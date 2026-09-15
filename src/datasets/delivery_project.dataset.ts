// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

import { defineDataset } from '@objectstack/spec/ui';

/**
 * Project analytics dataset (ADR-0021) — the semantic layer behind the
 * project operations dashboard (process sheet steps 37–39).
 *
 * Two cost-centre dimensions on purpose: the EXECUTING centre and the
 * ACCOUNTING centre are different cuts of the same money, and the report has
 * to answer both "who did the work" and "who carries the cost".
 */
export const DeliveryProjectDataset = defineDataset({
  name: 'project_metrics',
  label: 'Project Metrics',
  description: 'Semantic layer for delivery-project budget, cost and margin',
  object: 'crm_delivery_project',

  include: ['crm_account'],

  dimensions: [
    { name: 'project', label: 'Project', field: 'name', type: 'string' },
    { name: 'status', label: 'Status', field: 'status', type: 'string' },
    { name: 'cost_status', label: 'Cost Status', field: 'cost_status', type: 'string' },
    { name: 'cost_center', label: 'Executing Cost Centre', field: 'cost_center', type: 'string' },
    { name: 'accounting_cost_center', label: 'Accounting Cost Centre', field: 'accounting_cost_center', type: 'string' },
    { name: 'business_category', label: 'Business Category', field: 'business_category', type: 'string' },
    { name: 'account', label: 'Account', field: 'crm_account', type: 'lookup' },
    { name: 'account_category', label: 'Customer Category', field: 'crm_account.customer_category', type: 'string' },
    { name: 'project_manager', label: 'Project Manager', field: 'project_manager', type: 'lookup' },
  ],

  measures: [
    { name: 'project_count', label: 'Projects', aggregate: 'count' },
    { name: 'budget_baseline_sum', label: 'Budget Baseline', aggregate: 'sum', field: 'budget_baseline', format: '0,0' },
    { name: 'budget_total_sum', label: 'Total Budget', aggregate: 'sum', field: 'budget_total', format: '0,0' },
    { name: 'actual_total_sum', label: 'Actual Cost', aggregate: 'sum', field: 'actual_total_cost', format: '0,0' },
    { name: 'actual_labor_sum', label: 'Actual Labor Cost', aggregate: 'sum', field: 'actual_labor_cost', format: '0,0' },
    { name: 'actual_expense_sum', label: 'Actual Expenses', aggregate: 'sum', field: 'actual_expense_cost', format: '0,0' },
    { name: 'contract_sum', label: 'Contract Amount', aggregate: 'sum', field: 'contract_amount', format: '0,0' },
    { name: 'avg_budget_used', label: 'Avg Budget Used', aggregate: 'avg', field: 'budget_used_pct', format: '0.0' },
  ],
});
