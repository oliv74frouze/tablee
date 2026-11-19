'use strict';
/* ================= utilitaires ================= */
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const COLORS = ['#2349c4','#d98a16','#147a4a','#b8322a','#7a3fb8','#0f7c8c','#a8521b','#3d5a80'];
const colorFor = s => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return COLORS[h % COLORS.length]; };
const fmt1 = x => (Math.round(x * 10) / 10).toLocaleString('fr-FR', {minimumFractionDigits: 1, maximumFractionDigits: 1});
const ago = t => { const s = (Date.now() - t) / 1000; if (s < 60) return "à l'instant"; if (s < 3600) return `il y a ${Math.floor(s/60)} min`; if (s < 86400) return `il y a ${Math.floor(s/3600)} h`; if (s < 86400*7) return `il y a ${Math.floor(s/86400)} j`; return new Date(t).toLocaleDateString('fr-FR', {day:'numeric', month:'short'}); };
const stars = n => '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n));
const GOUT = ['', 'Bof', 'Correct', 'Bon', 'Très bon', 'À tomber'];
const DIFF = ['', 'Très facile', 'Facile', 'Moyen', 'Difficile', 'Très difficile'];
const SVGI = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
// Ustensiles : pictos génériques (pas de logos de marque).
const TOOLS = [
  {id:'four', l:'Four', i:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 8h18"/><circle cx="7" cy="5.5" r=".6"/><circle cx="10" cy="5.5" r=".6"/><rect x="6.5" y="11" width="11" height="7" rx="1"/>'},
  {id:'plaques', l:'Plaques', i:'<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="12" r="3"/><circle cx="16" cy="12" r="2.2"/>'},
  {id:'micro', l:'Micro-ondes', i:'<rect x="2" y="5" width="20" height="14" rx="2"/><rect x="5" y="8" width="10" height="8" rx="1"/><path d="M18.5 9v.01M18.5 12v.01M18.5 15v.01"/>'},
  {id:'airfryer', l:'Airfryer', i:'<rect x="5" y="3" width="14" height="18" rx="4"/><rect x="8" y="11" width="8" height="6" rx="1.2"/><path d="M11 14h2"/><circle cx="12" cy="7" r="1.4"/>'},
  {id:'robot', l:'Robot cuiseur', s:'Thermomix, Cookeo…', i:'<path d="M7.5 14 8.5 4h7l1 10"/><path d="M15.7 6.5h2v4.5h-1.4"/><rect x="4" y="14" width="16" height="7" rx="2"/><circle cx="12" cy="17.5" r="1.3"/>'},
  {id:'autocuiseur', l:'Autocuiseur', i:'<path d="M4 11h16v5.5A3.5 3.5 0 0 1 16.5 20h-9A3.5 3.5 0 0 1 4 16.5z"/><path d="M3 11a9 4 0 0 1 18 0"/><path d="M12 7V4.5M10.5 4.5h3M20 11h2.5M1.5 11H4"/>'},
  {id:'mijoteuse', l:'Mijoteuse', i:'<rect x="4" y="9" width="16" height="11" rx="4"/><path d="M5.5 9a6.5 3.2 0 0 1 13 0"/><path d="M12 5.8V4.5M2.5 13H4M20 13h1.5"/>'},
  {id:'mixeur', l:'Mixeur', s:'blender, plongeant', i:'<path d="M8 3h8l-1.2 11H9.2z"/><path d="M11 7l2 2"/><rect x="7" y="14" width="10" height="7" rx="2"/><circle cx="12" cy="17.5" r="1"/>'},
  {id:'patissier', l:'Robot pâtissier', i:'<path d="M5 21h14"/><path d="M6.5 21V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2.5h-6v3"/><path d="M8.5 13h9l-1.5 5.5h-6z"/><path d="M12.5 11.5v3"/>'},
  {id:'bbq', l:'Barbecue', s:'plancha', i:'<path d="M4 10h16a8 6.5 0 0 1-16 0z"/><path d="M8.5 15.5 6.5 21M15.5 15.5l2 5.5"/><path d="M9 3.5c.8.7.8 1.6 0 2.4M12.5 3.5c.8.7.8 1.6 0 2.4M16 3.5c.8.7.8 1.6 0 2.4"/>'},
  {id:'wok', l:'Wok', s:'poêle', i:'<path d="M2.5 11h14a7 5.5 0 0 1-14 0z"/><path d="M16.5 11 22 8.5"/><path d="M6 7.5c.8-.8 1.6-.8 2.4 0M10.5 7.5c.8-.8 1.6-.8 2.4 0"/>'},
  {id:'shaker', l:'Shaker', i:'<path d="M8 10h8l-1.2 11H9.2z"/><path d="M8.7 10V7.5a3.3 3.3 0 0 1 6.6 0V10"/><rect x="10.8" y="2.5" width="2.4" height="1.8" rx=".5"/>'},
];
const TOOL = Object.fromEntries(TOOLS.map(t => [t.id, t]));
const toolIcons = ids => (ids || []).filter(id => TOOL[id]).length ? `<div class="tools" aria-label="Ustensiles">${ids.filter(id => TOOL[id]).map(id => `<span class="tool" title="${TOOL[id].l}">${SVGI(TOOL[id].i)}</span>`).join('')}</div>` : '';
const toolLabels = ids => (ids || []).filter(id => TOOL[id]).map(id => `<span class="tl">${SVGI(TOOL[id].i)}${TOOL[id].l}</span>`).join('');
const HEART = SVGI('<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>');
let toastT;
function toast(msg){ const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 3200); }
const uid = () => (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

/* ================= exemples (affichés seulement quand le carnet est vide) ================= */
const EXAMPLES = [
  {id:'ex4', ex:true, kind:'trouvaille', name:'La Blanche du coin', desc:'Bière blanche légère, parfaite avec des moules-frites.', maker:'Petite brasserie locale', style:'Bière blanche', abv:4.8, where:'Cave du centre-ville', gout:4, diff:0, author:'Paul', exMakers:['Léa'], exLast:'Léa', createdAt:Date.now()-3600e3*6, ingredients:[], steps:[]},
  {id:'ex1', ex:true, kind:'plat', name:'Tarte tatin de Mamie', desc:'La recette du dimanche, caramel bien ambré.', portions:6, minutes:75, gout:4.7, diff:3, tools:['four','plaques'], exWants:2, author:'Mamie Jo', exMakers:['Paul','Léa','Tom'], exLast:'Paul', exTwist:'+ une pincée de fleur de sel et un peu de cannelle dans le caramel', exTwistN:1, createdAt:Date.now()-3600e3*20,
   ingredients:['1 pâte brisée','6 pommes (reinettes)','120 g de sucre','60 g de beurre demi-sel'], steps:['Faire un caramel avec le sucre et le beurre dans le moule.','Disposer les quartiers de pommes serrés.','Cuire 20 min, couvrir de pâte, enfourner 35 min à 190 °C.','Démouler tiède.']},
  {id:'ex2', ex:true, kind:'boisson', name:'Spritz au pamplemousse', desc:'Version maison pour l’apéro du samedi.', portions:1, minutes:5, gout:0, diff:1, tools:['shaker'], exWants:3, author:'Léa', createdAt:Date.now()-3600e3*30,
   ingredients:['6 cl de prosecco','4 cl d’apéritif amer','4 cl de jus de pamplemousse rose','Eau gazeuse','Glaçons'], steps:['Remplir un verre de glaçons.','Verser prosecco, apéritif et jus.','Compléter d’un trait d’eau gazeuse, remuer doucement.']},
  {id:'ex3', ex:true, kind:'plat', name:'Dahl de lentilles corail', desc:'Doux, crémeux, prêt en 35 minutes.', portions:4, minutes:35, gout:4.5, diff:2, tools:['plaques','mixeur'], exWants:1, author:'Sarah', exMakers:['Tom','Léa'], exLast:'Tom', createdAt:Date.now()-3600e3*50,
   ingredients:['250 g de lentilles corail','40 cl de lait de coco','1 oignon','2 gousses d’ail','1 c. à s. de curry','1 citron vert'], steps:['Faire revenir oignon, ail et curry.','Ajouter lentilles, lait de coco et 40 cl d’eau.','Cuire 20 min à feu doux.','Finir avec le jus du citron vert.']},
];

/* ================= stockage : Supabase (tribu) ou mode démo local ================= */
const CFG = window.TABLEE_CONFIG || {};
const DEMO = !CFG.supabaseUrl || !CFG.supabaseAnonKey || /[?&]demo\b/.test(location.search);
const S = { mode:'local', sb:null, me:'moi', canWrite:true, tribe:null, tribes:[], members:[], posts:[], names:{}, cart:[], wants:{}, kitchen:[], unsubC:null, urls:{} };
const LS = 'tablee_v1';
const local = { read(){ try{ return JSON.parse(localStorage.getItem(LS)) || {posts:[], comments:{}, cart:[]}; }catch(e){ return {posts:[], comments:{}, cart:[]}; } },
                write(d){ try{ localStorage.setItem(LS, JSON.stringify(d)); }catch(e){ toast('Stockage du navigateur plein : supprime des photos.'); } } };
const store = { get(k, d){ try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch(e){ return d; } }, set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} } };

// Code d'invitation présent dans l'adresse (?join=…) : gardé jusqu'à la connexion.
(function(){ const m = location.search.match(/[?&]join=([a-z0-9]+)/i); if (m){ try { sessionStorage.setItem('tablee_join', m[1]); } catch(e){} history.replaceState(null, '', location.pathname + location.hash); } })();
const pendingJoin = () => { try { return sessionStorage.getItem('tablee_join'); } catch(e){ return null; } };
const inviteLink = code => location.origin + location.pathname + '?join=' + code;

async function initStore(){
  const m = $('#mode');
  if (DEMO){
    S.mode = 'local'; m.textContent = 'Mode démo'; m.classList.add('local');
    const d = local.read(); S.posts = d.posts; S.cart = d.cart || []; S.wants = {[S.me]:d.wants || []}; S.kitchen = d.kitchen || []; render(); return;
  }
  S.mode = 'sb';
  S.sb = supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, {auth:{persistSession:true, autoRefreshToken:true}});
  const {data} = await S.sb.auth.getSession();
  if (data && data.session) await afterLogin(data.session.user); else showGate('auth');
}

/* ---------- connexion ---------- */
const AUTH = {signup:true};
function showGate(step){
  $('#gate').classList.add('on'); $('#gAuth').style.display = step === 'auth' ? '' : 'none'; $('#gTribe').style.display = step === 'tribe' ? '' : 'none';
  $('#gErr').textContent = ''; $('#tErr').textContent = '';
  if (step === 'auth'){
    $('#gInvite').style.display = pendingJoin() ? '' : 'none';
    paintAuth();
  } else {
    $('#gClose').style.display = S.tribe ? '' : 'none';
    $('#tList').innerHTML = S.tribes.length ? `<div class="lbl">Mes tribus</div>` + S.tribes.map(t => `<button class="row" data-tribe="${t.id}"><span class="th" style="background:${colorFor(t.name)}">${esc(t.name[0] || '?')}</span><span class="tx"><b>${esc(t.name)}</b><span>${S.tribe && S.tribe.id === t.id ? 'tribu ouverte' : 'ouvrir'}</span></span></button>`).join('') : '';
    $('#tIntro').textContent = S.tribes.length ? 'Change de tribu, crée-en une autre ou rejoins celle d’un proche.' : 'Une tribu, c’est ta famille ou ta bande d’amis : un carnet de recettes privé, rien qu’à vous.';
  }
}
function paintAuth(){
  $('#gName').parentNode.style.display = AUTH.signup ? '' : 'none';
  $('#gGo').textContent = AUTH.signup ? 'Créer mon compte' : 'Me connecter';
  $('#gSwitch').textContent = AUTH.signup ? 'J’ai déjà un compte' : 'Créer un compte';
  $('#gTitle').textContent = AUTH.signup ? 'Bienvenue sur Tablée' : 'Content de te revoir';
  $('#gPass').autocomplete = AUTH.signup ? 'new-password' : 'current-password';
}
const AUTH_ERR = m => /invalid login/i.test(m) ? 'E-mail ou mot de passe incorrect.' : /already registered|already been registered/i.test(m) ? 'Ce compte existe déjà : touche « J’ai déjà un compte ».'
  : /password.*(6|short|least)/i.test(m) ? 'Mot de passe trop court : 6 caractères minimum.' : /email.*invalid|invalid.*email/i.test(m) ? 'Adresse e-mail invalide.'
  : /not confirmed/i.test(m) ? 'Confirme d’abord ton adresse avec le lien reçu par e-mail.' : /rate|too many/i.test(m) ? 'Trop d’essais : attends une minute.' : 'Connexion impossible : vérifie ta connexion internet et réessaie.';
