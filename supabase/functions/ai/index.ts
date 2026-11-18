// Tablée — fonction serveur « ai » : pré-saisie d'une recette ou d'une étiquette avec Claude.
// La clé d'API Claude reste ici, côté serveur (secret ANTHROPIC_API_KEY), jamais dans l'application.
// Réglages facultatifs (secrets) : AI_MODEL (défaut claude-haiku-5-5), AI_MONTHLY_LIMIT (défaut 30 par personne et par mois).
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const TOOLS = "four, plaques, micro, airfryer, robot, autocuiseur, mijoteuse, mixeur, patissier, bbq, wok, shaker";
const TOOLS_HELP = "robot = robot cuiseur type Thermomix ou Cookeo ; bbq = barbecue ou plancha ; wok = wok ou poêle ; mixeur = mixeur ou blender";

function prompt(mode: string, name: string, kind: string, hasImages: boolean): string {
  if (mode === "recipe") return `Les photos jointes montrent une recette écrite : page de livre, fiche manuscrite, magazine ou capture d'écran.
Extrais-la pour un carnet de recettes personnel, en français : nom du plat, portions, temps total, ingrédients avec leurs quantités exactes, étapes.
Reprends fidèlement les quantités, températures et temps. Formule les étapes de façon courte et concrète, avec tes propres mots, sans recopier les anecdotes ni l'introduction.
S'il y a plusieurs recettes, prends la principale. Si une écriture manuscrite est ambiguë, choisis la lecture la plus plausible.
Réponds uniquement avec un objet JSON de cette forme :
{"nom":"…","source":"titre du livre, site ou auteur s'il est visible, sinon chaîne vide","description":"une phrase de 120 caractères maximum","boisson":false,"portions":4,"minutes":45,"difficulte":2,"ustensiles":["four"],"ingredients":["200 g de farine"],"etapes":["Étape courte"]}
Pour "ustensiles", choisis uniquement parmi : ${TOOLS} (${TOOLS_HELP}), seulement ceux vraiment nécessaires.
Si aucune recette n'est lisible, réponds {"erreur":"explication courte"}.`;
  if (mode === "label") return `Les photos montrent un produit acheté (bière, vin, cidre, spiritueux, fromage, épicerie fine…), en général sa bouteille ou son étiquette.
Lis l'étiquette et identifie le produit. N'invente rien : laisse vide ce qui n'est pas lisible ou que tu ne reconnais pas avec certitude.
Réponds uniquement avec un objet JSON : {"nom":"nom du produit","producteur":"brasserie, domaine, fromagerie…","style":"ex. IPA, blonde, rouge de Bourgogne, comté 18 mois","degre":6.5,"description":"une phrase neutre de 100 caractères maximum sur le produit"}
Mets "degre" à null s'il n'est pas lisible.`;
  const k = kind === "boisson" ? "boisson ou cocktail" : "plat";
  return `Tu aides un cuisinier amateur à noter ce qu'il vient de préparer, pour un carnet de recettes partagé en famille et entre amis.
${hasImages ? `Les photos jointes montrent le ${k}.` : "Aucune photo n'est disponible."} Nom donné : « ${name || "non précisé"} ».
Propose la recette maison la plus probable, en français, réaliste et simple. Si le nom et la photo se contredisent, privilégie le nom.
Réponds uniquement avec un objet JSON de cette forme :
{"nom":"nom du ${k}","description":"une phrase appétissante de 120 caractères maximum","portions":4,"minutes":45,"difficulte":2,"ustensiles":["four"],"ingredients":["200 g de farine","3 œufs"],"etapes":["Étape courte","Étape courte"]}
Règles : difficulte entre 1 (très facile) et 5 (très difficile) ; ustensiles choisis uniquement parmi ${TOOLS} (${TOOLS_HELP}), seulement ceux vraiment nécessaires ; 4 à 14 ingrédients avec quantités pour le nombre de portions ; 3 à 8 étapes courtes et concrètes (températures, temps).`;
}

function extractJson(text: string): unknown {
  const a = text.indexOf("{"), b = text.lastIndexOf("}");
  if (a < 0 || b <= a) throw new Error("invalid_json");
  return JSON.parse(text.slice(a, b + 1));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method" }, 405);

  const KEY = Deno.env.get("ANTHROPIC_API_KEY");
  if (!KEY) return json({ error: "not_configured" }, 503);

  // Qui appelle ? On agit avec la clé publique et le jeton de connexion de la personne :
  // la base vérifie elle-même qui c'est (aucune clé secrète Supabase n'est nécessaire ici).
  const url = Deno.env.get("SUPABASE_URL")!;
  const apikey = req.headers.get("apikey") || Deno.env.get("SUPABASE_ANON_KEY") || "";
  const auth = req.headers.get("Authorization") || "";
  const sb = createClient(url, apikey, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });
  const { data: who, error: authErr } = await sb.auth.getUser(auth.replace(/^Bearer\s+/i, ""));
  if (authErr || !who?.user) return json({ error: "not_authenticated" }, 401);

  let body: { mode?: string; name?: string; kind?: string; images?: string[] };
  try { body = await req.json(); } catch { return json({ error: "bad_request" }, 400); }
  const mode = ["dish", "recipe", "label"].includes(body.mode || "") ? body.mode! : "dish";
  const images = (Array.isArray(body.images) ? body.images : []).slice(0, 3).filter((s) => typeof s === "string" && s.length < 2_800_000);
  if ((mode === "recipe" || mode === "label") && !images.length) return json({ error: "image_required" }, 400);

  // Quota mensuel par personne (compté dans la base par la fonction ai_use)
  const limit = Number(Deno.env.get("AI_MONTHLY_LIMIT") || 30);
  const { data: used, error: qErr } = await sb.rpc("ai_use");
  if (qErr) return json({ error: "not_authenticated" }, 401);
  if (Number(used) > limit) return json({ error: "quota", limit }, 429);

  const content: unknown[] = images.map((data) => ({ type: "image", source: { type: "base64", media_type: "image/jpeg", data } }));
  content.push({ type: "text", text: prompt(mode, String(body.name || "").slice(0, 80), String(body.kind || "plat"), images.length > 0) });

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: Deno.env.get("AI_MODEL") || "claude-haiku-5-5",
      max_tokens: 1500,
      system: "Tu réponds uniquement avec un objet JSON valide, sans texte autour.",
      messages: [{ role: "user", content }],
    }),
  });
  if (r.status === 429) return json({ error: "rate_limited" }, 429);
  if (!r.ok) {
    const detail = await r.text();
    console.error("anthropic", r.status, detail.slice(0, 500));
    return json({ error: r.status === 400 && /image/i.test(detail) ? "image_rejected" : "upstream" }, 502);
  }
  const out = await r.json();
  const text = (out.content || []).filter((c: { type: string }) => c.type === "text").map((c: { text: string }) => c.text).join("");
  let result: unknown;
  try { result = extractJson(text); } catch { return json({ error: "invalid_json" }, 502); }

  return json({ result, remaining: Math.max(0, limit - Number(used)) });
});
