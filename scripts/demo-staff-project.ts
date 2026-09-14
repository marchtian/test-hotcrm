// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.
//
// Project-demo staffing — the two personas of the third demo scene.
//
//   pnpm dev                    # terminal 1 — leave it running (fresh DB: pnpm demo:reset first)
//   pnpm demo:staff:project     # terminal 2 — once, against that server
//
// Creates a PROJECT MANAGER login (sees budgets and actuals, but not contract
// amount, gross margin or hourly rates) and binds the `project_manager` and
// `pmo_director` positions to their permission sets. The dev admin
// (`admin@objectos.ai`) already sees everything through `system_admin`, so it
// plays the PMO director. Idempotent — rerun any time.
//
// Same guard as `demo-staff.ts`: refuses any host that is not this machine.

type Json = Record<string, any>;

const DEFAULT_URL = 'http://localhost:4001';

/** The people this script creates. Passwords are demo-grade on purpose. */
export const ProjectDemoStaff = [
  {
    name: '王小明（项目经理）',
    email: 'pm@objectos.ai',
    password: 'demo1234',
    positions: ['project_manager'],
  },
] as const;

/** position name → permission-set name, bound through `sys_position_permission_set`. */
const POSITION_PERMISSION_SETS: Record<string, string> = {
  project_manager: 'project_manager',
  pmo_director: 'pmo_director',
};

function arg(name: string, envName: string, fallback: string): string {
  const argv = process.argv.slice(2);
  const eq = argv.find((a) => a.startsWith(`--${name}=`));
  if (eq) return eq.slice(name.length + 3);
  const i = argv.indexOf(`--${name}`);
  if (i !== -1 && argv[i + 1]) return argv[i + 1];
  return process.env[envName]?.trim() || fallback;
}

function assertLocal(url: string): URL {
  const parsed = new URL(url);
  const loopback = ['127.0.0.1', '[::1]', '::1', '0.0.0.0'];
  if (parsed.hostname !== 'localhost' && !loopback.includes(parsed.hostname)) {
    throw new Error(`refusing to staff a non-local server (${parsed.hostname}) — demo accounts belong on a dev server only.`);
  }
  if (loopback.includes(parsed.hostname)) parsed.hostname = 'localhost';
  return parsed;
}

class Api {
  private cookie = '';
  constructor(private readonly base: URL) {}
  private async call(method: string, path: string, body?: Json): Promise<{ status: number; json: Json }> {
    const res = await fetch(new URL(path, this.base), {
      method,
      headers: { 'Content-Type': 'application/json', Origin: this.base.origin, ...(this.cookie ? { Cookie: this.cookie } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const setCookie = res.headers.getSetCookie?.() ?? [];
    if (setCookie.length) this.cookie = setCookie.map((c) => c.split(';')[0]).join('; ');
    const text = await res.text();
    let json: Json = {};
    try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
    return { status: res.status, json };
  }
  async post(path: string, body: Json) { return this.call('POST', path, body); }
  async get(path: string) { return this.call('GET', path); }
  async postOk(path: string, body: Json): Promise<Json> {
    const { status, json } = await this.post(path, body);
    if (status >= 400 || json?.error) throw new Error(`${path} → ${status}: ${JSON.stringify(json).slice(0, 300)}`);
    return json;
  }
  async records(object: string, limit = 100): Promise<Json[]> {
    const { json } = await this.get(`/api/v1/data/${object}?limit=${limit}`);
    return Array.isArray(json?.records) ? json.records : [];
  }
}

async function main() {
  const base = assertLocal(arg('url', 'OS_DEMO_URL', DEFAULT_URL));
  const api = new Api(base);
  await api.postOk('/api/v1/auth/sign-in/email', {
    email: arg('admin-email', 'OS_SEED_ADMIN_EMAIL', 'admin@objectos.ai'),
    password: arg('admin-password', 'OS_SEED_ADMIN_PASSWORD', 'admin123'),
  });
  const org = (await api.records('sys_organization', 1))[0]?.id ?? null;

  // 1. positions ↔ permission sets
  const positions = await api.records('sys_position');
  const sets = await api.records('sys_permission_set');
  const bound = await api.records('sys_position_permission_set', 500);
  for (const [posName, setName] of Object.entries(POSITION_PERMISSION_SETS)) {
    const pos = positions.find((p) => p.name === posName);
    const set = sets.find((s) => s.name === setName);
    if (!pos || !set) { console.log(`  ⚠ skip ${posName} → ${setName}: ${!pos ? 'position' : 'permission set'} not found`); continue; }
    if (bound.some((b) => b.position_id === pos.id && b.permission_set_id === set.id)) { console.log(`  = ${posName} → ${setName} already bound`); continue; }
    await api.postOk('/api/v1/data/sys_position_permission_set', { position_id: pos.id, permission_set_id: set.id, ...(org ? { organization_id: org } : {}) });
    console.log(`  + ${posName} → ${setName}`);
  }

  // 2. people
  const users = await api.records('sys_user', 500);
  for (const member of ProjectDemoStaff) {
    let user = users.find((u) => u.email === member.email);
    if (!user) {
      const res = await api.postOk('/api/v1/auth/admin/create-user', {
        name: member.name, email: member.email, password: member.password,
        // No first-login password change: the presenter logs straight in.
        mustChangePassword: false,
      });
      user = res?.data?.user ?? res?.user ?? res;
      console.log(`  + user ${member.email} (${user?.id})`);
    } else {
      console.log(`  = user ${member.email} exists (${user.id})`);
      // A rerun after someone changed the demo password by hand: put it back.
      // `set-user-password` re-arms the first-login change, so the user then
      // "changes" it to the same value to clear that flag.
      const probe = new Api(base);
      const { status } = await probe.post('/api/v1/auth/sign-in/email', { email: member.email, password: member.password });
      if (status >= 400) {
        await api.postOk('/api/v1/auth/admin/set-user-password', { userId: user.id, newPassword: member.password });
        await probe.postOk('/api/v1/auth/sign-in/email', { email: member.email, password: member.password });
        await probe.postOk('/api/v1/auth/change-password', { currentPassword: member.password, newPassword: member.password, revokeOtherSessions: false });
        console.log(`    ~ password reset to the demo value`);
      }
    }
    const held = (await api.records('sys_user_position', 500)).filter((r) => r.user_id === user.id).map((r) => String(r.position));
    for (const position of member.positions) {
      if (held.includes(position)) { console.log(`    = ${position}`); continue; }
      await api.postOk('/api/v1/data/sys_user_position', { user_id: user.id, position, ...(org ? { organization_id: org } : {}) });
      console.log(`    + ${position}`);
    }
  }

  // 3. verify the masking that the third scene shows
  const pm = new Api(base);
  await pm.postOk('/api/v1/auth/sign-in/email', { email: ProjectDemoStaff[0].email, password: ProjectDemoStaff[0].password });
  const rows = await pm.records('crm_delivery_project', 3);
  const leaked = rows.filter((r) => 'contract_amount' in r || 'gross_margin' in r);
  if (!rows.length) throw new Error('project manager reads no delivery project at all — check the permission-set binding');
  if (leaked.length) throw new Error(`project manager can read contract_amount / gross_margin — field masking is not in effect`);
  console.log(`\n✅ ${ProjectDemoStaff[0].email} / ${ProjectDemoStaff[0].password} — reads ${rows.length} delivery project(s), contract amount and gross margin masked.`);
}

main().catch((err) => { console.error(`\n❌ ${err.message}`); process.exit(1); });
