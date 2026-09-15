// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

import { ObjectSchema, Field } from '@objectstack/spec/data';
import { P } from '@objectstack/spec';
import { APPROVAL_STATUS_OPTIONS, DOC_STATUS_OPTIONS, POSITION_LEVEL_OPTIONS } from './_project-picklists';

/**
 * Timesheet (月度工时填报 / TS) — process sheet steps 33–34.
 *
 * One row = one person, one delivery project, one month. `hourly_rate` and
 * `labor_cost` are DERIVED by `timesheet.hook.ts` from `position_level` and
 * `hours` (sample rate table, inlined there). The same hook is the cost gate
 * of step 36: a SUBMIT on a project whose `cost_control` is `block` and whose
 * cost would exceed `budget_total` is refused with a message that points at
 * the budget-adjustment request.
 *
 * `approver` is filled from the project's `project_manager` (step 34: "工时
 * 提交后由项目经理审批") and is what the timesheet approval flow routes on.
 */
export const Timesheet = ObjectSchema.create({
  name: 'crm_timesheet',
  label: 'Timesheet',
  pluralLabel: 'Timesheets',
  icon: 'clock',
  description: 'Monthly timesheet entry against a delivery project',

  sharingModel: 'public_read_write',
  nameField: 'timesheet_number',
  highlightFields: ['timesheet_number', 'crm_delivery_project', 'period_month', 'hours', 'labor_cost', 'status'],

  fieldGroups: [
    { key: 'basic',    label: 'Timesheet',           icon: 'clock' },
    { key: 'cost',     label: 'Costing',             icon: 'calculator' },
    { key: 'approval', label: 'Status & Approval',   icon: 'check-circle' },
  ],

  fields: {
    owner_id: Field.lookup('sys_user', {
      label: 'Submitted By',
      group: 'basic',
      system: true,
      readonly: false,
    }),

    timesheet_number: Field.autonumber({
      label: 'Timesheet Number',
      group: 'basic',
      format: 'TS-{0000}',
    }),

    // Step 33: "销售填写售前项目 TS，交付填写交付项目 TS" — exactly one of the
    // two must be set (`timesheet_project_required` below). Only delivery
    // timesheets are costed against a budget; a presales timesheet records the
    // hours and routes to the presales project's manager.
    crm_delivery_project: Field.lookup('crm_delivery_project', {
      label: 'Delivery Project',
      group: 'basic',
    }),

    crm_presales_project: Field.lookup('crm_presales_project', {
      label: 'Presales Project',
      group: 'basic',
    }),

    // First day of the month the hours belong to.
    period_month: Field.date({
      label: 'Month',
      group: 'basic',
      required: true,
      storage: { notNull: true },
    }),

    hours: Field.number({
      label: 'Hours',
      group: 'basic',
      required: true,
      storage: { notNull: true },
      min: 0,
      max: 400,
    }),

    work_description: Field.textarea({
      label: 'Work Description',
      group: 'basic',
    }),

    // ─── Costing ───────────────────────────────────────────────────────
    position_level: Field.select({
      label: 'Position Level',
      group: 'cost',
      required: true,
      storage: { notNull: true },
      defaultValue: 'intermediate',
      options: [...POSITION_LEVEL_OPTIONS],
    }),

    hourly_rate: Field.currency({
      label: 'Hourly Rate (sample)',
      group: 'cost',
      scale: 2,
      readonly: true,
    }),

    labor_cost: Field.currency({
      label: 'Labor Cost',
      group: 'cost',
      scale: 2,
      readonly: true,
    }),

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

    approver: Field.lookup('sys_user', {
      label: 'Approver (Project Manager)',
      group: 'approval',
      readonly: true,
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
    { fields: ['crm_presales_project'] },
    { fields: ['owner_id'] },
    { fields: ['period_month'] },
    { fields: ['status'] },
  ],

  enable: {
    apiEnabled: true,
    apiMethods: ['get', 'list', 'create', 'update', 'delete'],
  },

  validations: [
    {
      name: 'timesheet_project_required',
      type: 'script',
      severity: 'error',
      message: 'A timesheet must reference a delivery project or a presales project',
      condition: P`(!has(record.crm_delivery_project) || record.crm_delivery_project == null) && (!has(record.crm_presales_project) || record.crm_presales_project == null)`,
    },
    {
      name: 'hours_positive',
      type: 'script',
      severity: 'error',
      message: 'Hours must be greater than zero',
      condition: P`has(record.hours) && record.hours != null && record.hours <= 0`,
    },
    {
      name: 'timesheet_status_progression',
      type: 'state_machine',
      severity: 'warning',
      message: 'Invalid timesheet status transition',
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
