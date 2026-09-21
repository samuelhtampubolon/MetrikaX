/**
 * P12: SCR-SOLVER, the workbench.
 *
 * Two panes. Left: the values the person entered, with a row for adding another. Right: everything
 * the relations derived from them, sorted by generation then by name.
 *
 * Below both sit the two lists that make this screen honest rather than merely useful. Blocked
 * relations say what could not be computed and why, in a sentence. Conflicts say which entered
 * value disagrees with what the relations compute, and offer the choice without making it: the
 * specification is explicit that nothing is resolved automatically.
 */

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ComboBox,
  GroupBox,
  ListView,
  ModalDialog,
  NumericField,
  PushButton,
  SearchField,
  type ListColumn,
} from '@metrika/ui';
import {
  VARIABLE_DEFINITIONS,
  VARIABLES,
  defaultDecimals,
  formatByUnitClass,
  parseNumber,
  type BlockedRelation,
  type Value,
} from '@metrika/engine';
import { useLocale } from '../locale/index.ts';
import { blockedOnce, derivedOnly, useSolver } from '../state/solver.ts';
import type { Currency, Period } from '../storage/types.ts';

const PERIODS: readonly Period[] = ['daily', 'weekly', 'monthly', 'quarterly', 'annual'];
const CURRENCIES: readonly Currency[] = ['IDR', 'USD', 'EUR'];

const PERIOD_LABEL: Readonly<Record<Period, { id: string; en: string }>> = {
  daily: { id: 'Harian', en: 'Daily' },
  weekly: { id: 'Mingguan', en: 'Weekly' },
  monthly: { id: 'Bulanan', en: 'Monthly' },
  quarterly: { id: 'Triwulanan', en: 'Quarterly' },
  annual: { id: 'Tahunan', en: 'Annual' },
};

interface EnteredRow {
  readonly variableId: string;
  readonly magnitude: number;
  readonly conflicted: boolean;
}

