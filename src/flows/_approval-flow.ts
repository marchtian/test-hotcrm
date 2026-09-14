// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

import { P } from '@objectstack/spec';
import type * as Automation from '@objectstack/spec/automation';

type Flow = Automation.Flow;
type Approver = { type: 'position' | 'field' | 'role' | 'manager' | 'user'; value?: string };

export type ApprovalTier = {
  /** Node id, unique inside the flow. */
  id: string;
  label: string;
  approvers: Approver[];
};

export type ApprovalFlowSpec = {
  name: string;
  label: string;
  description: string;
  objectName: string;
  /** The field whose value means "submitted" — the flow enters on that value. */
  submitField: string;
  submitValue: string;
  /** Field the approval node mirrors the live request status into. */
  approvalStatusField?: string;
  tiers: ApprovalTier[];
  /** Fields stamped on full approval / on any rejection. */
  onApprove: Record<string, string>;
  onReject: Record<string, string>;
  /** Notification copy. `{rec.<field>}` interpolates the fetched record. */
  notify: { titleField: string; approvedTitle: string; approvedMessage: string; rejectedTitle: string; rejectedMessage: string };
  /** Console route segment for the notification link — the object name. */
  route?: string;
};

/**
 * The one shape every approval in this app takes (ADR-0019 approval nodes):
 *
 *   start (afterUpdate, submit value, no open request)
 *     → get_record
 *     → tier 1 approval → tier 2 approval → … → mark_approved → notify → end
 *          ↘ reject (any tier) → mark_rejected → notify → end
 *
 * `presales-project-approval.flow.ts` is the hand-written original; this
 * factory writes the same nodes and edges for the other approvals so seven
 * flows cannot drift from one another. Every approval node carries
 * `onEmptyApprovers: 'admin_rescue'` (an empty position or field must stay
 * decidable while `lockRecord` holds the record), `first_response` and
 * `lockRecord: true`. The flow runs as system: the gate constrains the
 * submitter, and the stamps land on a record the node holds locked.
 *
 * TOTALITY: every `record.x` read in the start condition is `has()`-guarded;
 * an absent approval-status key is admitted, an explicit null too.
 */
/**
 * `P` is a tagged template whose `${}` slots are CEL LITERALS (a string value
 * is quoted), so a field NAME cannot be interpolated through it. The predicate
 * is assembled as plain text first and handed to the tag through a synthetic
 * `TemplateStringsArray` with no slots — exactly what a literal with no `${}`
 * would have produced.
 */
const cel = (text: string) => P(Object.assign([text], { raw: [text] }) as unknown as TemplateStringsArray);

export function defineApprovalFlow(spec: ApprovalFlowSpec): Flow {
  const asf = spec.approvalStatusField ?? 'approval_status';
  const route = spec.route ?? spec.objectName;
  const t = spec.notify;
  const rec = (f: string) => `{rec.${f}}`;

  const nodes: Flow['nodes'] = [
    {
      id: 'start',
      type: 'start',
      label: 'Start',
      config: {
        objectName: spec.objectName,
        triggerType: 'record-after-update',
        condition: cel(
          `has(record.${spec.submitField}) && record.${spec.submitField} == "${spec.submitValue}"` +
          ` && (!has(record.${asf}) || record.${asf} == null || record.${asf} == "not_required" || record.${asf} == "rejected")`,
        ),
      },
    },
    {
      id: 'get_record',
      type: 'get_record',
      label: 'Get Record',
      config: { objectName: spec.objectName, filter: { id: '{record.id}' }, outputVariable: 'rec' },
    },
    ...spec.tiers.map((tier) => ({
      id: tier.id,
      type: 'approval' as const,
      label: tier.label,
      config: {
        approvers: tier.approvers,
        onEmptyApprovers: 'admin_rescue',
        behavior: 'first_response',
        lockRecord: true,
        approvalStatusField: asf,
      },
    })),
    {
      id: 'mark_approved',
      type: 'update_record',
      label: 'Mark Approved',
      config: { objectName: spec.objectName, filter: { id: '{record.id}' }, fields: spec.onApprove },
    },
    {
      id: 'notify_approved',
      type: 'notify',
      label: 'Notify — Approved',
      config: {
        recipients: [rec('owner_id')],
        channels: ['inbox', 'email'],
        topic: `${spec.name}_approved`,
        title: t.approvedTitle.replace('{title}', rec(t.titleField)),
        message: t.approvedMessage.replace('{title}', rec(t.titleField)),
        actionUrl: `/${route}/{record.id}`,
      },
    },
    {
      id: 'mark_rejected',
      type: 'update_record',
      label: 'Mark Rejected',
      config: { objectName: spec.objectName, filter: { id: '{record.id}' }, fields: spec.onReject },
    },
    {
      id: 'notify_rejected',
      type: 'notify',
      label: 'Notify — Rejected',
      config: {
        recipients: [rec('owner_id')],
        channels: ['inbox', 'email'],
        severity: 'warning',
        topic: `${spec.name}_rejected`,
        title: t.rejectedTitle.replace('{title}', rec(t.titleField)),
        message: t.rejectedMessage.replace('{title}', rec(t.titleField)),
        actionUrl: `/${route}/{record.id}`,
      },
    },
    { id: 'end', type: 'end', label: 'End' },
  ];

  const edges: Flow['edges'] = [
    { id: 'e_start', source: 'start', target: 'get_record', type: 'default' },
    { id: 'e_get', source: 'get_record', target: spec.tiers[0].id, type: 'default' },
  ];
  spec.tiers.forEach((tier, i) => {
    const next = spec.tiers[i + 1]?.id ?? 'mark_approved';
    edges.push({ id: `e_${tier.id}_approve`, source: tier.id, target: next, type: 'default', label: 'approve' });
    edges.push({ id: `e_${tier.id}_reject`, source: tier.id, target: 'mark_rejected', type: 'default', label: 'reject' });
  });
  edges.push(
    { id: 'e_approved', source: 'mark_approved', target: 'notify_approved', type: 'default' },
    { id: 'e_approved_end', source: 'notify_approved', target: 'end', type: 'default' },
    { id: 'e_rejected', source: 'mark_rejected', target: 'notify_rejected', type: 'default' },
    { id: 'e_rejected_end', source: 'notify_rejected', target: 'end', type: 'default' },
  );

  return {
    name: spec.name,
    label: spec.label,
    description: spec.description,
    type: 'record_change',
    status: 'active',
    runAs: 'system',
    variables: [{ name: 'recordId', type: 'text', isInput: true, isOutput: false }],
    nodes,
    edges,
  };
}
