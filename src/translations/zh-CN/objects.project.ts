// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

import type { TranslationData } from '@objectstack/spec/system';

type Objects = NonNullable<TranslationData['objects']>;

/**
 * 简体中文 — `objects` 命名空间，PROJECT 家族：售前项目、交付项目、工时、差旅报销、
 * 预算追加、商机状态变更申请（数科公司 demo）。
 *
 * 标识符是通用的，这里的措辞才是客户的黑话：铁三角、Bizcase、实施/核算成本中心、
 * TS 填报。换一个客户只换这个文件。
 */
const SECURITY_LEVEL = { public: '公开', internal: '内部', confidential: '秘密', secret: '机密' };
const PROJECT_TYPE = { implementation: '实施项目', development: '定制开发', integration: '系统集成', consulting: '咨询项目', operations: '运维服务' };
const BUSINESS_CATEGORY = { erp: 'ERP / 财务', mes: 'MES / 生产', energy: '能源与碳管理', data: '数据与 AI', security: '安全生产', infra: '基础设施与云', crm: '销售与 CRM', other: '其他' };
const COST_CENTER = { delivery_1: '交付一部', delivery_2: '交付二部', data_ai: '数据智能部', infra: '基础设施部', presales: '售前与解决方案部' };
const DOC_STATUS = { draft: '草稿', submitted: '已提交', approved: '已审批', rejected: '已驳回' };
const APPROVAL_STATUS = { not_required: '无需审批', pending: '审批中', approved: '已批准', rejected: '已驳回' };

