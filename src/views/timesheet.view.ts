// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

import { defineView } from '@objectstack/spec/ui';

/**
 * Timesheet Views
 *
 *   • grid          — every timesheet
 *   • my_timesheets — the current user's own sheets (`{current_user_id}`
 *                     interpolates on the list-view data path — see crm.app.ts)
 *   • pending_timesheet_approval — submitted, waiting for the project manager
 */
export const TimesheetViews = defineView({
  list: {
    type: 'grid',
    name: 'all_timesheets',
    label: 'All Timesheets',
    data: { provider: 'object', object: 'crm_timesheet' },
    columns: [
      { field: 'timesheet_number', width: 120, link: true, pinned: 'left' },
      { field: 'crm_delivery_project', width: 220 },
      { field: 'owner_id', width: 140 },
      { field: 'period_month', width: 120, sortable: true },
      { field: 'hours', width: 90, align: 'right', summary: 'sum' },
      { field: 'position_level', width: 120 },
      { field: 'hourly_rate', width: 110, align: 'right' },
      { field: 'labor_cost', width: 120, align: 'right', summary: 'sum' },
      { field: 'status', width: 110, sortable: true },
      { field: 'approver', width: 140 },
    ],
    sort: [{ field: 'period_month', order: 'desc' }],
    pagination: { pageSize: 25 },
    selection: { type: 'multiple' },
  },

  listViews: {
    my_timesheets: {
      name: 'my_timesheets',
      type: 'grid',
      label: 'My Timesheets',
      data: { provider: 'object', object: 'crm_timesheet' },
      columns: ['timesheet_number', 'crm_delivery_project', 'period_month', 'hours', 'labor_cost', 'status', 'approver'],
      filter: [{ field: 'owner_id', operator: 'equals', value: '{current_user_id}' }],
      sort: [{ field: 'period_month', order: 'desc' }],
    },

    pending_timesheet_approval: {
      name: 'pending_timesheet_approval',
      type: 'grid',
      label: 'Pending Approval',
      data: { provider: 'object', object: 'crm_timesheet' },
      columns: ['timesheet_number', 'crm_delivery_project', 'owner_id', 'period_month', 'hours', 'labor_cost', 'approver'],
      filter: [{ field: 'status', operator: 'equals', value: 'submitted' }],
      sort: [{ field: 'updated_at', order: 'desc' }],
    },
  },
});
