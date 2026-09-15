// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

import type { Hook, HookContext } from '@objectstack/spec/data';
import type { HookApi } from './_hook-api';

/**
 * Roll submitted / approved expense claims up into the project's
 * `actual_expense_cost` (process sheet step 35: travel cost is collected per
 * project). Same shape as `timesheet_project_rollup`.
 */
const expenseClaimProjectRollupHook: Hook = {
  name: 'expense_claim_project_rollup',
  object: 'crm_expense_claim',
  events: ['afterInsert', 'afterUpdate', 'afterDelete'],
  priority: 300,
  async: true,
  onError: 'log',
  description: 'Recompute the parent delivery project actual expense cost from its submitted / approved claims.',
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
      const rows = await api.object('crm_expense_claim').find({
        where: { crm_delivery_project: projectId },
        fields: ['amount', 'status'],
        top: 5000,
      });
      let sum = 0;
      for (const r of rows ?? []) {
        if (r.status !== 'submitted' && r.status !== 'approved') continue;
        if (typeof r.amount === 'number') sum += r.amount;
      }
      await api.object('crm_delivery_project').update(
        { id: projectId, actual_expense_cost: Math.round(sum * 100) / 100 },
        { where: { id: projectId } },
      );
    }
  },
};

export default expenseClaimProjectRollupHook;
