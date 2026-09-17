/**
 * Expression handling for codegen.
 *
 * ADR-003: the JavaScript strings in the specification are authoring input. This module reads them
 * at generation time only, to find which identifiers a compiled function must bind and to infer the
 * unit class of a synthesised result variable. The emitted code contains the expression as literal
 * source, never as a string passed to eval or to the Function constructor.
 */

export const HELPER_NAMES = new Set([
  'series_sum',
  'npv_calc',
  'irr_solve',
  'black_scholes_call',
  'vw_intersection',
  'dot',
  'matvec',
  'transpose',
  'phi',
  'sum',
]);

const RESERVED = new Set([
  'Math',
  'pow',
  'exp',
  'log',
  'sqrt',
  'abs',
  'min',
  'max',
  'floor',
  'ceil',
  'round',
  'true',
  'false',
  'null',
  'undefined',
  'NaN',
  'Infinity',
]);

/** Identifiers in an expression that are neither helpers, reserved names, nor property accesses. */
export function freeIdentifiers(source: string): string[] {
  const found = new Set<string>();
  const pattern = /(\.)?\b([A-Za-z_][A-Za-z_0-9]*)\b/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(source)) !== null) {
    const isProperty = match[1] === '.';
    const name = match[2] as string;
    if (isProperty) continue;
    if (HELPER_NAMES.has(name)) continue;
    if (RESERVED.has(name)) continue;
    found.add(name);
  }
  return [...found];
}

/* ------------------------------------------------------------------ *
 * Dimensional inference
 * ------------------------------------------------------------------ */

/**
 * A dimension is an exponent pair over two bases: money and quantity. Everything the corpus treats
 * as dimensionless, ratios and scores included, sits at the origin.
 */
export interface Dim {
  money: number;
  qty: number;
}

export type DimResult = Dim | 'unknown';

const ZERO: Dim = { money: 0, qty: 0 };

export function dimOfUnitClass(unitClass: string): DimResult {
  switch (unitClass) {
    case 'currency':
      return { money: 1, qty: 0 };
    case 'count':
    case 'person_month':
      return { money: 0, qty: 1 };
    case 'ratio':
    case 'percent':
    case 'score':
    case 'period':
    case 'utils':
      return { money: 0, qty: 0 };
    default:
      return 'unknown';
  }
}

type Token =
  | { kind: 'number'; text: string }
  | { kind: 'ident'; text: string }
  | { kind: 'punct'; text: string };

function tokenise(source: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  while (index < source.length) {
    const character = source[index] as string;
    if (/\s/.test(character)) {
      index += 1;
      continue;
    }
    if (/[0-9]/.test(character) || (character === '.' && /[0-9]/.test(source[index + 1] ?? ''))) {
      let end = index;
      while (end < source.length && /[0-9.eE+-]/.test(source[end] as string)) {
        const current = source[end] as string;
        if ((current === '+' || current === '-') && !/[eE]/.test(source[end - 1] ?? '')) break;
        end += 1;
      }
      tokens.push({ kind: 'number', text: source.slice(index, end) });
      index = end;
      continue;
    }
    if (/[A-Za-z_]/.test(character)) {
      let end = index;
      while (end < source.length && /[A-Za-z_0-9]/.test(source[end] as string)) end += 1;
      tokens.push({ kind: 'ident', text: source.slice(index, end) });
      index = end;
      continue;
    }
    if (source.startsWith('**', index)) {
      tokens.push({ kind: 'punct', text: '**' });
      index += 2;
      continue;
    }
    tokens.push({ kind: 'punct', text: character });
    index += 1;
  }
  return tokens;
}

/**
 * Infer the dimension of an expression from the dimensions of its identifiers.
 *
 * Addition and subtraction require both sides to agree, which is the check that makes the result
 * meaningful: an expression that adds money to a count is not something this inference will type,
 * and it returns 'unknown' rather than a guess.
 */
