// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

import type { Dashboard } from '@objectstack/spec/ui';

/**
 * Project Operations Dashboard (项目经营看板) — process sheet steps 37–39.
 *
 * The centre piece is the THREE-BAR chart per project — baseline / adjusted
 * budget / actual — which is the "基线与实际成本差异" of step 39 drawn
 * rather than described. The two cost-centre tables below it cut the same
 * money by the executing and by the accounting centre.
 *
 * No KPI tile declares a `trend` (same rule as the sales dashboard): a delta
 * is a measurement, not a label.
 */
export const ProjectDashboard: Dashboard = {
  name: 'project_dashboard',
  label: 'Project Operations',
  description: 'Budget baseline vs adjusted vs actual, cost status and margin across delivery projects',

  columns: 12,
  gap: 4,
  refreshIntervalSeconds: 180,

  header: { showTitle: true, showDescription: false },

  dateRange: {
    field: 'created_at',
    defaultRange: 'this_year',
    allowCustomRange: true,
  },

  globalFilters: [
    {
      field: 'cost_center',
      label: { en: 'Executing Cost Centre', 'zh-CN': '实施成本中心', 'es-ES': 'Centro de costes ejecutor', 'ja-JP': '実施コストセンター' },
      type: 'select',
      scope: 'dashboard',
      options: [
        { value: 'delivery_1', label: { en: 'Delivery Dept. 1', 'zh-CN': '交付一部', 'es-ES': 'Entrega 1', 'ja-JP': 'デリバリー1部' } },
        { value: 'delivery_2', label: { en: 'Delivery Dept. 2', 'zh-CN': '交付二部', 'es-ES': 'Entrega 2', 'ja-JP': 'デリバリー2部' } },
        { value: 'data_ai',    label: { en: 'Data & AI Dept.', 'zh-CN': '数据智能部', 'es-ES': 'Datos e IA', 'ja-JP': 'データ・AI部' } },
        { value: 'infra',      label: { en: 'Infrastructure Dept.', 'zh-CN': '基础设施部', 'es-ES': 'Infraestructura', 'ja-JP': 'インフラ部' } },
        { value: 'presales',   label: { en: 'Presales & Solutions', 'zh-CN': '售前与解决方案', 'es-ES': 'Preventa', 'ja-JP': 'プリセールス' } },
      ],
    },
  ],

  widgets: [
    // ─── Row 1: KPIs ──────────────────────────────────────────────────
    {
      id: 'active_projects',
      title: 'Active Projects',
      description: 'Delivery projects in planning or execution',
      type: 'metric',
      filter: { status: { $in: ['planning', 'active'] } },
      colorVariant: 'blue',
      dataset: 'project_metrics', values: ['project_count'],
      layout: { x: 0, y: 0, w: 3, h: 2 },
      options: { icon: 'HardHat', format: '0,0' },
    },
    {
      id: 'total_budget',
      title: 'Total Budget',
      description: 'Baseline plus approved increases',
      type: 'metric',
      colorVariant: 'purple',
      dataset: 'project_metrics', values: ['budget_total_sum'],
      layout: { x: 3, y: 0, w: 3, h: 2 },
      options: { icon: 'Wallet', format: '0,0' },
    },
    {
      id: 'total_actual_cost',
      title: 'Actual Cost',
      description: 'Submitted and approved timesheets and expenses',
      type: 'metric',
      colorVariant: 'success',
      dataset: 'project_metrics', values: ['actual_total_sum'],
      layout: { x: 6, y: 0, w: 3, h: 2 },
      options: { icon: 'Activity', format: '0,0' },
    },
    {
      id: 'over_budget_projects',
      title: 'Over Budget',
      description: 'Projects whose actual cost exceeds the total budget',
      type: 'metric',
      filter: { cost_status: 'over_budget' },
      colorVariant: 'orange',
      dataset: 'project_metrics', values: ['project_count'],
      layout: { x: 9, y: 0, w: 3, h: 2 },
      options: { icon: 'AlertTriangle', format: '0,0' },
    },

    // ─── Row 2: baseline / adjusted / actual per project ──────────────
    {
      id: 'budget_vs_actual_by_project',
      title: 'Baseline · Adjusted · Actual by Project',
      description: 'The three lines of step 39 — where the budget started, where it stands, and what has been spent',
      type: 'bar',
      colorVariant: 'blue',
      dataset: 'project_metrics', dimensions: ['project'], values: ['budget_baseline_sum', 'budget_total_sum', 'actual_total_sum'],
      layout: { x: 0, y: 2, w: 8, h: 5 },
      chartConfig: {
        type: 'bar',
        showLegend: true,
        showDataLabels: false,
        colors: ['#94A3B8', '#4F46E5', '#10B981'],
        xAxis: { field: 'project', title: 'Project', showGridLines: false, logarithmic: false },
        yAxis: [
          { field: 'budget_baseline_sum', title: 'Baseline', format: '0,0', showGridLines: true, logarithmic: false },
          { field: 'budget_total_sum', title: 'Adjusted budget', format: '0,0', showGridLines: true, logarithmic: false },
          { field: 'actual_total_sum', title: 'Actual', format: '0,0', showGridLines: true, logarithmic: false },
        ],
        interaction: { tooltips: true, brush: false },
      },
    },
    {
      id: 'cost_status_mix',
      title: 'Cost Status',
      description: 'Projects on budget, in warning, and over budget',
      type: 'donut',
      colorVariant: 'purple',
      dataset: 'project_metrics', dimensions: ['cost_status'], values: ['project_count'],
      layout: { x: 8, y: 2, w: 4, h: 5 },
      chartConfig: {
        type: 'donut',
        showLegend: true,
        showDataLabels: true,
        colors: ['#10B981', '#F59E0B', '#EF4444'],
      },
    },

    // ─── Row 3: the two cost-centre cuts ──────────────────────────────
    {
      id: 'by_executing_cost_center',
      title: 'By Executing Cost Centre',
      description: 'Who does the work',
      type: 'table',
      colorVariant: 'default',
      dataset: 'project_metrics', dimensions: ['cost_center'], values: ['project_count', 'budget_total_sum', 'actual_total_sum', 'avg_budget_used'],
      layout: { x: 0, y: 7, w: 6, h: 4 },
    },
    {
      id: 'by_accounting_cost_center',
      title: 'By Accounting Cost Centre',
      description: 'Who carries the cost',
      type: 'table',
      colorVariant: 'default',
      dataset: 'project_metrics', dimensions: ['accounting_cost_center'], values: ['project_count', 'budget_total_sum', 'actual_total_sum', 'avg_budget_used'],
      layout: { x: 6, y: 7, w: 6, h: 4 },
    },

    // ─── Row 4: margin ────────────────────────────────────────────────
    {
      id: 'contract_vs_cost_by_project',
      title: 'Contract vs Cost by Project',
      description: 'Contract amount against actual cost — the margin, drawn',
      type: 'horizontal-bar',
      colorVariant: 'success',
      dataset: 'project_metrics', dimensions: ['project'], values: ['contract_sum', 'actual_total_sum'],
      layout: { x: 0, y: 11, w: 12, h: 4 },
      chartConfig: {
        type: 'horizontal-bar',
        showLegend: true,
        showDataLabels: true,
        colors: ['#4F46E5', '#10B981'],
        xAxis: { field: 'project', title: 'Project', showGridLines: false, logarithmic: false },
        yAxis: [
          { field: 'contract_sum', title: 'Contract', format: '0,0', showGridLines: true, logarithmic: false },
          { field: 'actual_total_sum', title: 'Actual cost', format: '0,0', showGridLines: true, logarithmic: false },
        ],
      },
    },
  ],
};
