// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

import type { Hook, HookContext } from '@objectstack/spec/data';

/**
 * Lead conversion gate (process sheet step 7): "线索对应审批流程，审批通过后方可
 * 转化为正式商机". The `lead_approval` flow stamps `approval_status`; this
 * hook refuses the write that flips `is_converted` unless that stamp is
 * `approved`. It sits BEFORE `lead_lifecycle` (priority 150 < 200) so the
 * refusal is the first thing the conversion path meets.
 */
const leadConversionGate: Hook = {
  name: 'lead_conversion_gate',
  object: 'crm_lead',
  events: ['beforeUpdate'],
  priority: 150,
  description: 'Refuse converting a lead whose approval is not granted.',
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
    const { input } = ctx;
    const previous = (ctx.previous ?? {}) as Record<string, unknown>;
    if (input.is_converted !== true || previous.is_converted === true) return;
    const merged: Record<string, unknown> = { ...previous, ...input };
    if (merged.approval_status === 'approved') return;
    const name = [merged.first_name, merged.last_name].filter((v) => typeof v === 'string' && v).join(' ') || (typeof merged.company === 'string' ? merged.company : 'lead');
    throw refuse(
      `Lead "${name}" cannot be converted: approval status is ${String(merged.approval_status ?? 'not_required')}, not approved.`,
      'LEAD_NOT_APPROVED',
      409,
      `线索「${name}」尚未通过审批，不能转化为商机。请先将线索状态置为「已确认资格」并等待线索审批通过。`,
    );
  },
};

export default leadConversionGate;
