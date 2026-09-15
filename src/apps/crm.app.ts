// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

import { App } from '@objectstack/spec/ui';

/**
 * CRM — navigation.
 *
 * Re-cut for the digital-tech company demo as ONE app with TWO AREAS, because
 * an 'app' package may define at most one app (ADR-0019 D3) and `areas` is
 * the platform's "one app, several workspaces" construct:
 *
 *   - `area_crm`      — the customer's process sheet, "系统路径" column, CRM
 *                       half: 客户管理 · 线索管理 · 商机管理 · 审批中心
 *   - `area_project`  — the project-platform half: 售前立项 · 交付立项 · 成本计划 ·
 *                       成本执行 · 工时填写 · 项目报表 · 审批中心
 *
 * so a presenter can walk the sheet row by row. The service and marketing
 * modules keep their objects, views and flows but are in neither area — the
 * sheet has no such rows. Both areas share every object; what differs is which
 * ones each puts in front of its users.
 *
 * Conventions kept from the original (#1259): one entry per destination, and
 * one exemplar per nav-item type — plain `object`, object + `viewName`,
 * `page`, `dashboard`, `report`, `component` — because this is still the
 * exemplar app (`test/app-navigation-shape.test.ts` pins that floor). "Mine"
 * views stay ListViews: `{current_user_id}` interpolates on the list-view data
 * path and nowhere else (dashboard filters do not).
 *
 * ADR-0063 §1/§2 — `defaultAgent` binds the platform `ask` agent; the app's
 * own AI capability ships as skills. Branding points at `assets/icon.svg`,
 * served at `/runtime/assets/icon.svg` (#731).
 */
