/**
 * The application shell: title bar, menu bar, the active screen and the status bar.
 *
 * Only the Calculator screen exists so far. The Window menu lists it and nothing else rather than
 * offering entries that do nothing, because a menu item that does not work is a claim the tool
 * cannot honour.
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { MenuBar, ModalDialog, StatusBar, TitleBar, type Menu } from '@metrika/ui';
import { LocaleProvider, useLocale, type Locale } from './locale/index.ts';
import { useCalculator } from './state/calculator.ts';
import { useWorkspace } from './state/workspace.ts';
import { exportWorkspaceFile } from './storage/download.ts';
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
  const workspace = useWorkspace();
  const [aboutOpen, setAboutOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  // Open storage once, on the first render. Nothing blocks on it: the calculator works whether or
  // not anything can be kept, and the status bar reports which of the two it turned out to be.
  useEffect(() => {
    void useWorkspace.getState().init();
  }, []);

  const menus: readonly Menu[] = [
    {
      id: 'file',
      label: t('menu.file'),
      mnemonicIndex: 0,
      items: [
        { id: 'new', label: t('menu.file.new') },
        { id: 'export', label: t('file.export') },
        { id: 'import', label: t('file.import') },
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
      void useWorkspace.getState().create(t('status.workspace.unsaved'));
      return;
    }
    if (menuId === 'file' && itemId === 'export') {
      exportWorkspaceFile(useWorkspace.getState().exportJson());
      setMessage(t('file.exported'));
      return;
    }
    if (menuId === 'file' && itemId === 'import') {
      importRef.current?.click();
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

      {/*
        The import control. A file the person chooses, read in this window and never sent anywhere.
        It is kept out of the tab order because the File menu is how it is reached.
      */}
      <input
        ref={importRef}
        type="file"
        accept="application/json,.json"
        tabIndex={-1}
        aria-hidden="true"
        style={{ display: 'none' }}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file === undefined) return;
          void file.text().then(async (text) => {
            await useWorkspace.getState().importJson(text);
            setMessage(
              useWorkspace.getState().lastError === null
                ? t('file.imported')
                : t('file.import.failed'),
            );
          });
        }}
      />

      <StatusBar
        message={
          message ?? storageMessage(workspace, t) ?? `${t('status.selected')} ${state.selectedId}`
        }
        state={computationState}
        workspace={workspace.current?.name ?? t('status.workspace.unsaved')}
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
          <p>{t('honesty.not_verified')}</p>
        </ModalDialog>
      ) : null}
    </div>
  );
}

/**
 * The storage sentence for the status bar.
 *
 * When nothing can be kept, that is the message: a tool that appears to save and does not is worse
 * than one that says plainly that it cannot. Otherwise the bar stays out of the way and the
 * ordinary selected-formula message shows instead.
 */
function storageMessage(
  workspace: { ready: boolean; ephemeral: boolean },
  t: (key: string) => string,
): string | null {
  if (!workspace.ready) return null;
  return workspace.ephemeral ? t('storage.memory') : null;
}
