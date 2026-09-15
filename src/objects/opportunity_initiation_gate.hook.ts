// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

import type { Hook, HookContext } from '@objectstack/spec/data';

/**
 * Initiation gate on opportunities (process sheet steps 11 and 14).
 *
 * Step 11: "新增商机可跟进，立项通过后方可更新阶段、投标、赢丢单操作". Until the
 * `opportunity_approval` flow has stamped `approval_status = approved`, a user
 * may keep working the deal (notes, contacts, amount, dates) but may not move
 * its stage or mark it for bidding.
 *
 * Step 14: "重要状态变更需审批，通过后商机状态正式生效". Closing a deal —
 * won or lost — goes through a `crm_opportunity_change_request`; on approval
 * `opportunity_change_request.hook.ts` writes the stage under the platform
 * identity. A user who sets `closed_won` / `closed_lost` directly is refused,
 * whatever the approval status, and told which path to take.
 *
 * USER writes only. Two signals, both needed: a seed / backfill carries no
 * `ctx.user?.id` (this repo's usual system-write signal, cf. the converted-lead
 * lock in `lead.hook.ts`), but a flow-driven write is different — measured on
 * 17.4.0, the change-request apply arrives WITH the deciding user re-attached
 * for attribution (`user.id` set) and `session: { isSystem: true, actor:
 * 'svc:flow:opportunity_change_approval' }`. A direct user PATCH carries no
 * `isSystem`. So `ctx.session?.isSystem` is what lets the sanctioned close
 * through, and `ctx.user?.id` what lets the seed through. Actions run under
 * the platform identity too, so `mass_update_stage` re-states the same rule
 * in its own body.
 */
const opportunityInitiationGate: Hook = {
  name: 'opportunity_initiation_gate',
  object: 'crm_opportunity',
  events: ['beforeUpdate'],
  priority: 140,
  description: 'Refuse stage / bid changes before initiation approval, and direct close without a change request.',
  handler: async (ctx: HookContext) => {
    function refuse(
      message: string,
      code: string,
      status: number,
      userMessage: string = message,
    ): Error {
      const err = new Error(message) as Error & {
        code: string;
        status: number;
        userMessage: string;
      };
      err.code = code;
      err.status = status;
      err.userMessage = userMessage;
      return err;
    }
    if (!ctx.user?.id || ctx.session?.isSystem) return;
    const { input } = ctx;
    const previous = (ctx.previous ?? {}) as Record<string, unknown>;
    const merged: Record<string, unknown> = { ...previous, ...input };
    const name = typeof merged.name === 'string' && merged.name ? merged.name : 'opportunity';

    const CLOSED: Record<string, string> = { closed_won: '赢单', closed_lost: '丢单' };
    const STATUS_LABELS: Record<string, string> = {
      not_required: '未提交', pending: '审批中', rejected: '已驳回',
    };

    const stageChanged = typeof input.stage === 'string' && input.stage !== previous.stage;
    if (stageChanged && CLOSED[input.stage as string]) {
      const label = CLOSED[input.stage as string];
      throw refuse(
        `Opportunity "${name}" cannot be set to ${String(input.stage)} directly; file an opportunity change request.`,
        'OPPORTUNITY_CLOSE_REQUIRES_CHANGE_REQUEST',
        409,
        `商机「${name}」不能直接置为「${label}」。请新建「商机状态变更申请」，审批通过后状态自动生效。`,
      );
    }

    if (merged.approval_status === 'approved') return;
    const statusKey = typeof merged.approval_status === 'string' ? merged.approval_status : 'not_required';
    const statusLabel = STATUS_LABELS[statusKey] ?? statusKey;
    const hint = statusKey === 'pending'
      ? '请等待立项审批通过。'
      : '请先点击「提交立项审批」并等待审批通过。';

    if (stageChanged) {
      throw refuse(
        `Opportunity "${name}" cannot change stage: initiation approval is ${statusKey}, not approved.`,
        'OPPORTUNITY_NOT_APPROVED',
        409,
        `商机「${name}」尚未通过立项审批（当前：${statusLabel}），不能更新阶段。${hint}`,
      );
    }
    if (input.is_bid === true && previous.is_bid !== true) {
      throw refuse(
        `Opportunity "${name}" cannot be marked for bidding: initiation approval is ${statusKey}, not approved.`,
        'OPPORTUNITY_NOT_APPROVED',
        409,
        `商机「${name}」尚未通过立项审批（当前：${statusLabel}），不能标记投标。${hint}`,
      );
    }
  },
};

export default opportunityInitiationGate;
