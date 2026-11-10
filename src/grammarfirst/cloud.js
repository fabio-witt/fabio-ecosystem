import { createClient } from "@supabase/supabase-js";
import { url, key } from "./lingora-config.js";

// Keep existing website analytics and the waitlist on their original project.
const API = "https://bedhhkrzgsewficmdkhq.supabase.co";
const KEY = "sb_publishable_jKbS6t0cRoTXBc-SCU9uCA_P0KW0vFi";
const ANON = "grammarfirst-anon";

const ls = {
  get: k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { } },
};
const online = () => !/[?&]debug/.test(location.search)
  && (location.protocol === "https:" || ["localhost", "127.0.0.1"].includes(location.hostname));

export const client = createClient(url, key, { auth: { detectSessionInUrl: false } });
export const signIn = (email, password) => client.auth.signInWithPassword({ email, password });
export const logout = () => client.auth.signOut({ scope: "local" });
const zone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
const pendingKey = uid => "grammarfirst-pending." + uid;

async function ownSession(uid) {
  const { data } = await client.auth.getSession();
  if (data.session?.user.id !== uid) throw new Error("Please sign in again.");
}

export function queueCompletion(uid, id, score) {
  const pending = ls.get(pendingKey(uid)) || {};
  pending[id] = { score: Math.max(score, pending[id]?.score ?? 0), date: Date.now() };
  ls.set(pendingKey(uid), pending);
}

export async function importScores(uid, scores) {
  await ownSession(uid);
  const { data, error } = await client.rpc("import_learn_progress", { p_scores: scores });
  if (error) throw error;
  return data;
}

async function readProgress(uid) {
  const rows = [];
  const size = 500;
  for (let start = 0; ; start += size) {
    const { data, error } = await client.from("learn_progress")
      .select("entry_id,best_score,stars,last_completed_at").eq("user_id", uid)
      .order("entry_id").range(start, start + size - 1);
    if (error) throw error;
    rows.push(...data);
    if (data.length < size) return rows;
  }
}

export async function syncProgress(uid) {
  await ownSession(uid);
  let rows = await readProgress(uid);
  const pending = ls.get(pendingKey(uid)) || {};
  const byId = new Map(rows.map(row => [row.entry_id, row]));
  let changed = false;
  for (const [id, item] of Object.entries(pending)) {
    const row = byId.get(id);
    const saved = row && row.best_score >= item.score && Date.parse(row.last_completed_at) >= item.date - 1000;
    if (!saved) {
      await ownSession(uid);
      const { error } = await client.rpc("complete_lesson", {
        p_entry_id: id, p_score: item.score, p_time_zone: zone(),
      });
      if (error) continue;
      changed = true;
    }
    const latest = ls.get(pendingKey(uid)) || {};
    if (latest[id]?.date === item.date) {
      delete latest[id];
      ls.set(pendingKey(uid), latest);
    }
  }
  if (changed) rows = await readProgress(uid);
  const { data, error } = await client.rpc("get_learn_summary", { p_time_zone: zone() });
  if (error) throw error;
  return { rows, summary: data, pending: Object.keys(ls.get(pendingKey(uid)) || {}).length };
}

// E-Mail-Liste für neue Lektionen und Kurse
export async function joinList(email, d = {}) {
  try {
    const r = await fetch(API + "/rest/v1/gf_waitlist", { method: "POST", headers: { apikey: KEY, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify({ email: String(email).trim().toLowerCase(), course: d.course || null, lang: d.lang || null, source: d.source || "app" }) });
    return { ok: r.ok || r.status === 409, status: r.status };
  } catch (e) { return { ok: false, status: 0 }; }
}

// Anonymous usage statistics: a random id, no cookies, no personal data. Can be switched off in the settings.
const anonId = () => { let a = ls.get(ANON); if (!a) { a = Math.random().toString(36).slice(2) + Date.now().toString(36); ls.set(ANON, a); } return a; };
export function track(event, d = {}, enabled = true) {
  if (!enabled || !online()) return;
  try {
    fetch(API + "/rest/v1/gf_events", { method: "POST", keepalive: true, headers: { apikey: KEY, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify({ anon_id: anonId(), event, course: d.course || null, lesson: d.lesson || null, value: d.value == null ? null : Math.round(d.value), ui: d.ui || null }) }).catch(() => { });
  } catch (e) { }
}
