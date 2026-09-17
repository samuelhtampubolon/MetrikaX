/**
 * P08: the raised, sunken and groupbox bevels as components.
 *
 * design_system.note asks for the Win32 common control vocabulary reproduced precisely rather than
 * approximated. Every control below composes one of these three treatments, so the recipe lives in
 * one place and a change to it cannot drift between controls.
 */

import type { ReactNode } from 'react';

export type Bevel = 'raised' | 'sunken' | 'groupbox' | 'none';

const BEVEL_CLASS: Readonly<Record<Bevel, string>> = {
  raised: 'mk-raised',
  sunken: 'mk-sunken',
  groupbox: 'mk-groupbox-bevel',
  none: '',
};

export function bevelClass(bevel: Bevel, ...extra: (string | false | undefined)[]): string {
  return [BEVEL_CLASS[bevel], ...extra].filter(Boolean).join(' ');
}

export interface TitleBarProps {
  readonly title: string;
  readonly active?: boolean;
  /** Accessible names come from the caller, in the active locale. */
  readonly minimiseLabel?: string;
  readonly closeLabel?: string;
  readonly onMinimise?: () => void;
  readonly onClose?: () => void;
}

/** TitleBar: solid navy fill, 20px, glyphs drawn as text characters rather than icons. */
export function TitleBar({
  title,
  active = true,
  minimiseLabel,
  closeLabel,
  onMinimise,
  onClose,
}: TitleBarProps): ReactNode {
  return (
    <div className="mk-titlebar" data-active={String(active)}>
      <span className="mk-titlebar__title">{title}</span>
      {onMinimise !== undefined && minimiseLabel !== undefined ? (
        <button
          type="button"
          className={bevelClass('raised', 'mk-titlebar__button')}
          aria-label={minimiseLabel}
          onClick={onMinimise}
        >
          _
        </button>
      ) : null}
      {onClose !== undefined && closeLabel !== undefined ? (
        <button
          type="button"
          className={bevelClass('raised', 'mk-titlebar__button')}
          aria-label={closeLabel}
          onClick={onClose}
        >
          x
        </button>
      ) : null}
    </div>
  );
}

export interface GroupBoxProps {
  readonly legend: string;
  readonly children: ReactNode;
  readonly className?: string;
}

/** GroupBox: the legend sits on the top border line with the border interrupted behind it. */
export function GroupBox({ legend, children, className }: GroupBoxProps): ReactNode {
  return (
    <fieldset className={bevelClass('groupbox', 'mk-groupbox', className)}>
      <legend className="mk-groupbox__legend">{legend}</legend>
      {children}
    </fieldset>
  );
}
