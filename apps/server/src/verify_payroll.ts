import http from 'http';

const BASE = 'http://localhost:4000/api/v1';
const PAY_EMAIL = 'payroll_manager@hrms.local';
const EMP_EMAIL = 'employee@hrms.local';
const PASS = 'Hr@12345';

let passed = 0;
let failed = 0;

function api(method: string, path: string, token?: string, body?: Record<string, unknown>): Promise<{ status: number; data: any }> {
  return new Promise((resolve) => {
    const url = BASE + path;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const bodyStr = body ? JSON.stringify(body) : undefined;
    const req = http.request(url, { method, headers }, (res) => {
      let chunks = '';
      res.on('data', (c) => (chunks += c));
      res.on('end', () => {
        try { resolve({ status: res.statusCode!, data: JSON.parse(chunks) }); }
        catch { resolve({ status: res.statusCode!, data: chunks }); }
      });
    });
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

function check(desc: string, cond: boolean, detail?: unknown) {
  if (cond) {
    passed++;
    console.log(`  ✓ ${desc}`);
  } else {
    failed++;
    console.log(`  ✗ ${desc}${detail !== undefined ? ` — ${JSON.stringify(detail).slice(0, 300)}` : ''}`);
  }
}

async function main() {
  console.log('🔑 Login');
  const payLogin = await api('POST', '/auth/login', undefined, { email: PAY_EMAIL, password: PASS });
  check('payroll_manager login 200', payLogin.status === 200, payLogin.status);
  const payToken = payLogin.data?.data?.accessToken;
  check('payroll_manager has accessToken', !!payToken);

  const empLogin = await api('POST', '/auth/login', undefined, { email: EMP_EMAIL, password: PASS });
  check('employee login 200', empLogin.status === 200, empLogin.status);
  const empToken = empLogin.data?.data?.accessToken;
  check('employee has accessToken', !!empToken);

  console.log('\n🎯 /auth/me → scope + permissions');
  const meRes = await api('GET', '/auth/me', payToken);
  const me = meRes.data?.data;
  check('payroll_manager /auth/me 200', meRes.status === 200, meRes.status);
  check('payroll_manager scope = "all"', me?.scope === 'all', me?.scope);
  const perms = (me?.permissions ?? []) as string[];
  check('has payroll:manage_structure', perms.includes('payroll:manage_structure'));
  check('has payroll:process', perms.includes('payroll:process'));
  check('has payroll:approve', perms.includes('payroll:approve'));
  check('has payroll:view', perms.includes('payroll:view'));
  check('has payroll:read_all', perms.includes('payroll:read_all'));
  check('has employee:view_salary', perms.includes('employee:view_salary'));
  check('has report:payroll', perms.includes('report:payroll'));
  check('DOES NOT have user:manage', !perms.includes('user:manage'));
  check('DOES NOT have role:manage', !perms.includes('role:manage'));
  check('DOES NOT have settings:system', !perms.includes('settings:system'));
  check('DOES NOT have employee:update', !perms.includes('employee:update'));
  check('DOES NOT have expense:approve', !perms.includes('expense:approve'));
  check('DOES NOT have ats:manage_requisition', !perms.includes('ats:manage_requisition'));
  check('DOES NOT have leave:approve', !perms.includes('leave:approve'));

  console.log('\n📊 /payroll/dashboard');
  const dashRes = await api('GET', '/payroll/dashboard', payToken);
  const d = dashRes.data?.data;
  check('GET /payroll/dashboard 200', dashRes.status === 200, dashRes.status);
  check('dashboard.employeeCount > 0', typeof d?.employeeCount === 'number' && d.employeeCount > 0, d?.employeeCount);
  check('dashboard.currentPeriod present', !!d?.currentPeriod?.name, d?.currentPeriod?.name);
  check('dashboard.pendingApprovals >= 1 (seeded unpaid run)', typeof d?.pendingApprovals === 'number' && d.pendingApprovals >= 1, d?.pendingApprovals);
  check('dashboard has totals {gross,deductions,net}', d?.totals && typeof d.totals.gross !== 'undefined' && typeof d.totals.net !== 'undefined', d?.totals);
  check('dashboard.runTrend is array', Array.isArray(d?.runTrend));

  console.log('\n📋 Salary structures');
  const strRes = await api('GET', '/payroll/structures', payToken);
  const strs = strRes.data?.data;
  check('GET /payroll/structures 200', strRes.status === 200, strRes.status);
  check('structures > 0', Array.isArray(strs) && strs.length > 0, strs?.length);
  const exec = strs?.find((s: any) => s.name === 'Executive Structure');
  check('seeded Executive Structure exists', !!exec, exec?.name);
  check('Executive Structure has components', Array.isArray(exec?.components) && exec.components.length > 0, exec?.components?.length);

  console.log('\n👤 Employee salaries');
  const empSalRes = await api('GET', '/payroll/employees', payToken);
  const empSals = empSalRes.data?.data;
  check('GET /payroll/employees 200', empSalRes.status === 200, empSalRes.status);
  check('employee salaries > 0', Array.isArray(empSals) && empSals.length > 0, empSals?.length);
  const withEmp = empSals?.find((a: any) => a.employee?.firstName);
  check('assignment includes employee ref', !!withEmp, withEmp?.employee);
  check('assignment includes salaryStructure + components', !!withEmp?.salaryStructure?.components?.length, withEmp?.salaryStructure?.name);

  console.log('\n📅 Payroll periods');
  const perRes = await api('GET', '/payroll/periods', payToken);
  const pers = perRes.data?.data;
  check('GET /payroll/periods 200', perRes.status === 200, perRes.status);
  check('periods >= 3 (Jul/Aug/Sep)', Array.isArray(pers) && pers.length >= 3, pers?.length);

  console.log('\n🏃 Payroll runs');
  const runsRes = await api('GET', '/payroll/runs', payToken);
  const runs = runsRes.data?.data;
  check('GET /payroll/runs 200', runsRes.status === 200, runsRes.status);
  check('runs >= 2 (paid + awaiting approval)', Array.isArray(runs) && runs.length >= 2, runs?.length);
  const paidRun = runs?.find((r: any) => r.status === 'paid');
  const pendingRun = runs?.find((r: any) => r.status !== 'paid');
  const runForDetail = paidRun ?? pendingRun;
  if (runForDetail) {
    const detRes = await api('GET', `/payroll/runs/${runForDetail.id}`, payToken);
    const det = detRes.data?.data;
    check('GET /payroll/runs/:id 200', detRes.status === 200, detRes.status);
    check('run detail has payslips with employee refs', Array.isArray(det?.payslips) && det.payslips.length > 0 && det.payslips[0]?.employee, det?.payslips?.length);
    const expRes = await api('GET', `/payroll/runs/${runForDetail.id}/export`, payToken);
    check('GET /payroll/runs/:id/export 200', expRes.status === 200, expRes.status);
    check('export returns text', typeof expRes.data === 'string' && expRes.data.includes('Employee'), expRes.data?.slice(0, 60));
  }

  console.log('\n📄 Payslips (all + filter + mine)');
  const paysRes = await api('GET', '/payroll/payslips', payToken);
  const pays = paysRes.data?.data;
  check('GET /payroll/payslips 200', paysRes.status === 200, paysRes.status);
  check('payslips > 0', Array.isArray(pays) && pays.length > 0, pays?.length);
  if (pendingRun) {
    const fRes = await api('GET', `/payroll/payslips?runId=${pendingRun.id}`, payToken);
    check('payslips filtered by runId 200 + non-empty', fRes.status === 200 && Array.isArray(fRes.data?.data) && fRes.data.data.length > 0, fRes.status);
  }
  const mineRes = await api('GET', '/payroll/payslips/mine', empToken);
  check('employee GET /payroll/payslips/mine 200', mineRes.status === 200, mineRes.status);
  check('employee has own payslips', Array.isArray(mineRes.data?.data) && mineRes.data.data.length > 0, mineRes.data?.data?.length);

  console.log('\n💰 Taxes / Bonuses / Overtime');
  const taxRes = await api('GET', '/payroll/taxes', payToken);
  const taxes = taxRes.data?.data;
  check('GET /payroll/taxes 200', taxRes.status === 200, taxRes.status);
  check('tax configs > 0', Array.isArray(taxes) && taxes.length > 0, taxes?.length);
  check('tax config has slabs', Array.isArray(taxes?.[0]?.slabs) && taxes[0].slabs.length > 0, taxes?.[0]?.slabs?.length);

  const bonusRes = await api('GET', '/payroll/bonuses', payToken);
  const bonuses = bonusRes.data?.data;
  check('GET /payroll/bonuses 200', bonusRes.status === 200, bonusRes.status);
  check('bonuses > 0', Array.isArray(bonuses) && bonuses.length > 0, bonuses?.length);
  check('bonus includes employee ref', !!bonuses?.[0]?.employee, bonuses?.[0]?.employee);

  const otRes = await api('GET', '/payroll/overtime', payToken);
  const ots = otRes.data?.data;
  check('GET /payroll/overtime 200', otRes.status === 200, otRes.status);
  check('overtime entries > 0', Array.isArray(ots) && ots.length > 0, ots?.length);

  console.log('\n🔬 Payroll E2E: create period → process → detail → approve');
  const stamp = Date.now();
  const start = new Date();
  start.setDate(1);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  const periodName = `Verify Period ${stamp}`;
  const createPer = await api('POST', '/payroll/periods', payToken, {
    name: periodName,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  });
  check('POST /payroll/periods 201', createPer.status === 201, createPer.status);
  const periodId = createPer.data?.data?.id;
  if (periodId) {
    const procRes = await api('POST', '/payroll/runs/process', payToken, { payrollPeriodId: periodId });
    check('POST /payroll/runs/process 200', procRes.status === 200, procRes.status);
    const newRun = procRes.data?.data;
    check('processed run created with payslips', !!newRun?.id && Array.isArray(newRun?.payslips) && newRun.payslips.length > 0, newRun?.payslips?.length);
    if (newRun?.id) {
      const appRes = await api('POST', `/payroll/runs/${newRun.id}/approve`, payToken);
      check('POST /payroll/runs/:id/approve 200', appRes.status === 200, appRes.status);
      check('run status now paid', appRes.data?.data?.status === 'paid', appRes.data?.data?.status);
      const perAfter = await api('GET', '/payroll/periods', payToken);
      const updatedPer = perAfter.data?.data?.find((p: any) => p.id === periodId);
      check('period flipped to paid after approval', updatedPer?.status === 'paid', updatedPer?.status);
    }
  }

  console.log('\n✏️  Write operations (Create bonus/overtime/tax)');
  const empOpt = empSals?.[0]?.employee?.id;
  if (empOpt) {
    const cb = await api('POST', '/payroll/bonuses', payToken, { employeeId: empOpt, type: 'bonus', amount: 250, reason: 'Verify bonus', date: new Date().toISOString(), status: 'pending' });
    check('POST /payroll/bonuses 201', cb.status === 201, cb.status);
    const co = await api('POST', '/payroll/overtime', payToken, { employeeId: empOpt, date: new Date().toISOString(), hours: 3, rateFactor: 1.5, amount: 180, status: 'pending' });
    check('POST /payroll/overtime 201', co.status === 201, co.status);
  }
  const ct = await api('POST', '/payroll/taxes', payToken, { country: `XX${stamp}`, taxType: 'flat', slabs: [{ fromAmount: 0, ratePercent: 5 }] });
  check('POST /payroll/taxes 201', ct.status === 201, ct.status);

  console.log('\n🚫 403 matrix — payroll_manager must NOT access admin/ATS/HQ reports');
  const blocked: Array<[string, string, string, number]> = [
    ['GET', '/users', 'user:manage', 403],
    ['GET', '/roles', 'role:manage', 403],
    ['POST', '/notifications/broadcast', 'settings:manage', 403],
    ['GET', '/recruitment/requisitions', 'ats:manage_requisition', 403],
    ['GET', '/recruitment/stats', 'ats:manage_candidate', 403],
    ['GET', '/reports/hr-summary', 'report:headcount', 403],
    ['GET', '/reports/company-summary', 'report:headcount', 403],
    ['GET', '/reports/department-summary', 'report:attendance', 403],
    ['GET', '/expenses', 'expense:read_all', 200],
    ['GET', '/employees', 'employee:read', 200],
    ['GET', '/reports/employee-summary', 'employee:read', 200],
  ];
  for (const [m, p, label, expected] of blocked) {
    const r = await api(m, p, payToken);
    check(`${m} ${p} → ${expected} (${label})`, r.status === expected, r.status);
  }

  console.log('\n🔑 Employee token CANNOT access payroll management');
  const e1 = await api('GET', '/payroll/dashboard', empToken);
  check('employee GET /payroll/dashboard → 403', e1.status === 403, e1.status);
  const e2 = await api('GET', '/payroll/structures', empToken);
  check('employee GET /payroll/structures → 403', e2.status === 403, e2.status);
  const e3 = await api('GET', '/payroll/payslips', empToken);
  check('employee GET /payroll/payslips (list) → 403', e3.status === 403, e3.status);
  const e4 = await api('POST', '/payroll/runs/process', empToken, { payrollPeriodId: periodId ?? '00000000-0000-0000-0000-000000000000' });
  check('employee POST /payroll/runs/process → 403', e4.status === 403, e4.status);

  console.log('\n══════════════════════════════════════');
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log('══════════════════════════════════════');
  if (failed > 0) process.exitCode = 1;
}

main().catch((err) => { console.error(err); process.exit(1); });