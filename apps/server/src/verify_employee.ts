import http from 'http';

const BASE = 'http://localhost:4000/api/v1';
const EMPLOYEE_EMAIL = 'employee@hrms.local';
const EMPLOYEE_PASS = 'Hr@12345';
const HR_EMAIL = 'hr_admin@hrms.local';

let employeeToken = '';
let hrToken = '';
let passed = 0;
let failed = 0;

function api(method: string, path: string, token?: string, body?: Record<string, unknown>): Promise<{status: number; data: unknown}> {
  return new Promise((resolve) => {
    const url = BASE + path;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const bodyStr = body ? JSON.stringify(body) : undefined;
    const req = http.request(url, { method, headers }, (res) => {
      let chunks = '';
      res.on('data', (c) => chunks += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode!, data: JSON.parse(chunks) }); }
        catch { resolve({ status: res.statusCode!, data: chunks }); }
      });
    });
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

function apiRaw(method: string, path: string, token?: string, body?: unknown): Promise<{status: number; data: unknown}> {
  return new Promise((resolve) => {
    const url = BASE + path;
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const req = http.request(url, { method, headers }, (res) => {
      let chunks = '';
      res.on('data', (c) => chunks += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode!, data: JSON.parse(chunks) }); }
        catch { resolve({ status: res.statusCode!, data: chunks }); }
      });
    });
    req.end();
  });
}

function assert(label: string, ok: boolean, detail?: string) {
  if (ok) { passed++; console.log(`  ✓ ${label}`); }
  else { failed++; console.log(`  ✗ ${label}${detail ? ' — ' + detail : ''}`); }
}

