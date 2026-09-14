// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

import type { Hook, HookContext } from '@objectstack/spec/data';
import type { HookApi, HookUpdateDoc } from './_hook-api';

/**
 * Apply an APPROVED change request to its opportunity (process sheet step
 * 14: "通过后商机状态正式生效"). Fires once, on the transition INTO `approved`.
 *
 *   win           → stage closed_won  + win_reason
 *   loss          → stage closed_lost + loss_reason (+ loss_details)
 *   iron_triangle → the three role lookups that were filled in
 *
 * Async + `onError: 'log'`: the request is already approved; a failure to
 * apply is logged, not turned into an approval that never happened.
 */
const applyOpportunityChangeRequestHook: Hook = {
  name: 'opportunity_change_request_apply',
  object: 'crm_opportunity_change_request',
  events: ['afterUpdate'],
  priority: 300,
  async: true,
  onError: 'log',
  description: 'Apply an approved win / loss / iron-triangle change to the opportunity.',
  handler: async (ctx: HookContext) => {
    const api = ctx.api as HookApi | undefined;
    if (!api) return;
    const { input } = ctx;
    const previous = (ctx.previous ?? {}) as Record<string, unknown>;
    if (input.status !== 'approved' || previous.status === 'approved') return;
    const merged: Record<string, unknown> = { ...previous, ...input };
    const oppId = typeof merged.crm_opportunity === 'string' ? merged.crm_opportunity : '';
    if (!oppId) return;

    const patch: HookUpdateDoc = { id: oppId };
    const type = merged.change_type;
    if (type === 'win') {
      patch.stage = 'closed_won';
      if (typeof merged.win_reason === 'string') patch.win_reason = merged.win_reason;
      if (typeof merged.loss_details === 'string') patch.loss_details = merged.loss_details;
    } else if (type === 'loss') {
      patch.stage = 'closed_lost';
      if (typeof merged.loss_reason === 'string') patch.loss_reason = merged.loss_reason;
      if (typeof merged.loss_details === 'string') patch.loss_details = merged.loss_details;
    } else if (type === 'iron_triangle') {
      for (const [from, to] of [
        ['new_account_manager', 'account_manager'],
        ['new_solution_manager', 'solution_manager'],
        ['new_delivery_manager', 'delivery_manager'],
      ] as const) {
        if (typeof merged[from] === 'string' && merged[from]) patch[to] = merged[from];
      }
    } else {
      return;
    }
    if (Object.keys(patch).length === 1) return;
    await api.object('crm_opportunity').update(patch, { where: { id: oppId } });
  },
};

export default applyOpportunityChangeRequestHook;
