---
"hotcrm": minor
---

Digital-tech company demo: a project-platform area beside CRM.

- Six new objects — presales project, delivery project, timesheet, expense claim,
  budget adjustment, opportunity change request — with costing / rollup hooks,
  an over-budget timesheet gate, and record actions that carry an opportunity
  into a presales project and a presales project into a delivery project.
- Customer classification and business profile on accounts; initiation info and
  iron-triangle roles on opportunities; account-category and review-status gates
  on opportunities; a lead-conversion approval gate.
- Eight approval flows (six through a shared factory) covering every approver
  source: position, a field on the record, a hook-filled approver.
- Opportunity approval has teeth: the entry is an explicit Submit for
  Initiation Approval action (every submitted deal is reviewed, no amount
  threshold), an initiation gate refuses stage / bid changes before approval
  and any direct Closed Won / Lost (those go through a change request), and
  the presales-project action accepts only an approved opportunity.
- The app is re-cut as one app with two areas (CRM · Project Platform), a
  project-metrics dataset, a project-operations dashboard, zh-CN packs, seed data
  staged for the three demo scenes, and `pnpm demo:staff:project`.
