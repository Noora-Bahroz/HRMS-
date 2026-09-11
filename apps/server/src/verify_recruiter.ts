import http from 'http';

const BASE = 'http://localhost:4000/api/v1';
const REC_EMAIL = 'recruiter@hrms.local';
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
  const recLogin = await api('POST', '/auth/login', undefined, { email: REC_EMAIL, password: PASS });
  check('recruiter login 200', recLogin.status === 200, recLogin.status);
  const recToken = recLogin.data?.data?.accessToken;
  check('recruiter has accessToken', !!recToken);

  const empLogin = await api('POST', '/auth/login', undefined, { email: EMP_EMAIL, password: PASS });
  check('employee login 200', empLogin.status === 200, empLogin.status);
  const empToken = empLogin.data?.data?.accessToken;
  check('employee has accessToken', !!empToken);

  console.log('\n🎯 /auth/me → scope + permissions');
  const meRes = await api('GET', '/auth/me', recToken);
  const me = meRes.data?.data;
  check('recruiter /auth/me 200', meRes.status === 200, meRes.status);
  check('recruiter scope = "all"', me?.scope === 'all', me?.scope);
  const perms = (me?.permissions ?? []) as string[];
  check('recruiter has ats:manage_requisition', perms.includes('ats:manage_requisition'));
  check('recruiter has ats:manage_candidate', perms.includes('ats:manage_candidate'));
  check('recruiter has ats:interview', perms.includes('ats:interview'));
  check('recruiter has ats:offer', perms.includes('ats:offer'));
  check('recruiter has ats:convert_employee', perms.includes('ats:convert_employee'));
  check('recruiter DOES NOT have payroll:read_all', !perms.includes('payroll:read_all'));
  check('recruiter DOES NOT have user:manage', !perms.includes('user:manage'));
  check('recruiter DOES NOT have role:manage', !perms.includes('role:manage'));
  check('recruiter DOES NOT have settings:system', !perms.includes('settings:system'));
  check('recruiter DOES NOT have employee:update', !perms.includes('employee:update'));
  check('recruiter DOES NOT have expense:approve', !perms.includes('expense:approve'));
  check('recruiter DOES NOT have report:payroll', !perms.includes('report:payroll'));

  console.log('\n📊 /recruitment/stats — recruiter dashboard data');
  const statsRes = await api('GET', '/recruitment/stats', recToken);
  const stats = statsRes.data?.data;
  check('GET /recruitment/stats 200', statsRes.status === 200, statsRes.status);
  check('stats has requisitions {total, open}', typeof stats?.requisitions?.total === 'number', stats?.requisitions);
  check('stats has postings count', typeof stats?.postings === 'number');
  check('stats has candidates count', typeof stats?.candidates === 'number', stats?.candidates);
  check('stats has applications.byStatus', typeof stats?.applications?.byStatus === 'object');
  check('stats has interviews.upcoming + pendingFeedback', Array.isArray(stats?.interviews?.upcoming) && typeof stats?.interviews?.pendingFeedback === 'number');
  check('stats has offers {total, accepted} + hired + conversionRate', typeof stats?.offers?.total === 'number' && typeof stats?.hired === 'number' && typeof stats?.conversionRate === 'number');

  console.log('\n📈 /recruitment/reports');
  const repRes = await api('GET', '/recruitment/reports', recToken);
  const rep = repRes.data?.data;
  check('GET /recruitment/reports 200', repRes.status === 200, repRes.status);
  check('reports has applicationsByStatus', typeof rep?.applicationsByStatus === 'object');
  check('reports has avgDaysToHire', typeof rep?.avgDaysToHire === 'number');
  check('reports has requisitionStats array', Array.isArray(rep?.requisitionStats));

  console.log('\n📋 Requisitions');
  const reqsRes = await api('GET', '/recruitment/requisitions', recToken);
  const reqs = reqsRes.data?.data;
  check('GET /recruitment/requisitions 200', reqsRes.status === 200, reqsRes.status);
  check('requisitions > 0', Array.isArray(reqs) && reqs.length > 0, reqs?.length);

  console.log('\n📄 Postings');
  const postsRes = await api('GET', '/recruitment/postings', recToken);
  const posts = postsRes.data?.data;
  check('GET /recruitment/postings 200', postsRes.status === 200, postsRes.status);
  check('postings > 0', Array.isArray(posts) && posts.length > 0, posts?.length);

  console.log('\n👥 Candidates');
  const candRes = await api('GET', '/recruitment/candidates', recToken);
  const cands = candRes.data?.data;
  check('GET /recruitment/candidates 200', candRes.status === 200, candRes.status);
  check('candidates > 0', Array.isArray(cands) && cands.length > 0, cands?.length);
  const candDetail = await api('GET', `/recruitment/candidates/${cands[0].id}`, recToken);
  check('GET /recruitment/candidates/:id 200', candDetail.status === 200, candDetail.status);

  console.log('\n🔀 Applications / Pipeline');
  const appsRes = await api('GET', '/recruitment/applications', recToken);
  const apps = appsRes.data?.data;
  check('GET /recruitment/applications 200', appsRes.status === 200, appsRes.status);
  check('applications > 0', Array.isArray(apps) && apps.length > 0, apps?.length);
  const appliedApp = apps?.find((a: any) => a.status === 'applied' || a.status === 'screening');
  if (appliedApp) {
    const nextStage = appliedApp.status === 'applied' ? 'screening' : 'interview';
    const moveRes = await api('PATCH', `/recruitment/applications/${appliedApp.id}/move`, recToken, { status: nextStage, stage: appliedApp.stage + 1 });
    check(`PATCH /recruitment/applications/:id/move → ${nextStage}`, moveRes.status === 200, moveRes.status);
    check('moved status persisted', moveRes.data?.data?.status === nextStage, moveRes.data?.data?.status);
  }

  console.log('\n📅 Interviews');
  const intRes = await api('GET', '/recruitment/interviews', recToken);
  const ints = intRes.data?.data;
  check('GET /recruitment/interviews 200', intRes.status === 200, intRes.status);
  const interviewWithoutFeedback = ints?.find((i: any) => (i.feedback ?? []).length === 0);
  if (interviewWithoutFeedback) {
    const fbRes = await api('POST', '/recruitment/feedback', recToken, {
      interviewId: interviewWithoutFeedback.id,
      rating: 4,
      comment: 'Recommended (verify)',
      status: 'recommended',
    });
    check('POST /recruitment/feedback 201', fbRes.status === 201, fbRes.status);
  }

  console.log('\n🎁 Offers');
  const offRes = await api('GET', '/recruitment/offers', recToken);
  const offs = offRes.data?.data;
  check('GET /recruitment/offers 200', offRes.status === 200, offRes.status);
  check('offers > 0', Array.isArray(offs) && offs.length > 0, offs?.length);
  const pendingOffer = offs?.find((o: any) => o.status === 'pending');
  if (pendingOffer) {
    const accRes = await api('PATCH', `/recruitment/offers/${pendingOffer.id}`, recToken, { status: 'accepted' });
    check('PATCH /recruitment/offers/:id → accepted', accRes.status === 200, accRes.status);
    const convRes = await api('POST', `/recruitment/offers/${pendingOffer.id}/convert`, recToken, {});
    check('POST /recruitment/offers/:id/convert 201', convRes.status === 201, convRes.status);
  }

  console.log('\n✏️  Write operations (recruiter can)');
  const createReq = await api('POST', '/recruitment/requisitions', recToken, { title: 'Verification New Role', openings: 1 });
  check('POST /recruitment/requisitions 201', createReq.status === 201, createReq.status);
  const newReqId = createReq.data?.data?.id;
  if (newReqId) {
    const patchReq = await api('PATCH', `/recruitment/requisitions/${newReqId}`, recToken, { status: 'open' });
    check('PATCH /recruitment/requisitions 200', patchReq.status === 200, patchReq.status);
  }
  const createCand = await api('POST', '/recruitment/candidates', recToken, { firstName: 'Verify', lastName: 'Recruiter', email: `verifycat_${Date.now()}@example.com`, phone: '+1-000' });
  check('POST /recruitment/candidates 201', createCand.status === 201, createCand.status);

  console.log('\n🚫 403 matrix — recruiter must NOT access non-ATS/admin');
  const blocked: Array<[string, string, string, number]> = [
    ['GET', '/users', 'user:manage', 403],
    ['GET', '/roles', 'role:manage', 403],
    ['GET', '/payroll/structures', 'payroll:read_all', 403],
    ['GET', '/payroll/runs', 'payroll:read_all', 403],
    ['GET', '/expenses', 'expense:read_all', 403],
    ['GET', '/reports/hr-summary', 'report:headcount', 403],
    ['GET', '/reports/company-summary', 'report:headcount', 403],
    ['GET', '/employees', 'employee:read (allowed for recruiter)', 200],
  ];
  for (const [m, p, label, expected] of blocked) {
    const r = await api(m, p, recToken);
    check(`${m} ${p} → ${expected} (${label})`, r.status === expected, r.status);
  }

  console.log('\n🔑 Employee token CANNOT access ATS');
  const empAts = await api('GET', '/recruitment/stats', empToken);
  check('employee GET /recruitment/stats → 403', empAts.status === 403, empAts.status);
  const empAts2 = await api('GET', '/recruitment/candidates', empToken);
  check('employee GET /recruitment/candidates → 403', empAts2.status === 403, empAts2.status);

  console.log('\n══════════════════════════════════════');
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log('══════════════════════════════════════');
  if (failed > 0) process.exitCode = 1;
}

main().catch((err) => { console.error(err); process.exit(1); });