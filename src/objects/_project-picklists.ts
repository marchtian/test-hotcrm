// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

import type { SelectOption } from '@objectstack/spec/data';

/**
 * Canonical picklists for the PROJECT domain (presales / delivery projects,
 * cost execution) and the CRM fields that feed it (customer category,
 * opportunity initiation info). Same discipline as `_picklists.ts`: declare a
 * vocabulary ONCE, spread it (`[...X]`) at every use site so each schema owns
 * its own array instance.
 *
 * Identifiers are generic on purpose — the customer-specific wording (铁三角,
 * Bizcase, 实施/核算成本中心 …) lives in the zh-CN translation pack, so the
 * same metadata re-labels for the next customer without a rename.
 */

/** Account — who the customer is to us. Bidding agents and "other" may only be
 *  used for payment / collection: they cannot open an opportunity (rule from the
 *  customer's process sheet, step 1). `internal` is a group subsidiary served
 *  by the digital-tech company at an internal settlement price. */
export const CUSTOMER_CATEGORY_OPTIONS: SelectOption[] = [
  { label: 'Regular Customer',   value: 'regular',       color: '#00AA00', default: true },
  { label: 'Group Subsidiary',   value: 'internal',      color: '#4169E1' },
  { label: 'Bidding Agent',      value: 'bidding_agent', color: '#FFA500' },
  { label: 'Other',              value: 'other',         color: '#999999' },
];

/** Categories that may NOT initiate an opportunity — consumed by the
 *  opportunity account-category gate (`opportunity_gate.hook.ts`). */
export const NON_SALES_CUSTOMER_CATEGORIES = ['bidding_agent', 'other'] as const;

export const PAYMENT_CYCLE_OPTIONS: SelectOption[] = [
  { label: 'Monthly',        value: 'monthly' },
  { label: 'Quarterly',      value: 'quarterly' },
  { label: 'By Milestone',   value: 'milestone' },
  { label: 'On Acceptance',  value: 'on_acceptance' },
];

/** Opportunity — initiation information (process sheet steps 8–9). */
export const OPPORTUNITY_LEVEL_OPTIONS: SelectOption[] = [
  { label: 'A — Strategic', value: 'level_a', color: '#FF0000' },
  { label: 'B — Key',       value: 'level_b', color: '#FFA500' },
  { label: 'C — Standard',  value: 'level_c', color: '#4169E1', default: true },
  { label: 'D — Minor',     value: 'level_d', color: '#999999' },
];

export const PRIORITY_OPTIONS: SelectOption[] = [
  { label: 'High',   value: 'high',   color: '#FF0000' },
  { label: 'Medium', value: 'medium', color: '#FFA500', default: true },
  { label: 'Low',    value: 'low',    color: '#999999' },
];

export const CONTROLLABILITY_OPTIONS: SelectOption[] = [
  { label: 'High',   value: 'high',   color: '#00AA00' },
  { label: 'Medium', value: 'medium', color: '#FFA500', default: true },
  { label: 'Low',    value: 'low',    color: '#FF0000' },
];

export const SIGNING_ENTITY_OPTIONS: SelectOption[] = [
  { label: 'Digital Technology Co.',   value: 'dt_main', default: true },
  { label: 'Group Headquarters',       value: 'group_hq' },
  { label: 'Regional Subsidiary',      value: 'regional_sub' },
];

export const REVENUE_TYPE_OPTIONS: SelectOption[] = [
  { label: 'Fixed-price Project',  value: 'fixed_price', default: true },
  { label: 'Time & Materials',     value: 'time_and_materials' },
  { label: 'Subscription',         value: 'subscription' },
  { label: 'Internal Settlement',  value: 'internal_settlement' },
];

/** Project — shared by presales and delivery projects. */
export const PROJECT_TYPE_OPTIONS: SelectOption[] = [
  { label: 'Implementation',      value: 'implementation', default: true },
  { label: 'Custom Development',  value: 'development' },
  { label: 'System Integration',  value: 'integration' },
  { label: 'Consulting',          value: 'consulting' },
  { label: 'Operations & Support', value: 'operations' },
];

