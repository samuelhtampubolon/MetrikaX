// GENERATED FILE. DO NOT EDIT.
//
// Emitted by packages/codegen from spec/metrika.spec.json.
// To change anything here, change the specification and run `pnpm codegen`.
// CI fails when a file under a generated directory differs from a fresh generation (AC-17).

import type { Relation } from '../../types.ts';
import { ctr } from './ctr.ts';
import { conversion_rate } from './conversion_rate.ts';
import { engagement_rate } from './engagement_rate.ts';
import { bounce_rate } from './bounce_rate.ts';
import { cart_abandonment_rate } from './cart_abandonment_rate.ts';
import { aov } from './aov.ts';
import { arpu } from './arpu.ts';
import { arppu } from './arppu.ts';
import { purchase_frequency } from './purchase_frequency.ts';
import { cpm } from './cpm.ts';
import { cpc } from './cpc.ts';
import { cpl } from './cpl.ts';
import { cpa } from './cpa.ts';
import { churn_rate } from './churn_rate.ts';
import { retention_rate } from './retention_rate.ts';
import { mql_to_sql_rate } from './mql_to_sql_rate.ts';
import { lead_to_customer_rate } from './lead_to_customer_rate.ts';
import { market_share } from './market_share.ts';
import { penetration_rate } from './penetration_rate.ts';
import { sov } from './sov.ts';
import { sos } from './sos.ts';
import { csat } from './csat.ts';
import { nps } from './nps.ts';
import { ces } from './ces.ts';
import { gross_margin } from './gross_margin.ts';
import { net_margin } from './net_margin.ts';
import { contribution_margin } from './contribution_margin.ts';
import { break_even_quantity } from './break_even_quantity.ts';
import { mrr } from './mrr.ts';
import { arr } from './arr.ts';
import { mrr_churn_rate } from './mrr_churn_rate.ts';
import { cac } from './cac.ts';
import { payback_period } from './payback_period.ts';
import { roas } from './roas.ts';
import { roi } from './roi.ts';
import { romi } from './romi.ts';
import { relative_market_share } from './relative_market_share.ts';
import { clv_simple } from './clv_simple.ts';
import { clv } from './clv.ts';
import { ltv_cac_ratio } from './ltv_cac_ratio.ts';
import { rfm_score } from './rfm_score.ts';
import { sales_velocity } from './sales_velocity.ts';
import { pipeline_coverage } from './pipeline_coverage.ts';
import { forecast_accuracy } from './forecast_accuracy.ts';
import { gdr } from './gdr.ts';
import { ndr } from './ndr.ts';
import { k_factor } from './k_factor.ts';
import { grp } from './grp.ts';
import { net_reach } from './net_reach.ts';
import { effective_frequency } from './effective_frequency.ts';
import { tam } from './tam.ts';
import { sam } from './sam.ts';
import { som } from './som.ts';
import { price_elasticity } from './price_elasticity.ts';
import { cross_elasticity } from './cross_elasticity.ts';
import { income_elasticity } from './income_elasticity.ts';
import { van_westendorp } from './van_westendorp.ts';
import { gabor_granger } from './gabor_granger.ts';
import { conjoint_utility } from './conjoint_utility.ts';
import { wtp } from './wtp.ts';
import { kano_better } from './kano_better.ts';
import { kano_worse } from './kano_worse.ts';
import { opportunity_score } from './opportunity_score.ts';
import { qfd_technical_importance } from './qfd_technical_importance.ts';
import { bass_f } from './bass_f.ts';
import { bass_n } from './bass_n.ts';
import { weighted_screening } from './weighted_screening.ts';
import { rice_score } from './rice_score.ts';
import { cost_of_delay } from './cost_of_delay.ts';
import { wsjf_score } from './wsjf_score.ts';
import { fmea_rpn } from './fmea_rpn.ts';
import { npv } from './npv.ts';
import { irr } from './irr.ts';
import { ev } from './ev.ts';
import { evpi } from './evpi.ts';
import { real_options_value } from './real_options_value.ts';

/** Every relation in the corpus, in specification order. */
export const RELATION_LIST: readonly Relation[] = Object.freeze([
  ctr,
  conversion_rate,
  engagement_rate,
  bounce_rate,
  cart_abandonment_rate,
  aov,
  arpu,
  arppu,
  purchase_frequency,
  cpm,
  cpc,
  cpl,
  cpa,
  churn_rate,
  retention_rate,
  mql_to_sql_rate,
  lead_to_customer_rate,
  market_share,
  penetration_rate,
  sov,
  sos,
  csat,
  nps,
  ces,
  gross_margin,
  net_margin,
  contribution_margin,
  break_even_quantity,
  mrr,
  arr,
  mrr_churn_rate,
  cac,
  payback_period,
  roas,
  roi,
  romi,
  relative_market_share,
  clv_simple,
  clv,
  ltv_cac_ratio,
  rfm_score,
  sales_velocity,
  pipeline_coverage,
  forecast_accuracy,
  gdr,
  ndr,
  k_factor,
  grp,
  net_reach,
  effective_frequency,
  tam,
  sam,
  som,
  price_elasticity,
  cross_elasticity,
  income_elasticity,
  van_westendorp,
  gabor_granger,
  conjoint_utility,
  wtp,
  kano_better,
  kano_worse,
  opportunity_score,
  qfd_technical_importance,
  bass_f,
  bass_n,
  weighted_screening,
  rice_score,
  cost_of_delay,
  wsjf_score,
  fmea_rpn,
  npv,
  irr,
  ev,
  evpi,
  real_options_value,
]);

export const RELATIONS: ReadonlyMap<string, Relation> = new Map(
  RELATION_LIST.map((relation) => [relation.formulaId, relation] as const),
);

export const FORMULA_COUNT = 76;

export {
  ctr,
  conversion_rate,
  engagement_rate,
  bounce_rate,
  cart_abandonment_rate,
  aov,
  arpu,
  arppu,
  purchase_frequency,
  cpm,
  cpc,
  cpl,
  cpa,
  churn_rate,
  retention_rate,
  mql_to_sql_rate,
  lead_to_customer_rate,
  market_share,
  penetration_rate,
  sov,
  sos,
  csat,
  nps,
  ces,
  gross_margin,
  net_margin,
  contribution_margin,
  break_even_quantity,
  mrr,
  arr,
  mrr_churn_rate,
  cac,
  payback_period,
  roas,
  roi,
  romi,
  relative_market_share,
  clv_simple,
  clv,
  ltv_cac_ratio,
  rfm_score,
  sales_velocity,
  pipeline_coverage,
  forecast_accuracy,
  gdr,
  ndr,
  k_factor,
  grp,
  net_reach,
  effective_frequency,
  tam,
  sam,
  som,
  price_elasticity,
  cross_elasticity,
  income_elasticity,
  van_westendorp,
  gabor_granger,
  conjoint_utility,
  wtp,
  kano_better,
  kano_worse,
  opportunity_score,
  qfd_technical_importance,
  bass_f,
  bass_n,
  weighted_screening,
  rice_score,
  cost_of_delay,
  wsjf_score,
  fmea_rpn,
  npv,
  irr,
  ev,
  evpi,
  real_options_value,
};
