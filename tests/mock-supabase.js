// Faux Supabase en mémoire (persisté dans localStorage) pour tester l'application sans serveur.
// Utilisé seulement par les tests automatiques : jamais chargé par l'application publiée.
(function(){
  const KEY = '__mockdb';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch(e){ return null; } };
  const db = load() || {users:[], session:null, profiles:[], tribes:[], members:[], posts:[], comments:[], wants:[], user_data:[], files:{}};
  const save = () => localStorage.setItem(KEY, JSON.stringify(db));
  const uuid = () => crypto.randomUUID();
  const me = () => db.session && db.session.user.id;
  const now = () => new Date().toISOString();
  const REL = {tribes:['tribe_id', 'id'], profiles:['user_id', 'id']};
  const DEF = {
    posts: r => ({id:uuid(), author:me(), created_at:now(), descr:'', photos:[], ingredients:[], steps:[], tools:[], diff:0, twist:'', ...r}),
    comments: r => ({id:uuid(), author:me(), created_at:now(), ...r}),
    wants: r => ({user_id:me(), created_at:now(), ...r}),
    user_data: r => ({user_id:me(), cart:[], kitchen:[], ...r}),
  };
  const PK = {posts:['id'], comments:['id'], wants:['user_id','post_id'], user_data:['user_id'], members:['tribe_id','user_id'], tribes:['id'], profiles:['id']};

  function query(table){
    const q = {op:'select', filters:[], ord:null, lim:null, single:false, cols:'*', payload:null};
    const api = {
      select(c){ if (q.op === 'select') q.cols = c || '*'; return api; },
      insert(p){ q.op = 'insert'; q.payload = p; return api; },
      upsert(p){ q.op = 'upsert'; q.payload = p; return api; },
      update(p){ q.op = 'update'; q.payload = p; return api; },
      delete(){ q.op = 'delete'; return api; },
      eq(k, v){ q.filters.push([k, v]); return api; },
      order(k, o){ q.ord = [k, !o || o.ascending !== false]; return api; },
      limit(n){ q.lim = n; return api; },
      maybeSingle(){ q.single = true; return api; },
      single(){ q.single = true; return api; },
      then(res, rej){ return Promise.resolve().then(run).then(res, rej); },
    };
    const match = r => q.filters.every(([k, v]) => r[k] === v);
    function embed(r){
      const out = {...r};
      for (const m of q.cols.matchAll(/(\w+)\(([^)]*)\)/g)){
        const [fk, pk] = REL[m[1]]; const t = (db[m[1]] || []).find(x => x[pk] === r[fk]) || null;
        out[m[1]] = t ? Object.fromEntries(m[2].split(',').map(s => s.trim()).map(c => [c, t[c]])) : null;
      }
      return out;
    }
    function run(){
      const T = db[table] = db[table] || [];
      if (!me()) return {data:null, error:{message:'not authenticated'}};
      if (q.op === 'select'){
        let L = T.filter(match);
        if (q.ord){ const [k, asc] = q.ord; L = L.slice().sort((a, b) => (a[k] > b[k] ? 1 : -1) * (asc ? 1 : -1)); }
        if (q.lim) L = L.slice(0, q.lim);
        L = L.map(embed);
        return {data:q.single ? (L[0] || null) : L, error:null};
      }
      if (q.op === 'insert' || q.op === 'upsert'){
        const rows = (Array.isArray(q.payload) ? q.payload : [q.payload]).map(r => (DEF[table] || (x => x))(r));
        for (const r of rows){
          const pk = PK[table] || ['id']; const i = T.findIndex(x => pk.every(k => x[k] === r[k]));
          if (i >= 0){ if (q.op === 'insert') return {data:null, error:{message:'duplicate key'}}; T[i] = {...T[i], ...q.payload}; }
          else T.push(r);
        }
        save(); return {data:rows, error:null};
      }
      if (q.op === 'update'){ T.filter(match).forEach(r => Object.assign(r, q.payload)); save(); return {data:null, error:null}; }
      if (q.op === 'delete'){ db[table] = T.filter(r => !match(r)); save(); return {data:null, error:null}; }
    }
    return api;
  }

  const client = {
    auth: {
      async getSession(){ return {data:{session:db.session}}; },
      async signUp({email, password, options}){
        if (db.users.find(u => u.email === email)) return {data:{}, error:{message:'User already registered'}};
        if (password.length < 6) return {data:{}, error:{message:'Password should be at least 6 characters'}};
        const u = {id:uuid(), email, password, user_metadata:(options && options.data) || {}};
        db.users.push(u); db.profiles.push({id:u.id, name:u.user_metadata.name || ''});
        db.session = {user:{id:u.id, email, user_metadata:u.user_metadata}, access_token:'tok-' + u.id}; save();
        return {data:{session:db.session, user:db.session.user}, error:null};
      },
      async signInWithPassword({email, password}){
        const u = db.users.find(x => x.email === email && x.password === password);
        if (!u) return {data:{}, error:{message:'Invalid login credentials'}};
        db.session = {user:{id:u.id, email, user_metadata:u.user_metadata}, access_token:'tok-' + u.id}; save();
        return {data:{session:db.session}, error:null};
      },
      async signOut(){ db.session = null; save(); return {error:null}; },
    },
    from: query,
    async rpc(name, args){
      if (name === 'create_tribe'){ const t = {id:uuid(), name:args.tribe_name, invite_code:Math.random().toString(16).slice(2, 18), created_by:me()}; db.tribes.push(t); db.members.push({tribe_id:t.id, user_id:me(), role:'admin'}); save(); return {data:t, error:null}; }
      if (name === 'join_tribe'){ const t = db.tribes.find(x => x.invite_code === args.code); if (!t) return {data:null, error:{message:'invalid_code'}};
        if (!db.members.find(m => m.tribe_id === t.id && m.user_id === me())) db.members.push({tribe_id:t.id, user_id:me(), role:'member'}); save(); return {data:t.id, error:null}; }
      if (name === 'reset_invite'){ const t = db.tribes.find(x => x.id === args.t); t.invite_code = Math.random().toString(16).slice(2, 18); save(); return {data:t.invite_code, error:null}; }
      return {data:null, error:{message:'unknown rpc'}};
    },
    storage: { from(){ return {
      async upload(path, blob){ const url = await new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(blob); }); db.files[path] = url; save(); return {data:{path}, error:null}; },
      async createSignedUrls(paths){ return {data:paths.map(p => ({path:p, signedUrl:db.files[p] || null})), error:null}; },
      async remove(paths){ paths.forEach(p => delete db.files[p]); save(); return {data:null, error:null}; },
    }; } },
    channel(){ const c = {on(){ return c; }, subscribe(){ return c; }}; return c; },
    removeChannel(){},
  };
  window.supabase = { createClient: () => client };
  window.__mockdb = db;
})();
