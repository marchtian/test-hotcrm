// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

import { describe, it, expect } from 'vitest';
import gateHook from '../src/objects/opportunity_initiation_gate.hook';
import { CreatePresalesProjectAction } from '../src/actions/presales_project.actions';
import { MassUpdateStageAction, SubmitOpportunityInitiationAction } from '../src/actions/opportunity.actions';
import { hookNamed, makeCtx, makeHarness } from './helpers/hook-harness';

const gate = hookNamed(gateHook, 'opportunity_initiation_gate');

/**
 * Process sheet steps 11 / 14 / 15 (#11): approval has teeth.
 *
 * Every approval NODE existed before this card, but the approval VERDICT
 * constrained nothing — an unapproved deal could be dragged to Closed Won,
 * and a never-submitted one could become a presales project. Three gates now
 * carry the verdict, and each is pinned here:
 *
 *   - `opportunity_initiation_gate` (hook, USER writes): no stage / bid change
 *     before `approved`; no direct `closed_won` / `closed_lost` at all.
 *   - `mass_update_stage` (action, platform identity): re-states both rules
 *     in its own body, since the hook cannot see it.
 *   - `create_presales_project` (action): only an `approved` opportunity.
 */

type Rec = Record<string, any>;

const OPEN = { id: 'o1', name: 'Big Deal', stage: 'proposal', is_bid: false };

const update = (input: Rec, previous: Rec, user: { id: string } | null = { id: 'usr_1' }, session?: { userId?: string; isSystem?: boolean }) =>
  gate.handler(
    makeCtx({
      event: 'beforeUpdate',
      input: { id: 'o1', ...input },
      previous: { ...OPEN, ...previous },
      user: user ?? undefined,
      session,
      api: makeHarness().api,
    }),
  );

const userMessage = async (p: Promise<unknown>): Promise<string> => {
  try {
    await p;
    return '';
  } catch (err) {
    return String((err as { userMessage?: string }).userMessage ?? (err as Error).message);
  }
};

describe('opportunity_initiation_gate — step 11: no stage / bid change before approval', () => {
  it.each(['not_required', 'pending', 'rejected', undefined])(
    'refuses a stage advance while approval_status is %s',
    async (approval_status) => {
      const msg = await userMessage(update({ stage: 'negotiation' }, { approval_status }));
      expect(msg).toContain('尚未通过立项审批');
      expect(msg).toContain('不能更新阶段');
    },
  );

  it('tells a pending deal to wait, and an unsubmitted one to submit', async () => {
    expect(await userMessage(update({ stage: 'negotiation' }, { approval_status: 'pending' }))).toContain('等待立项审批通过');
    expect(await userMessage(update({ stage: 'negotiation' }, { approval_status: 'not_required' }))).toContain('提交立项审批');
  });

  it('refuses marking an unapproved deal for bidding', async () => {
    expect(await userMessage(update({ is_bid: true }, { approval_status: 'not_required' }))).toContain('不能标记投标');
  });

  it('lets an approved deal advance its stage and be marked for bidding', async () => {
    await expect(update({ stage: 'negotiation' }, { approval_status: 'approved' })).resolves.toBeUndefined();
    await expect(update({ is_bid: true }, { approval_status: 'approved' })).resolves.toBeUndefined();
  });

  it('never judges fields other than stage and is_bid — the deal stays workable', async () => {
    await expect(update({ amount: 999, description: 'x', next_step: 'call' }, { approval_status: 'not_required' })).resolves.toBeUndefined();
    // Re-sending the current stage is not a change.
    await expect(update({ stage: 'proposal' }, { approval_status: 'pending' })).resolves.toBeUndefined();
  });
});

describe('opportunity_initiation_gate — step 14: closing goes through a change request', () => {
  it.each(['closed_won', 'closed_lost'])('refuses a direct %s even on an approved deal', async (stage) => {
    const msg = await userMessage(update({ stage }, { approval_status: 'approved' }));
    expect(msg).toContain('商机状态变更申请');
    expect(msg).toContain('不能直接置为');
  });

  it('names the change-request path before the approval status for an unapproved deal', async () => {
    const msg = await userMessage(update({ stage: 'closed_won' }, { approval_status: 'not_required' }));
    expect(msg).toContain('商机状态变更申请');
  });
});

describe('opportunity_initiation_gate — system writes pass', () => {
  it.each([
    ['a seed advancing the stage', { stage: 'negotiation' }],
    ['a seed marking a bid', { is_bid: true }],
  ])('%s carries no user and is not judged', async (_label, input) => {
    await expect(update(input, { approval_status: 'not_required' }, null)).resolves.toBeUndefined();
  });

  it.each([
    ['the change-request apply (closed_won)', { stage: 'closed_won', win_reason: 'better_price' }],
    ['a flow advancing the stage', { stage: 'proposal' }],
  ])('%s carries the deciding user AND session.isSystem, and is not judged', async (_label, input) => {
    // Measured on 17.4.0: a flow-driven write re-attaches the deciding user for
    // attribution, so `user.id` alone would refuse the sanctioned close.
    await expect(
      update(input, { stage: 'negotiation', approval_status: 'approved' }, { id: 'usr_1' }, { userId: 'usr_1', isSystem: true }),
    ).resolves.toBeUndefined();
  });

  it('a user write with a session that is not system is still judged', async () => {
    const msg = await userMessage(update({ stage: 'closed_won' }, { approval_status: 'approved' }, { id: 'usr_1' }, { userId: 'usr_1' }));
    expect(msg).toContain('商机状态变更申请');
  });
});

describe('the two actions re-state the verdict where the hook cannot see it', () => {
  const src = (a: Rec) => String(a.body.source);

  it('create_presales_project accepts only an approved opportunity (step 15)', () => {
    const body = src(CreatePresalesProjectAction);
    expect(body).toContain(`src.approval_status !== 'approved'`);
    // The message for the never-submitted case points at the submit action.
    expect(body).toContain('提交立项审批');
  });

  it('mass_update_stage refuses closing and unapproved rows before writing anything', () => {
    const body = src(MassUpdateStageAction);
    const refuseClose = body.indexOf(`newStage === 'closed_won' || newStage === 'closed_lost'`);
    const refuseUnapproved = body.indexOf(`r.approval_status !== 'approved'`);
    const firstWrite = body.indexOf(`.update(`);
    expect(refuseClose).toBeGreaterThan(-1);
    expect(refuseUnapproved).toBeGreaterThan(-1);
    expect(refuseClose, 'the close refusal must come before the loop').toBeLessThan(firstWrite);
    expect(refuseUnapproved, 'the approval refusal must come before the loop').toBeLessThan(firstWrite);
    expect(MassUpdateStageAction.body && (MassUpdateStageAction.body as Rec).capabilities).toContain('api.read');
  });

  it('submit_opportunity_initiation flips the flag the flow enters on, and resets a rejection', () => {
    const body = src(SubmitOpportunityInitiationAction);
    expect(body).toContain('initiation_requested: true');
    expect(body).toContain(`patch.approval_status = 'not_required'`);
    expect(SubmitOpportunityInitiationAction.objectName).toBe('crm_opportunity');
  });
});
