// End-to-end API test against a running server (default: `bun run start -p 3460`).
// Creates throwaway `e2e-*@example.test` users; scripts/e2e-cleanup.ts removes them.
//   E2E_BASE=http://localhost:3460 bun --env-file=.env.local run scripts/e2e.ts
const BASE = `${process.env.E2E_BASE ?? 'http://localhost:3460'}/api`;
const stamp = Date.now();
const results: { name: string; ok: boolean; info?: string }[] = [];
function check(name: string, ok: boolean, info?: unknown) {
  results.push({ name, ok, info: ok ? undefined : JSON.stringify(info)?.slice(0, 200) });
  if (process.env.E2E_VERBOSE) console.log(ok ? 'ok  ' : 'FAIL', name);
}
async function call(token: string | null, method: string, path: string, body?: unknown, form?: FormData) {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';
  const res = await fetch(BASE + path, { method, headers, body: form ?? (body ? JSON.stringify(body) : undefined) });
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('json') ? await res.json().catch(() => null) : null;
  return { status: res.status, data, res };
}
const out: Record<string, unknown> = {};

// --- auth
const emailA = `e2e-a-${stamp}@example.test`, emailB = `e2e-b-${stamp}@example.test`;
let r = await call(null, 'POST', '/auth/signup', { name: 'E2E Admin', email: emailA, password: 'secret12' });
check('signup A (no role)', r.status === 201 || r.status === 200, r);
const tokA = r.data?.token; const userA = r.data?.user;
r = await call(null, 'POST', '/auth/signup', { name: 'E2E Member', email: emailB, password: 'secret12' });
check('signup B', r.status < 300, r);
const tokB = r.data?.token; const userB = r.data?.user;
r = await call(null, 'POST', '/auth/signup', { name: 'dup', email: emailA, password: 'secret12' });
check('duplicate email rejected (409)', r.status === 409, r);
r = await call(null, 'POST', '/auth/login', { email: emailA, password: 'wrong-pass' });
check('wrong password rejected', r.status === 401, r);
r = await call(null, 'POST', '/auth/login', { email: emailA, password: 'secret12' });
check('login', r.status === 200 && !!r.data?.token, r);
r = await call(tokA, 'GET', '/auth/me'); check('me', r.status === 200 && r.data?.email === emailA, r);
r = await call(null, 'GET', '/auth/me'); check('me without token = 401', r.status === 401, r);

// --- personal notes
r = await call(tokA, 'POST', '/me/notes', { title: 'Personal note' });
check('create personal note', r.status === 201, r); const pn = r.data;
const content = 'Мицохондри бол эсийн эрчим хүчний үүсгүүр юм. Хлоропласт нь фотосинтез явуулдаг эсийн хэсэг юм. Рибосом нь уураг нийлэгжүүлдэг эсийн бүтэц юм. Цөм нь удамшлын мэдээллийг хадгалдаг эсийн төв юм. Голжи бие нь уургийг боловсруулж савладаг эсийн бүтэц юм.';
r = await call(tokA, 'PATCH', `/notes/${pn?.id}`, { content, baseUpdatedAt: pn?.updatedAt });
check('edit personal note', r.status === 200 && r.data?.content === content, r);
r = await call(tokB, 'GET', `/notes/${pn?.id}`); check('personal note hidden from others (404)', r.status === 404, r);
r = await call(tokA, 'GET', '/me/notes'); check('list personal notes', r.status === 200 && r.data?.length === 1, r);
r = await call(tokB, 'GET', '/me/notes'); check('B has no personal notes', r.status === 200 && r.data?.length === 0, r);
r = await call(tokA, 'POST', '/me/notes', { title: '  ' }); check('empty title rejected', r.status === 400, r);

