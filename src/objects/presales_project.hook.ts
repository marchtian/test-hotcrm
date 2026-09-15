// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

import type { Hook, HookContext } from '@objectstack/spec/data';

/**
 * Presales project costing.
 *
 * Derives `est_total_cost` (sum of the four estimate lines) and `gross_margin`
 * ((quote − total) / quote) on every write, from the MERGED record — an update
 * that touches one line still re-derives both. One place owns the arithmetic,
 * same reasoning as `crm_opportunity.expected_revenue`.
 */
const presalesProjectCostingHook: Hook = {
  name: 'presales_project_costing',
  object: 'crm_presales_project',
  events: ['beforeInsert', 'beforeUpdate'],
  priority: 200,
  description: 'Derive total estimated cost and gross margin from the estimate lines and the quote.',
  handler: async (ctx: HookContext) => {
    const { input } = ctx;
    const previous = (ctx.previous ?? {}) as Record<string, unknown>;
    const merged: Record<string, unknown> = { ...previous, ...input };
    const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
    const total =
      num(merged.est_labor_cost) + num(merged.est_service_cost) +
      num(merged.est_hardware_cost) + num(merged.est_expense_cost);
    input.est_total_cost = Math.round(total * 100) / 100;
    const quote = num(merged.quote_amount);
    input.gross_margin = quote > 0 ? Math.round(((quote - total) / quote) * 1000) / 10 : null;
  },
};

export default presalesProjectCostingHook;
