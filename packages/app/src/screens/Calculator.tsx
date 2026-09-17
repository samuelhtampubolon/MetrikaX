/**
 * P09: SCR-CALC, the default screen.
 *
 * Three vertical regions, as the specification lays them out. Left: the formula tree with its
 * grouping selector and search field. Centre: the input group for the selected formula. Right: the
 * result, the interpretation band, the pitfalls and the derivation pane.
 *
 * The keyboard map is the one in screens.SCR-CALC.keyboard, and every control is reachable by Tab
 * in reading order, so the whole screen is operable without a mouse (AC-09).
 */

import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import {
  ComboBox,
  DerivationPane,
  GroupBox,
  NumericField,
  PushButton,
  ResultField,
  SearchField,
  TreeView,
} from '@metrika/ui';
import { RELATIONS, VARIABLES, type Relation } from '@metrika/engine';
import { useLocale } from '../locale/index.ts';
import { useCalculator, type Grouping } from '../state/calculator.ts';
import { buildTree } from './grouping.ts';
import { bandFor, derivationLines, viewResult } from './result.ts';

const GROUPINGS: readonly Grouping[] = ['stratum', 'phase', 'class', 'domain', 'alphabetical'];

export function Calculator(): ReactNode {
  const { locale, t } = useLocale();
  const state = useCalculator();
  const searchRef = useRef<HTMLInputElement>(null);

  const relation = RELATIONS.get(state.selectedId) as Relation;

  const tree = useMemo(
    () => buildTree(state.grouping, { locale, t, search: state.search }),
    [state.grouping, state.search, locale, t],
  );

  const view = viewResult(relation, state.outcome, locale, t);
  const band = bandFor(relation, state.outcome);
  const lines = derivationLines(relation, state.outcome, locale, t);

  /* screens.SCR-CALC.keyboard */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'F9') {
        event.preventDefault();
        useCalculator.getState().toggleDerivation();
        return;
      }
      if (event.key.toLowerCase() === 'f' && event.ctrlKey) {
        event.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (event.key !== 'Enter') return;

      // A button owns its own Enter, and a modal dialog confirms with it. Everywhere else on the
      // screen Enter is the Calculate action, which is what screens.SCR-CALC.keyboard states.
      const target = event.target;
      if (target instanceof HTMLButtonElement) return;
      if (target instanceof Element && target.closest('[role="dialog"]') !== null) return;

      event.preventDefault();
      useCalculator.getState().calculate();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="mk-calc">
      <section className="mk-calc__left">
        <div className="mk-calc__toolrow">
          <ComboBox
            label={t('toolbar.grouping')}
            value={state.grouping}
            options={GROUPINGS.map((grouping) => ({
              value: grouping,
              label: t(`grouping.${grouping}`),
            }))}
            onChange={(next) => state.setGrouping(next as Grouping)}
          />
        </div>
        <div className="mk-calc__toolrow">
          <SearchField
            inputRef={searchRef}
            label={t('calc.search.label')}
            value={state.search}
            onChange={state.setSearch}
          />
        </div>
        {tree.length === 0 ? (
          <p className="mk-calc__empty">{t('calc.search.empty')}</p>
        ) : (
          <TreeView
            className="mk-calc__tree"
            label={t('calc.tree.label')}
            nodes={tree}
            selectedId={state.selectedId}
            onSelect={state.select}
            expandLabel={t('calc.tree.expand')}
            collapseLabel={t('calc.tree.collapse')}
          />
        )}
      </section>

      <section className="mk-calc__centre">
        <GroupBox legend={`${relation.symbol}  ${t(`formula.${relation.formulaId}.name`)}`}>
          <p className="mk-calc__expression">
            <span className="mk-calc__expression-label">{t('calc.formula.expression')}: </span>
            <code>{relation.expressionSource}</code>
          </p>
          <p className="mk-calc__taxonomy">
            {t('calc.formula.taxonomy')}: {relation.taxonomy.stratum} / {relation.taxonomy.phase} /{' '}
            {relation.taxonomy.structuralClass} / {relation.taxonomy.decisionDomain}
          </p>
        </GroupBox>

        <GroupBox legend={t('calc.inputs.legend')}>
          {relation.inputs.map((variableId, index) => {
            const definition = VARIABLES.get(variableId);
            return (
              <NumericField
                key={variableId}
                label={t(`variable.${variableId}.label`)}
                suffix={definition?.ui.suffix ?? ''}
                value={state.inputs[variableId] ?? ''}
                onChange={(next) => state.setInput(variableId, next)}
                autoFocus={index === 0}
              />
            );
          })}
          <div className="mk-calc__buttons">
            <PushButton isDefault onClick={state.calculate}>
              {t('calc.calculate')}
            </PushButton>
            <PushButton onClick={state.loadWorkedExample}>
              {locale === 'id' ? 'Contoh' : 'Example'}
            </PushButton>
            <PushButton onClick={state.clearInputs}>{t('menu.edit.clear_inputs')}</PushButton>
          </div>
        </GroupBox>
      </section>

      <section className="mk-calc__right">
        <GroupBox legend={t('calc.result.legend')}>
          <ResultField
            label={t('calc.result.label')}
            value={view.text}
            unit={view.unit}
            refused={view.refused}
          />
          {view.extra.length > 0 ? (
            <ul className="mk-calc__extra">
              {view.extra.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : null}
        </GroupBox>

        <GroupBox legend={t('calc.band.legend')}>
          {relation.interpretationBands.length === 0 ? (
            <p className="mk-calc__note">{t('calc.band.none')}</p>
          ) : band === null ? (
            <p className="mk-calc__note">
              {state.outcome.kind === 'value' ? t('calc.band.outside') : t('calc.result.empty')}
            </p>
          ) : (
            <p className="mk-calc__note">
              <strong>{t(`formula.${relation.formulaId}.band.${band.index}.label`)}.</strong>{' '}
              {t(`formula.${relation.formulaId}.band.${band.index}.guidance`)}
            </p>
          )}
        </GroupBox>

        <GroupBox legend={t('calc.pitfalls.legend')}>
          <ul className="mk-calc__pitfalls">
            {Array.from({ length: relation.pitfallCount }, (_unused, index) => (
              <li key={index}>{t(`formula.${relation.formulaId}.pitfall.${index}`)}</li>
            ))}
          </ul>
        </GroupBox>

        {state.derivationOpen ? (
          <GroupBox legend={t('calc.derivation.legend')}>
            <DerivationPane
              label={t('calc.derivation.label')}
              lines={lines}
              emptyMessage={t('calc.derivation.empty')}
            />
          </GroupBox>
        ) : null}
      </section>
    </div>
  );
}