export const BUSINESS_CATEGORY_OPTIONS: SelectOption[] = [
  { label: 'ERP / Finance',            value: 'erp' },
  { label: 'MES / Production',         value: 'mes' },
  { label: 'Energy & Carbon Management', value: 'energy' },
  { label: 'Data & AI',                value: 'data' },
  { label: 'Safety & Security',        value: 'security' },
  { label: 'Infrastructure & Cloud',   value: 'infra' },
  { label: 'Sales & CRM',              value: 'crm' },
  { label: 'Other',                    value: 'other' },
];

export const SECURITY_LEVEL_OPTIONS: SelectOption[] = [
  { label: 'Public',       value: 'public' },
  { label: 'Internal',     value: 'internal', default: true },
  { label: 'Confidential', value: 'confidential' },
  { label: 'Secret',       value: 'secret' },
];

/** Cost centres. The same list serves BOTH the executing (实施) and the
 *  accounting (核算) cost centre of a delivery project — they are two different
 *  answers to "who does the work" and "who carries the cost". */
export const COST_CENTER_OPTIONS: SelectOption[] = [
  { label: 'Delivery Dept. 1',      value: 'delivery_1' },
  { label: 'Delivery Dept. 2',      value: 'delivery_2' },
  { label: 'Data & AI Dept.',       value: 'data_ai' },
  { label: 'Infrastructure Dept.',  value: 'infra' },
  { label: 'Presales & Solutions',  value: 'presales' },
];

/** Position level — drives the hourly rate a timesheet is costed at.
 *  The RATE TABLE itself is inlined in `timesheet.hook.ts` (a lowered hook body
 *  cannot import); the demo ships SAMPLE rates and says so on the label. */
export const POSITION_LEVEL_OPTIONS: SelectOption[] = [
  { label: 'Junior',        value: 'junior' },
  { label: 'Intermediate',  value: 'intermediate', default: true },
  { label: 'Senior',        value: 'senior' },
  { label: 'Expert',        value: 'expert' },
  { label: 'Architect',     value: 'architect' },
];

export const COST_CATEGORY_OPTIONS: SelectOption[] = [
  { label: 'Labor Services',            value: 'labor', default: true },
  { label: 'Third-party Services',      value: 'service' },
  { label: 'Third-party Software/Hardware', value: 'hardware' },
  { label: 'Project Expenses (Travel)', value: 'expense' },
];

export const EXPENSE_CATEGORY_OPTIONS: SelectOption[] = [
  { label: 'Transportation', value: 'transport', default: true },
  { label: 'Accommodation',  value: 'hotel' },
  { label: 'Meals',          value: 'meals' },
  { label: 'Other',          value: 'other' },
];

/** Submit → approve/reject document lifecycle shared by every project-domain
 *  request object (timesheet, expense, budget adjustment, change request). */
export const DOC_STATUS_OPTIONS: SelectOption[] = [
  { label: 'Draft',     value: 'draft',     color: '#999999', default: true },
  { label: 'Submitted', value: 'submitted', color: '#FFA500' },
  { label: 'Approved',  value: 'approved',  color: '#00AA00' },
  { label: 'Rejected',  value: 'rejected',  color: '#FF0000' },
];

/** Mirror of `crm_opportunity.approval_status` — the field an approval node
 *  stamps through `approvalStatusField`. */
export const APPROVAL_STATUS_OPTIONS: SelectOption[] = [
  { label: 'Not Required', value: 'not_required', default: true },
  { label: 'Pending',      value: 'pending',      color: '#FFA500' },
  { label: 'Approved',     value: 'approved',     color: '#00AA00' },
  { label: 'Rejected',     value: 'rejected',     color: '#FF0000' },
];

export const COST_STATUS_OPTIONS: SelectOption[] = [
  { label: 'On Budget',   value: 'normal',      color: '#00AA00', default: true },
  { label: 'Warning',     value: 'warning',     color: '#FFA500' },
  { label: 'Over Budget', value: 'over_budget', color: '#FF0000' },
];

/** The cost-control switch a COST ADMINISTRATOR sets on a delivery project.
 *  `warn` (default) lets the machine signal warn; only `block` — a value a person
 *  wrote down — makes the timesheet gate refuse a write. */
export const COST_CONTROL_OPTIONS: SelectOption[] = [
  { label: 'Warn only',                  value: 'warn',  default: true },
  { label: 'Block timesheets when over', value: 'block' },
];

/** Plain `{ label, value }` projection for flow/action option lists. */
export const plainProjectOptions = (options: SelectOption[]) =>
  options.map(({ label, value }) => ({ label, value }));
