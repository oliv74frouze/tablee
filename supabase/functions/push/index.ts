// Tablée — fonction serveur « push » : notifications sur le téléphone à chaque nouveau post d'une tribu.
// À déployer dans Supabase › Edge Functions sous le nom « push », avec « Verify JWT » désactivé
// (la fonction vérifie elle-même qui l'appelle). Aucun secret à ajouter : les clés de notification
// sont créées toutes seules au premier appel et rangées dans une table privée de la base.
// Le chiffrement des notifications suit les standards du Web Push (RFC 8291 et 8292), sans bibliothèque externe.
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

// ---------- outils ----------
const enc = new TextEncoder();
export const b64u = (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
export const unb64u = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));
const cat = (...a: Uint8Array[]) => { const o = new Uint8Array(a.reduce((n, x) => n + x.length, 0)); let i = 0; for (const x of a) { o.set(x, i); i += x.length; } return o; };
async function hmac(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const k = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", k, data));
}

// ---------- clés VAPID (identité de l'appli auprès des services de notification) ----------
export async function newVapid(): Promise<{ pub: string; priv: string }> {
  const kp = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]) as CryptoKeyPair;
  const pub = new Uint8Array(await crypto.subtle.exportKey("raw", kp.publicKey));
  const priv = await crypto.subtle.exportKey("jwk", kp.privateKey);
  return { pub: b64u(pub), priv: JSON.stringify(priv) };
}
export async function vapidHeader(endpoint: string, pub: string, privJwk: string, subject: string): Promise<string> {
  const aud = new URL(endpoint).origin;
  const head = b64u(enc.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const body = b64u(enc.encode(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: subject })));
  const key = await crypto.subtle.importKey("jwk", JSON.parse(privJwk), { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, enc.encode(head + "." + body)));
  return `vapid t=${head}.${body}.${b64u(sig)}, k=${pub}`;
}

// ---------- chiffrement du message (RFC 8291, « aes128gcm ») ----------
export async function encrypt(payload: Uint8Array, p256dh: string, authSecret: string): Promise<Uint8Array> {
  const ua = unb64u(p256dh), auth = unb64u(authSecret);
  const uaKey = await crypto.subtle.importKey("raw", ua, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const as = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]) as CryptoKeyPair;
  const asPub = new Uint8Array(await crypto.subtle.exportKey("raw", as.publicKey));
  const ecdh = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: uaKey }, as.privateKey, 256));
  const prkKey = await hmac(auth, ecdh);
  const ikm = await hmac(prkKey, cat(enc.encode("WebPush: info\0"), ua, asPub, new Uint8Array([1])));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const prk = await hmac(salt, ikm);
  const cek = (await hmac(prk, cat(enc.encode("Content-Encoding: aes128gcm\0"), new Uint8Array([1])))).slice(0, 16);
  const nonce = (await hmac(prk, cat(enc.encode("Content-Encoding: nonce\0"), new Uint8Array([1])))).slice(0, 12);
  const k = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, k, cat(payload, new Uint8Array([2]))));
  const head = new Uint8Array(21); head.set(salt); new DataView(head.buffer).setUint32(16, 4096); head[20] = asPub.length;
  return cat(head, asPub, ct);
}

type Sub = { endpoint: string; p256dh: string; auth: string };
async function send(sub: Sub, msg: unknown, keys: { pub: string; priv: string }, subject: string): Promise<number> {
  const body = await encrypt(enc.encode(JSON.stringify(msg)), sub.p256dh, sub.auth);
  const r = await fetch(sub.endpoint, {
    method: "POST",
    headers: { Authorization: await vapidHeader(sub.endpoint, keys.pub, keys.priv, subject), "Content-Encoding": "aes128gcm", "Content-Type": "application/octet-stream", TTL: "86400", Urgency: "normal" },
    body,
  });
  if (!r.ok) console.error("push", r.status, (await r.text()).slice(0, 300));
  return r.status;
}

// ---------- serveur ----------
if (typeof Deno !== "undefined" && Deno.serve) Deno.serve(async (req) => {
  try { return await handle(req); }
  catch (e) { console.error("push", e); return json({ error: "server" }, 500); }
});