async function doAuth(){
  const name = $('#gName').value.trim(), email = $('#gMail').value.trim(), password = $('#gPass').value;
  if (AUTH.signup && !name){ $('#gErr').textContent = 'Indique ton prénom : c’est lui que ta tribu verra.'; return; }
  if (!email || !password){ $('#gErr').textContent = 'Remplis ton e-mail et ton mot de passe.'; return; }
  $('#gGo').disabled = true; $('#gErr').textContent = '';
  try {
    const r = AUTH.signup ? await S.sb.auth.signUp({email, password, options:{data:{name}}}) : await S.sb.auth.signInWithPassword({email, password});
    if (r.error) throw r.error;
    if (!r.data.session){ $('#gErr').textContent = 'Compte créé ! Ouvre le lien de confirmation reçu par e-mail, puis connecte-toi.'; AUTH.signup = false; paintAuth(); return; }
    await afterLogin(r.data.session.user);
  } catch(e){ $('#gErr').textContent = AUTH_ERR(String(e && e.message || e)); }
  finally { $('#gGo').disabled = false; }
}
async function afterLogin(user){
  S.me = user.id; S.names[S.me] = (user.user_metadata && user.user_metadata.name) || '';
  const code = pendingJoin();
  if (code){ try { const r = await S.sb.rpc('join_tribe', {code}); if (!r.error){ store.set('tablee_tribe', r.data); toast('Bienvenue dans la tribu !'); } else toast('Ce lien d’invitation ne marche plus : demande un nouveau lien.'); } catch(e){} try { sessionStorage.removeItem('tablee_join'); } catch(e){} }
  await loadTribes();
  const want = store.get('tablee_tribe', null), t = S.tribes.find(x => x.id === want) || S.tribes[0];
  if (t) await enterTribe(t); else showGate('tribe');
  loadUserData();
}
async function loadTribes(){
  const r = await S.sb.from('members').select('role, tribes(id, name, invite_code)').eq('user_id', S.me);
  S.tribes = (r.data || []).filter(x => x.tribes).map(x => ({...x.tribes, role:x.role})).sort((a, b) => a.name.localeCompare(b.name));
}
async function createTribe(){
  const name = $('#tName').value.trim(); if (!name){ $('#tErr').textContent = 'Donne un nom à ta tribu, par exemple « Famille Martin ».'; return; }
  $('#tCreate').disabled = true;
  const r = await S.sb.rpc('create_tribe', {tribe_name:name}); $('#tCreate').disabled = false;
  if (r.error){ $('#tErr').textContent = 'Création impossible : réessaie.'; return; }
  $('#tName').value = ''; await loadTribes(); await enterTribe(S.tribes.find(t => t.id === r.data.id) || S.tribes[0]);
  show('moi'); toast('Ta tribu est prête : envoie le lien d’invitation à tes proches.');
}
async function joinFromInput(){
  const v = $('#tCode').value.trim(), m = v.match(/join=([a-z0-9]+)/i), code = m ? m[1] : v.replace(/[^a-z0-9]/gi, '');
  if (!code){ $('#tErr').textContent = 'Colle le lien d’invitation reçu.'; return; }
  const r = await S.sb.rpc('join_tribe', {code});
  if (r.error){ $('#tErr').textContent = 'Lien inconnu ou expiré : demande un nouveau lien à la personne qui t’invite.'; return; }
  $('#tCode').value = ''; await loadTribes(); await enterTribe(S.tribes.find(t => t.id === r.data) || S.tribes[0]); toast('Bienvenue dans la tribu !');
}
async function signOut(){ await S.sb.auth.signOut(); store.set('tablee_tribe', null); location.reload(); }

/* ---------- tribu ouverte : chargement et temps réel ---------- */
let rtChan = null, reloadT = null;
async function enterTribe(t){
  S.tribe = t; store.set('tablee_tribe', t.id);
  $('#gate').classList.remove('on');
  const m = $('#mode'); m.textContent = t.name; m.classList.remove('local');
  $('#feed').innerHTML = '<p class="empty">Chargement du carnet…</p>';
  S.posts = []; S.wants = {};
  await reloadTribe();
  if (rtChan) S.sb.removeChannel(rtChan);
  const again = () => { clearTimeout(reloadT); reloadT = setTimeout(reloadTribe, 400); };
  rtChan = S.sb.channel('tribe-' + t.id)
    .on('postgres_changes', {event:'*', schema:'public', table:'posts', filter:'tribe_id=eq.' + t.id}, again)
    .on('postgres_changes', {event:'*', schema:'public', table:'wants', filter:'tribe_id=eq.' + t.id}, again)
    .subscribe();
}
const fromRow = r => ({id:r.id, kind:r.kind, name:r.name, desc:r.descr || '', source:r.source || '', photoPaths:r.photos || [], photos:(r.photos || []).map(p => urlOf(p)).filter(Boolean),
  portions:r.portions, minutes:r.minutes, ingredients:r.ingredients || [], steps:r.steps || [], diff:r.diff || 0, tools:r.tools || [], maker:r.maker || '', style:r.style || '', abv:r.abv,
  where:r.where_buy || '', twist:r.twist || '', remakeOf:r.remake_of, rootId:r.root_id, fromTwist:r.from_twist, author:r.author, createdAt:Date.parse(r.created_at), editedAt:r.edited_at ? Date.parse(r.edited_at) : null});
const toRow = (p, tribeId) => ({id:p.id, tribe_id:tribeId || S.tribe.id, kind:p.kind, name:p.name, descr:p.desc || '', source:p.source || '', photos:p.photoPaths || [], portions:p.portions || null, minutes:p.minutes || null,
  ingredients:p.ingredients || [], steps:p.steps || [], diff:p.diff || 0, tools:p.tools || [], maker:p.maker || '', style:p.style || '', abv:p.abv ?? null, where_buy:p.where || '',
  twist:p.twist || '', remake_of:p.remakeOf || null, root_id:p.rootId, from_twist:p.fromTwist || null, edited_at:p.editedAt ? new Date(p.editedAt).toISOString() : null});
async function reloadTribe(){
  if (!S.tribe) return;
  const T = S.tribe.id;
  const [P, W, M] = await Promise.all([
    S.sb.from('posts').select('*').eq('tribe_id', T).order('created_at', {ascending:false}).limit(500),
    S.sb.from('wants').select('user_id, post_id').eq('tribe_id', T),
    S.sb.from('members').select('user_id, role, profiles(name)').eq('tribe_id', T)]);
  if (P.error){ $('#feed').innerHTML = '<p class="empty">Impossible de lire le carnet : vérifie ta connexion internet.</p>'; return; }
  (M.data || []).forEach(m => { S.names[m.user_id] = (m.profiles && m.profiles.name) || ''; });
  S.members = (M.data || []).map(m => ({id:m.user_id, role:m.role, name:(m.profiles && m.profiles.name) || ''}));
  const w = {}; (W.data || []).forEach(x => { (w[x.user_id] = w[x.user_id] || []).push(x.post_id); }); S.wants = w;
  await signUrls((P.data || []).flatMap(r => r.photos || []));
  S.posts = (P.data || []).map(fromRow);
  render(); renderInvite();
}
document.addEventListener('visibilitychange', () => { if (!document.hidden && S.mode === 'sb' && S.tribe) reloadTribe(); });

/* ---------- photos : stockage privé + adresses signées (gardées une semaine) ---------- */
const URLS_KEY = 'tablee_urls', WEEK = 7 * 86400;
S.urls = store.get(URLS_KEY, {});
const urlOf = path => { const u = S.urls[path]; return u && u.exp > Date.now() + 3600e3 ? u.url : null; };
async function signUrls(paths){
  const need = [...new Set(paths)].filter(p => !urlOf(p)); if (!need.length) return;
  for (let i = 0; i < need.length; i += 100){
    const r = await S.sb.storage.from('photos').createSignedUrls(need.slice(i, i + 100), WEEK);
    (r.data || []).forEach(x => { if (x.signedUrl) S.urls[x.path] = {url:x.signedUrl, exp:Date.now() + WEEK * 1000}; });
  }
  for (const k in S.urls) if (S.urls[k].exp < Date.now()) delete S.urls[k];
  store.set(URLS_KEY, S.urls);
}
// Copie d'un nouveau post dans une autre tribu : nouvelles photos dans le dossier de cette tribu.
async function copyToTribe(p, tribeId){
  const id = uid(), paths = [];
  for (let i = 0; i < C.photos.length && paths.length < 3; i++){
    const path = `${tribeId}/${id}/${uid()}.jpg`;
    const r = await S.sb.storage.from('photos').upload(path, C.blobs[i] || dataToBlob(C.photos[i]), {contentType:'image/jpeg', upsert:false});
    if (r.error) throw {code:'upload'};
    paths.push(path);
  }
  const r = await S.sb.from('posts').insert(toRow({...p, id, rootId:id, remakeOf:null, fromTwist:null, twist:'', editedAt:null, photoPaths:paths}, tribeId));
  if (r.error) throw {code:'db'};
}
async function uploadPhotos(postId){
  const out = [];
  for (let i = 0; i < C.photos.length && out.length < 3; i++){
    if (C.paths[i]){ out.push(C.paths[i]); continue; }
    const blob = C.blobs[i] || dataToBlob(C.photos[i]);
    const path = `${S.tribe.id}/${postId}/${uid()}.jpg`;
    const r = await S.sb.storage.from('photos').upload(path, blob, {contentType:'image/jpeg', upsert:false});
    if (r.error) throw {code:'upload'};
    S.urls[path] = {url:C.photos[i], exp:Date.now() + 3600e3 * 2};   // affichage immédiat avec la photo locale
    out.push(path);
  }
  return out;
}

/* ---------- données privées : courses et « Ma cuisine » ---------- */
async function loadUserData(){
  if (S.mode !== 'sb') return;
  const r = await S.sb.from('user_data').select('cart, kitchen').eq('user_id', S.me).maybeSingle();
  if (r.data){ S.cart = r.data.cart || []; S.kitchen = r.data.kitchen || []; }
  renderCart(); renderMe(); renderBook();
}