async function run() {
  // --- Login ---
  console.log('\n🔑 Login');
  const empLogin = await api('POST', '/auth/login', undefined, { email: EMPLOYEE_EMAIL, password: EMPLOYEE_PASS });
  console.log('  empLogin response:', JSON.stringify(empLogin.data).slice(0, 300));
  const empLoginData = empLogin.data?.data ?? empLogin.data;
  employeeToken = empLoginData.accessToken;
  assert('employee login 200', empLogin.status === 200);
  assert('employee has accessToken', !!employeeToken);

  const hrLogin = await api('POST', '/auth/login', undefined, { email: HR_EMAIL, password: EMPLOYEE_PASS });
  const hrLoginData = hrLogin.data?.data ?? hrLogin.data;
  hrToken = hrLoginData.accessToken;
  assert('hr_admin login 200', hrLogin.status === 200);
  assert('hr_admin has accessToken', !!hrToken);

  // --- /auth/me scope ---
  console.log('\n🎯 /auth/me → scope');
  const empMe = await api('GET', '/auth/me', employeeToken);
  const empScope = empMe.data.data?.scope;
  assert('employee scope = "self"', empScope === 'self', `got "${empScope}"`);
  assert('employee has employee:read', (empMe.data.data?.permissions ?? []).includes('employee:read'));
  assert('employee has payroll:view', (empMe.data.data?.permissions ?? []).includes('payroll:view'));
  assert('employee has expense:submit', (empMe.data.data?.permissions ?? []).includes('expense:submit'));
  assert('employee has attendance:check_in', (empMe.data.data?.permissions ?? []).includes('attendance:check_in'));
  assert('employee has leave:apply', (empMe.data.data?.permissions ?? []).includes('leave:apply'));
  assert('employee DOES NOT have employee:manage_documents', !(empMe.data.data?.permissions ?? []).includes('employee:manage_documents'));
  assert('employee DOES NOT have employee:update', !(empMe.data.data?.permissions ?? []).includes('employee:update'));
  assert('employee DOES NOT have expense:read_all', !(empMe.data.data?.permissions ?? []).includes('expense:read_all'));
  assert('employee DOES NOT have expense:approve', !(empMe.data.data?.permissions ?? []).includes('expense:approve'));
  assert('employee DOES NOT have payroll:read_all', !(empMe.data.data?.permissions ?? []).includes('payroll:read_all'));
  assert('employee DOES NOT have report:employee', !(empMe.data.data?.permissions ?? []).includes('report:employee'));
  assert('employee DOES NOT have ats:manage_candidate', !(empMe.data.data?.permissions ?? []).includes('ats:manage_candidate'));
  assert('employee DOES NOT have settings:manage', !(empMe.data.data?.permissions ?? []).includes('settings:manage'));
  assert('employee DOES NOT have user:manage', !(empMe.data.data?.permissions ?? []).includes('user:manage'));

  // --- Employee self-data isolation ---
  console.log('\n🔒 Employee self-data isolation');
  const myEmp = await api('GET', '/employees/me', employeeToken);
  console.log('  /employees/me status:', myEmp.status, 'data keys:', typeof myEmp.data === 'object' ? Object.keys(myEmp.data) : typeof myEmp.data);
  assert('GET /employees/me 200', myEmp.status === 200, `got ${myEmp.status} - ${JSON.stringify(myEmp.data).slice(0, 300)}`);
  const myEmpId = myEmp.data?.data?.id;
  console.log(`  → own employee id: ${myEmpId}`);

  // GET own employee by id
  const ownById = await api('GET', `/employees/${myEmpId}`, employeeToken);
  assert(`GET /employees/${myEmpId} (own) 200`, ownById.status === 200);

  // Find another employee's id
  const hrList = await api('GET', '/employees', hrToken, undefined);
  const otherEmp = hrList.data.data?.rows?.find((e: any) => e.id !== myEmpId);
  if (otherEmp) {
    const otherId = otherEmp.id;
    console.log(`  → other employee id: ${otherId}`);
    const otherGet = await api('GET', `/employees/${otherId}`, employeeToken);
    assert(`GET /employees/${otherId} (other) 404`, otherGet.status === 404, `got ${otherGet.status}`);
    const otherPatch = await api('PATCH', `/employees/${otherId}`, employeeToken, { phone: 'hacked' });
    assert(`PATCH /employees/${otherId} (other) 403`, otherPatch.status === 403, `got ${otherPatch.status}`);
  }

  // Employee list should show only self
  const empList = await api('GET', '/employees', employeeToken);
  assert('GET /employees (self scope) 200', empList.status === 200);
  const selfOnlyRows = empList.data.data?.rows ?? empList.data.data;
  if (Array.isArray(selfOnlyRows)) {
    assert('GET /employees returns exactly 1 record (self)', selfOnlyRows.length === 1, `got ${selfOnlyRows.length}`);
    assert('GET /employees record is self', selfOnlyRows[0]?.id === myEmpId);
  }

  // --- My profile PATCH ---
  console.log('\n✏️  Update own profile');
  const patchMe = await api('PATCH', '/employees/me', employeeToken, { phone: '+1 555 123 9999', maritalStatus: 'single' });
  assert('PATCH /employees/me 200', patchMe.status === 200, `got ${patchMe.status}`);
  const patchVerify = await api('GET', '/employees/me', employeeToken);
  assert('PATCH updated phone persisted', patchVerify.data.data?.phone === '+1 555 123 9999');

  // --- My documents list + upload ---
  console.log('\n📄 My documents');
  const myDocs = await api('GET', '/employees/me/documents', employeeToken);
  assert('GET /employees/me/documents 200', myDocs.status === 200, `got ${myDocs.status}`);

  const uploadMyDoc = await apiRaw('POST', '/employees/me/documents/upload', employeeToken);
  assert('POST /employees/me/documents/upload (no file) → error or 400', uploadMyDoc.status !== 200);

  // Employee cannot upload to OTHER employee
  if (otherEmp) {
    const otherUpload = await apiRaw('POST', `/employees/${otherEmp.id}/documents/upload`, employeeToken);
    assert(`POST /employees/${otherEmp.id}/documents/upload (other) 403`, otherUpload.status === 403, `got ${otherUpload.status}`);
  }

  // --- Employee summary endpoint ---
  console.log('\n📊 /reports/employee-summary');
  const selfSummary = await api('GET', '/reports/employee-summary', employeeToken);
  assert('GET /reports/employee-summary 200', selfSummary.status === 200, `got ${selfSummary.status}`);
  if (selfSummary.status === 200) {
    const s = selfSummary.data.data;
    assert('summary has profile', !!s?.profile);
    assert('summary has attendance', !!s?.attendance);
    assert('summary has leave', !!s?.leave);
    assert('summary has payslip (may be null)', 'payslip' in (s ?? {}));
    assert('summary has expenses', !!s?.expenses);
    assert('summary has notifications', !!s?.notifications);
    assert('summary profile.id matches own', s?.profile?.id === myEmpId);
  }

  // --- 403 matrix: admin/sensitive endpoints ---
  console.log('\n🚫 403 matrix — employee should be blocked from admin endpoints');
  const blocked403 = [
    ['GET',  '/users',                     'user:manage'],
    ['GET',  '/roles',                     'role:manage'],
    ['GET',  '/reports/department-summary',  'report:attendance'],
    ['GET',  '/reports/team-summary',        'report:attendance'],
    ['GET',  '/reports/hr-summary',          'report:headcount'],
    ['GET',  '/reports/headcount',           'report:headcount'],
    ['GET',  '/reports/company-summary',     'report:headcount'],
    ['GET',  '/attendance',                  'employee (should fail with RoleGate on FE; backend attendance:read_all needed for listAll)'],
    ['POST', '/employees',                   'employee:create'],
    ['DELETE',`/employees/${myEmpId}`,       'employee:delete'],
  ];
  for (const [method, path, label] of blocked403) {
    const r = await api(method as string, path as string, employeeToken);
    const ok = r.status === 403 || r.status === 401;
    assert(`${method} ${path} → 403 (${label})`, ok, `got ${r.status}`);
  }

  // --- Own self-service endpoints (should work) ---
  console.log('\n✅ Own self-service endpoints — should be accessible');
  const ownChecks = [
    ['GET',  '/attendance/mine',              '200'],
    ['GET',  '/leave/requests/mine',          '200'],
    ['GET',  '/leave/balances/mine',          '200'],
    ['GET',  '/leave/types',                  '200'],
    ['GET',  '/payroll/payslips/mine',        '200'],
    ['GET',  '/expenses/mine',                '200'],
    ['GET',  '/notifications',                '200'],
    ['GET',  '/employees/directory',          '200'],
  ];
  for (const [method, path, expected] of ownChecks) {
    const r = await api(method as string, path as string, employeeToken);
    assert(`${method} ${path} → ${expected}`, r.status === Number(expected), `got ${r.status}`);
  }

  // --- Employee cannot use expense approve ---
  console.log('\n🚫 Expense/admin actions blocked');
  const expenseApprove = await api('PATCH', '/expenses/fake-id/decision', employeeToken, { decision: 'approved', comment: 'hacked' });
  assert('PATCH /expenses/:id/decision → 403', expenseApprove.status === 403, `got ${expenseApprove.status}`);

  // --- Notifications broadcast blocked ---
  const notifBroadcast = await api('POST', '/notifications/broadcast', employeeToken, { title: 'hack', body: 'hack' });
  assert('POST /notifications/broadcast → 403', notifBroadcast.status === 403, `got ${notifBroadcast.status}`);

  // --- Summary ---
  console.log(`\n══════════════════════════════════════`);
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log(`══════════════════════════════════════\n`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => { console.error(err); process.exit(1); });
