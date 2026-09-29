import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL!, { prepare: false, max: 1 });
await sql.begin(async (tx) => {
  const users = (await tx`select id from users where email like 'e2e-%@example.test'`).map((r) => r.id);
  if (users.length === 0) { console.log('nothing to clean'); return; }
  const classes = (await tx`select id from classes where teacher_id = any(${users})`).map((r) => r.id);
  const del = async (label: string, q: any) => { const r = await q; console.log(label, r.count); };
  const sessions = (await tx`select id from game_sessions where created_by = any(${users}) or quiz_id in (select id from quizzes where owner_id = any(${users}) or class_id = any(${classes}))`).map((r) => r.id);
  await del('game_answers', tx`delete from game_answers where game_session_id = any(${sessions})`);
  await del('game_results', tx`delete from game_results where game_session_id = any(${sessions}) or user_id = any(${users})`);
  await del('game_players', tx`delete from game_players where game_session_id = any(${sessions}) or user_id = any(${users})`);
  await del('game_sessions', tx`delete from game_sessions where id = any(${sessions})`);
  await del('submissions', tx`delete from submissions where student_id = any(${users}) or assignment_id in (select id from assignments where class_id = any(${classes}))`);
  await del('assignments', tx`delete from assignments where class_id = any(${classes})`);
  await del('class_materials', tx`delete from class_materials where class_id = any(${classes}) or uploaded_by = any(${users})`);
  await del('quizzes', tx`delete from quizzes where owner_id = any(${users}) or class_id = any(${classes})`);
  await del('notes', tx`delete from notes where owner_id = any(${users}) or class_id = any(${classes}) or updated_by = any(${users})`);
  await del('notifications', tx`delete from notifications where user_id = any(${users})`);
  await del('point_transactions', tx`delete from point_transactions where user_id = any(${users})`);
  await del('user_inventory', tx`delete from user_inventory where user_id = any(${users})`);
  await del('daily_streaks', tx`delete from daily_streaks where user_id = any(${users})`);
  await del('class_members', tx`delete from class_members where student_id = any(${users}) or class_id = any(${classes})`);
  await del('class_co_teachers', tx`delete from class_co_teachers where teacher_id = any(${users}) or class_id = any(${classes})`);
  await del('classes', tx`delete from classes where id = any(${classes})`);
  await del('class_groups', tx`delete from class_groups where teacher_id = any(${users})`);
  await del('users', tx`delete from users where id = any(${users})`);
});
await sql.end();