// --- attachments
const fd = new FormData(); fd.append('file', new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0])], 'тест.png', { type: 'image/png' }));
r = await call(tokA, 'POST', `/notes/${pn?.id}/attachments`, undefined, fd);
check('upload attachment', r.status === 201, r); const att = r.data;
const fake = new FormData(); fake.append('file', new File([new Uint8Array([1, 2, 3, 4, 5])], 'fake.png', { type: 'image/png' }));
r = await call(tokA, 'POST', `/notes/${pn?.id}/attachments`, undefined, fake); check('fake png (bad signature) rejected (415)', r.status === 415, r.status);
const bad = new FormData(); bad.append('file', new File(['x'], 'a.exe', { type: 'application/x-msdownload' }));
r = await call(tokA, 'POST', `/notes/${pn?.id}/attachments`, undefined, bad); check('bad file type rejected (415)', r.status === 415, r);
const bigPng = new Uint8Array(3 * 1024 * 1024 + 8);
bigPng.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const big = new FormData(); big.append('file', new File([bigPng], 'big.png', { type: 'image/png' }));
r = await call(tokA, 'POST', `/notes/${pn?.id}/attachments`, undefined, big); check('too-large file rejected (413)', r.status === 413, r.status);
r = await call(tokA, 'GET', `/notes/${pn?.id}/attachments`); check('list attachments', r.data?.length === 1, r);
r = await call(tokA, 'GET', `/note-attachments/${att?.id}`); check('download attachment', r.status === 200, r.status);
r = await call(tokB, 'GET', `/note-attachments/${att?.id}`); check('attachment hidden from others', r.status === 404, r.status);
r = await call(tokA, 'DELETE', `/note-attachments/${att?.id}`); check('delete attachment', r.status === 200, r);

// --- quiz generation
r = await call(tokA, 'POST', `/notes/${pn?.id}/generate-quiz`, { count: 3, mode: 'rule-based' });
check('rule-based quiz', r.status === 201 && r.data?.questions?.length >= 1, r); const quiz = r.data;
r = await call(tokA, 'POST', `/notes/${pn?.id}/generate-quiz`, { count: 3, mode: 'ai' });
check('AI quiz (Gemini) works or fails cleanly', r.status === 201 || [501, 502].includes(r.status), r);
out.aiStatus = r.status; out.aiMsg = r.data?.error;
const empty = (await call(tokA, 'POST', '/me/notes', { title: 'short' })).data;
r = await call(tokA, 'POST', `/notes/${empty?.id}/generate-quiz`, { count: 3 }); check('quiz from empty note gives clear 400', r.status === 400, r);
r = await call(tokA, 'GET', '/me/quizzes'); check('list my quizzes', r.status === 200 && r.data?.length >= 1, r);
r = await call(tokB, 'GET', `/quizzes/${quiz?.id}`); check('personal quiz hidden from others', r.status === 404, r);

// --- group (class)
r = await call(tokA, 'POST', '/classes', { name: 'E2E Group' }); check('any user creates group', r.status === 201, r); const klass = r.data;
r = await call(tokB, 'POST', '/classes/join', { code: 'ZZZZZ' }); check('bad join code 404', r.status === 404, r);
r = await call(tokB, 'POST', '/classes/join', { code: klass?.code.toLowerCase() }); check('join by code (case-insens.)', r.status === 200, r);
r = await call(tokA, 'POST', '/classes/join', { code: klass?.code }); check('owner joining own group rejected', r.status === 400, r);
r = await call(tokB, 'GET', '/me/classes'); check('B sees joined group', r.data?.some((c: any) => c.id === klass?.id), r);
r = await call(tokA, 'GET', '/me/classes'); check('A sees own group', r.data?.some((c: any) => c.id === klass?.id), r);
r = await call(tokB, 'GET', `/classes/${klass?.id}`); check('member gets canManage=false', r.data?.canManage === false, r.data);
r = await call(tokA, 'GET', `/classes/${klass?.id}`); check('owner gets canManage=true', r.data?.canManage === true, r.data);
r = await call(tokA, 'GET', `/classes/${klass?.id}/people`); check('people list', r.status === 200, r);
r = await call(tokB, 'PATCH', `/classes/${klass?.id}`, { name: 'hack' }); check('member cannot edit group (403)', r.status === 403, r);
r = await call(tokA, 'PATCH', `/classes/${klass?.id}`, { name: 'E2E Group v2' }); check('owner edits group', r.status === 200, r);