export function Workbench(): ReactNode {
  const { t, locale } = useLocale();
  const state = useSolver();

  const [search, setSearch] = useState('');
  const [chosen, setChosen] = useState('');
  const [draft, setDraft] = useState('');
  const [target, setTarget] = useState('');

  /* Ctrl+Enter derives, as screens.SCR-SOLVER states. */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        useSolver.getState().derive();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  /** Variables a person may enter: everything the specification defines, minus what is already in. */
  const choices = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return VARIABLE_DEFINITIONS.filter((definition) => {
      if (definition.synthesised) return false;
      if (definition.id in state.entered) return false;
      if (needle === '') return true;
      return (
        definition.id.toLowerCase().includes(needle) ||
        definition.label.id.toLowerCase().includes(needle) ||
        definition.label.en.toLowerCase().includes(needle)
      );
    }).slice(0, 200);
  }, [search, state.entered]);

  const conflicted = new Set((state.result?.conflicts ?? []).map((entry) => entry.variableId));

  const enteredRows: EnteredRow[] = Object.entries(state.entered).map(
    ([variableId, magnitude]) => ({
      variableId,
      magnitude,
      conflicted: conflicted.has(variableId),
    }),
  );

  const derived = derivedOnly(state.result);
  const blocked = blockedOnce(state.result);

  const render = (variableId: string, magnitude: number): string => {
    const unitClass = VARIABLES.get(variableId)?.unitClass ?? 'ratio';
    return formatByUnitClass(magnitude, unitClass, {
      locale,
      currency: state.currency,
      decimals: defaultDecimals(unitClass),
      withSuffix: false,
      withPrefix: false,
    });
  };

  const unitOf = (variableId: string): string => VARIABLES.get(variableId)?.unitClass ?? '';
  const labelOf = (variableId: string): string => t(`variable.${variableId}.label`);

  const enteredColumns: ListColumn<EnteredRow>[] = [
    {
      id: 'variable',
      label: t('solver.column.variable'),
      render: (row) => `${row.conflicted ? '* ' : ''}${labelOf(row.variableId)}`,
      sortKey: (row) => labelOf(row.variableId),
    },
    {
      id: 'value',
      label: t('solver.column.value'),
      numeric: true,
      render: (row) => render(row.variableId, row.magnitude),
      sortKey: (row) => row.magnitude,
    },
    { id: 'unit', label: t('solver.column.unit'), render: (row) => unitOf(row.variableId) },
    { id: 'origin', label: t('solver.column.origin'), render: () => t('solver.origin.user') },
    {
      id: 'note',
      label: t('solver.column.note'),
      render: (row) =>
        row.conflicted ? (
          <PushButton
            onClick={() => {
              const conflict = state.result?.conflicts.find(
                (entry) => entry.variableId === row.variableId,
              );
              if (conflict !== undefined) state.beginResolve(conflict);
            }}
          >
            {t('solver.conflict.resolve')}
          </PushButton>
        ) : (
          <PushButton onClick={() => state.remove(row.variableId)}>{t('solver.remove')}</PushButton>
        ),
    },
  ];

  const derivedColumns: ListColumn<Value>[] = [
    {
      id: 'variable',
      label: t('solver.column.variable'),
      render: (value) => labelOf(value.variableId),
      sortKey: (value) => labelOf(value.variableId),
    },
    {
      id: 'value',
      label: t('solver.column.value'),
      numeric: true,
      render: (value) =>
        typeof value.magnitude === 'number' ? render(value.variableId, value.magnitude) : '',
      sortKey: (value) => (typeof value.magnitude === 'number' ? value.magnitude : 0),
    },
    { id: 'unit', label: t('solver.column.unit'), render: (value) => value.unitClass },
    {
      id: 'via',
      label: t('solver.column.via'),
      render: (value) => (value.derivedBy === null ? '' : value.derivedBy),
      sortKey: (value) => value.derivedBy ?? '',
    },
    {
      id: 'generation',
      label: t('solver.column.generation'),
      numeric: true,
      render: (value) => String(value.depth),
      sortKey: (value) => value.depth,
    },
    {
      id: 'confidence',
      label: t('solver.column.confidence'),
      render: (value) => t(`solver.confidence.${value.confidence}`),
    },
  ];

  const addEntered = (): void => {
    const magnitude = parseNumber(draft, locale);
    if (chosen === '' || magnitude === null) return;
    state.enter(chosen, magnitude);
    setDraft('');
    setChosen('');
    setSearch('');
  };

  return (
    <div className="mk-solver">
      <GroupBox legend={t('solver.header.legend')} className="mk-solver__header">
        <div className="mk-solver__headerrow">
          <ComboBox
            label={t('solver.header.period')}
            value={state.period}
            onChange={(next) => state.setPeriod(next as Period)}
            options={PERIODS.map((period) => ({
              value: period,
              label: PERIOD_LABEL[period][locale],
            }))}
          />
          <ComboBox
            label={t('solver.header.currency')}
            value={state.currency}
            onChange={(next) => state.setCurrency(next as Currency)}
            options={CURRENCIES.map((currency) => ({ value: currency, label: currency }))}
          />
          <PushButton isDefault onClick={state.derive} title="Ctrl+Enter">
            {t('solver.derive')}
          </PushButton>
        </div>
      </GroupBox>

      <div className="mk-solver__panes">
        <GroupBox legend={t('solver.known.legend')} className="mk-solver__pane">
          <div className="mk-solver__addrow">
            <SearchField
              label={t('solver.add.variable')}
              value={search}
              onChange={(next) => {
                setSearch(next);
                setChosen('');
              }}
            />
          </div>
          <div className="mk-solver__addrow">
            <ComboBox
              label={t('solver.add.variable')}
              value={chosen}
              onChange={setChosen}
              options={[
                { value: '', label: '' },
                ...choices.map((definition) => ({
                  value: definition.id,
                  label: definition.label[locale],
                })),
              ]}
            />
          </div>
          <div className="mk-solver__addrow">
            <NumericField label={t('solver.add.value')} value={draft} onChange={setDraft} />
            <PushButton onClick={addEntered} disabled={chosen === '' || draft.trim() === ''}>
              {t('solver.add.button')}
            </PushButton>
          </div>

          {enteredRows.length === 0 ? (
            <p className="mk-calc__note">{t('solver.empty.known')}</p>
          ) : (
            <ListView
              className="mk-solver__list"
              label={t('solver.known.label')}
              sortLabel={t('toolbar.grouping')}
              columns={enteredColumns}
              rows={enteredRows}
              rowKey={(row) => row.variableId}
            />
          )}
        </GroupBox>

        <GroupBox legend={t('solver.derived.legend')} className="mk-solver__pane">
          {derived.length === 0 ? (
            <p className="mk-calc__note">{t('solver.empty.derived')}</p>
          ) : (
            <ListView
              className="mk-solver__list"
              label={t('solver.derived.label')}
              sortLabel={t('toolbar.grouping')}
              columns={derivedColumns}
              rows={derived}
              rowKey={(value) => value.variableId}
            />
          )}
        </GroupBox>
      </div>

      <div className="mk-solver__panes">
        <GroupBox legend={t('solver.blocked.legend')} className="mk-solver__pane">
          {blocked.length === 0 ? (
            <p className="mk-calc__note">{t('solver.blocked.none')}</p>
          ) : (
            <ul className="mk-calc__pitfalls">
              {blocked.map((entry: BlockedRelation) => (
                <li key={`${entry.formulaId}:${entry.reason}`}>{entry.detail[locale]}</li>
              ))}
            </ul>
          )}
        </GroupBox>

        <GroupBox legend={t('solver.missing.legend')} className="mk-solver__pane">
          <div className="mk-solver__addrow">
            <SearchField label={t('solver.missing.target')} value={target} onChange={setTarget} />
            <PushButton
              onClick={() => state.askWhatIsMissing(target.trim())}
              disabled={target.trim() === ''}
            >
              {t('solver.missing.button')}
            </PushButton>
          </div>
          {state.report === null ? null : (
            <p className="mk-calc__note">{state.report.message[locale]}</p>
          )}
        </GroupBox>
      </div>

      {state.resolving === null ? null : (
        <ModalDialog
          title={t('solver.conflict.legend')}
          confirmLabel={t('solver.conflict.keep_mine')}
          cancelLabel={t('solver.conflict.use_derived')}
          onConfirm={() => state.resolve('mine')}
          onCancel={() => state.resolve('derived')}
        >
          <p>{state.resolving.detail[locale]}</p>
          <p>{t('solver.conflict.marker')}</p>
        </ModalDialog>
      )}
    </div>
  );
}
