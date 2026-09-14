// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

import type { Action } from '@objectstack/spec/ui';

/**
 * Create Presales Project — the "一键立项" on an opportunity (process sheet
 * step 15). Copies the opportunity's identity, account, category, amount and
 * iron-triangle roles onto a new presales project so nothing is keyed in
 * twice. The opportunity must not be sitting in, or have failed, approval.
 *
 * Script-typed, same shape as `clone_opportunity`: reads the source from
 * `ctx.record`, writes with `api.write`.
 */
export const CreatePresalesProjectAction: Action = {
  name: 'create_presales_project',
  label: 'Create Presales Project',
  objectName: 'crm_opportunity',
  icon: 'clipboard-list',
  type: 'script',
  body: {
    language: 'js',
    source: `
      const id = ctx.recordId;
      if (!id) throw new Error('create_presales_project requires a recordId');
      const src = ctx.record ?? {};
      if (!src.crm_account) throw new Error('create_presales_project: source account not loaded.');
      if (src.approval_status === 'pending') {
        throw new Error('商机立项审批尚未完成，审批通过后才能生成售前立项。');
      }
      if (src.approval_status === 'rejected') {
        throw new Error('商机立项审批已驳回，不能生成售前立项。');
      }
      if (src.stage === 'closed_lost') {
        throw new Error('已丢单的商机不能生成售前立项。');
      }
      const inserted = await ctx.api.object('crm_presales_project').insert({
        name: src.project_name || src.name,
        crm_opportunity: id,
        crm_account: src.crm_account,
        business_category: src.business_category ?? null,
        expected_contract_amount: src.amount ?? null,
        quote_amount: src.amount ?? null,
        plan_start_date: src.expected_sign_date ?? null,
        account_manager: src.account_manager ?? null,
        project_manager: src.delivery_manager ?? null,
        description: src.description ?? null,
        risk_analysis: src.risk_analysis ?? null,
        status: 'draft',
        // Explicit because an action body runs isSystem (#548).
        owner_id: ctx.user?.id ?? null,
      });
      return { id: inserted?.id ?? null };
    `,
    capabilities: ['api.read', 'api.write'],
    timeoutMs: 5000,
  },
  locations: ['record_header', 'record_more'],
  successMessage: 'Presales project created from this opportunity.',
  refreshAfter: true,
};

/**
 * Create Delivery Project — "转交付立项" on an APPROVED presales project
 * (process sheet steps 21 and 27). The four cost ESTIMATES become the four
 * BUDGET lines (the baseline), the quote becomes the contract amount, the
 * roles carry over, and the presales project is marked `converted`.
 */
export const CreateDeliveryProjectAction: Action = {
  name: 'create_delivery_project',
  label: 'Create Delivery Project',
  objectName: 'crm_presales_project',
  icon: 'hard-hat',
  type: 'script',
  body: {
    language: 'js',
    source: `
      const id = ctx.recordId;
      if (!id) throw new Error('create_delivery_project requires a recordId');
      const src = ctx.record ?? {};
      if (src.status === 'converted') {
        throw new Error('该售前项目已转交付立项。');
      }
      if (src.status !== 'approved') {
        throw new Error('只有审批通过的售前立项才能转交付立项（当前状态：' + (src.status ?? '未知') + '）。');
      }
      const inserted = await ctx.api.object('crm_delivery_project').insert({
        name: src.name,
        alias: src.alias ?? null,
        crm_presales_project: id,
        crm_opportunity: src.crm_opportunity ?? null,
        crm_account: src.crm_account,
        project_type: src.project_type ?? null,
        business_category: src.business_category ?? null,
        plan_start_date: src.plan_start_date ?? null,
        plan_end_date: src.plan_end_date ?? null,
        project_manager: src.project_manager ?? null,
        project_director: src.project_director ?? null,
        pricing_lead: src.pricing_lead ?? null,
        qa_lead: src.qa_lead ?? null,
        budget_labor: src.est_labor_cost ?? 0,
        budget_service: src.est_service_cost ?? 0,
        budget_hardware: src.est_hardware_cost ?? 0,
        budget_expense: src.est_expense_cost ?? 0,
        contract_amount: src.quote_amount ?? null,
        security_level: src.security_level ?? null,
        security_notes: src.security_notes ?? null,
        description: src.description ?? null,
        status: 'planning',
        cost_control: 'warn',
        owner_id: ctx.user?.id ?? null,
      });
      await ctx.api.object('crm_presales_project').update(
        { id, status: 'converted' },
        { where: { id } },
      );
      return { id: inserted?.id ?? null };
    `,
    capabilities: ['api.read', 'api.write'],
    timeoutMs: 5000,
  },
  locations: ['record_header', 'record_more'],
  successMessage: 'Delivery project created; the presales project is now converted.',
  refreshAfter: true,
};