// group notes + quiz + assignment + submit + grade
r = await call(tokB, 'POST', `/classes/${klass?.id}/notes`, { title: 'Shared' }); check('member creates shared note', r.status === 201, r); const sn = r.data;
r = await call(tokA, 'PATCH', `/notes/${sn?.id}`, { content }); check('admin edits shared note', r.status === 200, r);
r = await call(tokB, 'PATCH', `/notes/${sn?.id}`, { content: content + ' Өөр өгүүлбэр байна энэ бол.', baseUpdatedAt: sn?.updatedAt });
check('stale edit -> 409 conflict with latest', r.status === 409 && !!r.data?.latest, r);
r = await call(tokA, 'POST', `/notes/${sn?.id}/generate-quiz`, { count: 3 }); check('quiz from shared note', r.status === 201, r); const gq = r.data;
const fa = new FormData(); fa.append('title', 'HW1'); fa.append('quizId', gq?.id);
r = await call(tokA, 'POST', `/classes/${klass?.id}/assignments`, undefined, fa); check('admin creates assignment', r.status === 201, r); const asg = r.data;
const fp = new FormData(); fp.append('title', 'bad'); fp.append('quizId', quiz?.id);
r = await call(tokA, 'POST', `/classes/${klass?.id}/assignments`, undefined, fp); check('personal quiz cannot be assigned (400)', r.status === 400, r);
const fm = new FormData(); fm.append('title', 'X');
r = await call(tokB, 'POST', `/classes/${klass?.id}/assignments`, undefined, fm); check('member cannot create assignment (403)', r.status === 403, r);
r = await call(tokB, 'GET', '/notifications'); check('member got new-assignment notification', r.data?.items?.some((n: any) => /HW1/.test(n.title)) && r.data.unread >= 1, r.data);
r = await call(tokA, 'GET', '/notifications'); check('admin got join notification', r.data?.items?.some((n: any) => /нэгдлээ/.test(n.title)), r.data);
r = await call(tokB, 'POST', '/notifications/read'); r = await call(tokB, 'GET', '/notifications'); check('mark notifications read', r.data?.unread === 0, r.data);
r = await call(tokA, 'POST', `/assignments/${asg?.id}/submit`, { answers: [] }); check('admin cannot submit (403)', r.status === 403, r);
r = await call(tokB, 'POST', `/assignments/${asg?.id}/submit`, { answers: gq?.questions.map((q: any) => q.correctIndex) });
check('member submits, score 100', r.status === 201 && r.data?.score === 100, r);
r = await call(tokB, 'POST', `/assignments/${asg?.id}/submit`, { answers: [] }); check('double submit -> 409', r.status === 409, r);
r = await call(tokA, 'GET', `/assignments/${asg?.id}/submissions`); check('admin sees submissions', r.status === 200 && r.data?.length === 1, r); const sub = r.data?.[0];
r = await call(tokB, 'GET', `/assignments/${asg?.id}/submissions`); check('member cannot see all submissions', r.status === 403 || r.status === 404, r.status);
r = await call(tokA, 'PATCH', `/submissions/${sub?.id}`, { score: 90 }); check('admin grades', r.status === 200, r);
r = await call(tokB, 'GET', `/me/quizzes`); check('member sees group quiz', r.data?.some((q: any) => q.id === gq?.id), r);
// material
const fmat = new FormData(); fmat.append('file', new File(['hello'], 'a.txt', { type: 'text/plain;charset=utf-8' }));
r = await call(tokA, 'POST', `/classes/${klass?.id}/materials`, undefined, fmat); check('admin uploads material', r.status === 201, r); const mat = r.data;
r = await call(tokB, 'GET', `/materials/${mat?.id}`); check('member downloads material', r.status === 200, r.status);
r = await call(tokB, 'DELETE', `/materials/${mat?.id}`); check('member cannot delete material (403)', r.status === 403, r.status);