const myWants = () => S.wants[S.me] || [];
const wantersOf = id => Object.entries(S.wants).filter(([u, ids]) => ids.includes(id)).map(([u]) => u);
async function toggleWant(id){
  const cur = myWants(), on = !cur.includes(id), ids = on ? [...cur, id] : cur.filter(x => x !== id);
  S.wants = {...S.wants, [S.me]:ids}; render(); if (curDetail) refreshDetailWant(id);
  toast(on ? 'Ajoutée à tes envies : retrouve-la dans le carnet, filtre « Mes envies ».' : 'Retirée de tes envies.');
  if (S.mode === 'sb'){
    const r = on ? await S.sb.from('wants').insert({post_id:id, tribe_id:S.tribe.id}) : await S.sb.from('wants').delete().eq('user_id', S.me).eq('post_id', id);
    if (r.error && !/duplicate/i.test(r.error.message || '')) toast('Envie non enregistrée : réessaie.');
  } else { const d = local.read(); d.wants = ids; local.write(d); }
}
async function saveKitchen(tools){
  S.kitchen = tools; renderMe(); renderBook();
  if (S.mode === 'sb'){ const r = await S.sb.from('user_data').upsert({user_id:S.me, kitchen:tools}); if (r.error) toast('Non enregistré : réessaie.'); }
  else { const d = local.read(); d.kitchen = tools; local.write(d); }
}
function wantBtn(id, pr, full){
  const on = myWants().includes(id), lab = pr ? 'J’ai envie de la goûter' : 'J’ai envie de la faire', short = pr ? 'Envie de goûter' : 'Envie de la faire';
  return `<button class="btn want" data-want="${id}" aria-pressed="${on}" aria-label="${lab}" title="${lab}"${full ? ' style="flex:1"' : ''}>${HEART}${full ? (on ? 'Dans mes envies' : short) : ''}</button>`;
}
function refreshDetailWant(id){ $$('#dBody [data-want]').forEach(b => { b.outerHTML = wantBtn(b.dataset.want, b.closest('[data-pr]') ? true : false, true); }); }
const nameOf = a => a === S.me ? 'Toi' : (S.mode === 'sb' ? (S.names[a] || 'Quelqu’un') : (a || 'Toi'));

async function savePost(p){
  if (S.mode === 'sb'){
    const r = await S.sb.from('posts').upsert(toRow(p)); if (r.error) throw {code:'db', message:r.error.message};
    const i = S.posts.findIndex(x => x.id === p.id); const q = {...p, author:S.me};
    if (i >= 0) S.posts[i] = q; else S.posts.unshift(q); render();
  }
  else { const d = local.read(); const i = d.posts.findIndex(x => x.id === p.id); if (i >= 0) d.posts[i] = p; else d.posts.unshift(p); local.write(d); S.posts = d.posts; render(); }
}
async function deletePost(id){
  if (S.mode === 'sb'){
    const p = S.posts.find(x => x.id === id);
    const r = await S.sb.from('posts').delete().eq('id', id); if (r.error) throw r.error;
    if (p && p.photoPaths && p.photoPaths.length) S.sb.storage.from('photos').remove(p.photoPaths);
    S.posts = S.posts.filter(x => x.id !== id); render();
  }
  else { const d = local.read(); d.posts = d.posts.filter(p => p.id !== id); local.write(d); S.posts = d.posts; render(); }
}
async function saveCart(items){
  S.cart = items; renderCart();
  if (S.mode === 'sb'){ const r = await S.sb.from('user_data').upsert({user_id:S.me, cart:items}); if (r.error) toast('Liste non enregistrée : réessaie.'); }
  else { const d = local.read(); d.cart = items; local.write(d); }
}

/* ---------- inviter ---------- */
function renderInvite(){
  const box = $('#howto'); if (!box) return;
  if (S.mode !== 'sb' || !S.tribe){ box.innerHTML = `<h2>Mode démo</h2><p class="hint">Ce carnet de démonstration reste dans ce navigateur. Pour partager avec ta tribu, l’application doit être reliée à Supabase (voir le guide d’installation).</p>`; return; }
  const link = inviteLink(S.tribe.invite_code), admin = S.tribe.role === 'admin';
  box.innerHTML = `<h2>Ta tribu : ${esc(S.tribe.name)}</h2>
    <p class="hint">Envoie ce lien à tes proches (famille, amis). Ils créent leur compte en 30 secondes et rejoignent le carnet.</p>
    <input class="search" id="invLink" readonly value="${esc(link)}" aria-label="Lien d’invitation">
    <div class="bar"><button class="btn pri" id="invShare" style="flex:1">Partager le lien</button><button class="btn" id="invCopy">Copier</button></div>
    <p class="hint"><b>${S.members.length} membre${S.members.length > 1 ? 's' : ''} :</b> ${S.members.map(m => esc(m.id === S.me ? 'toi' : (m.name || 'Quelqu’un'))).join(', ')}</p>
    <div class="bar">${admin ? '<button class="btn" id="invReset" style="flex:1">Nouveau lien</button>' : ''}<button class="btn" id="tSwitch" style="flex:1">Changer de tribu</button><button class="btn ghost" id="logout" style="flex:1">Me déconnecter</button></div>
    ${admin ? '<p class="hint">« Nouveau lien » désactive l’ancien, si tu l’as envoyé à la mauvaise personne.</p>' : ''}`;
}

/* ================= agrégats par recette ================= */
function groups(){
  const G = {};
  S.posts.forEach(p => { const r = p.rootId || p.id; (G[r] = G[r] || []).push(p); });
  return Object.entries(G).map(([root, L]) => {
    const orig = L.find(p => p.id === root) || L[L.length - 1];
    // Pas de note : le signal, c'est le nombre de fois où la tribu l'a refaite, et ses envies.
    // La difficulté, le temps et les ustensiles viennent de l'auteur.
    const re = L.filter(p => p.id !== orig.id);
    const people = [...new Set(re.map(p => p.author))];
    const d = +orig.diff || 0;
    const last = L.reduce((m, p) => Math.max(m, p.createdAt || 0), 0);
    const photo = (orig.photos && orig.photos.length ? orig : (L.slice().sort((a, b) => (a.createdAt||0) - (b.createdAt||0)).find(p => p.photos && p.photos.length) || {})).photos;  // la photo de l'original d'abord
    const prod = orig.kind === 'trouvaille';
    return {root, orig, prod, list:L, n:L.length, re:re.length, people, wants:wantersOf(orig.id).length, diff:d, minutes:orig.minutes || null, tools:orig.tools || [], last, photo:photo ? photo[0] : null};
  });
}
const groupOf = root => groups().find(g => g.root === root);
const exGroup = p => { const m = p.exMakers || [];
  return {root:p.id, orig:p, prod:p.kind === 'trouvaille', list:[p], n:1 + m.length, re:m.length, people:m, wants:p.exWants || 0, diff:p.diff, minutes:p.minutes || null, tools:p.tools || [], last:p.createdAt, photo:null, ex:true}; };

