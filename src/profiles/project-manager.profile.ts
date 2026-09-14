// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * Project Manager Profile (项目经理).
 *
 * Runs delivery projects and approves the timesheets on them, but does NOT see
 * the commercial figures: contract amount, gross margin and the hourly rate
 * table are masked at field level. That is the third demo scene — the same
 * project page, opened by the PMO director and by a project manager, shows a
 * different set of numbers. Field masking is authored here, not on the page,
 * so it holds on every surface (list, detail, API, export).
 */
export const ProjectManagerProfile = {
  name: 'project_manager',
  label: 'Project Manager',
  objects: {
    // CRM context, read-only.
    crm_account:     { allowCreate: false, allowRead: true, allowEdit: false, allowDelete: false, viewAllRecords: true, modifyAllRecords: false },
    crm_contact:     { allowCreate: false, allowRead: true, allowEdit: false, allowDelete: false, viewAllRecords: true, modifyAllRecords: false },
    crm_opportunity: { allowCreate: false, allowRead: true, allowEdit: false, allowDelete: false, viewAllRecords: true, modifyAllRecords: false },

    // Project domain.
    crm_presales_project:  { allowCreate: false, allowRead: true, allowEdit: true,  allowDelete: false, viewAllRecords: true, modifyAllRecords: true },
    crm_delivery_project:  { allowCreate: false, allowRead: true, allowEdit: true,  allowDelete: false, viewAllRecords: true, modifyAllRecords: true },
    crm_timesheet:         { allowCreate: true,  allowRead: true, allowEdit: true,  allowDelete: true,  viewAllRecords: true, modifyAllRecords: true },
    crm_expense_claim:     { allowCreate: true,  allowRead: true, allowEdit: true,  allowDelete: true,  viewAllRecords: true, modifyAllRecords: true },
    crm_budget_adjustment: { allowCreate: true,  allowRead: true, allowEdit: true,  allowDelete: false, viewAllRecords: true, modifyAllRecords: false },
    crm_opportunity_change_request: { allowCreate: false, allowRead: true, allowEdit: false, allowDelete: false, viewAllRecords: true, modifyAllRecords: false },
  },
  fields: {
    // Commercial figures — masked. `readable: false` removes the value from
    // every surface for this profile; the budget lines stay visible because a
    // PM manages to the budget, not to the margin.
    'crm_delivery_project.contract_amount': { readable: false, editable: false },
    'crm_delivery_project.gross_margin':    { readable: false, editable: false },
    'crm_presales_project.quote_amount':    { readable: false, editable: false },
    'crm_presales_project.gross_margin':    { readable: false, editable: false },
    'crm_timesheet.hourly_rate':            { readable: false, editable: false },
    // The cost-control switch belongs to the cost administrator, not the PM.
    'crm_delivery_project.cost_control':    { readable: true,  editable: false },
  },
};
