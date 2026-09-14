// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * Hooks Barrel
 *
 * Re-exports every `*.hook.ts` definition so they can be passed straight
 * into `defineStack({ hooks: allHooks })`. The `AppPlugin` then auto-binds
 * them onto the ObjectQL engine — no manual `engine.registerHook(...)`
 * wiring required.
 */

import type { Hook } from '@objectstack/spec/data';

import accountHook from '../objects/account.hook';
import articleFeedbackHook from '../objects/article_feedback.hook';
import campaignHook from '../objects/campaign.hook';
import campaignMemberHook from '../objects/campaign_member.hook';
import caseHook from '../objects/case.hook';
import contactHook from '../objects/contact.hook';
import contractHook from '../objects/contract.hook';
import eventHook from '../objects/event.hook';
import forecastHook from '../objects/forecast.hook';
import knowledgeArticleHook from '../objects/knowledge_article.hook';
import leadHook from '../objects/lead.hook';
import opportunityHook from '../objects/opportunity.hook';
import opportunityLineItemHook from '../objects/opportunity_line_item.hook';
import productHook from '../objects/product.hook';
import quoteHook from '../objects/quote.hook';
import quoteLineItemHook from '../objects/quote_line_item.hook';
import taskHook from '../objects/task.hook';
// Project domain (digital-tech company demo).
import presalesProjectHook from '../objects/presales_project.hook';
import deliveryProjectHook from '../objects/delivery_project.hook';
import timesheetHook from '../objects/timesheet.hook';
import expenseClaimHook from '../objects/expense_claim.hook';
import budgetAdjustmentHook from '../objects/budget_adjustment.hook';
import opportunityGateHook from '../objects/opportunity_gate.hook';
import opportunityChangeRequestHook from '../objects/opportunity_change_request.hook';

const entries: Array<Hook | Hook[]> = [
  accountHook,
  articleFeedbackHook,
  campaignHook,
  campaignMemberHook,
  caseHook,
  contactHook,
  contractHook,
  eventHook,
  forecastHook,
  knowledgeArticleHook,
  leadHook,
  opportunityHook,
  opportunityLineItemHook,
  productHook,
  quoteHook,
  quoteLineItemHook,
  taskHook,
  presalesProjectHook,
  deliveryProjectHook,
  timesheetHook,
  expenseClaimHook,
  budgetAdjustmentHook,
  opportunityGateHook,
  opportunityChangeRequestHook,
];

/** Flat list of every CRM lifecycle hook (each `*.hook.ts` may export one or many). */
export const allHooks: Hook[] = entries.flatMap((entry) =>
  Array.isArray(entry) ? entry : [entry],
);
