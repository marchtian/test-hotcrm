// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

import { ObjectSchema, Field } from '@objectstack/spec/data';
import { P } from '@objectstack/spec';
import {
  APPROVAL_STATUS_OPTIONS,
  BUSINESS_CATEGORY_OPTIONS,
  PROJECT_TYPE_OPTIONS,
  SECURITY_LEVEL_OPTIONS,
} from './_project-picklists';

/**
 * Presales Project (售前立项) — process sheet steps 15–20.
 *
 * MUST reference a CRM opportunity (step 15: "售前立项必须引用客户关系系统中已审批
 * 通过的商机数据"). It is normally CREATED from the opportunity by the
 * `create_presales_project` action, which copies name / account / category /
 * amount / iron-triangle roles across so nothing is keyed in twice.
 *
 * Derived money (`est_total_cost`, `gross_margin`) is computed in
 * `presales_project.hook.ts`, not declaratively — same reasoning as
 * `crm_opportunity.expected_revenue`: one place owns the arithmetic.
 *
 * `status` is the DOCUMENT lifecycle; `approval_status` is the mirror the
 * approval node stamps through `approvalStatusField` (see
 * `src/flows/presales-project-approval.flow.ts`).
 */
export const PresalesProject = ObjectSchema.create({
  name: 'crm_presales_project',
  label: 'Presales Project',
  pluralLabel: 'Presales Projects',
  icon: 'clipboard-list',
  description: 'Presales project initiation — costed and approved before delivery starts',

  // Demo posture: the whole digital-tech company works one book of projects.
  sharingModel: 'public_read_write',
  nameField: 'name',
  searchableFields: ['name', 'alias'],
  highlightFields: ['project_number', 'crm_opportunity', 'crm_account', 'status', 'quote_amount', 'gross_margin'],

  fieldGroups: [
    { key: 'basic',     label: 'Project Information',  icon: 'info' },
    { key: 'source',    label: 'CRM Source',           icon: 'link' },
    { key: 'roles',     label: 'Project Roles',        icon: 'users' },
    { key: 'estimate',  label: 'Cost Estimate & Quote', icon: 'calculator' },
    { key: 'security',  label: 'Information Security', icon: 'shield' },
    { key: 'approval',  label: 'Status & Approval',    icon: 'check-circle' },
    { key: 'narrative', label: 'Background & Risks',   icon: 'file-text', collapse: 'collapsed' },
  ],

  fields: {
    // Platform ownership anchor — canonical note in `account.object.ts` (#548).
    owner_id: Field.lookup('sys_user', {
      label: 'Presales Lead',
      group: 'basic',
      system: true,
      readonly: false,
      trackHistory: true,
    }),

    project_number: Field.autonumber({
      label: 'Project Number',
      group: 'basic',
      format: 'PS-{0000}',
    }),

    name: Field.text({
      label: 'Project Name',
      group: 'basic',
      required: true,
      storage: { notNull: true },
      searchable: true,
    }),

    alias: Field.text({
      label: 'Project Alias',
      group: 'basic',
      maxLength: 100,
    }),

    project_type: Field.select({
      label: 'Project Type',
      group: 'basic',
      options: [...PROJECT_TYPE_OPTIONS],
    }),

    business_category: Field.select({
      label: 'Business Category',
      group: 'basic',
      options: [...BUSINESS_CATEGORY_OPTIONS],
    }),

    plan_start_date: Field.date({
      label: 'Planned Start',
      group: 'basic',
    }),

    plan_end_date: Field.date({
      label: 'Planned End',
      group: 'basic',
    }),

    // ─── CRM source ────────────────────────────────────────────────────
    crm_opportunity: Field.lookup('crm_opportunity', {
      label: 'Opportunity',
      group: 'source',
      required: true,
      storage: { notNull: true },
      trackHistory: true,
    }),

    crm_account: Field.lookup('crm_account', {
      label: 'Account',
      group: 'source',
      required: true,
      storage: { notNull: true },
    }),

    expected_contract_amount: Field.currency({
      label: 'Expected Contract Amount',
      group: 'source',
      scale: 2,
      min: 0,
    }),

    // ─── Roles (step 17) ───────────────────────────────────────────────
    account_manager: Field.lookup('sys_user', { label: 'Account Manager', group: 'roles' }),
    project_manager: Field.lookup('sys_user', { label: 'Project Manager', group: 'roles' }),
    // The first-tier approver of `presales_project_approval` — the flow routes
    // by THIS field (`type: 'field'`), so whoever is named here decides.
    project_director: Field.lookup('sys_user', { label: 'Project Director', group: 'roles' }),
    qa_lead: Field.lookup('sys_user', { label: 'Project QA', group: 'roles' }),
    pricing_lead: Field.lookup('sys_user', { label: 'Resource Pricing Lead', group: 'roles' }),

    // ─── Cost estimate (step 18) ───────────────────────────────────────
    est_labor_cost: Field.currency({ label: 'Labor Services Cost', group: 'estimate', scale: 2, min: 0 }),
    est_service_cost: Field.currency({ label: 'Third-party Services Cost', group: 'estimate', scale: 2, min: 0 }),
    est_hardware_cost: Field.currency({ label: 'Third-party Software/Hardware Cost', group: 'estimate', scale: 2, min: 0 }),
    est_expense_cost: Field.currency({ label: 'Project Expenses', group: 'estimate', scale: 2, min: 0 }),

    est_total_cost: Field.currency({
      label: 'Total Estimated Cost',
      group: 'estimate',
      scale: 2,
      readonly: true,
    }),

    quote_amount: Field.currency({
      label: 'Project Quote',
      group: 'estimate',
      scale: 2,
      min: 0,
    }),

    gross_margin: Field.percent({
      label: 'Gross Margin (%)',
      group: 'estimate',
      readonly: true,
    }),

    // ─── Information security (step 19) ────────────────────────────────
    security_level: Field.select({
      label: 'Information Security Level',
      group: 'security',
      options: [...SECURITY_LEVEL_OPTIONS],
    }),

    security_notes: Field.textarea({
      label: 'Security Notes',
      group: 'security',
    }),

    // ─── Lifecycle & approval (step 20) ────────────────────────────────
    status: Field.select({
      label: 'Status',
      group: 'approval',
      required: true,
      storage: { notNull: true },
      defaultValue: 'draft',
      trackHistory: true,
      options: [
        { label: 'Draft',      value: 'draft',     color: '#999999', default: true },
        { label: 'Submitted',  value: 'submitted', color: '#FFA500' },
        { label: 'Approved',   value: 'approved',  color: '#00AA00' },
        { label: 'Rejected',   value: 'rejected',  color: '#FF0000' },
        { label: 'Converted to Delivery', value: 'converted', color: '#4169E1' },
      ],
    }),

    // `defaultValue` at FIELD level — see the note on `crm_opportunity`: an
    // option-level default only preselects in forms.
    approval_status: Field.select({
      label: 'Approval Status',
      group: 'approval',
      readonly: true,
      defaultValue: 'not_required',
      options: [...APPROVAL_STATUS_OPTIONS],
    }),

    approved_date: Field.datetime({
      label: 'Approved Date',
      group: 'approval',
      readonly: true,
    }),

    // ─── Narrative (step 10 carried over, step 16) ─────────────────────
    description: Field.markdown({
      label: 'Project Background',
      group: 'narrative',
    }),

    risk_analysis: Field.textarea({
      label: 'Risk Analysis',
      group: 'narrative',
    }),
  },

  indexes: [
    { fields: ['crm_opportunity'] },
    { fields: ['crm_account'] },
    { fields: ['status'] },
    { fields: ['owner_id'] },
  ],

  enable: {
    apiEnabled: true,
    apiMethods: ['get', 'list', 'create', 'update', 'delete'],
    // Step 10 / 25: project attachments live on the record.
    files: true,
  },

  // Predicates are TOTAL (AGENTS.md) — every `record.x` read is `has()`-guarded.
  validations: [
    {
      name: 'plan_end_after_start',
      type: 'script',
      severity: 'error',
      message: 'Planned End must be after Planned Start',
      condition: P`has(record.plan_end_date) && record.plan_end_date != null && has(record.plan_start_date) && record.plan_start_date != null && record.plan_end_date <= record.plan_start_date`,
    },
    {
      name: 'presales_status_progression',
      type: 'state_machine',
      severity: 'warning',
      message: 'Invalid presales project status transition',
      field: 'status',
      transitions: {
        draft: ['submitted'],
        // The approval flow lands `approved` / `rejected`; a recall goes back to draft.
        submitted: ['draft', 'approved', 'rejected'],
        approved: ['converted'],
        rejected: ['draft'],
        converted: [],
      },
    },
  ],
});
