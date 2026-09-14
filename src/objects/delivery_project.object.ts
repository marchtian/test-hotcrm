// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

import { ObjectSchema, Field } from '@objectstack/spec/data';
import { P } from '@objectstack/spec';
import {
  APPROVAL_STATUS_OPTIONS,
  BUSINESS_CATEGORY_OPTIONS,
  COST_CENTER_OPTIONS,
  COST_CONTROL_OPTIONS,
  COST_STATUS_OPTIONS,
  PROJECT_TYPE_OPTIONS,
  SECURITY_LEVEL_OPTIONS,
} from './_project-picklists';

/**
 * Delivery Project (交付立项) — process sheet steps 21–27 and the object every
 * cost-execution record (timesheet, expense, budget adjustment) hangs off.
 *
 * MUST reference an approved presales project (step 21). Normally CREATED by
 * the `create_delivery_project` action on the presales project, which copies
 * the basics and turns the four cost ESTIMATES into the four budget lines —
 * that is step 27, "以审批通过的 Bizcase 总成本作为考核基线".
 *
 * ### Two kinds of money field, and who writes them
 *
 *   - AUTHORED: the four `budget_*` lines, `contract_amount`, `cost_control`.
 *   - DERIVED (readonly): `budget_baseline`, `budget_total`,
 *     `actual_total_cost`, `budget_used_pct`, `cost_status`, `gross_margin` —
 *     recomputed by `delivery_project.hook.ts` on EVERY write from the merged
 *     record; and `actual_labor_cost` / `actual_expense_cost` /
 *     `budget_adjustment`, which the child objects' rollup hooks write as raw
 *     sums (the project hook then derives the rest).
 *
 * `cost_control` is the one switch a PERSON sets: the machine may only WARN
 * (`cost_status`), and the timesheet gate refuses a write only under `block`.
 */