export function inferDim(source: string, dimOf: (name: string) => DimResult): DimResult {
  const tokens = tokenise(source);
  let position = 0;

  const peek = (): Token | undefined => tokens[position];
  const eat = (text: string): boolean => {
    const token = peek();
    if (token && token.kind === 'punct' && token.text === text) {
      position += 1;
      return true;
    }
    return false;
  };

  function parseExpr(): DimResult {
    let left = parseTerm();
    for (;;) {
      if (eat('+') || eat('-')) {
        const right = parseTerm();
        if (left === 'unknown' || right === 'unknown') left = 'unknown';
        else if (left.money !== right.money || left.qty !== right.qty) left = 'unknown';
      } else break;
    }
    return left;
  }

  function parseTerm(): DimResult {
    let left = parsePower();
    for (;;) {
      if (eat('*')) {
        const right = parsePower();
        left = combine(left, right, 1);
      } else if (eat('/')) {
        const right = parsePower();
        left = combine(left, right, -1);
      } else break;
    }
    return left;
  }

  function parsePower(): DimResult {
    const base = parseUnary();
    if (eat('**')) {
      const exponentToken = peek();
      parseUnary();
      if (base === 'unknown') return 'unknown';
      if (exponentToken && exponentToken.kind === 'number') {
        const exponent = Number(exponentToken.text);
        if (Number.isFinite(exponent)) {
          return { money: base.money * exponent, qty: base.qty * exponent };
        }
      }
      return base.money === 0 && base.qty === 0 ? ZERO : 'unknown';
    }
    return base;
  }

  function parseUnary(): DimResult {
    if (eat('-') || eat('+')) return parseUnary();
    return parsePrimary();
  }

  function parsePrimary(): DimResult {
    const token = peek();
    if (!token) return 'unknown';

    if (token.kind === 'number') {
      position += 1;
      return { ...ZERO };
    }

    if (token.kind === 'ident') {
      position += 1;
      let name = token.text;
      while (eat('.')) {
        const property = peek();
        if (property && property.kind === 'ident') {
          position += 1;
          name = property.text;
        } else break;
      }
      if (eat('(')) {
        const argumentDims: DimResult[] = [];
        if (!eat(')')) {
          for (;;) {
            argumentDims.push(parseExpr());
            if (eat(',')) continue;
            eat(')');
            break;
          }
        }
        return dimOfCall(name, argumentDims);
      }
      return dimOf(name);
    }

    if (eat('(')) {
      const inner = parseExpr();
      eat(')');
      return inner;
    }

    position += 1;
    return 'unknown';
  }

  const result = parseExpr();
  return position >= tokens.length ? result : 'unknown';
}

function combine(left: DimResult, right: DimResult, sign: 1 | -1): DimResult {
  if (left === 'unknown' || right === 'unknown') return 'unknown';
  return { money: left.money + sign * right.money, qty: left.qty + sign * right.qty };
}

function dimOfCall(name: string, argumentDims: DimResult[]): DimResult {
  switch (name) {
    // A discounted sum of a cash flow series carries the dimension of the series.
    case 'npv_calc':
      return argumentDims[0] ?? 'unknown';
    // Dimensionless: a discount factor sum, a probability, a rate.
    case 'series_sum':
    case 'phi':
      return { ...ZERO };
    // A price, so money.
    case 'black_scholes_call':
      return { money: 1, qty: 0 };
    case 'pow': {
      const base = argumentDims[0];
      if (base === 'unknown' || base === undefined) return 'unknown';
      return base.money === 0 && base.qty === 0 ? { ...ZERO } : 'unknown';
    }
    case 'sqrt':
    case 'log':
    case 'exp':
      return { ...ZERO };
    case 'abs':
    case 'min':
    case 'max':
      return argumentDims[0] ?? 'unknown';
    default:
      return 'unknown';
  }
}

/** Map an inferred dimension back to a unit class name. */
export function unitClassOfDim(dim: DimResult): string | null {
  if (dim === 'unknown') return null;
  if (dim.money > 0) return 'currency';
  if (dim.money < 0) return null;
  if (dim.qty > 0) return 'count';
  if (dim.qty < 0) return null;
  return 'ratio';
}
