// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

import type { Hook, HookContext } from '@objectstack/spec/data';

/**
 * Delivery project budget & cost derivation.
 *
 * Every derived money field on the project is computed HERE, on every write,
 * from the merged record:
 *
 *   budget_baseline   = Σ budget_{labor,service,hardware,expense}
 *   budget_total      = budget_baseline + budget_adjustment   (approved increases)
 *   actual_total_cost = actual_labor_cost + actual_expense_cost
 *   budget_used_pct   = actual_total_cost / budget_total
 *   cost_status       = over_budget | warning (>= 80%) | normal
 *   gross_margin      = (contract_amount − actual_total_cost) / contract_amount
 *
 * The three RAW inputs the child objects own — `actual_labor_cost`
 * (timesheets), `actual_expense_cost` (expense claims), `budget_adjustment`
 * (approved budget adjustments) — arrive as plain updates from their rollup
 * hooks and pass through this same derivation. `cost_status` is a machine
 * SIGNAL; whether it blocks anything is decided by `cost_control`, which only
 * a person sets (see `timesheet.hook.ts`).
 */
const deliveryProjectDerivationHook: Hook = {
  name: 'delivery_project_derivation',
  object: 'crm_delivery_project',
  events: ['beforeInsert', 'beforeUpdate'],
  priority: 200,
  description: 'Derive budget baseline / total, actual total, budget usage, cost status and gross margin.',
  handler: async (ctx: HookContext) => {
    const { input } = ctx;
    const previous = (ctx.previous ?? {}) as Record<string, unknown>;
    const merged: Record<string, unknown> = { ...previous, ...input };
    const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
    const r2 = (v: number) => Math.round(v * 100) / 100;

    const baseline = r2(
      num(merged.budget_labor) + num(merged.budget_service) +
      num(merged.budget_hardware) + num(merged.budget_expense),
    );
    const adjustment = r2(num(merged.budget_adjustment));
    const total = r2(baseline + adjustment);
    const actualTotal = r2(num(merged.actual_labor_cost) + num(merged.actual_expense_cost));

    input.budget_baseline = baseline;
    input.budget_total = total;
    input.actual_total_cost = actualTotal;

    if (total > 0) {
      const pct = Math.round((actualTotal / total) * 1000) / 10;
      input.budget_used_pct = pct;
      input.cost_status = actualTotal > total ? 'over_budget' : pct >= 80 ? 'warning' : 'normal';
    } else {
      input.budget_used_pct = null;
      input.cost_status = 'normal';
    }

    const contract = num(merged.contract_amount);
    input.gross_margin = contract > 0 ? Math.round(((contract - actualTotal) / contract) * 1000) / 10 : null;
  },
};

export default deliveryProjectDerivationHook;