async function handle(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method" }, 405);
  // Clé « service » fournie automatiquement par Supabase à ses fonctions (jamais visible dans l'appli).
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  let body: { action?: string; posts?: string[]; comments?: string[] };
  try { body = await req.json(); } catch { return json({ error: "bad_request" }, 400); }

  // Clés VAPID : créées une seule fois, puis relues.
  const getKeys = async () => {
    const read = async () => { const { data } = await admin.from("app_keys").select("name, value").in("name", ["vapid_public", "vapid_private"]);
      const m = Object.fromEntries((data || []).map((r: { name: string; value: string }) => [r.name, r.value])); return m.vapid_public && m.vapid_private ? { pub: m.vapid_public, priv: m.vapid_private } : null; };
    let k = await read();
    if (!k) { const n = await newVapid(); await admin.from("app_keys").insert([{ name: "vapid_public", value: n.pub }, { name: "vapid_private", value: n.priv }]); k = await read(); }
    if (!k) throw new Error("app_keys illisible : relance schema.sql");
    return k;
  };
  if (body.action === "key") return json({ key: (await getKeys()).pub });
  if (body.action !== "notify" && body.action !== "comment") return json({ error: "bad_request" }, 400);

  // Qui appelle ? Seul l'auteur d'un post qui vient d'être publié peut déclencher sa notification.
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  const { data: who } = await admin.auth.getUser(token);
  const me = who?.user?.id; if (!me) return json({ error: "not_authenticated" }, 401);
  const keys = await getKeys();
  const subject = (req.headers.get("origin") || "https://github.com").replace(/\/$/, "");
  let sent = 0, gone = 0;
  const deliver = async (s: Sub, msg: unknown) => {
    try { const st = await send(s, msg, keys, subject); if (st >= 200 && st < 300) sent++; else if (st === 404 || st === 410) { gone++; await admin.from("push_subs").delete().eq("endpoint", s.endpoint); } }
    catch (e) { console.error("push", e); }
  };

  // ----- un commentaire : prévenir l'auteur de la recette et ceux qui l'ont déjà commentée -----
  if (body.action === "comment") {
    for (const id of (Array.isArray(body.comments) ? body.comments : []).slice(0, 3)) {
      const { data: c } = await admin.from("comments").select("id, post_id, tribe_id, author, text, created_at, notified_at").eq("id", id).maybeSingle();
      if (!c || c.author !== me || c.notified_at || Date.now() - Date.parse(c.created_at) > 15 * 60e3) continue;
      const { data: mark } = await admin.from("comments").update({ notified_at: new Date().toISOString() }).eq("id", id).is("notified_at", null).select("id");
      if (!mark || !mark.length) continue;
      const [{ data: post }, { data: tribe }, { data: who2 }, { data: others }, { data: mem }] = await Promise.all([
        admin.from("posts").select("id, name, author").eq("id", c.post_id).maybeSingle(),
        admin.from("tribes").select("name").eq("id", c.tribe_id).maybeSingle(),
        admin.from("profiles").select("name").eq("id", me).maybeSingle(),
        admin.from("comments").select("author").eq("post_id", c.post_id).neq("author", me),
        admin.from("members").select("user_id").eq("tribe_id", c.tribe_id).eq("notify", true),
      ]);
      if (!post) continue;
      const allowed = new Set((mem || []).map((m: { user_id: string }) => m.user_id));
      const targets = [...new Set([post.author, ...(others || []).map((o: { author: string }) => o.author)])].filter((u) => u && u !== me && allowed.has(u));
      if (!targets.length) continue;
      const by = (who2 && who2.name) || "Quelqu'un", quote = c.text.length > 90 ? c.text.slice(0, 89) + "…" : c.text;
      const { data: subs } = await admin.from("push_subs").select("endpoint, p256dh, auth, user_id").in("user_id", targets);
      for (const s of subs || []) {
        const text = s.user_id === post.author ? `${by} a commenté ta recette ${post.name} : « ${quote} »` : `${by} a aussi commenté ${post.name} : « ${quote} »`;
        await deliver(s, { title: (tribe && tribe.name) || "Tablée", body: text.slice(0, 200), url: `./?post=${post.id}`, tag: `cm-${post.id}` });
      }
    }
    return json({ sent, gone });
  }
  for (const id of (Array.isArray(body.posts) ? body.posts : []).slice(0, 5)) {
    const { data: p } = await admin.from("posts").select("id, tribe_id, author, name, kind, remake_of, root_id, twist, created_at, notified_at").eq("id", id).maybeSingle();
    if (!p || p.author !== me || p.notified_at || Date.now() - Date.parse(p.created_at) > 15 * 60e3) continue;
    const { data: mark } = await admin.from("posts").update({ notified_at: new Date().toISOString() }).eq("id", id).is("notified_at", null).select("id");
    if (!mark || !mark.length) continue;   // déjà notifié (double appel)
    const [{ data: tribe }, { data: who2 }, { data: orig }, { data: mem }] = await Promise.all([
      admin.from("tribes").select("name").eq("id", p.tribe_id).maybeSingle(),
      admin.from("profiles").select("name").eq("id", me).maybeSingle(),
      p.remake_of ? admin.from("posts").select("name, author, profiles(name)").eq("id", p.root_id || p.remake_of).maybeSingle() : Promise.resolve({ data: null }),
      admin.from("members").select("user_id").eq("tribe_id", p.tribe_id).neq("user_id", me).eq("notify", true),
    ]);
    const by = (who2 && who2.name) || "Quelqu'un", prod = p.kind === "trouvaille";
    const of = orig ? (orig.author === me ? " (sa recette)" : (orig.profiles && orig.profiles.name ? ` de ${orig.profiles.name}` : "")) : "";
    const text = p.remake_of ? `${by} ${prod ? "a goûté" : "a refait"} ${p.name}${of}${p.twist ? ` à sa sauce : ${p.twist}` : ""}`
      : `${by} ${prod ? "a partagé une trouvaille" : p.kind === "boisson" ? "a publié un cocktail" : "a publié un plat"} : ${p.name}`;
    const ids = (mem || []).map((m: { user_id: string }) => m.user_id); if (!ids.length) continue;
    const { data: subs } = await admin.from("push_subs").select("endpoint, p256dh, auth").in("user_id", ids);
    const msg = { title: (tribe && tribe.name) || "Tablée", body: text.slice(0, 180), url: `./?post=${p.root_id || p.id}`, tag: `post-${p.id}` };
    for (const s of subs || []) await deliver(s, msg);
  }
  return json({ sent, gone });
}