export const CrmApp = App.create({
  name: 'crm_enterprise',
  label: { en: 'Digital Tech Workspace', 'zh-CN': '数科经营平台' },
  icon: 'briefcase',
  defaultAgent: 'ask',
  branding: {
    primaryColor: '#4169E1',
    logo: '/runtime/assets/icon.svg',
    favicon: '/runtime/assets/icon.svg',
  },

  areas: [
    {
      id: 'area_crm',
      label: { en: 'CRM', 'zh-CN': 'CRM' },
      icon: 'briefcase',
      description: { en: 'Customers, leads, opportunities and approvals', 'zh-CN': '客户管理 · 线索管理 · 商机管理 · 审批中心' },
      navigation: [
        { id: 'nav_home', type: 'dashboard', dashboardName: 'executive_dashboard', label: '首页', icon: 'home' },

        {
          id: 'group_customer',
          type: 'group',
          label: '客户管理',
          icon: 'building',
          expanded: true,
          children: [
            { id: 'nav_account',           type: 'object', objectName: 'crm_account', label: '客户', icon: 'building' },
            // ADR-0047 interface page — the curated counterpart to the Accounts entry.
            { id: 'nav_account_workbench', type: 'page', pageName: 'account_workbench', label: '客户工作台', icon: 'sliders-horizontal' },
            { id: 'nav_contact',           type: 'object', objectName: 'crm_contact', label: '联系人', icon: 'user' },
          ],
        },

        {
          id: 'group_lead',
          type: 'group',
          label: '线索管理',
          icon: 'user-plus',
          expanded: true,
          children: [
            { id: 'nav_lead',     type: 'object', objectName: 'crm_lead', label: '线索', icon: 'user-plus' },
            { id: 'nav_my_leads', type: 'object', objectName: 'crm_lead', viewName: 'my_leads', label: '我的线索', icon: 'user-plus' },
          ],
        },

        {
          id: 'group_opportunity',
          type: 'group',
          label: '商机管理',
          icon: 'target',
          expanded: true,
          children: [
            // The kanban board is another tab on this list page (`pipeline_kanban`).
            { id: 'nav_opportunity',    type: 'object', objectName: 'crm_opportunity', label: '商机', icon: 'target' },
            { id: 'nav_my_deals',       type: 'object', objectName: 'crm_opportunity', viewName: 'my_open_deals', label: '我的商机', icon: 'target' },
            // Process sheet steps 13–14: win / loss / iron-triangle changes go
            // through an approved request, not a direct stage edit.
            { id: 'nav_change_request', type: 'object', objectName: 'crm_opportunity_change_request', label: '状态变更申请', icon: 'git-pull-request' },
            { id: 'nav_quote',          type: 'object', objectName: 'crm_quote', label: '报价', icon: 'receipt' },
            { id: 'nav_contract',       type: 'object', objectName: 'crm_contract', label: '合同', icon: 'file-signature' },
            { id: 'nav_product',        type: 'object', objectName: 'crm_product', label: '产品', icon: 'package' },
            { id: 'nav_sales_dashboard', type: 'dashboard', dashboardName: 'sales_dashboard', label: '销售业绩', icon: 'chart-line' },
          ],
        },

        {
          id: 'group_approval',
          type: 'group',
          label: '审批中心',
          icon: 'inbox',
          expanded: true,
          children: [
            // `component`, not `url` — the platform's approval centre is the
            // first-party `approvals:inbox` surface; `requiresObject` hides the
            // entry where the approvals plugin is absent (#1123, #1259).
            { id: 'nav_approval_requests', type: 'component', componentRef: 'approvals:inbox', label: '待我审批', icon: 'inbox', requiresObject: 'sys_approval_request' },
          ],
        },

        {
          id: 'group_work',
          type: 'group',
          label: '我的工作',
          icon: 'list-checks',
          children: [
            { id: 'nav_my_tasks',    type: 'object', objectName: 'crm_task', viewName: 'my_open_tasks', label: '我的任务', icon: 'circle-check' },
            { id: 'nav_my_calendar', type: 'object', objectName: 'crm_event', viewName: 'my_events', label: '我的日历', icon: 'calendar-days' },
          ],
        },

        {
          id: 'group_insights',
          type: 'group',
          label: '数据洞察',
          icon: 'sparkles',
          children: [
            { id: 'nav_crm_dashboard',            type: 'dashboard', dashboardName: 'crm_overview_dashboard', label: 'CRM 总览', icon: 'layout-dashboard' },
            { id: 'nav_forecast',                 type: 'object', objectName: 'crm_forecast', label: '销售预测', icon: 'trending-up' },
            { id: 'nav_report_pipeline_coverage', type: 'report', reportName: 'pipeline_coverage_by_quarter', label: '管道覆盖率', icon: 'columns-3' },
            { id: 'nav_report_lead_inflow',       type: 'report', reportName: 'lead_inflow_by_month_source', label: '线索流入', icon: 'trending-up' },
          ],
        },
      ],
    },

    {
      id: 'area_project',
      label: { en: 'Project Platform', 'zh-CN': '项管平台' },
      icon: 'hard-hat',
      description: { en: 'Presales and delivery initiation, cost planning and execution, timesheets, reports', 'zh-CN': '售前立项 · 交付立项 · 成本计划 · 成本执行 · 工时填写 · 项目报表 · 审批中心' },
      navigation: [
        { id: 'pp_home', type: 'dashboard', dashboardName: 'project_dashboard', label: '首页', icon: 'home' },

        {
          id: 'pp_group_presales',
          type: 'group',
          label: '售前立项',
          icon: 'clipboard-list',
          expanded: true,
          children: [
            { id: 'pp_presales',       type: 'object', objectName: 'crm_presales_project', label: '售前项目', icon: 'clipboard-list' },
            { id: 'pp_presales_board', type: 'object', objectName: 'crm_presales_project', viewName: 'presales_kanban', label: '售前看板', icon: 'columns-3' },
            // The CRM source the sheet says a presales project must reference.
            { id: 'pp_opportunity',    type: 'object', objectName: 'crm_opportunity', label: 'CRM 商机', icon: 'target' },
          ],
        },

        {
          id: 'pp_group_delivery',
          type: 'group',
          label: '交付立项',
          icon: 'hard-hat',
          expanded: true,
          children: [
            { id: 'pp_delivery', type: 'object', objectName: 'crm_delivery_project', label: '交付项目', icon: 'hard-hat' },
          ],
        },

        {
          id: 'pp_group_cost_plan',
          type: 'group',
          label: '成本计划',
          icon: 'wallet',
          expanded: true,
          children: [
            { id: 'pp_cost_plan',         type: 'object', objectName: 'crm_delivery_project', viewName: 'cost_plan', label: '成本计划', icon: 'wallet' },
            { id: 'pp_budget_adjustment', type: 'object', objectName: 'crm_budget_adjustment', label: '预算追加申请', icon: 'trending-up' },
          ],
        },

        {
          id: 'pp_group_cost_exec',
          type: 'group',
          label: '成本执行',
          icon: 'activity',
          expanded: true,
          children: [
            { id: 'pp_cost_monitor', type: 'object', objectName: 'crm_delivery_project', viewName: 'cost_monitor', label: '成本监控', icon: 'gauge' },
            { id: 'pp_cost_board',   type: 'object', objectName: 'crm_delivery_project', viewName: 'cost_kanban', label: '成本状态看板', icon: 'columns-3' },
            { id: 'pp_expense',      type: 'object', objectName: 'crm_expense_claim', label: '差旅报销', icon: 'receipt' },
          ],
        },

        {
          id: 'pp_group_timesheet',
          type: 'group',
          label: '工时填写',
          icon: 'clock',
          expanded: true,
          children: [
            { id: 'pp_my_timesheets',      type: 'object', objectName: 'crm_timesheet', viewName: 'my_timesheets', label: 'TS 月度填写', icon: 'clock' },
            { id: 'pp_timesheets',         type: 'object', objectName: 'crm_timesheet', label: '全部工时', icon: 'list-checks' },
            { id: 'pp_timesheet_approval', type: 'object', objectName: 'crm_timesheet', viewName: 'pending_timesheet_approval', label: '工时审批', icon: 'circle-check' },
          ],
        },

        {
          id: 'pp_group_reports',
          type: 'group',
          label: '项目报表',
          icon: 'chart-line',
          expanded: true,
          children: [
            { id: 'pp_project_dashboard', type: 'dashboard', dashboardName: 'project_dashboard', label: '项目经营看板', icon: 'layout-dashboard' },
            { id: 'pp_sales_dashboard',   type: 'dashboard', dashboardName: 'sales_dashboard', label: '销售业绩', icon: 'chart-line' },
          ],
        },

        {
          id: 'pp_group_approvals',
          type: 'group',
          label: '审批中心',
          icon: 'inbox',
          expanded: true,
          children: [
            { id: 'pp_inbox', type: 'component', componentRef: 'approvals:inbox', label: '待我审批', icon: 'inbox', requiresObject: 'sys_approval_request' },
          ],
        },
      ],
    },
  ],
});