/* ================= rendu ================= */
let feedK = 'all', bookK = 'all';
function avatar(a){ const n = nameOf(a); return `<span class="av" style="background:${colorFor(a)}">${esc((n[0] || '?').toUpperCase())}</span>`; }
function photoBlock(p, cls='ph'){
  if (p.photos && p.photos.length) return `<div class="${cls}"><img src="${p.photos[0]}" alt="${esc(p.name)}" loading="lazy">${p.photos.length > 1 ? `<span class="more">+${p.photos.length-1}</span>` : ''}</div>`;
  return `<div class="${cls}" style="background:${colorFor(p.name)}"><span class="ph0">${esc((p.name||'?')[0])}</span></div>`;
}
const KIND = k => k === 'boisson' ? 'À boire' : k === 'trouvaille' ? 'Trouvaille' : 'Plat';
const fois = n => `${n} fois`;
function scoresHtml(G, card, noTools){
  const {diff, prod, minutes, re, people, wants} = G;
  const refaite = (re && card) ? '' : re ? `<span class="sc"><span class="meta-n">${prod ? 'Goûtée' : 'Refaite'} ${fois(re)}</span>${people.length > 1 ? ` par ${people.length} personnes` : ''}</span>`
                     : `<span class="sc todo">${prod ? 'Pas encore goûtée par la tribu' : 'Pas encore refaite'}</span>`;
  const meta = prod ? '' : `${diff ? `<span class="sc">Difficulté ${Math.round(diff)}/5</span>` : ''}${minutes ? `<span class="sc">${minutes} min</span>` : ''}`;
  const env = wants ? `<span class="sc">${HEART.replace('<svg', '<svg style="width:14px;height:14px;margin-right:4px;vertical-align:-2px"')}${wants} envie${wants > 1 ? 's' : ''}</span>` : '';
  return `<div class="scores">${refaite}${meta}${env}</div>${prod || noTools ? '' : toolIcons(G.tools)}`;
}
function facts(p){ const f = [p.maker, p.style, p.abv ? String(p.abv).replace('.', ',') + ' %' : '', p.where ? 'Où : ' + p.where : ''].filter(Boolean); return f.length ? `<div class="facts">${f.map(x => `<span>${esc(x)}</span>`).join('')}</div>` : ''; }
// Photos de la carte : l'original d'abord, puis chaque réalisation avec photo (la plus récente en premier), à faire glisser.
function carousel(g){
  const o = g.orig, pr = o.kind === 'trouvaille';
  const others = g.list.filter(x => x.id !== o.id && x.photos && x.photos.length).sort((a, b) => (b.createdAt||0) - (a.createdAt||0));
  const who = a => a === S.me ? 'toi' : nameOf(a);
  const slides = [`<div class="sl" data-open="${o.id}" ${o.photos && o.photos.length ? '' : `style="background:${colorFor(o.name)}"`}>${o.photos && o.photos.length ? `<img src="${o.photos[0]}" alt="${esc(o.name)}" loading="lazy">` : `<span class="ph0">${esc((o.name||'?')[0])}</span>`}${others.length ? `<span class="cap orig">L’original · ${esc(who(o.author))}</span>` : ''}</div>`]
    .concat(others.map(x => `<div class="sl" data-ver="${x.id}"><img src="${x.photos[0]}" alt="" loading="lazy"><span class="cap">${x.author === S.me ? (x.twist ? 'Ta version à ta sauce' : (pr ? 'Goûté par toi' : 'Ta réalisation')) : (x.twist ? 'À la sauce de ' : (pr ? 'Goûté par ' : 'Refait par ')) + esc(who(x.author))}</span></div>`));
  if (slides.length === 1) return `<div class="carw"><div class="car">${slides[0]}</div></div>`;
  return `<div class="carw"><div class="car" aria-label="Photos : glisse pour voir les versions">${slides.join('')}</div>
    <span class="nxt">+${others.length} version${others.length > 1 ? 's' : ''} ›</span><span class="dots">${slides.map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</span></div>`;
}
function stackCard(g){
  const o = g.orig, ex = !!o.ex, pr = o.kind === 'trouvaille';
  const makers = ex ? (o.exMakers || []) : [...new Set(g.list.filter(x => x.id !== o.id).map(x => x.author))];
  const nRem = ex ? makers.length : g.n - 1;
  const latest = ex ? null : g.list.reduce((m, x) => (x.createdAt || 0) > (m.createdAt || 0) ? x : m, o);
  const actor = ex ? (o.exLast || o.author) : latest.author, isRe = ex ? !!o.exLast : latest.id !== o.id;
  const twist = isRe ? (ex ? o.exTwist : latest.twist) : '';
  const verb = isRe ? (pr ? 'a goûté' : 'a refait') : (pr ? 'a partagé' : 'a publié');
  const when = ex ? o.createdAt : latest.createdAt;
  const nm = a => ex ? a : nameOf(a);
  const ph = ex ? `<button style="all:unset;cursor:pointer;display:block;width:100%" data-open="${o.id}" aria-label="Voir ${esc(o.name)}">${photoBlock(o)}</button>` : carousel(g);
  const madeLine = nRem ? `<div class="made"><span class="avs">${makers.slice(0, 4).map(a => `<span class="av" style="background:${colorFor(a)}">${esc((nm(a)[0] || '?').toUpperCase())}</span>`).join('')}</span>
      <span>${pr ? 'Goûté' : 'Refait'} <b>${nRem} fois</b> par ${makers.slice(0, 2).map(a => esc(!ex && a === S.me ? 'toi' : nm(a))).join(' et ')}${makers.length > 2 ? ` et ${makers.length - 2} autre${makers.length > 3 ? 's' : ''}` : ''}</span></div>` : '';
  return `<article class="post ${nRem >= 2 ? 's2' : nRem === 1 ? 's1' : ''}" data-root="${o.id}"${pr ? ' data-pr="1"' : ''}>
    <div class="who"><span class="av" style="background:${colorFor(actor)}">${esc((nm(actor)[0] || '?').toUpperCase())}</span><div><div class="n">${(!ex && actor === S.me) ? 'Tu' : esc(nm(actor))} <span style="font-weight:400;color:var(--muted)">${(!ex && actor === S.me) ? verb.replace(/^a /, '').replace(/^(\S+)/, w => ({refait:'as refait', goûté:'as goûté', partagé:'as partagé', publié:'as publié'}[w] || w)) : verb}${isRe ? (!ex && o.author === S.me ? (pr ? ' ta trouvaille' : ' ta recette') : ` ${pr ? 'la trouvaille' : 'la recette'} de ${esc(nm(o.author))}`) : ''}${twist ? ((!ex && actor === S.me) ? ' à ta sauce' : ' à sa sauce') : ''}</span></div><div class="t">${ago(when)} · <span class="kind">${KIND(o.kind)}</span></div></div>${ex ? '<span class="ex">Exemple</span>' : ''}</div>
    ${ph}
    <div class="body"><div class="vhead"><h3>${esc(o.name)}</h3>${pr ? facts(o) : ''}${o.desc ? `<p class="desc">${esc(o.desc)}</p>` : ''}${twist ? `<div class="sauce"><span class="tg">${(!ex && actor === S.me) ? 'À ta sauce' : 'À sa sauce'}</span><span>${esc(twist)}</span></div>` : ''}</div>${scoresHtml(ex ? exGroup(o) : g, true)}${madeLine}
      <div class="acts"><button class="btn vbtn" data-open="${o.id}">${pr ? 'Voir' : 'Recette'}</button>${ex ? '' : `<button class="btn pri" data-remake="${o.id}">${pr ? 'Je l’ai goûté' : 'Je l’ai refait'}</button>${wantBtn(o.id, pr)}`}</div></div>
  </article>`;
}
function postCard(p){
  const ex = p.ex, g = ex ? null : groupOf(p.rootId || p.id);
  const rootLine = p.remakeOf ? `<div class="remk">${p.kind === 'trouvaille' ? 'a goûté' : 'a refait'} <b>${esc(p.rootName || (g && g.orig.name) || '')}</b>${(p.rootAuthor || (g && g.orig.author)) ? ` de ${esc(ex ? p.rootAuthor : nameOf(g.orig.author))}` : ''}</div>` : '';
  const pr = p.kind === 'trouvaille', sc = scoresHtml(g || exGroup(p));
  return `<article class="post">
    <div class="who">${ex ? `<span class="av" style="background:${colorFor(p.author)}">${esc(p.author[0])}</span>` : avatar(p.author)}<div><div class="n">${esc(ex ? p.author : nameOf(p.author))}</div><div class="t">${ago(p.createdAt)} · <span class="kind">${KIND(p.kind)}</span></div></div>${ex ? '<span class="ex">Exemple</span>' : ''}</div>
    <button style="all:unset;cursor:pointer;display:block;width:100%" data-open="${p.id}" aria-label="Voir ${esc(p.name)}">${photoBlock(p)}</button>
    <div class="body">${rootLine}<h3>${esc(p.name)}</h3>${pr ? facts(p) : ''}${p.desc ? `<p class="desc">${esc(p.desc)}</p>` : ''}${sc}
      <div class="acts"><button class="btn" data-open="${p.id}">${pr ? 'Voir' : 'Recette'}</button>${ex ? '' : `<button class="btn pri" data-remake="${p.rootId || p.id}">${pr ? 'Je l’ai goûté' : 'Je l’ai refait'}</button>`}</div></div>
  </article>`;
}
function render(){
  // fil
  let L = groups().sort((a, b) => b.last - a.last);
  if (feedK !== 'all') L = L.filter(g => (g.orig.kind || 'plat') === feedK);
  const feed = $('#feed');
  if (!S.posts.length){
    feed.innerHTML = `<div class="note"><h2>Votre carnet est vide</h2><p>Publie ton premier plat avec le bouton <b>+</b>. En attendant, voici à quoi ressemblera le fil :</p></div>` + EXAMPLES.map(o => stackCard({orig:o, list:[o], n:1})).join('');
  } else feed.innerHTML = L.length ? L.map(stackCard).join('') : '<p class="empty">Rien dans cette catégorie pour l’instant.</p>';
  renderBook(); renderMe(); renderCart();
}
const ixHtml = g => g.re ? `<span class="ix">${g.re}<small>${g.prod ? 'fois goûtée' : 'fois refaite'}</small></span>` : `<span class="ix" style="color:var(--muted);font-size:15px">–<small>${g.prod ? 'à goûter' : 'à refaire'}</small></span>`;
const BT = {wants:false, kitchen:false};
// Vignette du carnet : photo de l'original ; si la recette a été refaite, des cartes empilées derrière et un compteur.
function thumb(g){
  const k = g.n - 1, inner = `<span class="th" style="background:${colorFor(g.orig.name)}">${g.photo ? `<img src="${g.photo}" alt="">` : esc(g.orig.name[0])}</span>`;
  if (!k) return inner;
  return `<span class="thw ${k > 1 ? 'k2' : 'k1'}" title="${k} réalisation${k > 1 ? 's' : ''} de plus">${inner}<span class="thn">${g.prod ? '' : '×'}${g.n}</span></span>`;
}
function renderBook(){
  const q = $('#q').value.trim().toLowerCase(), sort = $('#sort').value;
  let G = S.posts.length ? groups() : EXAMPLES.map(exGroup);
  if (bookK !== 'all') G = G.filter(g => (g.orig.kind || 'plat') === bookK);
  if (q) G = G.filter(g => (g.orig.name + ' ' + (g.orig.ingredients || []).join(' ')).toLowerCase().includes(q));
  if (BT.wants) G = G.filter(g => myWants().includes(g.orig.id));
  if (BT.kitchen) G = G.filter(g => (g.tools || []).every(t => S.kitchen.includes(t)));
  const key = {n:g => -g.re, wants:g => -g.wants, easy:g => g.diff || 9, fast:g => g.minutes || 9999, new:g => -g.last}[sort] || (g => -g.re);
  G.sort((a, b) => key(a) - key(b) || b.last - a.last);
  const why = BT.wants && !myWants().length ? 'Touche ♡ sur une recette pour la garder dans tes envies.'
    : BT.kitchen && !S.kitchen.length ? 'Indique d’abord tes ustensiles dans Moi › Ma cuisine.' : 'Aucune recette ne correspond.';
  $('#book').innerHTML = G.length ? G.map(g => `<button class="row" data-open="${g.orig.id}">
      ${thumb(g)}
      <span class="tx"><b>${esc(g.orig.name)}</b><span>${g.prod ? esc(g.orig.style || 'Trouvaille') : `difficulté ${Math.round(g.diff)}/5${g.minutes ? ' · ' + g.minutes + ' min' : ''}`}${g.wants ? ` · ♡ ${g.wants}` : ''}${g.ex ? ' · exemple' : ''}</span></span>
      ${ixHtml(g)}</button>`).join('')
    : `<p class="empty">${why}</p>`;
}
function renderMe(){
  const mine = S.posts.filter(p => p.author === S.me);
  const roots = new Set(mine.filter(p => !p.remakeOf).map(p => p.id));
  const refaits = S.posts.filter(p => p.remakeOf && roots.has(p.rootId) && p.author !== S.me).length;
  const envies = groups().filter(g => g.orig.author === S.me).reduce((a, g) => a + g.wants, 0);
  $('#myStats').innerHTML = `<div class="stat"><b>${roots.size}</b><span>recettes partagées</span></div>
    <div class="stat"><b>${refaits}</b><span>fois refaites par la tribu</span></div>
    <div class="stat"><b>${envies}</b><span>envies de les faire</span></div>`;
  $('#kitchen').innerHTML = TOOLS.map(t => `<button class="tt" data-kit="${t.id}" aria-pressed="${S.kitchen.includes(t.id)}">${SVGI(t.i)}${t.l}${t.s ? `<small>${t.s}</small>` : ''}</button>`).join('');
  $('#myPosts').innerHTML = mine.length ? groups().filter(g => g.orig.author === S.me).map(g => `<button class="row" data-open="${g.orig.id}">${thumb(g)}<span class="tx"><b>${esc(g.orig.name)}</b><span>${g.re ? `${g.prod ? 'goûtée' : 'refaite'} par ${g.people.map(a => esc(a === S.me ? 'toi' : nameOf(a))).join(', ')}` : (g.prod ? 'pas encore goûtée' : 'pas encore refaite')}${g.wants ? ` · ♡ ${g.wants}` : ''}</span></span>${ixHtml(g)}</button>`).join('') : '<p class="hint">Tes plats apparaîtront ici.</p>';
  renderInvite();
}
function renderCart(){
  const box = $('#cart');
  if (!S.cart.length){ box.innerHTML = '<p class="empty">Ta liste est vide.</p>'; $('#cartActs').style.display = 'none'; return; }
  $('#cartActs').style.display = '';
  const by = {}; S.cart.forEach((it, i) => { (by[it.from || 'Divers'] = by[it.from || 'Divers'] || []).push([it, i]); });
  box.innerHTML = Object.entries(by).map(([from, L]) => `<div class="cart-g"><h3>${esc(from)}</h3>${L.map(([it, i]) => `<div class="ci ${it.done ? 'done' : ''}"><input type="checkbox" id="ci${i}" data-ci="${i}" ${it.done ? 'checked' : ''}><label for="ci${i}">${esc(it.t)}</label></div>`).join('')}</div>`).join('');
}

