/**
 * P08: window chrome. MenuBar, TabStrip, ModalDialog and PlotCanvas.
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { bevelClass } from './primitives.tsx';

/* ------------------------------------------------------------------ *
 * MenuBar
 * ------------------------------------------------------------------ */

export interface MenuItem {
  readonly id: string;
  readonly label: string;
  readonly shortcut?: string;
  readonly disabled?: boolean;
}

export interface Menu {
  readonly id: string;
  readonly label: string;
  /** The index of the character to underline, which is also its Alt mnemonic. */
  readonly mnemonicIndex: number;
  readonly items: readonly MenuItem[];
}

export interface MenuBarProps {
  readonly label: string;
  readonly menus: readonly Menu[];
  readonly onCommand: (menuId: string, itemId: string) => void;
}

/**
 * MenuBar: every menu carries an underlined mnemonic and opens on Alt plus that letter. Escape
 * closes the open menu and returns focus, so no menu is ever a focus trap.
 */
export function MenuBar({ label, menus, onCommand }: MenuBarProps): ReactNode {
  const [openId, setOpenId] = useState<string | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent): void => {
      if (event.key === 'Escape' && openId !== null) {
        setOpenId(null);
        return;
      }
      if (!event.altKey || event.ctrlKey || event.metaKey) return;
      const key = event.key.toLowerCase();
      const match = menus.find((menu) => menu.label[menu.mnemonicIndex]?.toLowerCase() === key);
      if (match === undefined) return;
      event.preventDefault();
      setOpenId((current) => (current === match.id ? null : match.id));
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menus, openId]);

  return (
    <div className="mk-menubar" role="menubar" aria-label={label} ref={barRef}>
      {menus.map((menu) => {
        const before = menu.label.slice(0, menu.mnemonicIndex);
        const letter = menu.label.slice(menu.mnemonicIndex, menu.mnemonicIndex + 1);
        const after = menu.label.slice(menu.mnemonicIndex + 1);
        const isOpen = openId === menu.id;

        return (
          <div key={menu.id} style={{ position: 'relative' }}>
            <button
              type="button"
              role="menuitem"
              className="mk-menubar__item"
              aria-haspopup="true"
              aria-expanded={isOpen}
              onClick={() => setOpenId(isOpen ? null : menu.id)}
            >
              {before}
              <span className="mk-menubar__mnemonic">{letter}</span>
              {after}
            </button>
            {isOpen ? (
              <ul className={bevelClass('raised', 'mk-menu')} role="menu" aria-label={menu.label}>
                {menu.items.map((item) => (
                  <li key={item.id} role="none">
                    <button
                      type="button"
                      role="menuitem"
                      className="mk-menu__item"
                      style={{
                        width: '100%',
                        background: 'transparent',
                        border: 0,
                        font: 'inherit',
                        color: 'inherit',
                      }}
                      disabled={item.disabled === true}
                      onClick={() => {
                        setOpenId(null);
                        onCommand(menu.id, item.id);
                      }}
                    >
                      <span>{item.label}</span>
                      {item.shortcut === undefined ? null : (
                        <span className="mk-menu__shortcut">{item.shortcut}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * TabStrip
 * ------------------------------------------------------------------ */

export interface TabDefinition {
  readonly id: string;
  readonly label: string;
}

export interface TabStripProps {
  readonly label: string;
  readonly tabs: readonly TabDefinition[];
  readonly activeId: string;
  readonly onSelect: (id: string) => void;
}

/** TabStrip: classic notched tabs; the active tab is 2px taller and merges with the panel below. */
export function TabStrip({ label, tabs, activeId, onSelect }: TabStripProps): ReactNode {
  return (
    <div className="mk-tabstrip" role="tablist" aria-label={label}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          id={`tab-${tab.id}`}
          aria-selected={tab.id === activeId}
          aria-controls={`tabpanel-${tab.id}`}
          tabIndex={tab.id === activeId ? 0 : -1}
          className="mk-tab"
          onClick={() => onSelect(tab.id)}
          onKeyDown={(event) => {
            const index = tabs.findIndex((entry) => entry.id === activeId);
            if (event.key === 'ArrowRight')
              onSelect((tabs[(index + 1) % tabs.length] as TabDefinition).id);
            if (event.key === 'ArrowLeft')
              onSelect((tabs[(index - 1 + tabs.length) % tabs.length] as TabDefinition).id);
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function TabPanel({ id, children }: { id: string; children: ReactNode }): ReactNode {
  return (
    <div
      role="tabpanel"
      id={`tabpanel-${id}`}
      aria-labelledby={`tab-${id}`}
      className={bevelClass('raised', 'mk-tabpanel')}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * ModalDialog
 * ------------------------------------------------------------------ */

export interface ModalDialogProps {
  readonly title: string;
  readonly children: ReactNode;
  readonly confirmLabel: string;
  readonly cancelLabel: string;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
  readonly confirmDisabled?: boolean;
}

/**
 * ModalDialog: dialogs are dialogs. They have a title bar, an OK button and a Cancel button, and
 * they block. Escape cancels, Enter confirms, and focus is held inside until one of the two is
 * chosen, which is the only place in the application where focus is trapped.
 */
export function ModalDialog({
  title,
  children,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  confirmDisabled = false,
}: ModalDialogProps): ReactNode {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const first = dialogRef.current?.querySelector<HTMLElement>('button, input, select, textarea');
    first?.focus();
    return () => previous?.focus();
  }, []);

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onCancel();
      return;
    }
    if (event.key === 'Enter' && !confirmDisabled) {
      event.stopPropagation();
      onConfirm();
      return;
    }
    if (event.key !== 'Tab') return;

    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)',
    );
    if (focusable === undefined || focusable.length === 0) return;
    const first = focusable[0] as HTMLElement;
    const last = focusable[focusable.length - 1] as HTMLElement;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="mk-modal__scrim" role="presentation">
      <div
        ref={dialogRef}
        className={bevelClass('raised', 'mk-modal')}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onKeyDown={onKeyDown}
      >
        <div className="mk-titlebar">
          <span className="mk-titlebar__title">{title}</span>
        </div>
        <div className="mk-modal__body">{children}</div>
        <div className="mk-modal__buttons">
          <button
            type="button"
            className={bevelClass('raised', 'mk-button')}
            data-default="true"
            disabled={confirmDisabled}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
          <button type="button" className={bevelClass('raised', 'mk-button')} onClick={onCancel}>
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * PlotCanvas
 * ------------------------------------------------------------------ */

export interface PlotBar {
  readonly id: string;
  readonly label: string;
  readonly value: number;
}

export interface PlotCanvasProps {
  readonly label: string;
  readonly bars: readonly PlotBar[];
  readonly formatValue: (value: number) => string;
  readonly width?: number;
}

/**
 * PlotCanvas: hand-written SVG, black strokes on white, hatch patterns instead of fills, 1px axes
 * with outward ticks. No charting library: every library brings visual defaults that the doctrine
 * forbids, and the vocabulary needed here is one bar chart.
 *
 * The caller renders the same numbers in a table beside it. AC-15 requires the two to agree, and
 * they do because both read the same array.
 */
export function PlotCanvas({ label, bars, formatValue, width = 380 }: PlotCanvasProps): ReactNode {
  const rowHeight = 18;
  const marginLeft = 130;
  const marginRight = 60;
  const marginTop = 8;
  const height = marginTop * 2 + bars.length * rowHeight;
  const plotWidth = Math.max(10, width - marginLeft - marginRight);
  const extent = Math.max(1e-12, ...bars.map((bar) => Math.abs(bar.value)));
  const zeroX = marginLeft + plotWidth / 2;
  const scale = plotWidth / 2 / extent;

  return (
    <svg
      className="mk-plot"
      role="img"
      aria-label={label}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
    >
      <defs>
        <pattern
          id="mk-hatch"
          width="4"
          height="4"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1="0" y1="0" x2="0" y2="4" stroke="#000000" strokeWidth="1" />
        </pattern>
      </defs>

      <line
        className="mk-plot__axis"
        x1={zeroX}
        y1={marginTop}
        x2={zeroX}
        y2={height - marginTop}
      />

      {bars.map((bar, index) => {
        const y = marginTop + index * rowHeight + 3;
        const length = Math.abs(bar.value) * scale;
        const x = bar.value >= 0 ? zeroX : zeroX - length;
        return (
          <g key={bar.id}>
            <text x={marginLeft - 6} y={y + 9} textAnchor="end">
              {bar.label}
            </text>
            <rect
              className="mk-plot__bar"
              x={x}
              y={y}
              width={length}
              height={rowHeight - 6}
              fill="url(#mk-hatch)"
            />
            <line
              className="mk-plot__axis"
              x1={zeroX}
              y1={y + rowHeight - 6}
              x2={zeroX}
              y2={y + rowHeight - 3}
            />
            <text x={width - marginRight + 6} y={y + 9}>
              {formatValue(bar.value)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
