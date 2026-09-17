/**
 * P08: the composite views, which are the controls that carry data rather than collect it.
 */

import { useState, type ReactNode } from 'react';
import { bevelClass } from './primitives.tsx';

/* ------------------------------------------------------------------ *
 * TreeView
 * ------------------------------------------------------------------ */

export interface TreeLeaf {
  readonly kind: 'leaf';
  readonly id: string;
  readonly label: string;
}

export interface TreeBranch {
  readonly kind: 'branch';
  readonly id: string;
  readonly label: string;
  readonly children: readonly TreeNode[];
}

export type TreeNode = TreeBranch | TreeLeaf;

export interface TreeViewProps {
  readonly label: string;
  readonly nodes: readonly TreeNode[];
  readonly selectedId: string | null;
  readonly onSelect: (id: string) => void;
  readonly expandLabel: string;
  readonly collapseLabel: string;
  readonly className?: string;
}

/**
 * TreeView: plus and minus glyphs in boxes with dotted connector lines.
 *
 * Every node is reachable by Tab in reading order, which is what makes the formula selector
 * operable without a mouse.
 */
export function TreeView({
  label,
  nodes,
  selectedId,
  onSelect,
  expandLabel,
  collapseLabel,
  className,
}: TreeViewProps): ReactNode {
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());

  const toggle = (id: string): void => {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderNodes = (list: readonly TreeNode[], root: boolean): ReactNode => (
    <ul
      className={`mk-tree__group${root ? ' mk-tree__group--root' : ''}`}
      role={root ? 'tree' : 'group'}
      aria-label={root ? label : undefined}
    >
      {list.map((node) => {
        if (node.kind === 'leaf') {
          return (
            <li key={node.id} role="none">
              <div className="mk-tree__node" role="treeitem" aria-selected={node.id === selectedId}>
                <span className="mk-tree__spacer" aria-hidden="true" />
                <button
                  type="button"
                  className="mk-tree__label"
                  aria-current={node.id === selectedId}
                  onClick={() => onSelect(node.id)}
                >
                  {node.label}
                </button>
              </div>
            </li>
          );
        }

        const isCollapsed = collapsed.has(node.id);
        return (
          <li key={node.id} role="none">
            <div
              className="mk-tree__node"
              role="treeitem"
              aria-expanded={!isCollapsed}
              aria-selected={false}
            >
              <button
                type="button"
                className="mk-tree__toggle"
                aria-label={`${isCollapsed ? expandLabel : collapseLabel}: ${node.label}`}
                onClick={() => toggle(node.id)}
              >
                {isCollapsed ? '+' : '-'}
              </button>
              <span className="mk-tree__label" style={{ cursor: 'default' }}>
                {node.label}
              </span>
            </div>
            {isCollapsed ? null : renderNodes(node.children, false)}
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className={bevelClass('sunken', 'mk-treeview', className)}>{renderNodes(nodes, true)}</div>
  );
}

/* ------------------------------------------------------------------ *
 * ListView
 * ------------------------------------------------------------------ */

export interface ListColumn<Row> {
  readonly id: string;
  readonly label: string;
  readonly numeric?: boolean;
  readonly render: (row: Row) => ReactNode;
  readonly sortKey?: (row: Row) => string | number;
}

export interface ListViewProps<Row> {
  readonly label: string;
  readonly columns: readonly ListColumn<Row>[];
  readonly rows: readonly Row[];
  readonly rowKey: (row: Row) => string;
  readonly selectedKey?: string | null;
  readonly onSelect?: (row: Row) => void;
  readonly sortLabel: string;
  readonly className?: string;
}

/** ListView: report style with sortable column headers drawn as raised buttons. */
export function ListView<Row>({
  label,
  columns,
  rows,
  rowKey,
  selectedKey = null,
  onSelect,
  sortLabel,
  className,
}: ListViewProps<Row>): ReactNode {
  const [sort, setSort] = useState<{ column: string; ascending: boolean } | null>(null);

  const sorted = (() => {
    if (sort === null) return rows;
    const column = columns.find((entry) => entry.id === sort.column);
    if (column?.sortKey === undefined) return rows;
    const key = column.sortKey;
    return [...rows].sort((a, b) => {
      const left = key(a);
      const right = key(b);
      const order = left < right ? -1 : left > right ? 1 : 0;
      return sort.ascending ? order : -order;
    });
  })();

  return (
    <div className={bevelClass('sunken', 'mk-listview', className)}>
      <table className="mk-listview__table">
        <caption className="mk-visually-hidden" style={{ position: 'absolute', left: '-9999px' }}>
          {label}
        </caption>
        <thead className="mk-listview__header">
          <tr>
            {columns.map((column) => (
              <th key={column.id} scope="col">
                {column.sortKey === undefined ? (
                  <span
                    className={bevelClass('raised', 'mk-listview__sort')}
                    style={{ display: 'block' }}
                  >
                    {column.label}
                  </span>
                ) : (
                  <button
                    type="button"
                    className={bevelClass('raised', 'mk-listview__sort')}
                    aria-label={`${sortLabel}: ${column.label}`}
                    onClick={() =>
                      setSort((current) =>
                        current !== null && current.column === column.id
                          ? { column: column.id, ascending: !current.ascending }
                          : { column: column.id, ascending: true },
                      )
                    }
                  >
                    {column.label}
                    {sort !== null && sort.column === column.id
                      ? sort.ascending
                        ? ' ^'
                        : ' v'
                      : ''}
                  </button>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => {
            const key = rowKey(row);
            return (
              <tr
                key={key}
                className="mk-listview__row"
                aria-selected={key === selectedKey}
                onClick={onSelect === undefined ? undefined : () => onSelect(row)}
              >
                {columns.map((column) => (
                  <td
                    key={column.id}
                    className={column.numeric === true ? 'mk-listview__numeric' : undefined}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * StatusBar, ProgressBar, ResultField, DerivationPane
 * ------------------------------------------------------------------ */

export interface StatusBarProps {
  readonly message: string;
  readonly state: string;
  readonly workspace: string;
  readonly messageLabel: string;
  readonly stateLabel: string;
  readonly workspaceLabel: string;
}

/** StatusBar: three sunken panes, message, computation state and workspace name. */
export function StatusBar({
  message,
  state,
  workspace,
  messageLabel,
  stateLabel,
  workspaceLabel,
}: StatusBarProps): ReactNode {
  return (
    <div className="mk-statusbar">
      <div
        className={bevelClass('sunken', 'mk-statusbar__pane', 'mk-statusbar__pane--message')}
        role="status"
        aria-label={messageLabel}
        title={message}
      >
        {message}
      </div>
      <div
        className={bevelClass('sunken', 'mk-statusbar__pane', 'mk-statusbar__pane--state')}
        aria-label={stateLabel}
      >
        {state}
      </div>
      <div
        className={bevelClass('sunken', 'mk-statusbar__pane', 'mk-statusbar__pane--workspace')}
        aria-label={workspaceLabel}
      >
        {workspace}
      </div>
    </div>
  );
}

export interface ProgressBarProps {
  readonly label: string;
  readonly value: number;
  readonly max: number;
  readonly blocks?: number;
}

/** ProgressBar: segmented blocks rather than a continuous fill. */
export function ProgressBar({ label, value, max, blocks = 20 }: ProgressBarProps): ReactNode {
  const share = max <= 0 ? 0 : Math.max(0, Math.min(1, value / max));
  const filled = Math.round(share * blocks);
  return (
    <div
      className={bevelClass('sunken', 'mk-progress')}
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      {Array.from({ length: blocks }, (_unused, index) => (
        <span key={index} className="mk-progress__block" data-filled={String(index < filled)} />
      ))}
    </div>
  );
}

export interface ResultFieldProps {
  readonly label: string;
  readonly value: string;
  readonly unit?: string;
  /** A refusal is shown as a sentence, left aligned, never as a number. */
  readonly refused?: boolean;
}

/**
 * ResultField: the only element permitted a heavier visual weight than its neighbours. Read only,
 * sunken, monospace, selectable, with tabular figures so the width does not shift as digits change.
 */
export function ResultField({
  label,
  value,
  unit = '',
  refused = false,
}: ResultFieldProps): ReactNode {
  return (
    <output
      className={bevelClass('sunken', 'mk-result')}
      aria-label={label}
      data-state={refused ? 'refused' : 'ok'}
    >
      <span>{value}</span>
      {unit === '' || refused ? null : <span className="mk-result__unit">{unit}</span>}
    </output>
  );
}

export interface DerivationPaneProps {
  readonly label: string;
  readonly lines: readonly string[];
  readonly emptyMessage: string;
}

/** DerivationPane: a monospace region showing the substituted expression line by line. */
export function DerivationPane({ label, lines, emptyMessage }: DerivationPaneProps): ReactNode {
  return (
    <div
      className={bevelClass('sunken', 'mk-derivation')}
      role="region"
      aria-label={label}
      tabIndex={0}
    >
      {lines.length === 0 ? (
        <span className="mk-derivation__empty">{emptyMessage}</span>
      ) : (
        lines.join('\n')
      )}
    </div>
  );
}