/* ================= détail ================= */
let curDetail = null;
function versionsHtml(base, remakes, ex){
  if (base.kind === 'trouvaille') return '';
  let V = remakes.filter(r => r.twist).map(r => { const fol = remakes.filter(x => x.fromTwist === r.id); const sc = fol.filter(x => x.author !== base.author && +x.gout > 0);
    return {r, fol, avg:sc.length ? sc.reduce((a, x) => a + +x.gout, 0) / sc.length : null}; });
  if (ex && base.exTwist) V = [{r:{id:'', author:base.exLast, twist:base.exTwist, gout:5, photos:[]}, fol:new Array(base.exTwistN || 0), avg:null, ex:true}];
  if (!V.length) return '';
  V.sort((a, b) => b.fol.length - a.fol.length || (b.r.createdAt || 0) - (a.r.createdAt || 0));
  return `<div><div class="lbl" style="margin-bottom:6px">Les versions à la sauce de la tribu (${V.length})</div><div class="vers">${V.map(v => { const who = v.ex ? v.r.author : nameOf(v.r.author), mine = !v.ex && v.r.author === S.me;
    return `<div class="ver"${v.ex ? '' : ` data-ver="${v.r.id}"`}><div class="i">${v.r.photos && v.r.photos[0] ? `<img src="${v.r.photos[0]}" alt="">` : '🧂'}</div><div class="tx"><b>${mine ? 'Ta version' : 'La version de ' + esc(who)}</b><q>${esc(v.r.twist)}</q>
      <span class="hint">${v.fol.length ? `refaite ${v.fol.length} fois` : 'pas encore refaite'}</span>
      ${v.ex || mine ? '' : `<div style="margin-top:6px"><button class="btn" style="padding:6px 12px" data-remake="${base.id}" data-variant="${v.r.id}">Refaire cette version</button></div>`}</div></div>`; }).join('')}</div></div>`;
}
function openDetail(id){
  const ex = EXAMPLES.find(e => e.id === id);
  const p = ex || S.posts.find(x => x.id === id); if (!p) return;
  curDetail = p.id;
  const g = ex ? null : groupOf(p.rootId || p.id);
  const base = g ? g.orig : p;
  const gal = (g ? g.list : [p]).flatMap(x => x.photos || []);
  const mine = !ex && p.author === S.me;
  const remakes = g ? g.list.filter(x => x.id !== base.id) : [];
  const pr = base.kind === 'trouvaille';
  $('#dTitle').textContent = pr ? 'Trouvaille' : base.kind === 'boisson' ? 'À boire' : 'Recette';
  $('#dBody').innerHTML = `
    ${gal.length ? `<div class="gal">${gal.map(src => `<img src="${src}" alt="">`).join('')}</div>` : photoBlock(base)}
    <div><div class="kind">${KIND(base.kind)} · par ${esc(ex ? base.author : nameOf(base.author))}</div><h2 style="font-size:26px;margin-top:4px">${esc(base.name)}</h2>${base.desc ? `<p class="desc">${esc(base.desc)}</p>` : ''}${base.source ? `<p class="hint">D'après ${esc(base.source)}</p>` : ''}${base.editedAt ? `<p class="hint">Modifié ${ago(base.editedAt)}</p>` : ''}</div>
    ${scoresHtml(g || exGroup(base), false, true)}${!pr && (base.tools || []).length ? `<div class="tools">${toolLabels(base.tools)}</div>` : ''}${pr ? facts(base) : ''}
    <p class="hint">${[base.portions ? base.portions + ' portion' + (base.portions > 1 ? 's' : '') : ''].filter(Boolean).join(' · ')}</p>
    ${(base.ingredients || []).length ? `<div><div class="lbl" style="margin-bottom:4px">Ingrédients</div><ul class="ing">${base.ingredients.map(i => `<li>${esc(i)}</li>`).join('')}</ul></div>` : ''}
    ${(base.steps || []).length ? `<div><div class="lbl" style="margin-bottom:4px">Étapes</div><ol class="stp">${base.steps.map(i => `<li>${esc(i)}</li>`).join('')}</ol></div>` : ''}
    <div class="bar"${pr ? ' data-pr="1"' : ''}>${ex ? '' : `<button class="btn pri" style="flex:1" data-remake="${base.id}">${pr ? 'Je l’ai goûté' : 'Je l’ai refait'}</button>${wantBtn(base.id, pr, true)}`}${(base.ingredients || []).length ? `<button class="btn" style="flex:1" data-addcart="${p.id}">Ajouter aux courses</button>` : ''}</div>
    ${versionsHtml(base, remakes, ex)}
    ${remakes.length ? `<div><div class="lbl" style="margin-bottom:6px">${pr ? 'Goûté' : 'Refait'} par la tribu (${remakes.length})</div><div class="mk">${remakes.map(r => `<div class="m" data-ver="${r.id}"><div class="i">${r.photos && r.photos[0] ? `<img src="${r.photos[0]}" alt="">` : ''}</div><div style="flex:1"><b>${esc(nameOf(r.author))}</b><br><span class="hint">${r.author === base.author ? 'sa propre recette · ' : ''}${ago(r.createdAt)}</span>${r.twist ? '<br><b style="color:var(--saffron)">À sa sauce</b>' : ''}${r.desc ? `<br>${esc(r.desc)}` : ''}${r.editedAt ? ' <span class="hint">(modifié)</span>' : ''}</div>${r.author === S.me && S.canWrite ? `<button class="btn" style="align-self:center;padding:6px 12px" data-edit="${r.id}">Modifier</button>` : ''}</div>`).join('')}</div></div>` : ''}
    ${ex ? '<p class="hint">Ceci est un exemple : publie ton premier plat pour remplir le carnet.</p>' : `<div><div class="lbl" style="margin-bottom:6px">Commentaires</div><div id="cmts" style="display:flex;flex-direction:column;gap:8px"><p class="hint">Chargement…</p></div>
      ${S.canWrite ? `<form class="cmf" id="cmf" style="margin-top:8px"><input id="cmIn" maxlength="400" placeholder="Un mot sur ce plat…" aria-label="Commentaire"><button class="btn pri">Envoyer</button></form>` : ''}</div>`}
    ${mine ? `<div class="bar">${S.canWrite || S.mode !== 'db' ? `<button class="btn" style="flex:1" data-edit="${p.id}">Modifier ce post</button>` : ''}<button class="btn danger ghost" style="flex:1" id="delPost" data-id="${p.id}">Supprimer ce post</button></div>` : ''}`;
  $('#detail').classList.add('on');
  if (!ex) watchComments(base.id);
}
function openVersion(id){
  const v = S.posts.find(x => x.id === id); if (!v) return;
  const g = groupOf(v.rootId || v.id), o = g ? g.orig : null; if (!o){ openDetail(id); return; }
  if (S.unsubC){ S.unsubC(); S.unsubC = null; }
  curDetail = v.id;
  const pr = o.kind === 'trouvaille', mine = v.author === S.me, who = mine ? 'toi' : nameOf(v.author);
  const norm = t => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
  const oi = new Set((o.ingredients || []).map(norm)), vi = new Set((v.ingredients || []).map(norm));
  const gone = (o.ingredients || []).filter(t => !vi.has(norm(t)));
  const stepsSame = (v.steps || []).join('\n') === (o.steps || []).join('\n');
  const follow = S.posts.filter(x => x.fromTwist === v.id);
  $('#dTitle').textContent = v.twist ? 'Version à la sauce' : (pr ? 'Avis' : 'Réalisation');
  $('#dBody').innerHTML = `
    ${(v.photos || []).length ? `<div class="gal">${v.photos.map(src => `<img src="${src}" alt="">`).join('')}</div>` : ''}
    <div><div class="kind">${mine ? (v.twist ? 'Ta version à ta sauce' : 'Ta réalisation') : (v.twist ? 'À la sauce de ' : (pr ? 'Goûté par ' : 'Refait par ')) + esc(who)} · ${ago(v.createdAt)}</div><h2 style="font-size:26px;margin-top:4px">${esc(v.name)}</h2>
      ${v.twist ? `<div class="sauce" style="margin-top:8px"><span class="tg">${mine ? 'Ta touche' : 'Sa touche'}</span><span>${esc(v.twist)}</span></div>` : ''}
      ${v.desc ? `<p class="desc">${esc(v.desc)}</p>` : ''}</div>
    <div class="scores">${v.minutes ? `<span class="sc">${v.minutes} min</span>` : ''}${v.portions ? `<span class="sc">${v.portions} portion${v.portions > 1 ? 's' : ''}</span>` : ''}${follow.length ? `<span class="sc">Refaite ${follow.length} fois</span>` : ''}</div>
    ${!pr && (v.tools || []).length ? `<div class="tools">${toolLabels(v.tools)}</div>` : ''}
    ${(v.ingredients || []).length ? `<div><div class="lbl" style="margin-bottom:4px">Ingrédients</div><ul class="ing">${v.ingredients.map(t => oi.size && !oi.has(norm(t)) ? `<li class="new">${esc(t)}<span class="nw">nouveau</span></li>` : `<li>${esc(t)}</li>`).join('')}</ul>
      ${gone.length && (v.ingredients || []).length ? `<p class="gone">Retiré par rapport à l’original : ${gone.map(t => `<s>${esc(t)}</s>`).join(', ')}</p>` : ''}</div>` : ''}
    ${(v.steps || []).length ? `<div><div class="lbl" style="margin-bottom:4px">Étapes${stepsSame ? ' <span class="hint">(comme l’original)</span>' : ''}</div><ol class="stp">${v.steps.map(t => `<li>${esc(t)}</li>`).join('')}</ol></div>` : ''}
    <div class="bar">${!mine && v.twist && !pr ? `<button class="btn pri" style="flex:1" data-remake="${o.id}" data-variant="${v.id}">Refaire cette version</button>` : ''}${(v.ingredients || []).length ? `<button class="btn" style="flex:1" data-addcart="${v.id}">Ajouter aux courses</button>` : ''}</div>
    <button class="btn" data-open="${o.id}">← ${o.author === S.me ? (pr ? 'Ta trouvaille' : 'Ta recette originale') : (pr ? 'La trouvaille de ' : 'La recette originale de ') + esc(nameOf(o.author))}</button>
    ${mine ? `<div class="bar"><button class="btn" style="flex:1" data-edit="${v.id}">Modifier</button><button class="btn danger ghost" style="flex:1" id="delPost" data-id="${v.id}">Supprimer</button></div>` : ''}`;
  $('#detail').classList.add('on'); $('#detail .sb').scrollTop = 0;
}
function closeDetail(){ $('#detail').classList.remove('on'); curDetail = null; if (S.unsubC){ S.unsubC(); S.unsubC = null; } }
function watchComments(postId){
  const show = L => { const b = $('#cmts'); if (!b) return;
    b.innerHTML = L.length ? L.map(c => `<div class="cm">${avatar(c.author)}<div class="bub"><b>${esc(nameOf(c.author))}</b> <span class="hint">${ago(c.at)}</span><p>${esc(c.text)}</p></div></div>`).join('') : '<p class="hint">Pas encore de commentaire.</p>'; };
  let load = null;
  if (S.mode === 'sb'){
    if (S.unsubC) S.unsubC();
    load = async () => { const r = await S.sb.from('comments').select('author, text, created_at').eq('post_id', postId).order('created_at').limit(200);
      show((r.data || []).map(c => ({author:c.author, text:c.text, at:Date.parse(c.created_at)}))); };
    load();
    const ch = S.sb.channel('cm-' + postId).on('postgres_changes', {event:'INSERT', schema:'public', table:'comments', filter:'post_id=eq.' + postId}, load).subscribe();
    S.unsubC = () => S.sb.removeChannel(ch);
  } else show((local.read().comments || {})[postId] || []);
  const f = $('#cmf'); if (f) f.onsubmit = async e => { e.preventDefault(); const t = $('#cmIn').value.trim(); if (!t) return; $('#cmIn').value = '';
    const c = {author:S.me, text:t, at:Date.now()};
    if (S.mode === 'sb'){ const r = await S.sb.from('comments').insert({post_id:postId, tribe_id:S.tribe.id, text:t}); if (r.error) toast('Commentaire non envoyé : réessaie.'); else if (load) load(); }
    else { const d = local.read(); d.comments = d.comments || {}; (d.comments[postId] = d.comments[postId] || []).push(c); local.write(d); show(d.comments[postId]); } };
}

/* ================= publier ================= */
const C = {photos:[], blobs:[], paths:[], kind:'plat', gout:0, diff:0, remake:null, tools:[]};
/* Garde tactile : un appui ne compte que s'il est franc. On annule l'appui (et donc le clic, la note,
   la publication, l'ouverture du clavier) si le doigt a glissé, si la page défilait au moment du contact
   (appui pour stopper l'élan), si elle a défilé pendant le geste, ou si l'élément a bougé sous le doigt
   (clavier qui se ferme, mise en page qui saute). */
const TAP = {x:0, y:0, t:0, moved:false, scrollAt:0, active:false, during:false, was:false, el:null, top:0, blockAt:0};
const TAPPABLE = 'button,label,input,textarea,select,.chip,[data-open],a';
document.addEventListener('touchstart', e => { const t = e.touches[0]; const now = Date.now();
  Object.assign(TAP, {x:t.clientX, y:t.clientY, t:now, moved:false, active:true, during:false, was:now - TAP.scrollAt < 160});
  TAP.el = e.target.closest ? e.target.closest(TAPPABLE) : null; TAP.top = TAP.el ? TAP.el.getBoundingClientRect().top : 0; }, {passive:true, capture:true});
document.addEventListener('touchmove', e => { const t = e.touches[0]; if (Math.abs(t.clientX - TAP.x) > 8 || Math.abs(t.clientY - TAP.y) > 8) TAP.moved = true; }, {passive:true, capture:true});
document.addEventListener('scroll', () => { TAP.scrollAt = Date.now(); if (TAP.active) TAP.during = true; }, {passive:true, capture:true});
if (window.visualViewport) visualViewport.addEventListener('resize', () => { TAP.scrollAt = Date.now(); if (TAP.active) TAP.during = true; });
document.addEventListener('touchend', e => { TAP.active = false; if (e.touches.length) return;
  const el = TAP.el; if (!el) return;
  const field = el.matches('input,textarea,select');
  const shifted = Math.abs(el.getBoundingClientRect().top - TAP.top) > 6;
  const long = !field && Date.now() - TAP.t > 900;
  if (TAP.moved || TAP.during || TAP.was || shifted || long){ TAP.blockAt = Date.now(); if (e.cancelable && !(field && document.activeElement === el)) e.preventDefault(); }
}, {passive:false, capture:true});
document.addEventListener('click', e => { if (Date.now() - TAP.blockAt < 600 && e.target.closest && e.target.closest(TAPPABLE)){ e.preventDefault(); e.stopPropagation(); TAP.blockAt = 0; } }, true);
const realTap = () => !TAP.moved && Date.now() - TAP.blockAt > 600;
function rateUI(el, lab, key, words){
  el.innerHTML = [1,2,3,4,5].map(i => `<button type="button" data-v="${i}" aria-label="${words[i]}">${key === 'diff' ? '●' : '★'}</button>`).join('');
  const paint = () => { $$('#' + el.id + ' button').forEach(b => b.classList.toggle('on', +b.dataset.v <= C[key])); lab.textContent = C[key] ? words[C[key]] : 'Touche pour noter'; };
  el.onclick = e => { const b = e.target.closest('button'); if (!b || !realTap()) return; C[key] = +b.dataset.v; paint(); };
  paint();
}
function applyKind(){
  $('#compose').classList.toggle('prod', C.kind === 'trouvaille');
  $$('#cKind button').forEach(b => b.classList.toggle('on', b.dataset.k === C.kind));
  $('#cName').placeholder = C.kind === 'trouvaille' ? 'Ex. Brasserie du Mont-Blanc, la Blanche' : C.kind === 'boisson' ? 'Ex. Spritz au pamplemousse' : 'Ex. Tarte tatin de Mamie';
  $('#cDesc').placeholder = C.kind === 'trouvaille' ? 'Ce qu’elle a de particulier, avec quoi la boire…' : 'Ce qui le rend bon, l’occasion…';
  if (!C.remake && !C.edit) $('#cTitle').textContent = C.kind === 'trouvaille' ? 'Nouvelle trouvaille' : C.kind === 'boisson' ? 'Nouvelle boisson' : 'Nouveau plat';
  $('#cSend').textContent = C.edit ? 'Enregistrer les modifications' : 'Publier dans le carnet';
  const pr = C.kind === 'trouvaille';
  const ownRe = C.remake && C.remake.author === S.me;
  $('#fGout').style.display = 'none';
  drawTools();
  $('#fDiff').style.display = (!C.remake && !pr) ? '' : 'none';
  $('#noteHint').textContent = C.remake
    ? (pr ? 'Pas de note : ton passage compte dans « Goûtée N fois ».' : (ownRe ? 'Tu refais ta propre recette : elle compte dans « Refaite N fois ».' : 'Pas de note : ta réalisation compte dans « Refaite N fois ». La difficulté et le temps restent ceux de ' + nameOf(C.remake.author) + '.'))
    : pr ? 'Pas de note : la tribu montre qu’elle aime en la goûtant à son tour.'
         : 'Pas de note de goût : la tribu montre qu’elle aime en refaisant ta recette.';
}
function remakeBanner(o, line, sub){
  const by = o.author === S.me ? 'ta recette' : (o.kind === 'trouvaille' ? 'partagée par ' : 'la recette de ') + esc(nameOf(o.author));
  const th = o.photos && o.photos.length ? `<img src="${o.photos[0]}" alt="">` : esc((o.name || '?')[0]);
  return `<span class="th" style="background:${colorFor(o.name)}">${th}</span><span>${line}${o.remakeOf ? '' : ` <span style="color:var(--muted)">(${by})</span>`}<small>${sub}</small></span>`;
}
function drawTools(){
  $('#cTools').innerHTML = TOOLS.filter(t => C.kind === 'boisson' || t.id !== 'shaker').map(t => `<button type="button" class="tt" data-tool="${t.id}" aria-pressed="${C.tools.includes(t.id)}">${SVGI(t.i)}${t.l}${t.s ? `<small>${t.s}</small>` : ''}</button>`).join('');
}
function sauceUI(){ const on = $('#cSauceOn').checked; $('#fTwist').style.display = on ? '' : 'none'; }
function openCompose(remakeRoot, editId, variantId){
  if (S.mode === 'sb' && !S.tribe){ showGate('tribe'); return; }
  Object.assign(C, {alsoTribes:[], photos:[], blobs:[], paths:[], kind:'plat', gout:0, diff:0, remake:null, edit:null, variant:null, tools:[]});
  $('#cSauceOn').checked = false; $('#cTwist').value = '';
  ['#cName','#cDesc','#cSrc','#cPort','#cMin','#cIng','#cSteps','#pMaker','#pStyle','#pAbv','#pWhere'].forEach(s => $(s).value = ''); $('#labMsg').textContent = 'Prends la bouteille ou l’étiquette en photo : l’IA remplit le nom, le producteur, le style et le degré.';
  $('#cErr').textContent = ''; $('#aiMsg').textContent = ''; $('#cRemake').style.display = 'none';
  if (remakeRoot){
    const g = groupOf(remakeRoot); const o = g ? g.orig : null;
    if (o){ C.remake = o; C.kind = o.kind || 'plat'; $('#cName').value = o.name; $('#cPort').value = o.portions || ''; $('#cSrc').value = o.source || ''; $('#cMin').value = o.minutes || '';
      $('#cIng').value = (o.ingredients || []).join('\n'); $('#cSteps').value = (o.steps || []).join('\n'); C.tools = (o.tools || []).slice();
      $('#pMaker').value = o.maker || ''; $('#pStyle').value = o.style || ''; $('#pAbv').value = o.abv || ''; $('#pWhere').value = o.where || '';
      $('#cRemake').innerHTML = remakeBanner(o, o.kind === 'trouvaille' ? `Tu as goûté <b>${esc(o.name)}</b>` : `Tu refais <b>${esc(o.name)}</b>`, o.kind === 'trouvaille' ? 'Ajoute ta photo et ta note.' : 'Ajoute ta photo et ce que tu as changé.'); $('#cRemake').style.display = ''; }
  }
  if (C.remake && variantId){ const v = S.posts.find(x => x.id === variantId); if (v && v.twist){ C.variant = v;
      $('#cRemake').innerHTML = remakeBanner(v, `Tu refais <b>${esc(C.remake.name)}</b> à la sauce de ${esc(v.author === S.me ? 'toi' : nameOf(v.author))}`, `« ${esc(v.twist)} »`); } }
  const e = editId ? S.posts.find(x => x.id === editId && x.author === S.me) : null;
  if (e){ C.edit = e; C.kind = e.kind || 'plat'; C.gout = e.gout || 0; C.diff = e.diff || 0; C.tools = (e.tools || []).slice(); C.photos = (e.photos || []).slice(0, 3); C.paths = S.mode === 'sb' ? (e.photoPaths || []).slice(0, C.photos.length) : C.photos.map(() => null); C.blobs = C.photos.map(u => /^data:/.test(u) ? dataToBlob(u) : null);
    $('#cName').value = e.name || ''; $('#cDesc').value = e.desc || ''; $('#cSrc').value = e.source || ''; $('#cPort').value = e.portions || ''; $('#cMin').value = e.minutes || '';
    $('#cIng').value = (e.ingredients || []).join('\n'); $('#cSteps').value = (e.steps || []).join('\n');
    $('#pMaker').value = e.maker || ''; $('#pStyle').value = e.style || ''; $('#pAbv').value = e.abv || ''; $('#pWhere').value = e.where || '';
    if (e.remakeOf){ const g = groupOf(e.rootId); C.remake = g ? g.orig : {id:e.remakeOf, kind:e.kind, name:e.name}; }
    if (e.twist){ $('#cSauceOn').checked = true; $('#cTwist').value = e.twist; }
    if (e.fromTwist) C.variant = S.posts.find(x => x.id === e.fromTwist) || null; }
  $('#cTitle').textContent = C.edit ? 'Modifier' : C.remake ? (C.kind === 'trouvaille' ? 'Je l’ai goûté' : 'Je l’ai refait') : 'Nouveau plat';
  const lockKind = C.remake || (C.edit && S.posts.some(x => x.rootId === C.edit.id && x.id !== C.edit.id));
  $('#aiBox').style.display = C.remake ? 'none' : ''; $('#prodBox').style.display = C.remake ? 'none' : ''; $('#cKind').style.display = lockKind ? 'none' : '';
  const others = S.mode === 'sb' && !C.remake && !C.edit ? S.tribes.filter(t => !S.tribe || t.id !== S.tribe.id) : [];
  C.alsoTribes = (C.alsoTribes || []).filter(id => others.some(t => t.id === id));
  $('#alsoBox').style.display = others.length ? '' : 'none';
  $('#alsoList').innerHTML = others.map(t => `<button type="button" class="chip" data-also="${t.id}" aria-pressed="${C.alsoTribes.includes(t.id)}">${C.alsoTribes.includes(t.id) ? '✓ ' : ''}${esc(t.name)}</button>`).join('');
  $('#alsoHint').textContent = S.tribe ? `Toujours publié dans « ${S.tribe.name} ». Chaque tribu cochée reçoit sa propre copie, avec ses refaits, envies et commentaires.` : '';
  $('#sauceBox').style.display = (C.remake && C.kind !== 'trouvaille') ? 'flex' : 'none'; sauceUI();
  applyKind();
  rateUI($('#rGout'), $('#rGoutL'), 'gout', GOUT); rateUI($('#rDiff'), $('#rDiffL'), 'diff', DIFF);
  drawShots(); $('#compose').classList.add('on'); setTimeout(() => $('#compose .sb').scrollTop = 0, 0);
}
function dataToBlob(u){ const [h, b] = u.split(','); const bin = atob(b); const a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return new Blob([a], {type:(h.match(/:(.*?);/) || [,'image/jpeg'])[1]}); }
function drawShots(){
  $('#shots').innerHTML = C.photos.map((src, i) => `<div class="shot"><img src="${src}" alt="Photo ${i+1}"><button data-rm="${i}" aria-label="Retirer la photo">✕</button></div>`).join('')
    + (C.photos.length < 3 ? `<label class="addshot" for="file" id="addShot" role="button" tabindex="0">${C.photos.length ? '+ Photo' : 'Prendre ou choisir une photo'}</label>` : '');
}
function resize(file, max, q){
  return new Promise((res, rej) => { const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => { const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight)); const c = document.createElement('canvas');
      c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url); c.toBlob(b => b ? res({blob:b, data:c.toDataURL('image/jpeg', q)}) : rej(new Error('photo')), 'image/jpeg', 0.85); };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('photo')); }; img.src = url; });
}
async function addFiles(files){
  for (const f of [...files].slice(0, 3 - C.photos.length)){
    try { const r = await resize(f, 680, 0.72); const big = await resize(f, 1400, 0.85); C.photos.push(S.mode === 'sb' ? big.data : r.data); C.blobs.push(big.blob); C.paths.push(null); }
    catch(e){ toast('Cette photo n’a pas pu être lue. Essaie une autre image (JPEG ou PNG).'); }
  }
  drawShots();
}

let aiCtl = null, AI_ON = false;
async function initAI(){
  AI_ON = S.mode === 'sb';
  if (!AI_ON){ $('#aiGo').disabled = true; $('#recGo').style.display = 'none'; $('#aiMsg').textContent = 'La pré-saisie par l’IA fonctionne dans la version connectée de Tablée.'; }
}
const blobToB64 = b => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(b); });
// Appel de la fonction serveur « ai » (la clé Claude reste sur le serveur).
async function callAI(mode, {name = '', kind = 'plat', blobs = []} = {}){
  const {data} = await S.sb.auth.getSession(); const token = data && data.session && data.session.access_token;
  if (!token) throw {code:'not_authenticated'};
  const images = []; for (const b of blobs.filter(Boolean).slice(0, 3)) images.push(await blobToB64(b));
  let res;
  try { res = await fetch(CFG.supabaseUrl + '/functions/v1/ai', {method:'POST', signal:aiCtl ? aiCtl.signal : undefined,
      headers:{'Authorization':'Bearer ' + token, 'apikey':CFG.supabaseAnonKey, 'Content-Type':'application/json'}, body:JSON.stringify({mode, name, kind, images})}); }
  catch(e){ throw {code:e && e.name === 'AbortError' ? 'cancelled' : 'network'}; }
  let out = {}; try { out = await res.json(); } catch(e){}
  if (!res.ok || out.error) throw {code:out.error || 'upstream', limit:out.limit};
  if (out.remaining != null && out.remaining <= 5) setTimeout(() => toast(`Plus que ${out.remaining} pré-saisie${out.remaining > 1 ? 's' : ''} IA ce mois-ci.`), 1500);
  return out.result;
}
function fillFromAI(r, overwrite){
  const name = $('#cName').value.trim();
  if ((overwrite || !name) && r.nom) $('#cName').value = String(r.nom).slice(0, 80);
  if (r.description && (overwrite || !$('#cDesc').value)) $('#cDesc').value = String(r.description).slice(0, 160);
  if (r.source && !$('#cSrc').value) $('#cSrc').value = String(r.source).slice(0, 120);
  if (r.portions) $('#cPort').value = Math.max(1, Math.min(40, Math.round(+r.portions) || 4));
  if (r.minutes) $('#cMin').value = Math.max(1, Math.round(+r.minutes) || 30);
  if (Array.isArray(r.ingredients) && r.ingredients.length) $('#cIng').value = r.ingredients.map(String).join('\n');
  if (Array.isArray(r.etapes) && r.etapes.length) $('#cSteps').value = r.etapes.map(String).join('\n');
  if (r.difficulte && !C.diff){ C.diff = Math.max(1, Math.min(5, Math.round(+r.difficulte))); rateUI($('#rDiff'), $('#rDiffL'), 'diff', DIFF); }
  if (Array.isArray(r.ustensiles) && (overwrite || !C.tools.length)){ C.tools = r.ustensiles.map(String).filter(id => TOOL[id]); drawTools(); }
  if (r.boisson === true && C.kind !== 'boisson'){ C.kind = 'boisson'; $$('#cKind button').forEach(x => x.classList.toggle('on', x.dataset.k === 'boisson')); }
}
const AI_ERR = {cancelled:'Lecture arrêtée.', rate_limited:'Trop de demandes pour le moment : réessaie dans un instant.', quota:'Tu as utilisé toutes tes pré-saisies IA du mois : remplis la recette à la main, le compteur repart le 1er du mois.',
  image_rejected:'La photo n’a pas pu être lue : essaie une image plus nette (JPEG ou PNG).', invalid_json:'La réponse de l’IA était incomplète : réessaie.', not_configured:'L’IA n’est pas encore activée sur ce carnet (clé à ajouter dans Supabase).',
  network:'Pas de connexion internet : réessaie.', not_authenticated:'Reconnecte-toi pour utiliser l’IA.', image_required:'Ajoute d’abord une photo.'};
async function readRecipe(files){
  if (!AI_ON){ $('#aiMsg').textContent = 'La lecture par l’IA fonctionne dans la version connectée de Tablée.'; return; }
  const blobs = [];
  for (const f of [...files].slice(0, 3)){ try { blobs.push((await resize(f, 1600, 0.85)).blob); } catch(e){} }
  if (!blobs.length){ $('#aiMsg').textContent = AI_ERR.image_rejected; return; }
  aiCtl = new AbortController(); $('#aiGo').disabled = true; $('#recGo').style.opacity = .5; $('#aiStop').style.display = '';
  $('#aiMsg').textContent = 'L’IA lit la recette… (10 à 40 secondes)';
  try {
    const r = await callAI('recipe', {blobs});
    if (!r || typeof r !== 'object') throw {code:'invalid_json'};
    if (r.erreur){ $('#aiMsg').textContent = 'Recette illisible : ' + String(r.erreur).slice(0, 140) + ' Reprends la photo plus près, bien à plat et éclairée.'; return; }
    fillFromAI(r, true);
    $('#aiMsg').textContent = 'Recette lue : vérifie les quantités, ajoute la photo de ton plat, puis publie.';
  } catch(e){ $('#aiMsg').textContent = AI_ERR[e && e.code] || 'La lecture n’a pas abouti : réessaie ou remplis la recette à la main.'; }
  finally { $('#aiGo').disabled = false; $('#recGo').style.opacity = ''; $('#aiStop').style.display = 'none'; aiCtl = null; }
}
async function readLabel(){
  if (!AI_ON){ $('#labMsg').textContent = 'La reconnaissance fonctionne dans la version connectée de Tablée.'; return; }
  const blobs = C.blobs.filter(Boolean);
  if (!blobs.length){ $('#labMsg').textContent = 'Ajoute d’abord la photo de la bouteille ou de l’étiquette, en haut.'; return; }
  aiCtl = new AbortController(); $('#labGo').disabled = true; $('#labMsg').textContent = 'L’IA lit l’étiquette… (5 à 30 secondes)';
  try {
    const r = await callAI('label', {blobs});
    if (!r || typeof r !== 'object') throw {code:'invalid_json'};
    if (r.nom && !$('#cName').value.trim()) $('#cName').value = String(r.nom).slice(0, 80);
    if (r.producteur) $('#pMaker').value = String(r.producteur).slice(0, 80);
    if (r.style) $('#pStyle').value = String(r.style).slice(0, 60);
    if (r.degre != null && !isNaN(+r.degre)) $('#pAbv').value = +r.degre;
    if (r.description && !$('#cDesc').value) $('#cDesc').value = String(r.description).slice(0, 160);
    $('#labMsg').textContent = r.nom ? 'Étiquette lue : vérifie et publie.' : 'Étiquette difficile à lire : complète le nom à la main.';
  } catch(e){ $('#labMsg').textContent = AI_ERR[e && e.code] || 'La lecture n’a pas abouti : réessaie ou complète à la main.'; }
  finally { $('#labGo').disabled = false; aiCtl = null; }
}
async function runAI(){
  if (!AI_ON){ $('#aiMsg').textContent = 'La pré-saisie par l’IA fonctionne dans la version connectée de Tablée.'; return; }
  const name = $('#cName').value.trim(), blobs = C.blobs.filter(Boolean);
  if (!name && !blobs.length){ $('#aiMsg').textContent = 'Ajoute au moins une photo ou un nom.'; return; }
  aiCtl = new AbortController(); $('#aiGo').disabled = true; $('#aiStop').style.display = '';
  $('#aiMsg').textContent = 'L’IA regarde ta photo et prépare la recette… (10 à 40 secondes)';
  try {
    const r = await callAI('dish', {name, kind:C.kind, blobs});
    if (!r || typeof r !== 'object') throw {code:'invalid_json'};
    fillFromAI(r, false);
    $('#aiMsg').textContent = 'Recette pré-remplie : vérifie les quantités et corrige ce qui ne correspond pas à ta version.';
  } catch(e){ $('#aiMsg').textContent = AI_ERR[e && e.code] || 'La pré-saisie n’a pas abouti : réessaie ou remplis la recette à la main.'; }
  finally { $('#aiGo').disabled = false; $('#aiStop').style.display = 'none'; aiCtl = null; }
}
async function sendPost(){
  const name = $('#cName').value.trim();
  const prod = C.kind === 'trouvaille';
  const err = !name ? (prod ? 'Donne un nom à ta trouvaille.' : 'Donne un nom à ton plat.') : (!C.remake && !prod && !+$('#cMin').value) ? 'Indique le temps de préparation (en minutes).' : (!C.remake && !prod && !C.diff) ? 'Note la difficulté (de 1 à 5).' : '';
  if (err){ $('#cErr').textContent = err; return; }
  const lines = s => $(s).value.split('\n').map(x => x.trim()).filter(Boolean).slice(0, 40);
  const id = C.edit ? C.edit.id : uid();
  const p = {...(C.edit || {}), id, kind:C.kind, name, desc:$('#cDesc').value.trim(), source:$('#cSrc').value.trim(), photos:C.photos.slice(0, 3), portions:+$('#cPort').value || null, minutes:+$('#cMin').value || null,
    ingredients:prod ? [] : lines('#cIng'), steps:prod ? [] : lines('#cSteps'), gout:0, diff:(prod || C.remake) ? 0 : C.diff, tools:prod ? [] : C.tools.slice(),
    maker:prod ? $('#pMaker').value.trim() : '', style:prod ? $('#pStyle').value.trim() : '', abv:prod ? (+String($('#pAbv').value).replace(',', '.') || null) : null, where:prod ? $('#pWhere').value.trim() : '', author:S.me, createdAt:C.edit ? C.edit.createdAt : Date.now(),
    remakeOf:C.edit ? (C.edit.remakeOf || null) : C.remake ? C.remake.id : null, rootId:C.edit ? (C.edit.rootId || id) : C.remake ? C.remake.id : id};
  if (C.edit) p.editedAt = Date.now();
  const tw = (C.remake && !prod && $('#cSauceOn').checked) ? $('#cTwist').value.trim() : '';
  if (C.remake && !prod && $('#cSauceOn').checked && !tw){ $('#cErr').textContent = 'Dis en quelques mots ce que tu as ajouté ou changé.'; return; }
  p.twist = tw; p.fromTwist = C.variant ? C.variant.id : (C.edit && C.edit.fromTwist) || null;
  for (const k of ['rootName','rootAuthor']) if (p[k] === undefined) delete p[k];
  $('#cSend').disabled = true; $('#cSend').textContent = C.edit ? 'Enregistrement…' : 'Publication…';
  const wasEdit = !!C.edit;
  try { if (S.mode === 'sb'){ const old = (C.edit && C.edit.photoPaths) || []; p.photoPaths = await uploadPhotos(id); p.photos = C.photos.slice(0, 3);
      const gone = old.filter(x => !p.photoPaths.includes(x)); if (gone.length) S.sb.storage.from('photos').remove(gone); }
    await savePost(p);
    const also = (S.mode === 'sb' && !C.remake && !wasEdit) ? (C.alsoTribes || []) : [];
    let copied = 0; for (const t of also){ try { await copyToTribe(p, t); copied++; } catch(err){} }
    if (also.length && copied < also.length) toast('Publié ici, mais la copie dans une autre tribu a échoué : réessaie depuis cette tribu.');
    $('#compose').classList.remove('on'); if (wasEdit){ toast('Modifications enregistrées.'); openDetail(p.id); return; } toast(C.remake ? (prod ? 'Ton avis est ajouté !' : p.twist ? 'Ta version à ta sauce est partagée !' : 'Bravo, c’est ajouté à la recette de la tribu !') : also.length && copied === also.length ? `Publié dans ${also.length + 1} tribus !` : 'Publié dans le carnet !'); show('fil'); }
  catch(e){ $('#cErr').textContent = e && e.code === 'upload' ? 'Une photo n’a pas pu être envoyée : vérifie ta connexion et réessaie.' : 'Publication impossible : vérifie ta connexion et réessaie.'; }
  finally { $('#cSend').disabled = false; $('#cSend').textContent = C.edit ? 'Enregistrer les modifications' : 'Publier dans le carnet'; }
}

/* ================= navigation & événements ================= */
function show(v){ $$('.view').forEach(e => e.classList.toggle('on', e.id === 'v-' + v)); $$('nav [data-v]').forEach(b => b.classList.toggle('on', b.dataset.v === v)); window.scrollTo(0, 0); try { history.replaceState(null, '', '#' + v); } catch(e){} }
$$('nav [data-v]').forEach(b => b.onclick = () => show(b.dataset.v));
$('#navPlus').onclick = () => openCompose(null);
$('#feedChips').onclick = e => { const b = e.target.closest('.chip'); if (!b) return; feedK = b.dataset.k; $$('#feedChips .chip').forEach(x => x.classList.toggle('on', x === b)); render(); };
$('#bookChips').onclick = e => { const b = e.target.closest('.chip'); if (!b) return; bookK = b.dataset.k; $$('#bookChips .chip').forEach(x => x.classList.toggle('on', x === b)); renderBook(); };
$('#q').oninput = renderBook; $('#sort').onchange = renderBook;
$('#bookTog').onclick = e => { const b = e.target.closest('.chip'); if (!b) return; BT[b.dataset.t] = !BT[b.dataset.t]; b.classList.toggle('on', BT[b.dataset.t]); b.setAttribute('aria-pressed', BT[b.dataset.t]); renderBook(); };
document.addEventListener('click', async e => {
  const o = e.target.closest('[data-open]'); if (o){ openDetail(o.dataset.open); return; }
  const ed = e.target.closest('[data-edit]'); if (ed){ closeDetail(); openCompose(null, ed.dataset.edit); return; }
  const r = e.target.closest('[data-remake]'); if (r){ closeDetail(); openCompose(r.dataset.remake, null, r.dataset.variant || null); return; }
  const al = e.target.closest('[data-also]'); if (al){ const id = al.dataset.also; C.alsoTribes = C.alsoTribes.includes(id) ? C.alsoTribes.filter(x => x !== id) : [...C.alsoTribes, id]; al.setAttribute('aria-pressed', C.alsoTribes.includes(id)); al.textContent = (C.alsoTribes.includes(id) ? '✓ ' : '') + (S.tribes.find(t => t.id === id) || {}).name; return; }
  const w = e.target.closest('[data-want]'); if (w){ toggleWant(w.dataset.want); return; }
  const tb = e.target.closest('[data-tribe]'); if (tb){ const t = S.tribes.find(x => x.id === tb.dataset.tribe); if (t){ await enterTribe(t); show('fil'); } return; }
  if (e.target.closest('#invShare')){ const link = inviteLink(S.tribe.invite_code), text = `Rejoins notre carnet de recettes « ${S.tribe.name} » sur Tablée :`; if (navigator.share){ try { await navigator.share({title:'Tablée', text, url:link}); } catch(err){} } else { try { await navigator.clipboard.writeText(text + ' ' + link); toast('Lien copié : colle-le dans un message.'); } catch(err){ $('#invLink').select(); } } return; }
  if (e.target.closest('#invCopy')){ try { await navigator.clipboard.writeText(inviteLink(S.tribe.invite_code)); toast('Lien copié.'); } catch(err){ $('#invLink').select(); toast('Sélectionne le lien et copie-le.'); } return; }
  if (e.target.closest('#invReset')){ const r = await S.sb.rpc('reset_invite', {t:S.tribe.id}); if (!r.error){ S.tribe.invite_code = r.data; renderInvite(); toast('Nouveau lien créé : l’ancien ne marche plus.'); } return; }
  if (e.target.closest('#tSwitch')){ showGate('tribe'); return; }
  if (e.target.closest('#logout')){ signOut(); return; }
  const tl = e.target.closest('[data-tool]'); if (tl){ const id = tl.dataset.tool; C.tools = C.tools.includes(id) ? C.tools.filter(x => x !== id) : [...C.tools, id]; tl.setAttribute('aria-pressed', C.tools.includes(id)); return; }
  const kt = e.target.closest('[data-kit]'); if (kt){ const id = kt.dataset.kit; saveKitchen(S.kitchen.includes(id) ? S.kitchen.filter(x => x !== id) : [...S.kitchen, id]); return; }
  const vr = e.target.closest('[data-ver]'); if (vr && !e.target.closest('[data-addcart],#delPost')){ openVersion(vr.dataset.ver); return; }
  const a = e.target.closest('[data-addcart]'); if (a){ const p = S.posts.find(x => x.id === a.dataset.addcart) || EXAMPLES.find(x => x.id === a.dataset.addcart); const base = (p.remakeOf && (p.ingredients || []).length) ? p : (groupOf(p.rootId || p.id) || {orig:p}).orig;
    await saveCart([...S.cart, ...(base.ingredients || []).map(t => ({t, from:base.name, done:false}))]); toast(`${(base.ingredients || []).length} ingrédients ajoutés à ta liste.`); return; }
  const rm = e.target.closest('[data-rm]'); if (rm){ C.photos.splice(+rm.dataset.rm, 1); C.blobs.splice(+rm.dataset.rm, 1); C.paths.splice(+rm.dataset.rm, 1); drawShots(); return; }
  const d = e.target.closest('#delPost'); if (d){ if (d.dataset.armed){ try { await deletePost(d.dataset.id); closeDetail(); toast('Post supprimé.'); } catch(err){ toast('Suppression impossible.'); } } else { d.dataset.armed = 1; d.textContent = 'Toucher à nouveau pour confirmer'; } return; }
});
$('#file').onchange = e => { addFiles(e.target.files); e.target.value = ''; };
$('#recFile').onchange = e => { const f = [...e.target.files]; e.target.value = ''; if (f.length) readRecipe(f); };
$('#pasteBox').addEventListener('paste', e => {
  const files = [...(e.clipboardData ? e.clipboardData.items : [])].filter(i => i.kind === 'file' && i.type.startsWith('image/')).map(i => i.getAsFile()).filter(Boolean);
  e.preventDefault(); e.target.value = '';
  if (files.length) addFiles(files); else toast('Aucune photo dans le presse-papiers : copie d’abord l’image depuis ta galerie.');
});
$('#cKind').onclick = e => { const b = e.target.closest('button'); if (!b) return; C.kind = b.dataset.k; applyKind(); };
$('#cClose').onclick = () => $('#compose').classList.remove('on');
$('#dClose').onclick = closeDetail;
$('#aiGo').onclick = runAI; $('#labGo').onclick = readLabel; $('#aiStop').onclick = () => aiCtl && aiCtl.abort();
$('#cSend').onclick = sendPost;
document.addEventListener('scroll', e => { const c = e.target; if (!c.classList || !c.classList.contains('car')) return;
  const i = Math.round(c.scrollLeft / c.clientWidth), w = c.parentNode; w.querySelectorAll('.dots i').forEach((d, k) => d.classList.toggle('on', k === i));
  const n = w.querySelector('.nxt'); if (n) n.style.opacity = i ? 0 : 1;
  const card = c.closest('.post'); if (!card || card.dataset.vi == i) return; card.dataset.vi = i;
  const head = card.querySelector('.vhead'), btn = card.querySelector('.vbtn'); if (!head) return;
  if (!head.dataset.orig) head.dataset.orig = head.innerHTML;
  const sl = c.children[i], v = sl && sl.dataset.ver ? S.posts.find(x => x.id === sl.dataset.ver) : null;
  if (!v){ head.innerHTML = head.dataset.orig; btn.removeAttribute('data-ver'); btn.dataset.open = card.dataset.root; btn.textContent = card.dataset.pr ? 'Voir' : 'Recette'; return; }
  const who = v.author === S.me ? 'toi' : nameOf(v.author);
  head.innerHTML = `<button class="vtap" data-ver="${v.id}"><h3>${esc(v.name)}<span class="go">›</span></h3>
    <div class="sauce"><span class="tg">${v.twist ? (v.author === S.me ? 'À ta sauce' : 'À la sauce de ' + esc(who)) : (card.dataset.pr ? 'Goûté par ' : 'Refait par ') + esc(who)}</span><span>${esc(v.twist || v.desc || ago(v.createdAt))}</span></div>
    ${v.twist && v.desc ? `<p class="desc">${esc(v.desc)}</p>` : ''}</button>`;
  btn.removeAttribute('data-open'); btn.dataset.ver = v.id; btn.textContent = v.author === S.me ? 'Ma version' : 'Sa version';
}, {passive:true, capture:true});
$('#cSauceOn').onchange = () => { sauceUI(); if ($('#cSauceOn').checked) setTimeout(() => $('#cTwist').focus(), 50); };
$('#cart').onchange = e => { const i = e.target.dataset.ci; if (i === undefined) return; const items = S.cart.map((x, k) => k === +i ? {...x, done:e.target.checked} : x); saveCart(items); };
$('#clearDone').onclick = () => saveCart(S.cart.filter(x => !x.done));
$('#copyCart').onclick = async () => {
  const txt = S.cart.filter(x => !x.done).map(x => '• ' + x.t).join('\n');
  try { await navigator.clipboard.writeText(txt); toast('Liste copiée : colle-la dans un message ou tes notes.'); }
  catch(e){ const t = $('#cartText'); t.style.display = ''; t.value = txt; t.select(); toast('Sélectionne le texte et copie-le.'); }
};
document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.id === 'addShot'){ e.preventDefault(); $('#file').click(); return; } if ((e.key === 'Enter' || e.key === ' ') && e.target.id === 'recGo'){ e.preventDefault(); $('#recFile').click(); return; } if (e.key === 'Escape'){ if ($('#detail').classList.contains('on')) closeDetail(); else $('#compose').classList.remove('on'); } });
const h = (location.hash || '').slice(1); if (['fil','carnet','courses','moi'].includes(h)) show(h);

$('#gGo').onclick = doAuth; $('#gSwitch').onclick = () => { AUTH.signup = !AUTH.signup; $('#gErr').textContent = ''; paintAuth(); };
$('#gPass').addEventListener('keydown', e => { if (e.key === 'Enter') doAuth(); });
$('#tCreate').onclick = createTribe; $('#tJoin').onclick = joinFromInput; $('#gClose').onclick = () => $('#gate').classList.remove('on');
$('#mode').onclick = () => { if (S.mode === 'sb' && S.me) showGate('tribe'); };
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});

render();
initStore().then(initAI).catch(e => { console.error(e); $('#feed').innerHTML = '<p class="empty">Connexion au carnet impossible : vérifie ta connexion internet, puis recharge la page.</p>'; });