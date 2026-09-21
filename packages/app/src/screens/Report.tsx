/**
 * P22: SCR-REPORT.
 *
 * The screen is the document. There is no separate print renderer: what stands on this page in
 * Times New Roman at A4 width is the same element the printer receives, and the print stylesheet
 * removes the frame around it rather than rebuilding the contents. A preview that is a second
 * rendering of the same material is a preview that can lie.
 *
 * The four export actions are the four the screen definition names. None of them sends anything
 * anywhere: printing hands the page to the printer the person chose, the JSON export writes a file
 * they name, and the Markdown copy goes to their own clipboard.
 */

import { useMemo, useState, type ReactNode } from 'react';
import { GroupBox, PushButton } from '@metrika/ui';
import { useLocale } from '../locale/index.ts';
import { useSolver } from '../state/solver.ts';
import { useWorkspace } from '../state/workspace.ts';
import { exportWorkspaceFile } from '../storage/download.ts';
import { buildReport, reportMarkdown } from './report.ts';

const APP_VERSION = '0.1.0';

export function Report(): ReactNode {
  const { locale, t } = useLocale();
  const entered = useSolver((state) => state.entered);
  const result = useSolver((state) => state.result);
  const workspace = useWorkspace((state) => state.current);

  const [message, setMessage] = useState<string | null>(null);
  const [markdownShown, setMarkdownShown] = useState<string | null>(null);

  const report = useMemo(
    () =>
      buildReport({
        workspace: workspace?.name ?? t('status.workspace.unsaved'),
        entered,
        result,
        locale,
        version: APP_VERSION,
        now: new Date(),
        t,
      }),
    [workspace, entered, result, locale, t],
  );

  const print = (): void => {
    if (typeof window !== 'undefined' && typeof window.print === 'function') window.print();
  };

  /**
   * Copy as Markdown.
   *
   * The clipboard API is refused in more places than it is granted: a page opened from a disk has
   * no secure origin, and a browser may simply say no. When it does, the text is put on the screen
   * instead of the action failing silently, because the person asked for the text and the text is
   * what they get.
   */
  const copyMarkdown = (): void => {
    const markdown = reportMarkdown(report, t);
    const clipboard = typeof navigator === 'undefined' ? undefined : navigator.clipboard;

    if (clipboard === undefined || typeof clipboard.writeText !== 'function') {
      setMarkdownShown(markdown);
      setMessage(t('report.copy.failed'));
      return;
    }

    clipboard.writeText(markdown).then(
      () => {
        setMarkdownShown(null);
        setMessage(t('report.copied'));
      },
      () => {
        setMarkdownShown(markdown);
        setMessage(t('report.copy.failed'));
      },
    );
  };

  return (
    <div className="mk-report">
      <div className="mk-report__actions">
        <PushButton isDefault onClick={print}>
          {t('report.print')}
        </PushButton>
        <PushButton onClick={print}>{t('report.pdf')}</PushButton>
        <PushButton onClick={() => exportWorkspaceFile(useWorkspace.getState().exportJson())}>
          {t('report.json')}
        </PushButton>
        <PushButton onClick={copyMarkdown}>{t('report.markdown')}</PushButton>
      </div>

      <p className="mk-report__hint">
        {t('report.pdf.note')} {t('report.pagenumber.note')}
      </p>
      {message === null ? null : (
        <p className="mk-report__hint" role="status">
          {message}
        </p>
      )}

      <div className="mk-report__scroll">
        <article className="mk-paper" aria-label={t('report.preview.label')}>
          <header className="mk-paper__header">
            <h1 className="mk-paper__title">
              {report.application}: {t('report.title')}
            </h1>
            <p className="mk-paper__meta">
              {t('report.header.workspace')}: {report.workspace}
              <br />
              {t('report.header.date')}: {report.date}
              <br />
              {t('report.header.version')}: {report.application} {report.version}
            </p>
          </header>

          {report.empty ? (
            <p className="mk-paper__body">{t('report.empty')}</p>
          ) : (
            <>
              <section>
                <h2 className="mk-paper__heading">{t('report.entered.legend')}</h2>
                {report.entered.length === 0 ? (
                  <p className="mk-paper__body">{t('report.entered.none')}</p>
                ) : (
                  <table className="mk-paper__table">
                    <tbody>
                      {report.entered.map((entry) => (
                        <tr key={entry.variableId}>
                          <td>{entry.label}</td>
                          <td className="mk-paper__numeric">{entry.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>

              <section>
                <h2 className="mk-paper__heading">{t('report.sections.legend')}</h2>
                {report.sections.length === 0 ? (
                  <p className="mk-paper__body">{t('report.sections.none')}</p>
                ) : (
                  report.sections.map((section) => (
                    <div key={section.variableId} className="mk-paper__section">
                      <h3 className="mk-paper__subheading">{section.label}</h3>
                      <p className="mk-paper__body">
                        {section.symbol}, {section.formulaName}. {t('report.section.generation')}{' '}
                        {section.generation}.
                      </p>
                      <pre className="mk-paper__derivation">
                        {section.symbolic}
                        {'\n'}
                        {section.substituted}
                        {'\n'}
                        {section.result}
                      </pre>
                    </div>
                  ))
                )}
              </section>

              <section>
                <h2 className="mk-paper__heading">{t('report.assumptions.legend')}</h2>
                <ul className="mk-paper__list">
                  {report.assumptions.map((sentence) => (
                    <li key={sentence}>{sentence}</li>
                  ))}
                </ul>
              </section>
            </>
          )}

          <footer className="mk-paper__footer">
            <p>{report.footer}</p>
          </footer>
        </article>
      </div>

      {markdownShown === null ? null : (
        <GroupBox legend={t('report.markdown.label')}>
          <textarea
            className="mk-report__markdown"
            aria-label={t('report.markdown.label')}
            readOnly
            rows={12}
            value={markdownShown}
          />
        </GroupBox>
      )}
    </div>
  );
}
