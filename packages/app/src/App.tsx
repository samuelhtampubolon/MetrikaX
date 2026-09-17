/**
 * The application shell: title bar, menu bar, the active screen and the status bar.
 *
 * Only the Calculator screen exists so far. The Window menu lists it and nothing else rather than
 * offering entries that do nothing, because a menu item that does not work is a claim the tool
 * cannot honour.
 */

import { useState, type ReactNode } from 'react';
import { MenuBar, ModalDialog, StatusBar, TitleBar, type Menu } from '@metrika/ui';
import { LocaleProvider, useLocale, type Locale } from './locale/index.ts';
import { useCalculator } from './state/calculator.ts';
import { Calculator } from './screens/Calculator.tsx';
import { FORMULA_COUNT } from '@metrika/engine';

const SPEC_VERSION = '1.0.1';
const APP_VERSION = '0.1.0';

export function App(): ReactNode {
  const locale = useCalculator((state) => state.locale);
  const highContrast = useCalculator((state) => state.highContrast);

  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-contrast', highContrast ? 'high' : 'normal');
    document.documentElement.lang = locale;
  }

  return (
    <LocaleProvider locale={locale}>
      <Shell />
    </LocaleProvider>
  );
}

function Shell(): ReactNode {
  const { t } = useLocale();
  const state = useCalculator();
  const [aboutOpen, setAboutOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const menus: readonly Menu[] = [
    {
      id: 'file',
      label: t('menu.file'),
      mnemonicIndex: 0,
      items: [
        { id: 'new', label: t('menu.file.new') },
        { id: 'open', label: t('menu.file.open'), disabled: true },
        { id: 'save', label: t('menu.file.save'), disabled: true },
        { id: 'print', label: t('menu.file.print'), shortcut: 'Ctrl+P' },
      ],
    },
    {
      id: 'edit',
      label: t('menu.edit'),
      mnemonicIndex: 0,
      items: [
        { id: 'copy_result', label: t('menu.edit.copy_result') },
        { id: 'clear_inputs', label: t('menu.edit.clear_inputs') },
      ],
    },
    {
      id: 'analysis',
      label: t('menu.analysis'),
      mnemonicIndex: 0,
      items: [
        { id: 'calculate', label: t('menu.analysis.calculate'), shortcut: 'Enter' },
        { id: 'derivation', label: t('menu.analysis.derivation'), shortcut: 'F9' },
      ],
    },
    {
      id: 'tools',
      label: t('menu.tools'),
      mnemonicIndex: 0,
      items: [
        { id: 'locale', label: t('menu.tools.locale') },
        { id: 'contrast', label: t('menu.tools.contrast') },
      ],
    },
    {
      id: 'window',
      label: t('menu.window'),
      mnemonicIndex: 0,
      items: [{ id: 'calculator', label: t('menu.window.calculator') }],
    },
    {
      id: 'help',
      label: t('menu.help'),
      mnemonicIndex: 0,
      items: [{ id: 'about', label: t('menu.help.about') }],
    },
  ];

  const onCommand = (menuId: string, itemId: string): void => {
    if (menuId === 'analysis' && itemId === 'calculate') {
      state.calculate();
      setMessage(t('status.computed'));
      return;
    }
    if (menuId === 'analysis' && itemId === 'derivation') {
      state.toggleDerivation();
      return;
    }
    if (menuId === 'edit' && itemId === 'clear_inputs') {
      state.clearInputs();
      setMessage(null);
      return;
    }
    if (menuId === 'tools' && itemId === 'locale') {
      state.setLocale(state.locale === 'id' ? 'en' : ('id' as Locale));
      return;
    }
    if (menuId === 'tools' && itemId === 'contrast') {
      state.toggleContrast();
      return;
    }
    if (menuId === 'file' && itemId === 'new') {
      state.clearInputs();
      return;
    }
    if (menuId === 'file' && itemId === 'print') {
      if (typeof window !== 'undefined' && typeof window.print === 'function') window.print();
      return;
    }
    if (menuId === 'help' && itemId === 'about') setAboutOpen(true);
  };

  const computationState =
    state.outcome.kind === 'value'
      ? t('status.state.computed')
      : state.outcome.kind === 'idle'
        ? t('status.state.idle')
        : t('status.state.refused');

  return (
    <div className="mk-shell">
      <TitleBar title={t('app.window.title')} />
      <MenuBar label={t('menu.bar.label')} menus={menus} onCommand={onCommand} />

      <main className="mk-shell__body">
        <Calculator />
      </main>

      <StatusBar
        message={message ?? `${t('status.selected')} ${state.selectedId}`}
        state={computationState}
        workspace={t('status.workspace.unsaved')}
        messageLabel={t('status.label.message')}
        stateLabel={t('status.label.state')}
        workspaceLabel={t('status.label.workspace')}
      />

      {aboutOpen ? (
        <ModalDialog
          title={t('dialog.about.title')}
          confirmLabel={t('dialog.ok')}
          cancelLabel={t('dialog.cancel')}
          onConfirm={() => setAboutOpen(false)}
          onCancel={() => setAboutOpen(false)}
        >
          <p>
            {t('app.name')}. {t('dialog.about.version')} {APP_VERSION}.
          </p>
          <p>{t('dialog.about.statement')}</p>
          <p>
            {t('dialog.about.taxonomy')} {SPEC_VERSION}. {FORMULA_COUNT}.
          </p>
          <p>{t('dialog.about.offline')}</p>
          <p>{t('dialog.about.licence')}</p>
        </ModalDialog>
      ) : null}
    </div>
  );
}