export const DeliveryProject = ObjectSchema.create({
  name: 'crm_delivery_project',
  label: 'Delivery Project',
  pluralLabel: 'Delivery Projects',
  icon: 'hard-hat',
  description: 'Delivery project — budget baseline, cost execution and margin tracking',

  sharingModel: 'public_read_write',
  nameField: 'name',
  searchableFields: ['name', 'alias'],
  highlightFields: ['project_number', 'crm_account', 'status', 'budget_total', 'actual_total_cost', 'cost_status'],

  fieldGroups: [
    { key: 'basic',      label: 'Project Information',   icon: 'info' },
    { key: 'source',     label: 'Presales Source',       icon: 'link' },
    { key: 'org',        label: 'Cost Centres',          icon: 'building' },
    { key: 'roles',      label: 'Project Roles',         icon: 'users' },
    { key: 'budget',     label: 'Budget (Baseline)',     icon: 'wallet' },
    { key: 'actuals',    label: 'Cost Execution',        icon: 'activity' },
    { key: 'financials', label: 'Contract & Margin',     icon: 'trending-up' },
    { key: 'security',   label: 'Information Security',  icon: 'shield', collapse: 'collapsed' },
    { key: 'approval',   label: 'Status & Approval',     icon: 'check-circle' },
  ],

  fields: {
    owner_id: Field.lookup('sys_user', {
      label: 'Project Owner',
      group: 'basic',
      system: true,
      readonly: false,
      trackHistory: true,
    }),

    project_number: Field.autonumber({
      label: 'Project Number',
      group: 'basic',
      format: 'DP-{0000}',
    }),

    name: Field.text({
      label: 'Project Name',
      group: 'basic',
      required: true,
      storage: { notNull: true },
      searchable: true,
    }),

    alias: Field.text({ label: 'Project Alias', group: 'basic', maxLength: 100 }),

    project_type: Field.select({ label: 'Project Type', group: 'basic', options: [...PROJECT_TYPE_OPTIONS] }),

    business_category: Field.select({ label: 'Business Category', group: 'basic', options: [...BUSINESS_CATEGORY_OPTIONS] }),

    plan_start_date: Field.date({ label: 'Planned Start', group: 'basic' }),
    plan_end_date: Field.date({ label: 'Planned End', group: 'basic' }),
    actual_start_date: Field.date({ label: 'Actual Start', group: 'basic' }),

    // ─── Presales source (step 21) ─────────────────────────────────────
    crm_presales_project: Field.lookup('crm_presales_project', {
      label: 'Presales Project',
      group: 'source',
      required: true,
      storage: { notNull: true },
      trackHistory: true,
    }),

    crm_opportunity: Field.lookup('crm_opportunity', { label: 'Opportunity', group: 'source' }),

    crm_account: Field.lookup('crm_account', {
      label: 'Account',
      group: 'source',
      required: true,
      storage: { notNull: true },
    }),

    // ─── Cost centres (step 23) ────────────────────────────────────────
    // Two fields, one vocabulary: the EXECUTING centre does the work, the
    // ACCOUNTING centre carries the cost. They are often not the same
    // department, which is why the report can be cut on either.
    cost_center: Field.select({
      label: 'Executing Cost Centre',
      group: 'org',
      options: [...COST_CENTER_OPTIONS],
    }),

    accounting_cost_center: Field.select({
      label: 'Accounting Cost Centre',
      group: 'org',
      options: [...COST_CENTER_OPTIONS],
    }),

    // ─── Roles (step 24) ───────────────────────────────────────────────
    // `project_manager` doubles as the approver of this project's timesheets.
    project_manager: Field.lookup('sys_user', { label: 'Project Manager', group: 'roles' }),
    project_director: Field.lookup('sys_user', { label: 'Project Director', group: 'roles' }),
    pricing_lead: Field.lookup('sys_user', { label: 'Resource Pricing Lead', group: 'roles' }),
    qa_lead: Field.lookup('sys_user', { label: 'Project QA', group: 'roles' }),

    // ─── Budget baseline (steps 27–31) ─────────────────────────────────
    budget_labor: Field.currency({ label: 'Labor Services Budget', group: 'budget', scale: 2, min: 0 }),
    budget_service: Field.currency({ label: 'Third-party Services Budget', group: 'budget', scale: 2, min: 0 }),
    budget_hardware: Field.currency({ label: 'Third-party Software/Hardware Budget', group: 'budget', scale: 2, min: 0 }),
    budget_expense: Field.currency({ label: 'Project Expenses Budget', group: 'budget', scale: 2, min: 0 }),

    budget_baseline: Field.currency({
      label: 'Budget Baseline',
      group: 'budget',
      scale: 2,
      readonly: true,
    }),

    // Sum of APPROVED `crm_budget_adjustment` rows — written by that object's
    // rollup hook. The baseline itself never moves (step 32): an increase is
    // recorded beside it, so the report can show baseline / adjusted / actual.
    // ⚠️ NOT `readonly`: written by `budget_adjustment.hook.ts` through a
    // user-context update, and `stripReadonlyFields` deletes a readonly key
    // from exactly that path (measured: the derived `budget_total` landed while
    // this raw input came back null). Same for the two `actual_*` inputs.
    budget_adjustment: Field.currency({
      label: 'Approved Budget Increase',
      description: 'Rolled up from approved budget adjustments — not edited by hand.',
      group: 'budget',
      scale: 2,
    }),

    budget_total: Field.currency({
      label: 'Total Budget (after adjustments)',
      group: 'budget',
      scale: 2,
      readonly: true,
    }),

    // ─── Cost execution (steps 33–36) ──────────────────────────────────
    actual_labor_cost: Field.currency({ label: 'Actual Labor Cost', description: 'Rolled up from submitted / approved timesheets.', group: 'actuals', scale: 2 }),
    actual_expense_cost: Field.currency({ label: 'Actual Expenses', description: 'Rolled up from submitted / approved expense claims.', group: 'actuals', scale: 2 }),
    actual_total_cost: Field.currency({ label: 'Actual Total Cost', group: 'actuals', scale: 2, readonly: true }),

    budget_used_pct: Field.percent({
      label: 'Budget Used (%)',
      group: 'actuals',
      readonly: true,
    }),

    cost_status: Field.select({
      label: 'Cost Status',
      group: 'actuals',
      readonly: true,
      defaultValue: 'normal',
      options: [...COST_STATUS_OPTIONS],
    }),

    cost_control: Field.select({
      label: 'Cost Control Mode',
      description: 'Set by the cost administrator. Only "block" stops timesheets from being submitted once the project is over budget.',
      group: 'actuals',
      defaultValue: 'warn',
      options: [...COST_CONTROL_OPTIONS],
    }),

    // ─── Contract & margin (step 38) ───────────────────────────────────
    contract_amount: Field.currency({ label: 'Contract Amount', group: 'financials', scale: 2, min: 0 }),

    gross_margin: Field.percent({
      label: 'Gross Margin (%)',
      group: 'financials',
      readonly: true,
    }),

    // ─── Information security (step 25) ────────────────────────────────
    security_level: Field.select({ label: 'Information Security Level', group: 'security', options: [...SECURITY_LEVEL_OPTIONS] }),
    security_notes: Field.textarea({ label: 'Security Notes', group: 'security' }),

    // ─── Lifecycle & approval (step 26) ────────────────────────────────
    status: Field.select({
      label: 'Status',
      group: 'approval',
      required: true,
      storage: { notNull: true },
      defaultValue: 'planning',
      trackHistory: true,
      options: [
        { label: 'Planning',   value: 'planning', color: '#999999', default: true },
        { label: 'Submitted',  value: 'submitted', color: '#FFA500' },
        { label: 'Active',     value: 'active',   color: '#00AA00' },
        { label: 'On Hold',    value: 'on_hold',  color: '#FFA500' },
        { label: 'Closed',     value: 'closed',   color: '#4169E1' },
      ],
    }),

    approval_status: Field.select({
      label: 'Approval Status',
      group: 'approval',
      readonly: true,
      defaultValue: 'not_required',
      options: [...APPROVAL_STATUS_OPTIONS],
    }),

    approved_date: Field.datetime({ label: 'Approved Date', group: 'approval', readonly: true }),

    description: Field.markdown({ label: 'Description', group: 'basic' }),
  },

  indexes: [
    { fields: ['crm_presales_project'] },
    { fields: ['crm_account'] },
    { fields: ['status'] },
    { fields: ['cost_status'] },
    { fields: ['cost_center'] },
    { fields: ['owner_id'] },
  ],

  enable: {
    apiEnabled: true,
    apiMethods: ['get', 'list', 'create', 'update', 'delete'],
    files: true,
  },

  validations: [
    {
      name: 'plan_end_after_start',
      type: 'script',
      severity: 'error',
      message: 'Planned End must be after Planned Start',
      condition: P`has(record.plan_end_date) && record.plan_end_date != null && has(record.plan_start_date) && record.plan_start_date != null && record.plan_end_date <= record.plan_start_date`,
    },
    {
      name: 'delivery_status_progression',
      type: 'state_machine',
      severity: 'warning',
      message: 'Invalid delivery project status transition',
      field: 'status',
      transitions: {
        planning: ['submitted', 'active', 'closed'],
        submitted: ['planning', 'active'],
        active: ['on_hold', 'closed'],
        on_hold: ['active', 'closed'],
        closed: [],
      },
    },
  ],
});
