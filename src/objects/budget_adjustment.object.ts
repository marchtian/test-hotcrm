// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

import { ObjectSchema, Field } from '@objectstack/spec/data';
import { P } from '@objectstack/spec';
import { APPROVAL_STATUS_OPTIONS, COST_CATEGORY_OPTIONS, DOC_STATUS_OPTIONS } from './_project-picklists';

/**
 * Budget Adjustment (预算追加申请) — process sheet step 32: "预算不足时申请追加，
 * 填写调整原因、差异分析，走审批流程".
 *
 * The approval flow (`budget-adjustment-approval.flow.ts`) lands `approved`;
 * `budget_adjustment.hook.ts` then rolls the APPROVED amounts up into
 * `crm_delivery_project.budget_adjustment`, which raises `budget_total` and
 * releases the timesheet gate. The baseline is never rewritten.
 */
export const BudgetAdjustment = ObjectSchema.create({
  name: 'crm_budget_adjustment',
  label: 'Budget Adjustment',
  pluralLabel: 'Budget Adjustments',
  icon: 'wallet',
  description: 'Request to increase a delivery project budget, with reason and variance analysis',

  sharingModel: 'public_read_write',
  nameField: 'request_number',
  highlightFields: ['request_number', 'crm_delivery_project', 'cost_category', 'amount', 'status'],

  fieldGroups: [
    { key: 'basic',    label: 'Request',            icon: 'wallet' },
    { key: 'analysis', label: 'Reason & Analysis',  icon: 'file-text' },
    { key: 'approval', label: 'Status & Approval',  icon: 'check-circle' },
  ],

  fields: {
    owner_id: Field.lookup('sys_user', {
      label: 'Requested By',
      group: 'basic',
      system: true,
      readonly: false,
    }),

    request_number: Field.autonumber({ label: 'Request Number', group: 'basic', format: 'BA-{0000}' }),

    crm_delivery_project: Field.lookup('crm_delivery_project', {
      label: 'Delivery Project',
      group: 'basic',
      required: true,
      storage: { notNull: true },
    }),

    cost_category: Field.select({
      label: 'Cost Category',
      group: 'basic',
      required: true,
      storage: { notNull: true },
      defaultValue: 'labor',
      options: [...COST_CATEGORY_OPTIONS],
    }),

    amount: Field.currency({
      label: 'Requested Increase',
      group: 'basic',
      required: true,
      storage: { notNull: true },
      scale: 2,
      min: 0,
    }),

    reason: Field.textarea({
      label: 'Adjustment Reason',
      group: 'analysis',
      required: true,
      storage: { notNull: true },
    }),

    variance_analysis: Field.textarea({
      label: 'Variance Analysis',
      group: 'analysis',
    }),

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
    { fields: ['crm_delivery_project'] },
    { fields: ['status'] },
    { fields: ['owner_id'] },
  ],

  enable: {
    apiEnabled: true,
    apiMethods: ['get', 'list', 'create', 'update', 'delete'],
    files: true,
  },

  validations: [
    {
      name: 'amount_positive',
      type: 'script',
      severity: 'error',
      message: 'Requested increase must be greater than zero',
      condition: P`has(record.amount) && record.amount != null && record.amount <= 0`,
    },
    {
      name: 'budget_adjustment_status_progression',
      type: 'state_machine',
      severity: 'warning',
      message: 'Invalid budget adjustment status transition',
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
