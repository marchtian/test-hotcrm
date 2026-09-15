// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

import { defineView } from '@objectstack/spec/ui';

/** Opportunity Change Request Views — the register. */
export const OpportunityChangeRequestViews = defineView({
  list: {
    type: 'grid',
    name: 'all_opportunity_change_requests',
    label: 'All Change Requests',
    data: { provider: 'object', object: 'crm_opportunity_change_request' },
    columns: [
      { field: 'request_number', width: 120, link: true, pinned: 'left' },
      { field: 'crm_opportunity', width: 220 },
      { field: 'change_type', width: 150 },
      { field: 'status', width: 110, sortable: true },
      { field: 'approval_status', width: 120 },
      { field: 'owner_id', width: 140 },
      { field: 'reason', width: 300 },
    ],
    sort: [{ field: 'created_at', order: 'desc' }],
    pagination: { pageSize: 25 },
    selection: { type: 'multiple' },
  },
});
