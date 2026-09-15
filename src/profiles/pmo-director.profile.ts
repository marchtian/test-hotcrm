// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * PMO Director Profile (数科负责人 / 项目管理部).
 *
 * Owns the project book end to end: full access to every project-domain object
 * and to the CRM records they hang off, every commercial figure visible. The
 * counterpart of `project_manager` in the third demo scene.
 */
export const PmoDirectorProfile = {
  name: 'pmo_director',
  label: 'PMO Director',
  objects: {
    crm_lead:        { allowCreate: true, allowRead: true, allowEdit: true, allowDelete: false, viewAllRecords: true, modifyAllRecords: true, allowTransfer: true, allowExport: true },
    crm_account:     { allowCreate: true, allowRead: true, allowEdit: true, allowDelete: false, viewAllRecords: true, modifyAllRecords: true, allowTransfer: true, allowExport: true },
    crm_contact:     { allowCreate: true, allowRead: true, allowEdit: true, allowDelete: false, viewAllRecords: true, modifyAllRecords: true, allowTransfer: true, allowExport: true },
    crm_opportunity: { allowCreate: true, allowRead: true, allowEdit: true, allowDelete: false, viewAllRecords: true, modifyAllRecords: true, allowTransfer: true, allowExport: true },
    crm_contract:    { allowCreate: true, allowRead: true, allowEdit: true, allowDelete: false, viewAllRecords: true, modifyAllRecords: true, allowTransfer: true },
    crm_task:        { allowCreate: true, allowRead: true, allowEdit: true, allowDelete: true,  viewAllRecords: true, modifyAllRecords: true, allowTransfer: true },
    crm_event:       { allowCreate: true, allowRead: true, allowEdit: true, allowDelete: true,  viewAllRecords: true, modifyAllRecords: true, allowTransfer: true },
    crm_event_attendee: { allowCreate: true, allowRead: true, allowEdit: true, allowDelete: true, viewAllRecords: true, modifyAllRecords: true },

    crm_presales_project:  { allowCreate: true, allowRead: true, allowEdit: true, allowDelete: true, viewAllRecords: true, modifyAllRecords: true, allowTransfer: true, allowExport: true },
    crm_delivery_project:  { allowCreate: true, allowRead: true, allowEdit: true, allowDelete: true, viewAllRecords: true, modifyAllRecords: true, allowTransfer: true, allowExport: true },
    crm_timesheet:         { allowCreate: true, allowRead: true, allowEdit: true, allowDelete: true, viewAllRecords: true, modifyAllRecords: true, allowTransfer: true, allowExport: true },
    crm_expense_claim:     { allowCreate: true, allowRead: true, allowEdit: true, allowDelete: true, viewAllRecords: true, modifyAllRecords: true, allowTransfer: true, allowExport: true },
    crm_budget_adjustment: { allowCreate: true, allowRead: true, allowEdit: true, allowDelete: true, viewAllRecords: true, modifyAllRecords: true, allowTransfer: true, allowExport: true },
    crm_opportunity_change_request: { allowCreate: true, allowRead: true, allowEdit: true, allowDelete: true, viewAllRecords: true, modifyAllRecords: true, allowTransfer: true },

    // Platform objects the record page reads for every record: the activity
    // timeline, comments and attachments. Without these the console's record
    // page answers 403 on three side requests and never leaves its skeleton.
    sys_activity:   { allowCreate: false, allowRead: true, allowEdit: false, allowDelete: false, viewAllRecords: true, modifyAllRecords: false },
    sys_comment:    { allowCreate: true,  allowRead: true, allowEdit: true,  allowDelete: false, viewAllRecords: true, modifyAllRecords: false },
    sys_attachment: { allowCreate: true,  allowRead: true, allowEdit: false, allowDelete: false, viewAllRecords: true, modifyAllRecords: false },
  },
  fields: {
    'crm_delivery_project.contract_amount': { readable: true, editable: true },
    'crm_delivery_project.gross_margin':    { readable: true, editable: false },
    'crm_delivery_project.cost_control':    { readable: true, editable: true },
    'crm_presales_project.quote_amount':    { readable: true, editable: true },
    'crm_presales_project.gross_margin':    { readable: true, editable: false },
    'crm_timesheet.hourly_rate':            { readable: true, editable: false },
  },
};
