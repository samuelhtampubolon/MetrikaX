/**
 * P13: SCR-SENSITIVITY.
 *
 * Inputs on the left as in the Calculator, the tornado plot and its table on the right, exactly as
 * the screen definition lays them out.
 *
 * The plot and the table are drawn from one array of rows, and each row carries the printed form
 * of its own number. Neither element formats anything: they both print the same strings, so there
 * is no arithmetic here that could disagree with the arithmetic there.
 */

import { useEffect, useMemo, type ReactNode } from 'react';
import {
  ComboBox,
  GroupBox,
  ListView,
  NumericField,
  PlotCanvas,
  PushButton,
  ResultField,
} from '@metrika/ui';
import { RELATIONS, VARIABLES, type Relation } from '@metrika/engine';
import { useLocale } from '../locale/index.ts';
import { SENSITIVE_RELATIONS, useSensitivity } from '../state/sensitivity.ts';
import { buildView, plotBars, type SensitivityRow } from './sensitivity.ts';

export function Sensitivity(): ReactNode {
  const { locale, t } = useLocale();
  const state = useSensitivity();

  const relation = RELATIONS.get(state.selectedId) as Relation;
  const view = useMemo(
    () => buildView(relation, state.outcome, locale, t),
    [relation, state.outcome, locale, t],
  );
  const bars = useMemo(() => plotBars(view.rows), [view.rows]);

  /* Enter runs the analysis, as it calculates on SCR-CALC. A button keeps its own Enter. */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Enter') return;
      const target = event.target;
      if (target instanceof HTMLButtonElement) return;
      if (target instanceof Element && target.closest('[role="dialog"]') !== null) return;
      event.preventDefault();
      useSensitivity.getState().run();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="mk-sens">
      <section className="mk-sens__left">
        <GroupBox legend={t('sensitivity.formula.legend')}>
          <ComboBox
            label={t('sensitivity.formula.label')}
            value={state.selectedId}
            options={SENSITIVE_RELATIONS.map((entry) => ({
              value: entry.formulaId,
              label: `${entry.symbol}  ${t(`formula.${entry.formulaId}.name`)}`,
            }))}
            onChange={state.select}
          />
          <p className="mk-sens__note">{t('sensitivity.scope')}</p>
          <p className="mk-calc__expression">
            <code>{relation.expressionSource}</code>
          </p>
        </GroupBox>

        <GroupBox legend={t('calc.inputs.legend')}>
          <NumericField
            label={t('sensitivity.perturbation.label')}
            suffix="%"
            value={state.perturbation}
            onChange={state.setPerturbation}
          />
          {relation.inputs.map((variableId, index) => (
            <NumericField
              key={variableId}
              label={t(`variable.${variableId}.label`)}
              suffix={VARIABLES.get(variableId)?.ui.suffix ?? ''}
              value={state.inputs[variableId] ?? ''}
              onChange={(next) => state.setInput(variableId, next)}
              autoFocus={index === 0}
            />
          ))}
          <div className="mk-calc__buttons">
            <PushButton isDefault onClick={state.run}>
              {t('sensitivity.run')}
            </PushButton>
            <PushButton onClick={state.loadWorkedExample}>
              {locale === 'id' ? 'Contoh' : 'Example'}
            </PushButton>
            <PushButton onClick={state.clearInputs}>{t('menu.edit.clear_inputs')}</PushButton>
          </div>
        </GroupBox>
      </section>

      <section className="mk-sens__right">
        <GroupBox legend={t('sensitivity.base.legend')}>
          <ResultField
            label={t('sensitivity.base.label')}
            value={view.state === 'ranked' ? view.base : view.message}
            refused={view.state !== 'ranked'}
          />
        </GroupBox>

        {view.state !== 'ranked' ? null : view.rows.length === 0 ? (
          <GroupBox legend={t('sensitivity.table.legend')}>
            <p className="mk-sens__note">{t('sensitivity.empty')}</p>
          </GroupBox>
        ) : (
          <>
            <GroupBox legend={t('sensitivity.plot.legend')}>
              <PlotCanvas
                label={t('sensitivity.plot.label')}
                bars={bars}
                axisLabel={view.axisLabel}
                width={460}
              />
            </GroupBox>

            <GroupBox legend={t('sensitivity.table.legend')}>
              <ListView<SensitivityRow>
                className="mk-sens__table"
                label={t('sensitivity.table.label')}
                sortLabel={t('sensitivity.sort')}
                rowKey={(row) => row.variableId}
                rows={view.rows}
                columns={[
                  {
                    id: 'factor',
                    label: t('sensitivity.column.factor'),
                    render: (row) => row.label,
                  },
                  {
                    id: 'low',
                    label: t('sensitivity.column.low'),
                    numeric: true,
                    render: (row) => row.low,
                  },
                  {
                    id: 'high',
                    label: t('sensitivity.column.high'),
                    numeric: true,
                    render: (row) => row.high,
                  },
                  {
                    id: 'swing',
                    label: t('sensitivity.column.swing'),
                    numeric: true,
                    render: (row) => row.swing,
                  },
                  {
                    id: 'share',
                    label: t('sensitivity.column.share'),
                    numeric: true,
                    render: (row) => row.share,
                  },
                  {
                    id: 'note',
                    label: t('sensitivity.column.note'),
                    render: (row) => (row.partial ? t('sensitivity.partial') : ''),
                  },
                ]}
              />
            </GroupBox>

            <GroupBox legend={t('sensitivity.sentence.legend')}>
              <p className="mk-sens__sentence">{view.sentence}</p>
              <p className="mk-sens__note">{t('honesty.not_verified')}</p>
            </GroupBox>
          </>
        )}
      </section>
    </div>
  );
}
