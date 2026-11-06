// GrammarFirst cloud: login per E-Mail-Link, Fortschritt synchronisieren, anonyme Nutzungsstatistik (Supabase, Region Zürich).
const API = "https://bedhhkrzgsewficmdkhq.supabase.co";
const KEY = "sb_publishable_jKbS6t0cRoTXBc-SCU9uCA_P0KW0vFi";
const SESS = "grammarfirst-session", ANON = "grammarfirst-anon";

const ls = { get: k => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }, del: k => { try { localStorage.removeItem(k); } catch (e) { } } };
const online = () => { try { if (/[?&]debug/.test(location.search)) return false; return location.protocol === "https:" || /localhost|127\.0\.0\.1/.test(location.hostname); } catch (e) { return false; } };

export const session = () => ls.get(SESS);

// Called on start: the e-mail link returns to /grammarfirst/#access_token=...&refresh_token=...
export function captureLogin() {
  try {
    const h = location.hash || "";
    if (!/access_token=/.test(h)) return false;
    const p = new URLSearchParams(h.slice(1));
    const s = { access_token: p.get("access_token"), refresh_token: p.get("refresh_token"), expires_at: Date.now() + (+p.get("expires_in") || 3600) * 1000 };
    if (s.access_token && s.refresh_token) ls.set(SESS, s);
    history.replaceState(null, "", location.pathname + location.search);
    return !!s.access_token;
  } catch (e) { return false; }
}

async function token() {
  let s = session(); if (!s) return null;
  if (Date.now() > s.expires_at - 60000) {
    const r = await fetch(API + "/auth/v1/token?grant_type=refresh_token", { method: "POST", headers: { apikey: KEY, "Content-Type": "application/json" }, body: JSON.stringify({ refresh_token: s.refresh_token }) });
    if (!r.ok) { ls.del(SESS); return null; }
    const j = await r.json(); s = { access_token: j.access_token, refresh_token: j.refresh_token, expires_at: Date.now() + (j.expires_in || 3600) * 1000, email: j.user && j.user.email, id: j.user && j.user.id };
    ls.set(SESS, s);
  }
  return s.access_token;
}

export async function sendLink(email) {
  const back = location.origin + "/grammarfirst/";
  const r = await fetch(API + "/auth/v1/otp?redirect_to=" + encodeURIComponent(back), { method: "POST", headers: { apikey: KEY, "Content-Type": "application/json" }, body: JSON.stringify({ email, create_user: true }) });
  if (r.ok) return { ok: true };
  let code = ""; try { const j = await r.json(); code = j.error_code || j.code || j.msg || ""; } catch (e) { }
  return { ok: false, code: String(code), status: r.status };
}

export async function me() {
  const t = await token(); if (!t) return null;
  const r = await fetch(API + "/auth/v1/user", { headers: { apikey: KEY, Authorization: "Bearer " + t } });
  if (!r.ok) return null;
  const u = await r.json(); const s = session(); if (s) ls.set(SESS, { ...s, email: u.email, id: u.id });
  return { id: u.id, email: u.email };
}

export async function pull(uid) {
  const t = await token(); if (!t) return null;
  const r = await fetch(API + "/rest/v1/gf_progress?select=state,updated_at&user_id=eq." + uid, { headers: { apikey: KEY, Authorization: "Bearer " + t } });
  if (!r.ok) return null; const rows = await r.json(); return rows[0] || null;
}

export async function push(uid, state) {
  const t = await token(); if (!t) return false;
  const r = await fetch(API + "/rest/v1/gf_progress?on_conflict=user_id", { method: "POST", headers: { apikey: KEY, Authorization: "Bearer " + t, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ user_id: uid, state, updated_at: new Date().toISOString() }) });
  return r.ok;
}

export async function wipe(uid) {
  const t = await token(); if (!t) return false;
  const r = await fetch(API + "/rest/v1/gf_progress?user_id=eq." + uid, { method: "DELETE", headers: { apikey: KEY, Authorization: "Bearer " + t } });
  return r.ok;
}

// E-Mail-Liste für neue Lektionen und Kurse
export async function joinList(email, d = {}) {
  try {
    const r = await fetch(API + "/rest/v1/gf_waitlist", { method: "POST", headers: { apikey: KEY, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify({ email: String(email).trim().toLowerCase(), course: d.course || null, lang: d.lang || null, source: d.source || "app" }) });
    return { ok: r.ok || r.status === 409, status: r.status };
  } catch (e) { return { ok: false, status: 0 }; }
}

export async function logout() {
  const t = await token(); ls.del(SESS);
  if (t) { try { await fetch(API + "/auth/v1/logout", { method: "POST", headers: { apikey: KEY, Authorization: "Bearer " + t } }); } catch (e) { } }
}

// Anonymous usage statistics: a random id, no cookies, no personal data. Can be switched off in the settings.
const anonId = () => { let a = ls.get(ANON); if (!a) { a = Math.random().toString(36).slice(2) + Date.now().toString(36); ls.set(ANON, a); } return a; };
export function track(event, d = {}, enabled = true) {
  if (!enabled || !online()) return;
  try {
    fetch(API + "/rest/v1/gf_events", { method: "POST", keepalive: true, headers: { apikey: KEY, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify({ anon_id: anonId(), event, course: d.course || null, lesson: d.lesson || null, value: d.value == null ? null : Math.round(d.value), ui: d.ui || null }) }).catch(() => { });
  } catch (e) { }
}
