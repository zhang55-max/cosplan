// CosPlan Cloud Sync API
// 部署到 Cloudflare Workers + D1

const SESSION_TTL = 30 * 24 * 3600 * 1000; // 30 天

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}

function error(msg, status) {
  return json({ error: msg }, status || 400);
}

function generateToken() {
  var arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr, function(b) { return b.toString(16).padStart(2,'0'); }).join('');
}

async function hashPassword(password, salt) {
  var encoder = new TextEncoder();
  var data = encoder.encode(password + '::' + salt);
  var hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash), function(b) { return b.toString(16).padStart(2,'0'); }).join('');
}

function generateSalt() {
  var arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr, function(b) { return b.toString(16).padStart(2,'0'); }).join('');
}

async function authUser(db, token) {
  if (!token) return null;
  var stmt = db.prepare('SELECT user_id FROM sessions WHERE token = ? AND expires_at > ?');
  var result = await stmt.bind(token, Date.now()).first();
  if (!result) return null;
  return result.user_id;
}

// 注册
async function handleRegister(db, body) {
  var username = (body.username || '').trim();
  var password = body.password || '';
  if (!username || username.length > 20) return error('用户名无效', 400);
  if (!password || password.length < 4) return error('密码至少4位', 400);

  var existing = await db.prepare('SELECT id FROM users WHERE username = ?').bind(username).first();
  if (existing) return error('用户名已存在', 409);

  var id = Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
  var salt = generateSalt();
  var pwHash = await hashPassword(password, salt);
  var now = Date.now();

  await db.prepare('INSERT INTO users (id, username, password_hash, salt, nickname, avatar, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(id, username, pwHash, salt, username, '', now).run();

  var token = generateToken();
  await db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)')
    .bind(token, id, now + SESSION_TTL).run();

  return json({ token: token, user: { id: id, username: username, nickname: username, avatar: '' } });
}

// 登录
async function handleLogin(db, body) {
  var username = (body.username || '').trim();
  var password = body.password || '';
  if (!username || !password) return error('请输入用户名和密码', 400);

  var user = await db.prepare('SELECT * FROM users WHERE username = ?').bind(username).first();
  if (!user) return error('用户名或密码错误', 401);

  var hash = await hashPassword(password, user.salt);
  if (hash !== user.password_hash) return error('用户名或密码错误', 401);

  var token = generateToken();
  var now = Date.now();
  await db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)')
    .bind(token, user.id, now + SESSION_TTL).run();

  return json({
    token: token,
    user: { id: user.id, username: user.username, nickname: user.nickname || user.username, avatar: user.avatar || '' }
  });
}

// 上传数据
async function handleUpload(db, userId, body) {
  var data = body.data;
  if (!data) return error('缺少数据', 400);
  var jsonStr = JSON.stringify(data);
  var now = Date.now();
  var existing = await db.prepare('SELECT user_id FROM user_data WHERE user_id = ?').bind(userId).first();
  if (existing) {
    await db.prepare('UPDATE user_data SET data = ?, updated_at = ? WHERE user_id = ?').bind(jsonStr, now, userId).run();
  } else {
    await db.prepare('INSERT INTO user_data (user_id, data, updated_at) VALUES (?, ?, ?)').bind(userId, jsonStr, now).run();
  }
  return json({ success: true });
}

// 下载数据
async function handleDownload(db, userId) {
  var row = await db.prepare('SELECT data FROM user_data WHERE user_id = ?').bind(userId).first();
  if (!row) return json({ data: {} });
  return json({ data: JSON.parse(row.data) });
}

// 修改密码
async function handleChangePassword(db, userId, body) {
  var oldPw = body.oldPassword || '';
  var newPw = body.newPassword || '';
  if (!newPw || newPw.length < 4) return error('新密码至少4位', 400);

  var user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
  var hash = await hashPassword(oldPw, user.salt);
  if (hash !== user.password_hash) return error('原密码错误', 403);

  var newSalt = generateSalt();
  var newHash = await hashPassword(newPw, newSalt);
  await db.prepare('UPDATE users SET password_hash = ?, salt = ? WHERE id = ?').bind(newHash, newSalt, userId).run();
  return json({ success: true });
}

// 更新资料
async function handleUpdateProfile(db, userId, body) {
  if (body.nickname !== undefined) {
    await db.prepare('UPDATE users SET nickname = ? WHERE id = ?').bind(body.nickname.substring(0, 20), userId).run();
  }
  if (body.avatar !== undefined) {
    await db.prepare('UPDATE users SET avatar = ? WHERE id = ?').bind(body.avatar, userId).run();
  }
  return json({ success: true });
}

// 主入口
export default {
  async fetch(request, env) {
    var url = new URL(request.url);
    var path = url.pathname;
    var method = request.method;

    // CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, {
        headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' }
      });
    }

    var db = env.DB;
    var body = {};
    if (method === 'POST') {
      try { body = await request.json(); } catch(e) {}
    }
    var token = body.token || url.searchParams.get('token') || '';

    // 路由
    if (path === '/api/register' && method === 'POST') {
      return handleRegister(db, body);
    }
    if (path === '/api/login' && method === 'POST') {
      return handleLogin(db, body);
    }

    // 需要认证的路由
    var userId = await authUser(db, token);
    if (!userId) return error('未登录或登录已过期', 401);

    if (path === '/api/sync/upload' && method === 'POST') {
      return handleUpload(db, userId, body);
    }
    if (path === '/api/sync/download' && method === 'GET') {
      return handleDownload(db, userId);
    }
    if (path === '/api/password' && method === 'POST') {
      return handleChangePassword(db, userId, body);
    }
    if (path === '/api/profile' && method === 'POST') {
      return handleUpdateProfile(db, userId, body);
    }

    return error('Not Found', 404);
  }
};
