// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

import { defineApprovalFlow } from './_approval-flow';

/**
 * The customer's process sheet ends eight of its nine stages with an approval.
 * `opportunity-approval.flow.ts` (step 11) and
 * `presales-project-approval.flow.ts` (step 20) are hand-written; the six
 * below are the same construction through `defineApprovalFlow`, and between
 * them they show every approver source the platform offers a designer:
 *
 *   position           — a role in the org (PMO manager, finance manager …)
 *   field on the record — the project director the record names
 *   the approver field — a person a HOOK filled in (the project manager)
 */

/** Step 5 — 客户信息审批: a customer takes effect only after review. */
export const AccountApprovalFlow = defineApprovalFlow({
  name: 'account_approval',
  label: 'Account Review',
  description: 'A submitted account is reviewed by the PMO manager before it can carry an opportunity.',
  objectName: 'crm_account',
  submitField: 'account_status',
  submitValue: 'submitted',
  tiers: [{ id: 'pmo_manager_review', label: 'PMO Manager Review', approvers: [{ type: 'position', value: 'pmo_manager' }] }],
  onApprove: { account_status: 'active', approval_status: 'approved' },
  onReject: { account_status: 'rejected', approval_status: 'rejected' },
  notify: {
    titleField: 'name',
    approvedTitle: 'Account approved: {title}',
    approvedMessage: 'Account {title} is now active — opportunities can be opened on it.',
    rejectedTitle: 'Account rejected: {title}',
    rejectedMessage: 'Account {title} was not approved. Revise and submit again.',
  },
});

/** Step 7 — 线索审批: a qualified lead is approved before it may convert. */
export const LeadApprovalFlow = defineApprovalFlow({
  name: 'lead_approval',
  label: 'Lead Approval',
  description: 'A qualified lead is approved by the presales manager before it may be converted to an opportunity.',
  objectName: 'crm_lead',
  submitField: 'status',
  submitValue: 'qualified',
  tiers: [{ id: 'presales_manager_review', label: 'Presales Manager Review', approvers: [{ type: 'position', value: 'presales_manager' }] }],
  onApprove: { approval_status: 'approved' },
  onReject: { approval_status: 'rejected' },
  notify: {
    titleField: 'company',
    approvedTitle: 'Lead approved: {title}',
    approvedMessage: 'Lead {title} is approved and may be converted to an opportunity.',
    rejectedTitle: 'Lead rejected: {title}',
    rejectedMessage: 'Lead {title} was not approved for conversion.',
  },
});

/** Step 14 — 商机状态变更审批: win / loss / iron-triangle changes take effect on approval. */
export const OpportunityChangeApprovalFlow = defineApprovalFlow({
  name: 'opportunity_change_approval',
  label: 'Opportunity Change Approval',
  description: 'A submitted win / loss / iron-triangle change request is approved by the PMO director, then applied to the opportunity.',
  objectName: 'crm_opportunity_change_request',
  submitField: 'status',
  submitValue: 'submitted',
  tiers: [{ id: 'pmo_director_review', label: 'PMO Director Review', approvers: [{ type: 'position', value: 'pmo_director' }] }],
  onApprove: { status: 'approved', approval_status: 'approved', approved_date: '{NOW()}' },
  onReject: { status: 'rejected', approval_status: 'rejected' },
  notify: {
    titleField: 'request_number',
    approvedTitle: 'Change request approved: {title}',
    approvedMessage: 'Change request {title} was approved and has been applied to the opportunity.',
    rejectedTitle: 'Change request rejected: {title}',
    rejectedMessage: 'Change request {title} was not approved; the opportunity is unchanged.',
  },
});

/** Step 26 — 交付立项审批: project director (named on the record), then PMO director. */
export const DeliveryProjectApprovalFlow = defineApprovalFlow({
  name: 'delivery_project_approval',
  label: 'Delivery Project Approval',
  description: 'Two-tier approval of a delivery project: the named project director, then the PMO director. On approval the project starts.',
  objectName: 'crm_delivery_project',
  submitField: 'status',
  submitValue: 'submitted',
  tiers: [
    { id: 'director_review', label: 'Project Director Review', approvers: [{ type: 'field', value: 'project_director' }] },
    { id: 'pmo_signoff', label: 'PMO Director Sign-off', approvers: [{ type: 'position', value: 'pmo_director' }] },
  ],
  onApprove: { status: 'active', approval_status: 'approved', approved_date: '{NOW()}' },
  onReject: { status: 'planning', approval_status: 'rejected' },
  notify: {
    titleField: 'name',
    approvedTitle: 'Delivery project approved: {title}',
    approvedMessage: 'Delivery project {title} is approved and now active.',
    rejectedTitle: 'Delivery project rejected: {title}',
    rejectedMessage: 'Delivery project {title} was not approved. Revise and submit again.',
  },
});

/** Step 32 — 预算追加审批: finance manager; the rollup hook raises the budget on approval. */
export const BudgetAdjustmentApprovalFlow = defineApprovalFlow({
  name: 'budget_adjustment_approval',
  label: 'Budget Adjustment Approval',
  description: 'A submitted budget increase is approved by the finance manager; approved amounts raise the project budget and release the timesheet gate.',
  objectName: 'crm_budget_adjustment',
  submitField: 'status',
  submitValue: 'submitted',
  tiers: [{ id: 'finance_review', label: 'Finance Manager Review', approvers: [{ type: 'position', value: 'finance_manager' }] }],
  onApprove: { status: 'approved', approval_status: 'approved', approved_date: '{NOW()}' },
  onReject: { status: 'rejected', approval_status: 'rejected' },
  notify: {
    titleField: 'request_number',
    approvedTitle: 'Budget adjustment approved: {title}',
    approvedMessage: 'Budget adjustment {title} was approved; the project budget has been raised.',
    rejectedTitle: 'Budget adjustment rejected: {title}',
    rejectedMessage: 'Budget adjustment {title} was not approved.',
  },
});

/** Step 34 — 工时审批: the approver is the project manager the hook filled in. */
export const TimesheetApprovalFlow = defineApprovalFlow({
  name: 'timesheet_approval',
  label: 'Timesheet Approval',
  description: 'A submitted timesheet is approved by the project manager of its delivery project (the `approver` field).',
  objectName: 'crm_timesheet',
  submitField: 'status',
  submitValue: 'submitted',
  tiers: [{ id: 'project_manager_review', label: 'Project Manager Review', approvers: [{ type: 'field', value: 'approver' }] }],
  onApprove: { status: 'approved', approval_status: 'approved', approved_date: '{NOW()}' },
  onReject: { status: 'rejected', approval_status: 'rejected' },
  notify: {
    titleField: 'timesheet_number',
    approvedTitle: 'Timesheet approved: {title}',
    approvedMessage: 'Timesheet {title} was approved and counts toward the project cost.',
    rejectedTitle: 'Timesheet rejected: {title}',
    rejectedMessage: 'Timesheet {title} was rejected. Correct it and submit again.',
  },
});