// --- live game
r = await call(tokA, 'POST', '/games', { quizId: gq?.id }); check('host creates game', r.status === 201, r); const game = r.data;
r = await call(tokB, 'GET', `/games/code/${game?.code}`); check('lookup by code', r.status === 200, r);
r = await call(tokB, 'POST', `/games/${game?.id}/join`); check('join game', r.status < 300, r);
r = await call(tokB, 'POST', `/games/${game?.id}/start`); check('non-host cannot start (403)', r.status === 403, r);
r = await call(tokA, 'POST', `/games/${game?.id}/start`); check('host starts', r.status < 300, r);
r = await call(tokB, 'POST', `/games/${game?.id}/answer`, { optionIndex: gq?.questions[0].correctIndex }); check('answer', r.status < 300, r);
r = await call(tokB, 'POST', `/games/${game?.id}/answer`, { optionIndex: 0 }); check('second answer rejected', r.status >= 400, r);
const total = gq?.questions.length ?? 1;
for (let q = 0; q < total; q++) {
  if (q > 0) { r = await call(tokB, 'POST', `/games/${game?.id}/answer`, { optionIndex: gq.questions[q].correctIndex }); }
  r = await call(tokA, 'POST', `/games/${game?.id}/reveal`); check(`reveal q${q + 1}`, r.status < 300, r);
  r = await call(tokA, 'POST', `/games/${game?.id}/next`); check(`next after q${q + 1}`, r.status < 300, r);
}
r = await call(tokB, 'GET', `/games/${game?.id}/state`); check('game state final = finished', r.status === 200 && r.data?.status === 'finished', r.data?.status);
r = await call(tokB, 'GET', '/points/balance'); check('placement points paid to player', (r.data?.balance ?? 0) > 0, r.data);

// --- points / shop / streak
r = await call(tokB, 'GET', '/points/balance'); check('balance', r.status === 200, r); out.bal = r.data;
r = await call(tokB, 'GET', '/points/history'); check('history', r.status === 200, r);
r = await call(tokB, 'POST', '/streak/claim'); check('streak claim', r.status < 300, r); out.streak = r.data;
r = await call(tokB, 'POST', '/streak/claim'); check('second claim same day rejected', r.status >= 400, r);
r = await call(tokB, 'GET', '/shop/items'); check('shop items', r.status === 200 && r.data?.items?.length > 0, r); const items = r.data?.items;
out.shopItems = items?.length;
if (items?.length) { r = await call(tokB, 'POST', '/shop/purchase', { itemId: items[0].id }); out.purchase = { status: r.status, err: r.data?.error }; check('purchase clean response (ok or clear error)', r.status < 300 || (r.status === 400 && !!r.data?.error), r); }
r = await call(tokB, 'GET', '/inventory'); check('inventory', r.status === 200, r);
r = await call(tokB, 'PATCH', '/me/avatar', { style: 'x' }); out.avatarStatus = r.status;


// --- co-admin
r = await call(tokA, 'PATCH', `/classes/${klass?.id}/members/${userB?.id}`, { admin: true }); check('owner makes member co-admin', r.status === 200, r);
r = await call(tokB, 'GET', `/classes/${klass?.id}`); check('co-admin gets canManage', r.data?.canManage === true, r.data);
r = await call(tokA, 'GET', `/classes/${klass?.id}/people`); check('people lists co-admin', r.data?.teachers?.length === 2 && r.data?.students?.length === 0, r.data);
r = await call(tokB, 'PATCH', `/classes/${klass?.id}/members/${userA?.id}`, { admin: false }); check('co-admin cannot change owner (403)', r.status === 403, r);
r = await call(tokB, 'DELETE', `/classes/${klass?.id}`); check('co-admin cannot delete group (403)', r.status === 403, r);
r = await call(tokA, 'PATCH', `/classes/${klass?.id}/members/${userB?.id}`, { admin: false }); check('owner revokes co-admin', r.status === 200, r);
r = await call(tokB, 'GET', `/classes/${klass?.id}`); check('revoked member loses canManage but stays member', r.status === 200 && r.data?.canManage === false, r.data);

// --- profile & account
r = await call(tokB, 'PATCH', '/me/profile', { name: '  Renamed  ' }); check('rename profile', r.status === 200 && r.data?.name === 'Renamed', r);
r = await call(tokB, 'PATCH', '/me/profile', { name: '' }); check('empty name rejected', r.status === 400, r);
r = await call(tokB, 'POST', '/me/password', { currentPassword: 'wrong', newPassword: 'newsecret1' }); check('password change needs current password', r.status === 400, r);
r = await call(tokB, 'POST', '/me/password', { currentPassword: 'secret12', newPassword: 'newsecret1' }); check('change password', r.status === 200, r);
r = await call(null, 'POST', '/auth/login', { email: emailB, password: 'newsecret1' }); check('login with new password', r.status === 200, r);

