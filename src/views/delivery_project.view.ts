// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

import { defineView } from '@objectstack/spec/ui';

/**
 * Delivery Project Views
 *
 *   • grid            — project register with budget / actual / usage / status
 *   • cost_plan       — the budget lines (process sheet "成本计划")
 *   • cost_monitor    — cost execution: usage %, status, control mode ("成本监控")
 *   • cost_kanban     — by cost status: normal / warning / over budget
 */
export const DeliveryProjectViews = defineView({
  list: {
    type: 'grid',
    name: 'all_delivery_projects',
    label: 'All Delivery Projects',
    data: { provider: 'object', object: 'crm_delivery_project' },
    columns: [
      { field: 'project_number', width: 120, link: true, pinned: 'left' },
      { field: 'name', width: 240, link: true },
      { field: 'crm_account', width: 180 },
      { field: 'cost_center', width: 140 },
      { field: 'status', width: 110, sortable: true },
      { field: 'budget_total', width: 130, align: 'right', summary: 'sum' },
      { field: 'actual_total_cost', width: 130, align: 'right', summary: 'sum' },
      { field: 'budget_used_pct', width: 110, align: 'right' },
      { field: 'cost_status', width: 110, sortable: true },
      { field: 'project_manager', width: 140 },
    ],
    sort: [{ field: 'created_at', order: 'desc' }],
    pagination: { pageSize: 25 },
    selection: { type: 'multiple' },
    appearance: { allowedVisualizations: ['grid', 'kanban'] },
    kanban: { groupByField: 'cost_status', summarizeField: 'actual_total_cost', columns: ['name', 'crm_account', 'budget_total', 'actual_total_cost'] },
  },

  listViews: {
    cost_plan: {
      name: 'cost_plan',
      type: 'grid',
      label: 'Cost Plan',
      data: { provider: 'object', object: 'crm_delivery_project' },
      columns: [
        { field: 'project_number', width: 120, link: true, pinned: 'left' },
        { field: 'name', width: 220, link: true },
        { field: 'budget_labor', width: 130, align: 'right', summary: 'sum' },
        { field: 'budget_service', width: 130, align: 'right', summary: 'sum' },
        { field: 'budget_hardware', width: 130, align: 'right', summary: 'sum' },
        { field: 'budget_expense', width: 130, align: 'right', summary: 'sum' },
        { field: 'budget_baseline', width: 130, align: 'right', summary: 'sum' },
        { field: 'budget_adjustment', width: 130, align: 'right', summary: 'sum' },
        { field: 'budget_total', width: 130, align: 'right', summary: 'sum' },
      ],
      sort: [{ field: 'created_at', order: 'desc' }],
    },

    cost_monitor: {
      name: 'cost_monitor',
      type: 'grid',
      label: 'Cost Monitor',
      data: { provider: 'object', object: 'crm_delivery_project' },
      columns: [
        { field: 'project_number', width: 120, link: true, pinned: 'left' },
        { field: 'name', width: 220, link: true },
        { field: 'cost_center', width: 130 },
        { field: 'accounting_cost_center', width: 130 },
        { field: 'budget_total', width: 130, align: 'right', summary: 'sum' },
        { field: 'actual_labor_cost', width: 130, align: 'right', summary: 'sum' },
        { field: 'actual_expense_cost', width: 130, align: 'right', summary: 'sum' },
        { field: 'actual_total_cost', width: 130, align: 'right', summary: 'sum' },
        { field: 'budget_used_pct', width: 110, align: 'right', sortable: true },
        { field: 'cost_status', width: 110, sortable: true },
        { field: 'cost_control', width: 150 },
      ],
      sort: [{ field: 'budget_used_pct', order: 'desc' }],
    },

    cost_kanban: {
      name: 'cost_kanban',
      type: 'kanban',
      label: 'Cost Status Board',
      data: { provider: 'object', object: 'crm_delivery_project' },
      columns: ['name', 'crm_account', 'budget_total', 'actual_total_cost', 'budget_used_pct'],
      kanban: {
        groupByField: 'cost_status',
        summarizeField: 'actual_total_cost',
        columns: ['name', 'crm_account', 'budget_total', 'actual_total_cost'],
      },
      sort: [{ field: 'budget_used_pct', order: 'desc' }],
      navigation: { mode: 'drawer', width: '640px' },
    },
  },
});
