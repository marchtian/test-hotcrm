// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

import { ObjectSchema, Field } from '@objectstack/spec/data';
import { P } from '@objectstack/spec';
import { APPROVAL_STATUS_OPTIONS, DOC_STATUS_OPTIONS } from './_project-picklists';

/**
 * Opportunity Change Request (商机状态变更申请) — process sheet steps 13–14:
 * "发起赢单、弃单、调整铁三角等状态变更操作，填写变更原因与说明" → "重要状态
 * 变更需审批，通过后商机状态正式生效".
 *
 * The request carries the CHANGE; the opportunity is untouched until the
 * approval flow lands `approved`, at which point
 * `opportunity_change_request.hook.ts` applies it (stage + reason for win /
 * loss, the three iron-triangle lookups for a role change).
 *
 * `win_reason` / `loss_reason` mirror `crm_opportunity`'s own vocabularies so
 * the approved value copies across as a legal option.
 */
export const OpportunityChangeRequest = ObjectSchema.create({
  name: 'crm_opportunity_change_request',
  label: 'Opportunity Change Request',
  pluralLabel: 'Opportunity Change Requests',
  icon: 'git-pull-request',
  description: 'Approval-gated win / loss / iron-triangle change on an opportunity',

  sharingModel: 'public_read_write',
  nameField: 'request_number',
  highlightFields: ['request_number', 'crm_opportunity', 'change_type', 'status'],

  fieldGroups: [
    { key: 'basic',    label: 'Change Request',     icon: 'git-pull-request' },
    { key: 'outcome',  label: 'Win / Loss Details', icon: 'flag' },
    { key: 'roles',    label: 'New Iron Triangle',  icon: 'users' },
    { key: 'approval', label: 'Status & Approval',  icon: 'check-circle' },
  ],

  fields: {
    owner_id: Field.lookup('sys_user', {
      label: 'Requested By',
      group: 'basic',
      system: true,
      readonly: false,
    }),

    request_number: Field.autonumber({ label: 'Request Number', group: 'basic', format: 'CR-{0000}' }),

    crm_opportunity: Field.lookup('crm_opportunity', {
      label: 'Opportunity',
      group: 'basic',
      required: true,
      storage: { notNull: true },
    }),

    change_type: Field.select({
      label: 'Change Type',
      group: 'basic',
      required: true,
      storage: { notNull: true },
      options: [
        { label: 'Close as Won',           value: 'win',           color: '#00AA00' },
        { label: 'Abandon (Close as Lost)', value: 'loss',         color: '#FF0000' },
        { label: 'Adjust Iron Triangle',   value: 'iron_triangle', color: '#4169E1' },
      ],
    }),

    reason: Field.textarea({
      label: 'Change Reason',
      group: 'basic',
      required: true,
      storage: { notNull: true },
    }),

    // ─── Win / loss (mirrors crm_opportunity) ──────────────────────────
    win_reason: Field.select({
      label: 'Win Reason',
      group: 'outcome',
      requiredWhen: P`has(record.change_type) && record.change_type == "win"`,
      options: [
        { label: 'Better Product', value: 'better_product' },
        { label: 'Better Price', value: 'better_price' },
        { label: 'Existing Relationship', value: 'relationship' },
        { label: 'Better Support', value: 'better_support' },
        { label: 'Best Fit / Features', value: 'best_fit' },
        { label: 'Quote Accepted', value: 'quote_accepted' },
        { label: 'Other', value: 'other' },
      ],
    }),

    loss_reason: Field.select({
      label: 'Loss Reason',
      group: 'outcome',
      requiredWhen: P`has(record.change_type) && record.change_type == "loss"`,
      options: [
        { label: 'Price Too High', value: 'price' },
        { label: 'Lost to Competitor', value: 'competitor' },
        { label: 'No Budget', value: 'no_budget' },
        { label: 'No Decision', value: 'no_decision' },
        { label: 'Bad Timing', value: 'timing' },
        { label: 'Missing Features', value: 'features' },
        { label: 'Other', value: 'other' },
      ],
    }),

    loss_details: Field.textarea({ label: 'Details', group: 'outcome' }),

    // ─── Iron triangle ─────────────────────────────────────────────────
    new_account_manager: Field.lookup('sys_user', { label: 'New Account Manager', group: 'roles' }),
    new_solution_manager: Field.lookup('sys_user', { label: 'New Solution Manager', group: 'roles' }),
    new_delivery_manager: Field.lookup('sys_user', { label: 'New Delivery Manager', group: 'roles' }),

    // ─── Lifecycle & approval ──────────────────────────────────────────
    status: Field.select({
      label: 'Status',
      group: 'approval',
      required: true,
      storage: { notNull: true },
      defaultValue: 'draft',
      trackHistory: true,
      options: [...DOC_STATUS_OPTIONS],
    }),

    approval_status: Field.select({
      label: 'Approval Status',
      group: 'approval',
      readonly: true,
      defaultValue: 'not_required',
      options: [...APPROVAL_STATUS_OPTIONS],
    }),

    approved_date: Field.datetime({ label: 'Approved Date', group: 'approval', readonly: true }),
  },

  indexes: [
    { fields: ['crm_opportunity'] },
    { fields: ['status'] },
    { fields: ['owner_id'] },
  ],

  enable: {
    apiEnabled: true,
    apiMethods: ['get', 'list', 'create', 'update', 'delete'],
  },

  validations: [
    {
      name: 'change_request_status_progression',
      type: 'state_machine',
      severity: 'warning',
      message: 'Invalid change request status transition',
      field: 'status',
      transitions: {
        draft: ['submitted'],
        submitted: ['draft', 'approved', 'rejected'],
        approved: [],
        rejected: ['draft'],
      },
    },
  ],
});
