// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

import type { Hook, HookContext } from '@objectstack/spec/data';
import type { HookApi } from './_hook-api';

/**
 * Timesheet costing, approver fill and the over-budget gate (process sheet
 * steps 33, 34, 36).
 *
 * - `hourly_rate` comes from the SAMPLE rate table below, keyed by
 *   `position_level`; `labor_cost = hours × rate`. The table is inlined because
 *   a lowered hook body has no module scope (see `_refusal.ts`).
 * - `approver` is filled from the project's `project_manager` (step 34: "工时
 *   提交后由项目经理审批").
 * - THE GATE (step 36, "成本超预算时限制工时填报"): a write that leaves the
 *   sheet in a COUNTED state (`submitted` / `approved`) on a project whose
 *   `cost_control` is `block` is refused when the project's actual cost plus
 *   this sheet's delta would exceed `budget_total`. Draft sheets are never
 *   refused — a person can always save their hours; what is gated is charging
 *   them to the project. The machine signal alone (`cost_status`) never blocks:
 *   `block` is a value a cost administrator wrote down.
 */
const timesheetCostingGateHook: Hook = {
  name: 'timesheet_costing_gate',
  object: 'crm_timesheet',
  events: ['beforeInsert', 'beforeUpdate'],
  priority: 200,
  description: 'Cost the timesheet from the rate table, fill the approver, and refuse a submit that would overrun a cost-locked project.',
  handler: async (ctx: HookContext) => {
    // The refusal envelope (#1075) — mirrored from `./_refusal.ts`.
    function refuse(
      message: string,
      code: string,
      status: number,
      userMessage: string = message,
    ): Error {
      const err = new Error(message) as Error & {
        code: string;
        status: number;
        userMessage: string;
      };
      err.code = code;
      err.status = status;
      err.userMessage = userMessage;
      return err;
    }
    // SAMPLE hourly rates (CNY) — the demo says so on the field label. The
    // customer's own rate card replaces this table.
    const RATES: Record<string, number> = {
      junior: 100,
      intermediate: 150,
      senior: 220,
      expert: 320,
      architect: 450,
    };
    const COUNTED = new Set(['submitted', 'approved']);

    const { input } = ctx;
    const previous = (ctx.previous ?? {}) as Record<string, unknown>;
    const merged: Record<string, unknown> = { ...previous, ...input };
    const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

    const level = typeof merged.position_level === 'string' ? merged.position_level : 'intermediate';
    const rate = RATES[level] ?? RATES.intermediate;
    const hours = num(merged.hours);
    const laborCost = Math.round(hours * rate * 100) / 100;
    input.hourly_rate = rate;
    input.labor_cost = laborCost;

    const api = ctx.api as HookApi | undefined;
    const projectId = typeof merged.crm_delivery_project === 'string' ? merged.crm_delivery_project : '';
    if (!api || !projectId) return;

    const project = await api.object('crm_delivery_project').findOne({
      where: { id: projectId },
      fields: ['id', 'name', 'project_manager', 'cost_control', 'budget_total', 'actual_labor_cost', 'actual_expense_cost'],
    });
    if (!project) return;

    if (!merged.approver && typeof project.project_manager === 'string' && project.project_manager) {
      input.approver = project.project_manager;
    }

    const status = typeof merged.status === 'string' ? merged.status : 'draft';
    if (!COUNTED.has(status)) return;
    if (project.cost_control !== 'block') return;

    const prevStatus = typeof previous.status === 'string' ? previous.status : '';
    const prevCounted = COUNTED.has(prevStatus) ? num(previous.labor_cost) : 0;
    const delta = laborCost - prevCounted;
    const budgetTotal = num(project.budget_total);
    const actualTotal = num(project.actual_labor_cost) + num(project.actual_expense_cost);
    if (budgetTotal > 0 && actualTotal + delta > budgetTotal) {
      const fmt = (v: number) => Math.round(v).toLocaleString('en-US');
      const name = typeof project.name === 'string' ? project.name : projectId;
      throw refuse(
        `Timesheet refused: project "${name}" is cost-locked and over budget (budget ${fmt(budgetTotal)}, actual ${fmt(actualTotal)}, this sheet ${fmt(delta)}).`,
        'PROJECT_OVER_BUDGET',
        409,
        `项目「${name}」已超预算，工时填报已锁定：预算 ¥${fmt(budgetTotal)}，已用 ¥${fmt(actualTotal)}，本单 ¥${fmt(delta)}。请先提交「预算追加申请」并获批后再提交工时。`,
      );
    }
  },
};

/**
 * Roll the COUNTED timesheets (submitted / approved) up into the project's
 * `actual_labor_cost`. The project's own derivation hook then recomputes the
 * total, the usage and the cost status. Async + `onError: 'log'`: a derived
 * convenience must never block the timesheet write; handles re-parenting.
 */
const timesheetProjectRollupHook: Hook = {
  name: 'timesheet_project_rollup',
  object: 'crm_timesheet',
  events: ['afterInsert', 'afterUpdate', 'afterDelete'],
  priority: 300,
  async: true,
  onError: 'log',
  description: 'Recompute the parent delivery project actual labor cost from its submitted / approved timesheets.',
  handler: async (ctx: HookContext) => {
    const api = ctx.api as HookApi | undefined;
    if (!api) return;
    const { input } = ctx;
    const previous = ctx.previous;
    const projectIds = new Set<string>();
    for (const v of [input?.crm_delivery_project, previous?.crm_delivery_project]) {
      if (typeof v === 'string' && v) projectIds.add(v);
    }
    for (const projectId of projectIds) {
      const rows = await api.object('crm_timesheet').find({
        where: { crm_delivery_project: projectId },
        fields: ['labor_cost', 'status'],
        top: 5000,
      });
      let sum = 0;
      for (const r of rows ?? []) {
        if (r.status !== 'submitted' && r.status !== 'approved') continue;
        if (typeof r.labor_cost === 'number') sum += r.labor_cost;
      }
      await api.object('crm_delivery_project').update(
        { id: projectId, actual_labor_cost: Math.round(sum * 100) / 100 },
        { where: { id: projectId } },
      );
    }
  },
};

export default [timesheetCostingGateHook, timesheetProjectRollupHook];