// --- deletion / leave / robustness
r = await call(tokA, 'GET', '/notes/not-a-uuid'); check('malformed id -> 404 (not 500)', r.status === 404, r.status);
r = await call(tokA, 'GET', '/materials/undefined'); check('malformed material id -> 404', r.status === 404, r.status);
r = await call(tokB, 'DELETE', `/quizzes/${gq?.id}`); check('member cannot delete group quiz (403)', r.status === 403, r);
r = await call(tokA, 'DELETE', `/quizzes/${gq?.id}`); check('quiz used by assignment -> 409', r.status === 409, r);
r = await call(tokA, 'DELETE', `/assignments/${asg?.id}`); check('admin deletes assignment (+submissions)', r.status === 200, r);
r = await call(tokB, 'DELETE', `/assignments/${asg?.id}`); check('deleted assignment -> 404', r.status === 404, r);
r = await call(tokA, 'DELETE', `/quizzes/${gq?.id}`); check('admin deletes group quiz (+games)', r.status === 200, r);
r = await call(tokA, 'DELETE', `/quizzes/${quiz?.id}`); check('owner deletes personal quiz', r.status === 200, r);
r = await call(tokA, 'GET', `/quizzes/${quiz?.id}`); check('deleted quiz gone', r.status === 404, r);
const q2 = (await call(tokA, 'POST', `/notes/${pn?.id}/generate-quiz`, { count: 2 })).data;
r = await call(tokA, 'DELETE', `/notes/${pn?.id}`); check('owner deletes personal note', r.status === 200, r);
r = await call(tokA, 'GET', `/quizzes/${q2?.id}`); check('quiz survives note deletion (sourceNoteId null)', r.status === 200 && r.data?.sourceNoteId === null, r.data);
r = await call(tokB, 'DELETE', `/notes/${sn?.id}`); check('member deletes shared note', r.status === 200, r);
r = await call(tokA, 'DELETE', `/classes/${klass?.id}/membership`); check('owner cannot leave (400)', r.status === 400, r);
r = await call(tokB, 'DELETE', `/classes/${klass?.id}`); check('member cannot delete group (403)', r.status === 403, r);
r = await call(tokB, 'DELETE', `/classes/${klass?.id}/membership`); check('member leaves group', r.status === 200, r);
r = await call(tokB, 'GET', `/classes/${klass?.id}`); check('left member loses access (404)', r.status === 404, r);
r = await call(tokB, 'POST', '/classes/join', { code: klass?.code }); check('can rejoin after leaving', r.status === 200, r);
r = await call(tokA, 'DELETE', `/classes/${klass?.id}`); check('owner deletes group (cascade)', r.status === 200, r);
r = await call(tokA, 'GET', `/classes/${klass?.id}`); check('deleted group -> 404', r.status === 404, r);
r = await call(tokB, 'GET', '/me/classes'); check('deleted group gone from member list', !r.data?.some((c: any) => c.id === klass?.id), r);


// --- delete account (B) after everything else
r = await call(tokB, 'DELETE', '/me', { password: 'nope' }); check('account delete needs correct password', r.status === 400, r);
r = await call(tokB, 'DELETE', '/me', { password: 'newsecret1' }); check('delete account', r.status === 200, r);
r = await call(tokB, 'GET', '/auth/me'); check('deleted account token no longer works', r.status === 401, r.status);

// --- rate limit: hammer login with a wrong password
let limited = false;
for (let i = 0; i < 14 && !limited; i++) limited = (await call(null, 'POST', '/auth/login', { email: `nobody-${stamp}@example.test`, password: 'x' })).status === 429;
check('login is rate limited (429)', limited);

console.log(JSON.stringify({ users: [userA?.id, userB?.id], klass: klass?.id, out }, null, 0));
const fails = results.filter((x) => !x.ok);
console.log(`PASS ${results.length - fails.length}/${results.length}`);
for (const f of fails) console.log('FAIL', f.name, f.info);
