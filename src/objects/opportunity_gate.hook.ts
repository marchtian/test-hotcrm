// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

import type { Hook, HookContext } from '@objectstack/spec/data';
import type { HookApi } from './_hook-api';

/**
 * Account-category gate on opportunities (process sheet step 1, note 2):
 * "招标代理及其他类客户仅可用于付款回款，无法发起商机、投标、销售合同".
 *
 * A rule, not prose: an opportunity whose account is a `bidding_agent` or
 * `other` is refused on insert, and on an update that re-parents it onto one.
 * The category list is inlined (a lowered hook body cannot import) and
 * mirrors `NON_SALES_CUSTOMER_CATEGORIES` in `_project-picklists.ts`.
 */
const opportunityAccountCategoryGate: Hook = {
  name: 'opportunity_account_category_gate',
  object: 'crm_opportunity',
  events: ['beforeInsert', 'beforeUpdate'],
  priority: 150,
  description: 'Refuse an opportunity on a bidding-agent or other-category account.',
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
    const NON_SALES = new Set(['bidding_agent', 'other']);
    const LABELS: Record<string, string> = { bidding_agent: '招标代理公司', other: '其他' };

    const { event, input } = ctx;
    const accountId = typeof input.crm_account === 'string' ? input.crm_account : '';
    if (!accountId) return;
    if (event === 'beforeUpdate') {
      const prev = (ctx.previous ?? {}) as Record<string, unknown>;
      if (prev.crm_account === accountId) return;
    }
    const api = ctx.api as HookApi | undefined;
    if (!api) return;
    const account = await api.object('crm_account').findOne({
      where: { id: accountId },
      fields: ['id', 'name', 'customer_category', 'account_status'],
    });
    if (!account) return;
    const name = typeof account.name === 'string' ? account.name : accountId;
    // Step 5: a customer takes effect after review. An ABSENT status (rows
    // that predate the field) counts as active; only an explicit draft /
    // submitted / rejected is refused.
    const reviewStatus = typeof account.account_status === 'string' ? account.account_status : '';
    if (reviewStatus && reviewStatus !== 'active') {
      const STATUS_LABELS: Record<string, string> = { draft: '草稿', submitted: '审批中', rejected: '已驳回' };
      throw refuse(
        `Account "${name}" is not active (review status: ${reviewStatus}) and cannot carry an opportunity yet.`,
        'ACCOUNT_NOT_ACTIVE',
        409,
        `客户「${name}」尚未审批生效（当前：${STATUS_LABELS[reviewStatus] ?? reviewStatus}），审批通过后才能关联商机、项目。`,
      );
    }
    const category = typeof account.customer_category === 'string' ? account.customer_category : '';
    if (!NON_SALES.has(category)) return;
    throw refuse(
      `Account "${name}" is a ${category} customer and cannot initiate an opportunity.`,
      'ACCOUNT_CATEGORY_NOT_SALES',
      409,
      `客户「${name}」的客户分类为「${LABELS[category] ?? category}」，仅可用于付款回款，不能发起商机、投标或销售合同。`,
    );
  },
};

export default opportunityAccountCategoryGate;
