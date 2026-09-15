// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

import { P } from '@objectstack/spec';
import type * as Automation from '@objectstack/spec/automation';
type Flow = Automation.Flow;

/**
 * Presales Project Approval (售前立项审批) — process sheet step 20, cut down
 * from the customer's five-tier chain to the two tiers a demo can show:
 *
 *   1. Project Director review — the approver is whoever the RECORD names in
 *      `project_director` (`type: 'field'`), so the same flow routes
 *      differently per project without a branch per director;
 *   2. PMO Director sign-off — a POSITION.
 *
 * Same construction as `opportunity_approval` (approval nodes, ADR-0019):
 * the engine opens a request on node entry, suspends, and resumes down the
 * edge whose `label` matches the decision. `admin_rescue` keeps an empty
 * field / position decidable. Runs as system for the same reason that flow
 * does — the gate constrains the submitter, and the status stamps land on a
 * record the approval node holds locked.
 */
export const PresalesProjectApprovalFlow: Flow = {
  name: 'presales_project_approval',
  label: 'Presales Project Approval',
  description: 'Two-tier approval of a presales project: the named project director, then the PMO director.',
  type: 'record_change',
  status: 'active',
  runAs: 'system',

  variables: [
    { name: 'projectId', type: 'text', isInput: true, isOutput: false },
  ],

  nodes: [
    {
      id: 'start',
      type: 'start',
      label: 'Start',
      config: {
        objectName: 'crm_presales_project',
        triggerType: 'record-after-update',
        // Enter on SUBMIT, and not while a request is already open. A record
        // whose previous request was rejected may be re-submitted, so
        // `rejected` is admitted; `approved` is terminal.
        condition: P`has(record.status) && record.status == "submitted"
          && (!has(record.approval_status) || record.approval_status == null
              || record.approval_status == "not_required" || record.approval_status == "rejected")`,
      },
    },
    {
      id: 'get_project',
      type: 'get_record',
      label: 'Get Presales Project',
      config: { objectName: 'crm_presales_project', filter: { id: '{record.id}' }, outputVariable: 'projRecord' },
    },

    // ── Tier 1: the project director named on the record ────────────
    {
      id: 'director_review',
      type: 'approval',
      label: 'Project Director Review',
      config: {
        approvers: [{ type: 'field', value: 'project_director' }],
        onEmptyApprovers: 'admin_rescue',
        behavior: 'first_response',
        lockRecord: true,
        approvalStatusField: 'approval_status',
      },
    },

    // ── Tier 2: PMO director ─────────────────────────────────────────
    {
      id: 'pmo_signoff',
      type: 'approval',
      label: 'PMO Director Sign-off',
      config: {
        approvers: [{ type: 'position', value: 'pmo_director' }],
        onEmptyApprovers: 'admin_rescue',
        behavior: 'first_response',
        lockRecord: true,
        approvalStatusField: 'approval_status',
      },
    },

    {
      id: 'mark_approved',
      type: 'update_record',
      label: 'Mark Approved',
      config: {
        objectName: 'crm_presales_project',
        filter: { id: '{record.id}' },
        fields: { status: 'approved', approval_status: 'approved', approved_date: '{NOW()}' },
      },
    },
    {
      id: 'notify_approved',
      type: 'notify',
      label: 'Notify Presales Lead — Approved',
      config: {
        recipients: ['{projRecord.owner_id}'],
        channels: ['inbox', 'email'],
        topic: 'presales_project_approved',
        title: 'Presales project approved: {projRecord.name}',
        message: 'Presales project {projRecord.name} has been approved. You can now create the delivery project.',
        actionUrl: '/crm_presales_project/{record.id}',
      },
    },
    {
      id: 'mark_rejected',
      type: 'update_record',
      label: 'Mark Rejected',
      config: {
        objectName: 'crm_presales_project',
        filter: { id: '{record.id}' },
        fields: { status: 'rejected', approval_status: 'rejected' },
      },
    },
    {
      id: 'notify_rejected',
      type: 'notify',
      label: 'Notify Presales Lead — Rejected',
      config: {
        recipients: ['{projRecord.owner_id}'],
        channels: ['inbox', 'email'],
        severity: 'warning',
        topic: 'presales_project_rejected',
        title: 'Presales project rejected: {projRecord.name}',
        message: 'Presales project {projRecord.name} was not approved. Revise it and submit again.',
        actionUrl: '/crm_presales_project/{record.id}',
      },
    },
    { id: 'end', type: 'end', label: 'End' },
  ],

  edges: [
    { id: 'e1', source: 'start', target: 'get_project', type: 'default' },
    { id: 'e2', source: 'get_project', target: 'director_review', type: 'default' },
    { id: 'e3', source: 'director_review', target: 'pmo_signoff', type: 'default', label: 'approve' },
    { id: 'e4', source: 'director_review', target: 'mark_rejected', type: 'default', label: 'reject' },
    { id: 'e5', source: 'pmo_signoff', target: 'mark_approved', type: 'default', label: 'approve' },
    { id: 'e6', source: 'pmo_signoff', target: 'mark_rejected', type: 'default', label: 'reject' },
    { id: 'e7', source: 'mark_approved', target: 'notify_approved', type: 'default' },
    { id: 'e8', source: 'notify_approved', target: 'end', type: 'default' },
    { id: 'e9', source: 'mark_rejected', target: 'notify_rejected', type: 'default' },
    { id: 'e10', source: 'notify_rejected', target: 'end', type: 'default' },
  ],
};
