// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

import type { Hook, HookContext } from '@objectstack/spec/data';
import type { HookApi } from './_hook-api';

/**
 * Roll APPROVED budget adjustments up into the project's `budget_adjustment`
 * (process sheet step 32). The project derivation hook then raises
 * `budget_total`, which is what releases the timesheet gate — the baseline
 * itself never moves, so the report can show baseline / adjusted / actual.
 */
const budgetAdjustmentProjectRollupHook: Hook = {
  name: 'budget_adjustment_project_rollup',
  object: 'crm_budget_adjustment',
  events: ['afterInsert', 'afterUpdate', 'afterDelete'],
  priority: 300,
  async: true,
  onError: 'log',
  description: 'Recompute the parent delivery project approved budget increase from its approved adjustments.',
  handler: async (ctx: HookContext) => {
    const api = ctx.api as HookApi | undefined;
    if (!api) return;
    const { input } = ctx;
    const previous = ctx.previous;
    const projectIds = new Set<string>();
    for (const v of [input?.crm_delivery_project, previous?.crm_delivery_project]) {
      if (typeof v === 'string' && v) projectIds.add(v);
    }
    for (const projectId of projectIds) {
      const rows = await api.object('crm_budget_adjustment').find({
        where: { crm_delivery_project: projectId },
        fields: ['amount', 'status'],
        top: 5000,
      });
      let sum = 0;
      for (const r of rows ?? []) {
        if (r.status !== 'approved') continue;
        if (typeof r.amount === 'number') sum += r.amount;
      }
      await api.object('crm_delivery_project').update(
        { id: projectId, budget_adjustment: Math.round(sum * 100) / 100 },
        { where: { id: projectId } },
      );
    }
  },
};

export default budgetAdjustmentProjectRollupHook;
