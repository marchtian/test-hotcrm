// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

import { ObjectSchema, Field } from '@objectstack/spec/data';
import { P } from '@objectstack/spec';
import { DOC_STATUS_OPTIONS, EXPENSE_CATEGORY_OPTIONS } from './_project-picklists';

/**
 * Expense Claim (差旅报销) — process sheet step 35: travel cost is collected
 * PER PROJECT next to the labor cost. Submitted / approved amounts roll up into
 * `crm_delivery_project.actual_expense_cost` (`expense_claim.hook.ts`).
 *
 * The receipt itself is an attachment (`enable.files`); the finance-system
 * hand-off the sheet mentions is out of scope here.
 */
export const ExpenseClaim = ObjectSchema.create({
  name: 'crm_expense_claim',
  label: 'Expense Claim',
  pluralLabel: 'Expense Claims',
  icon: 'receipt',
  description: 'Travel and project expense claim against a delivery project',

  sharingModel: 'public_read_write',
  nameField: 'claim_number',
  highlightFields: ['claim_number', 'crm_delivery_project', 'expense_date', 'amount', 'status'],

  fieldGroups: [
    { key: 'basic',    label: 'Expense',            icon: 'receipt' },
    { key: 'approval', label: 'Status & Approval',  icon: 'check-circle' },
  ],

  fields: {
    owner_id: Field.lookup('sys_user', {
      label: 'Claimant',
      group: 'basic',
      system: true,
      readonly: false,
    }),

    claim_number: Field.autonumber({ label: 'Claim Number', group: 'basic', format: 'EX-{0000}' }),

    crm_delivery_project: Field.lookup('crm_delivery_project', {
      label: 'Delivery Project',
      group: 'basic',
      required: true,
      storage: { notNull: true },
    }),

    expense_date: Field.date({
      label: 'Expense Date',
      group: 'basic',
      required: true,
      storage: { notNull: true },
    }),

    category: Field.select({
      label: 'Category',
      group: 'basic',
      required: true,
      storage: { notNull: true },
      defaultValue: 'transport',
      options: [...EXPENSE_CATEGORY_OPTIONS],
    }),

    amount: Field.currency({
      label: 'Amount',
      group: 'basic',
      required: true,
      storage: { notNull: true },
      scale: 2,
      min: 0,
    }),

    description: Field.textarea({ label: 'Description', group: 'basic' }),

    status: Field.select({
      label: 'Status',
      group: 'approval',
      required: true,
      storage: { notNull: true },
      defaultValue: 'draft',
      trackHistory: true,
      options: [...DOC_STATUS_OPTIONS],
    }),
  },

  indexes: [
    { fields: ['crm_delivery_project'] },
    { fields: ['owner_id'] },
    { fields: ['status'] },
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
      message: 'Amount must be greater than zero',
      condition: P`has(record.amount) && record.amount != null && record.amount <= 0`,
    },
  ],
});