export const project: Objects = {
  crm_presales_project: {
    label: '售前项目',
    pluralLabel: '售前项目',
    description: '售前立项 —— 引用已审批的 CRM 商机，完成成本测算与报价后进入审批',
    fields: {
      owner_id: { label: '售前负责人' },
      project_number: { label: '项目编号' },
      name: { label: '项目名称' },
      alias: { label: '项目别名' },
      project_type: { label: '项目类型', options: PROJECT_TYPE },
      business_category: { label: '业务分类', options: BUSINESS_CATEGORY },
      plan_start_date: { label: '计划开始日期' },
      plan_end_date: { label: '计划结束日期' },
      crm_opportunity: { label: 'CRM 商机', help: '售前立项必须引用客户关系系统中的商机。' },
      crm_account: { label: '客户' },
      expected_contract_amount: { label: '预计合同金额' },
      account_manager: { label: '客户经理' },
      project_manager: { label: '项目经理' },
      project_director: { label: '项目总监', help: '售前立项审批的一级审批人。' },
      qa_lead: { label: '项目 QA' },
      pricing_lead: { label: '资源报价负责人' },
      est_labor_cost: { label: '人工服务成本' },
      est_service_cost: { label: '第三方服务成本' },
      est_hardware_cost: { label: '第三方软硬件采购成本' },
      est_expense_cost: { label: '项目费用' },
      est_total_cost: { label: 'Bizcase 总成本', help: '四类成本之和，自动计算。' },
      quote_amount: { label: '项目报价' },
      gross_margin: { label: '毛利率 (%)', help: '（报价 − 总成本）÷ 报价，自动计算。' },
      security_level: { label: '信息安全类别', options: SECURITY_LEVEL },
      security_notes: { label: '安全备注说明' },
      status: {
        label: '状态',
        options: { draft: '草稿', submitted: '已提交', approved: '已立项', rejected: '已驳回', converted: '已转交付' },
      },
      approval_status: { label: '审批状态', options: APPROVAL_STATUS },
      approved_date: { label: '批准时间' },
      description: { label: '项目背景' },
      risk_analysis: { label: '风险分析' },
    },
    _views: {
      all_presales_projects: { label: '全部售前项目' },
      presales_kanban: { label: '售前看板' },
      pending_presales_approval: { label: '待审批售前立项' },
    },
    _sections: {
      basic: { label: '项目信息' },
      source: { label: 'CRM 来源' },
      roles: { label: '项目角色' },
      estimate: { label: '成本测算与报价（Bizcase）' },
      security: { label: '信息安全' },
      approval: { label: '状态与审批' },
      narrative: { label: '项目背景与风险' },
    },
    _validations: {
      plan_end_after_start: { message: '计划结束日期必须晚于计划开始日期' },
      presales_status_progression: { message: '无效的售前项目状态流转' },
    },
    _actions: {
      create_delivery_project: {
        label: '转交付立项',
        successMessage: '已生成交付项目：四类成本测算已转为预算基线，报价已转为合同额。',
      },
    },
  },

  crm_delivery_project: {
    label: '交付项目',
    pluralLabel: '交付项目',
    description: '交付立项 —— 以审批通过的售前测算为预算基线，跟踪成本执行与毛利',
    fields: {
      owner_id: { label: '项目负责人' },
      project_number: { label: '项目编号' },
      name: { label: '项目名称' },
      alias: { label: '项目别名' },
      project_type: { label: '项目类型', options: PROJECT_TYPE },
      business_category: { label: '业务分类', options: BUSINESS_CATEGORY },
      plan_start_date: { label: '计划开始日期' },
      plan_end_date: { label: '计划结束日期' },
      actual_start_date: { label: '实际开工日期' },
      crm_presales_project: { label: '售前立项', help: '交付立项必须选择已审批通过的售前立项。' },
      crm_opportunity: { label: 'CRM 商机' },
      crm_account: { label: '客户' },
      cost_center: { label: '实施成本中心', help: '干活的部门。', options: COST_CENTER },
      accounting_cost_center: { label: '核算成本中心', help: '背成本的部门 —— 与实施成本中心可以不同。', options: COST_CENTER },
      department: { label: '对应部门' },
      project_manager: { label: '项目经理', help: '本项目工时的审批人。' },
      project_director: { label: '项目总监' },
      pricing_lead: { label: '资源报价负责人' },
      qa_lead: { label: '项目 QA' },
      qa_director: { label: 'QA 总监' },
      subcontract_ts_owner: { label: '分包 TS 填写人' },
      budget_labor: { label: '人工服务成本预算' },
      budget_service: { label: '第三方服务成本预算' },
      budget_hardware: { label: '第三方软硬件采购预算' },
      budget_expense: { label: '项目费用预算' },
      budget_baseline: { label: '预算基线', help: '来自审批通过的 Bizcase 总成本，四类预算之和。基线不会被改写。' },
      budget_adjustment: { label: '已批准追加预算', help: '由已批准的预算追加申请汇总，不手工填写。' },
      budget_total: { label: '预算总额', help: '预算基线 + 已批准追加。' },
      actual_labor_cost: { label: '实际人工成本', help: '由已提交 / 已审批的工时汇总。' },
      actual_expense_cost: { label: '实际项目费用', help: '由已提交 / 已审批的差旅报销汇总。' },
      actual_total_cost: { label: '实际总成本' },
      budget_used_pct: { label: '预算执行率 (%)' },
      cost_status: { label: '成本状态', options: { normal: '正常', warning: '预警', over_budget: '已超支' } },
      cost_control: {
        label: '成本管控模式',
        help: '由成本管理员设置。仅「超支锁定工时」会在项目超预算时拒绝工时提交。',
        options: { warn: '仅预警', block: '超支锁定工时' },
      },
      contract_amount: { label: '合同额' },
      gross_margin: { label: '毛利率 (%)', help: '（合同额 − 实际总成本）÷ 合同额。' },
      security_level: { label: '信息安全类别', options: SECURITY_LEVEL },
      security_notes: { label: '安全备注说明' },
      status: { label: '状态', options: { planning: '立项中', submitted: '已提交审批', active: '执行中', on_hold: '已暂停', closed: '已结项' } },
      approval_status: { label: '审批状态', options: APPROVAL_STATUS },
      approved_date: { label: '批准时间' },
      description: { label: '项目说明' },
    },
    _views: {
      all_delivery_projects: { label: '全部交付项目' },
      cost_plan: { label: '成本计划' },
      cost_monitor: { label: '成本监控' },
      cost_kanban: { label: '成本状态看板' },
    },
    _sections: {
      basic: { label: '项目信息' },
      source: { label: '售前来源' },
      org: { label: '成本中心' },
      roles: { label: '项目角色' },
      budget: { label: '成本计划（预算基线）' },
      actuals: { label: '成本执行' },
      financials: { label: '合同与毛利' },
      security: { label: '信息安全' },
      approval: { label: '状态与审批' },
    },
    _validations: {
      plan_end_after_start: { message: '计划结束日期必须晚于计划开始日期' },
      delivery_status_progression: { message: '无效的交付项目状态流转' },
    },
  },

  crm_timesheet: {
    label: '工时填报',
    pluralLabel: '工时填报',
    description: '月度 TS 填报 —— 按项目、按月填写工时，由项目经理审批后计入实际成本',
    fields: {
      owner_id: { label: '填报人' },
      timesheet_number: { label: '工时单号' },
      crm_delivery_project: { label: '交付项目', help: '交付填写交付项目 TS。' },
      crm_presales_project: { label: '售前项目', help: '销售填写售前项目 TS；售前工时不占用交付预算。' },
      period_month: { label: '所属月份' },
      hours: { label: '工时（小时）' },
      work_description: { label: '工作内容' },
      position_level: {
        label: '岗位级别',
        options: { junior: '初级', intermediate: '中级', senior: '高级', expert: '专家', architect: '架构师' },
      },
      hourly_rate: { label: '费率（示例）', help: '按岗位级别取示例费率表，正式上线替换为贵司费率卡。' },
      labor_cost: { label: '人工成本', help: '工时 × 费率，自动计算。' },
      status: { label: '状态', options: DOC_STATUS },
      approver: { label: '审批人（项目经理）', help: '自动取所属项目的项目经理。' },
      approval_status: { label: '审批状态', options: APPROVAL_STATUS },
      approved_date: { label: '批准时间' },
    },
    _views: {
      all_timesheets: { label: '全部工时' },
      my_timesheets: { label: '我的工时' },
      pending_timesheet_approval: { label: '待审批工时' },
    },
    _sections: {
      basic: { label: '工时' },
      cost: { label: '成本核算' },
      approval: { label: '状态与审批' },
    },
    _validations: {
      timesheet_project_required: { message: '工时必须关联一个交付项目或售前项目' },
      hours_positive: { message: '工时必须大于零' },
      timesheet_status_progression: { message: '无效的工时状态流转' },
    },
  },

  crm_expense_claim: {
    label: '差旅报销',
    pluralLabel: '差旅报销',
    description: '差旅成本按项目归集，与人力成本对应',
    fields: {
      owner_id: { label: '报销人' },
      claim_number: { label: '报销单号' },
      crm_delivery_project: { label: '交付项目' },
      expense_date: { label: '发生日期' },
      category: { label: '费用类别', options: { transport: '交通', hotel: '住宿', meals: '餐饮', other: '其他' } },
      amount: { label: '金额' },
      description: { label: '事由说明' },
      status: { label: '状态', options: DOC_STATUS },
    },
    _views: {
      all_expense_claims: { label: '全部差旅报销' },
      my_expense_claims: { label: '我的报销' },
    },
    _sections: {
      basic: { label: '费用' },
      approval: { label: '状态与审批' },
    },
    _validations: {
      amount_positive: { message: '金额必须大于零' },
    },
  },

  crm_budget_adjustment: {
    label: '预算追加申请',
    pluralLabel: '预算追加申请',
    description: '预算不足时申请追加，填写调整原因与差异分析，走审批流程',
    fields: {
      owner_id: { label: '申请人' },
      request_number: { label: '申请单号' },
      crm_delivery_project: { label: '交付项目' },
      cost_category: {
        label: '成本类别',
        options: { labor: '人工服务成本', service: '第三方服务成本', hardware: '第三方软硬件采购成本', expense: '项目费用（差旅等）' },
      },
      amount: { label: '追加金额' },
      reason: { label: '调整原因' },
      variance_analysis: { label: '差异分析' },
      status: { label: '状态', options: DOC_STATUS },
      approval_status: { label: '审批状态', options: APPROVAL_STATUS },
      approved_date: { label: '批准时间' },
    },
    _views: {
      all_budget_adjustments: { label: '全部预算追加' },
      pending_budget_approval: { label: '待审批预算追加' },
    },
    _sections: {
      basic: { label: '申请' },
      analysis: { label: '原因与分析' },
      approval: { label: '状态与审批' },
    },
    _validations: {
      amount_positive: { message: '追加金额必须大于零' },
      budget_adjustment_status_progression: { message: '无效的预算追加状态流转' },
    },
  },

  crm_opportunity_change_request: {
    label: '商机状态变更申请',
    pluralLabel: '商机状态变更申请',
    description: '赢单、弃单、铁三角调整等状态变更，填写变更原因，审批通过后生效',
    fields: {
      owner_id: { label: '申请人' },
      request_number: { label: '申请单号' },
      crm_opportunity: { label: '商机' },
      change_type: { label: '变更类型', options: { win: '赢单', loss: '弃单', iron_triangle: '调整铁三角' } },
      reason: { label: '变更原因与说明' },
      win_reason: {
        label: '赢单原因',
        options: {
          better_product: '产品更优', better_price: '价格更优', relationship: '客户关系',
          better_support: '支持更好', best_fit: '最佳契合', quote_accepted: '报价被接受', other: '其他',
        },
      },
      loss_reason: {
        label: '弃单原因',
        options: {
          price: '价格过高', competitor: '输给竞争对手', no_budget: '客户无预算',
          no_decision: '客户未决策', timing: '时机不对', features: '功能缺失', other: '其他',
        },
      },
      loss_details: { label: '补充说明' },
      new_account_manager: { label: '新客户经理' },
      new_solution_manager: { label: '新解决方案经理' },
      new_delivery_manager: { label: '新交付经理' },
      status: { label: '状态', options: DOC_STATUS },
      approval_status: { label: '审批状态', options: APPROVAL_STATUS },
      approved_date: { label: '批准时间' },
    },
    _views: {
      all_opportunity_change_requests: { label: '全部变更申请' },
    },
    _sections: {
      basic: { label: '变更申请' },
      outcome: { label: '赢单 / 弃单信息' },
      roles: { label: '新铁三角' },
      approval: { label: '状态与审批' },
    },
    _validations: {
      change_request_status_progression: { message: '无效的变更申请状态流转' },
    },
  },
};
