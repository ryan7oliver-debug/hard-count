  // ---------- daily hooks: one official run a day, the same dice for everyone, a streak ----------
  // The first finished run against today's opponent is the official one. It is stored, it feeds the streak, and
  // every later run that day is practice. Each drive's dice are seeded from the date, the opponent and the drive
  // number (see seedRng), so two players who make the same calls get the same game.
  const DAILY_KEY = 'gg.daily.v1';
  function emptyDaily(){ return { v:1, days:{}, streak:{ n:0, best:0, last:null } }; }
  function readDaily(){
    try{
      const d = JSON.parse(store.get(DAILY_KEY) || 'null');
      if(d && d.v===1 && d.days && d.streak) return d;
    }catch(e){}
    return emptyDaily();
  }
  function writeDaily(d){
    const keys = Object.keys(d.days).sort();
    while(keys.length>60) delete d.days[keys.shift()];      // keep two months
    return store.set(DAILY_KEY, JSON.stringify(d));
  }
  function dailyToday(){ return readDaily().days[dayKey()] || null; }
  function dailySeedKey(){ return dayKey()+':'+state.team.id; }
  function isOfficial(){ return !!state.seedKey && !dailyToday() && !!state.team && state.team.id===pickTeamForToday().id; }
  function yesterdayKey(todayKey){
    const y = new Date(todayKey+'T12:00:00'); y.setDate(y.getDate()-1);      // noon, so a daylight-saving change can't skip a day
    return dayKey(y);
  }
  // pure: the streak after an official run on todayKey
  function nextStreak(prev, todayKey){
    if(prev.last===todayKey) return { n:prev.n, best:prev.best, last:prev.last };
    const n = prev.last===yesterdayKey(todayKey) ? prev.n+1 : 1;
    return { n, best:Math.max(prev.best, n), last:todayKey };
  }
  // the streak you would see today: still alive if you played today or yesterday
  function liveStreak(d, todayKey){
    todayKey = todayKey || dayKey();
    return d.streak.last===todayKey || d.streak.last===yesterdayKey(todayKey) ? d.streak.n : 0;
  }
  function recordDailyResult(res, todayKey){
    todayKey = todayKey || dayKey();
    const d = readDaily();
    if(d.days[todayKey]) return { official:false, daily:d };
    d.days[todayKey] = Object.assign({ at:Date.now() }, res);
    d.streak = nextStreak(d.streak, todayKey);
    writeDaily(d);
    return { official:true, daily:d };
  }

  // ---------- the day rolls over while the page is open ----------
  function syncDay(force){
    if(!force && state.dayKey===dayKey()) return;
    state.dayKey = dayKey(); state.team = pickTeamForToday(); state.attempt = 1;
    $('todayDate').textContent = fmtDate();
    $('introLede').innerHTML = 'Today you\'re taking on <strong>'+state.team.name+'</strong>. Post the best final score and the rivalry record is yours.';
  }
  function attemptNote(){
    const today = dailyToday();
    if(!state.team) return '';
    if(state.team.id!==pickTeamForToday().id) return 'Practice run against another team. It does not count toward your streak.';
    if(today) return 'Practice run. Today\'s official score is '+today.score+'.';
    return 'This is your official run for today. It counts toward your streak, and you get one.';
  }
  // the result screen stamps the run: official (it counts) or practice (it doesn't)
  function dailyResultNote(official, rec){
    if(official) return '<span class="stamp official">Official</span><span>Locked in for today. Day streak '+rec.daily.streak.n+(rec.daily.streak.best>rec.daily.streak.n?', best '+rec.daily.streak.best:'')+'.</span>';
    const t = dailyToday();
    return '<span class="stamp practice">Practice</span><span>'+(t ? 'Today\'s official score stays at '+t.score+'.' : 'It does not count toward your streak.')+'</span>';
  }

  // ---------- shared daily leaderboard (optional infrastructure) ----------
  // This only exists once the build is hosted somewhere with the /api/submit-score and /api/leaderboard
  // functions (netlify/functions/) -- e.g. Netlify with Blobs enabled. On the Claude Artifact, or any host
  // without them, every call below fails quietly and the leaderboard box just stays hidden. The rest of the
  // game never depends on it.
  const LB_NAME_KEY = 'gg.leaderboard.name';
  function leaderboardName(){ const n = store.get(LB_NAME_KEY); return n && n.trim() ? n.trim().slice(0,24) : null; }
  function setLeaderboardName(n){ n = String(n||'').trim().slice(0,24); if(n) store.set(LB_NAME_KEY, n); return n; }
  function escLb(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  async function submitToLeaderboard(res, name){
    try{
      const r = await fetch('/api/submit-score', {
        method:'POST', headers:{'content-type':'application/json'},
        body: JSON.stringify({ date: dayKey(), name, score: res.score, position: res.pos, opponent: res.teamName })
      });
      return r.ok ? await r.json() : null;
    }catch(e){ return null; }
  }
  async function fetchLeaderboard(dateKeyArg){
    try{
      const r = await fetch('/api/leaderboard?date='+encodeURIComponent(dateKeyArg||dayKey()));
      return r.ok ? await r.json() : null;
    }catch(e){ return null; }
  }
  function renderLeaderboardList(entries, youRank){
    if(!entries || !entries.length) return '<p class="wk-hint">No scores posted yet today — be the first.</p>';
    return '<ol class="lb-list">' + entries.slice(0,10).map((e,i)=>
      `<li class="${youRank===i+1?'me':''}"><span class="lb-rank">${i+1}</span><span class="lb-name">${escLb(e.name)}</span><span class="lb-meta">${escLb(e.position||'')}${e.opponent?' · '+escLb(e.opponent):''}</span><span class="lb-score">${e.score}</span></li>`
    ).join('') + '</ol>';
  }
  async function runLeaderboardSubmitAndRender(res, name){
    const box = $('lbBox'); if(!box) return;
    const sub = await submitToLeaderboard(res, name);
    if(!sub){ box.hidden = true; return; }   // no backend on this host -- fail quiet, don't clutter the results screen
    const board = await fetchLeaderboard();
    box.innerHTML = '<p class="tape">Today\'s leaderboard</p>'+
      '<p class="wk-hint">You\'re #'+(sub.rank||'?')+' of '+sub.total+' today.</p>'+
      renderLeaderboardList(board ? board.entries : null, sub.rank);
  }
  function showDailyLeaderboard(official, res){
    const box = $('lbBox'); if(!box) return;
    if(!official){ box.hidden = true; return; }
    box.hidden = false;
    const name = leaderboardName();
    if(!name){
      box.innerHTML = `<p class="tape">Today's leaderboard</p>
        <p class="wk-hint">Post your score under a name to see where you land today.</p>
        <div style="display:flex;gap:8px;"><input type="text" id="lbNameInput" maxlength="24" placeholder="Your name" class="name-input" style="font-size:1rem;padding:10px 12px;">
        <button class="btn btn-primary btn-small" id="lbNameGo">Post</button></div>`;
      const btn = $('lbNameGo');
      if(btn) btn.addEventListener('click', ()=>{
        const v = setLeaderboardName($('lbNameInput').value);
        if(v) runLeaderboardSubmitAndRender(res, v);
      });
      return;
    }
    box.innerHTML = '<p class="tape">Today\'s leaderboard</p><p class="wk-hint">Posting…</p>';
    runLeaderboardSubmitAndRender(res, name);
  }

  // ---------- account (Netlify Identity, optional infrastructure) ----------
  // Same fail-quiet shape as the leaderboard above: every call is try/catch'd, and on any host without the
  // auth-* functions (the Claude Artifact, or Netlify before Identity is turned on) the account button just
  // stays hidden and Five-Star / Hot Seat play exactly as they always have, with no login wall.
  //
  // Login and logout run as server-side mutations (see netlify/functions/auth-*.js) and set a session cookie
  // on the response. A plain fetch() picks that cookie up, but the library that sets it documents a full page
  // navigation as the reliable way to guarantee the browser has it before the next read -- so both paths end
  // in a reload rather than patching local state in place. Anything worth resuming after (a pending Five-Star
  // / Hot Seat launch, a name typed at signup) rides across that reload in sessionStorage.
  const PROFILE_NAME_KEY = 'gg.profile.name', RESUME_KEY = 'gg.auth.resume';
  let authUser = null, authChecked = false, authModalMode = 'login', pendingCareerMode = null, pendingProfileName = null;
  function cachedProfileName(){ try{ return store.get(PROFILE_NAME_KEY); }catch(e){ return null; } }
  let authAvailable = false;
  async function checkAuth(){
    if(authChecked) return authUser;
    try{
      const r = await fetch('/api/auth-user');
      if(r.ok){ const d = await r.json(); authUser = d && d.user ? d.user : null; authAvailable = true; }
      else authUser = null;
    }catch(e){ authUser = null; }
    authChecked = true;
    renderAccountButton();
    return authUser;
  }
  function backendHasAuth(){ return authAvailable; }   // only a genuinely successful /api/auth-user round trip counts
  function renderAccountButton(){
    const b = $('btnAccount'); if(!b) return;
    if(!backendHasAuth()){ b.hidden = true; return; }
    b.hidden = false;
    b.dataset.state = authUser ? 'in' : 'out';
    b.textContent = authUser ? (cachedProfileName() || authUser.email.split('@')[0]) : 'Log in';
  }
  function setAuthField(id, hidden){ const f = $(id); if(f){ const wrap = f.closest ? f.closest('.auth-field') : null; if(wrap) wrap.hidden = hidden; } }
  function openAuthModal(mode){
    const m = $('authModal'); if(!m) return;
    authModalMode = mode;
    $('authError').hidden = true; $('authError').textContent = '';
    setAuthField('authEmail', mode==='name');
    setAuthField('authPassword', mode==='name' || mode==='account');
    $('authNameField').hidden = mode!=='signup' && mode!=='name';
    $('authSwitchWrap').hidden = mode!=='login' && mode!=='signup';
    $('authOauth').hidden = (mode!=='login' && mode!=='signup') || !backendHasAuth();
    if(mode==='account'){
      $('authTag').textContent = 'Your account';
      $('authLede').textContent = 'Logged in as '+escLb(authUser?authUser.email:'')+'.';
      $('authSubmit').textContent = 'Log out';
    } else if(mode==='name'){
      $('authTag').textContent = 'One more thing';
      $('authLede').textContent = 'Pick a name for the leaderboard.';
      $('authName').value = '';
      $('authSubmit').textContent = 'Save ▸';
    } else {
      $('authTag').textContent = mode==='signup' ? 'Sign up' : 'Log in';
      $('authLede').textContent = 'Five-Star and Hot Seat save to an account, so a finished career posts to the leaderboard automatically.';
      $('authEmail').value=''; $('authPassword').value=''; $('authName').value='';
      $('authSwitch').textContent = mode==='signup' ? 'Log in instead' : 'Sign up';
      $('authSubmit').textContent = mode==='signup' ? 'Sign up ▸' : 'Log in ▸';
    }
    m.hidden = false;
    const f = mode==='name' ? $('authName') : mode==='account' ? null : $('authEmail');
    if(f) f.focus();
  }
  function closeAuthModal(){ const m = $('authModal'); if(m) m.hidden = true; }
  // resolves a display name without ever blocking on it -- caller checks whether it had to open the 'name' modal
  async function ensureProfileName(freshName){
    if(freshName){
      try{
        const r = await fetch('/api/profile', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({name:freshName}) });
        if(r.ok) store.set(PROFILE_NAME_KEY, freshName);
      }catch(e){}
      return true;
    }
    if(cachedProfileName()) return true;
    try{
      const r = await fetch('/api/profile');
      const d = r.ok ? await r.json() : null;
      if(d && d.name){ store.set(PROFILE_NAME_KEY, d.name); return true; }
    }catch(e){}
    openAuthModal('name');
    return false;
  }
  function stashResume(){
    try{ sessionStorage.setItem(RESUME_KEY, JSON.stringify({ mode: pendingCareerMode, name: pendingProfileName })); }catch(e){}
  }
  async function resumeAfterReload(){
    let stash = null;
    try{ const raw = sessionStorage.getItem(RESUME_KEY); if(raw){ stash = JSON.parse(raw); sessionStorage.removeItem(RESUME_KEY); } }catch(e){}
    if(!stash || !authUser) return;
    pendingCareerMode = stash.mode || null;
    const resolved = await ensureProfileName(stash.name || null);
    if(resolved && pendingCareerMode){ const m = pendingCareerMode; pendingCareerMode = null; showLegacyIntro(m); }
    // if resolving the name opened the 'name' modal instead, its own submit handler resumes pendingCareerMode
  }
  async function submitAuthForm(){
    const err = $('authError'); err.hidden = true; $('authSubmit').disabled = true;
    try{
      if(authModalMode==='account'){
        try{ await fetch('/api/auth-logout', { method:'POST' }); }catch(e){}
        location.reload();
        return;
      }
      if(authModalMode==='name'){
        const name = $('authName').value.trim();
        if(!name){ err.textContent = 'Enter a name.'; err.hidden = false; return; }
        await ensureProfileName(name.slice(0,24));
        renderAccountButton(); closeAuthModal();
        if(pendingCareerMode){ const m=pendingCareerMode; pendingCareerMode=null; showLegacyIntro(m); }
        return;
      }
      const email = $('authEmail').value.trim(), password = $('authPassword').value, name = $('authName').value.trim();
      if(!email || !password){ err.textContent = 'Enter an email and password.'; err.hidden = false; return; }
      if(authModalMode==='signup'){
        if(password.length<8){ err.textContent = 'Password needs at least 8 characters.'; err.hidden = false; return; }
        const r = await fetch('/api/auth-signup', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({email,password,name}) });
        const d = await r.json().catch(()=>null);
        if(!r.ok || !d || d.error){ err.textContent = (d&&d.error)||'Could not sign up. Try again.'; err.hidden = false; return; }
        pendingProfileName = name || null;
        openAuthModal('login');
        err.textContent = 'Account created — log in below.'; err.hidden = false;
        $('authEmail').value = email;
        return;
      }
      const r = await fetch('/api/auth-login', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({email,password}) });
      const d = await r.json().catch(()=>null);
      if(!r.ok || !d || d.error){ err.textContent = (d&&d.error)||'Could not log in. Check your email and password.'; err.hidden = false; return; }
      stashResume();
      location.reload();
    }catch(e){ err.textContent = 'Network error. Try again.'; err.hidden = false; }
    finally{ if($('authSubmit')) $('authSubmit').disabled = false; }
  }
  // Google sign-in rides Netlify Identity's own hosted OAuth redirect (no extra client SDK needed): navigate away,
  // Google authenticates, GoTrue redirects back with the session token in the URL hash. That's a full page
  // navigation each way, so it uses the same stashResume()/resumeAfterReload() pair the email/password login uses.
  function startGoogleLogin(){
    stashResume();
    location.href = '/.netlify/identity/authorize?provider=google';
  }
  function captureOAuthHash(){
    if(location.hash.indexOf('access_token=')===-1) return;
    const token = new URLSearchParams(location.hash.slice(1)).get('access_token');
    history.replaceState(null, '', location.pathname + location.search);
    if(!token) return;
    try{ document.cookie = 'nf_jwt='+token+'; path=/; max-age=3600; samesite=lax'; }catch(e){}
  }
  async function initAccountUI(){
    const btn = $('btnAccount'); if(!btn) return;
    captureOAuthHash();
    btn.addEventListener('click', ()=>{ openAuthModal(authUser ? 'account' : 'login'); });
    $('authClose').addEventListener('click', closeAuthModal);
    $('authModal').addEventListener('click', (e)=>{ if(e.target.id==='authModal') closeAuthModal(); });
    $('authSubmit').addEventListener('click', submitAuthForm);
    $('authSwitch').addEventListener('click', ()=>{ openAuthModal(authModalMode==='signup' ? 'login' : 'signup'); });
    const g = $('authGoogle'); if(g) g.addEventListener('click', startGoogleLogin);
    await checkAuth();
    await resumeAfterReload();
  }
  // the login gate for Five-Star / Hot Seat: only enforced once we've confirmed the auth functions are live
  async function requireLogin(mode){
    await checkAuth();
    if(!backendHasAuth() || authUser) return true;
    pendingCareerMode = mode;
    openAuthModal('login');
    return false;
  }

  // ---------- career leaderboard (optional infrastructure, same graceful-degrade shape) ----------
  // Named tradeoff, matching the daily board: one composite "career score" per mode, an account's single
  // best finish kept, no replay validation. See ANALYSIS.md.
  function careerScore(mode, s){
    if(mode==='player'){
      return (s.totalW||0)*2 - (s.totalL||0) + (s.heisman?150:0) + (s.heisFinalist&&!s.heisman?40:0)
        + (s.aa||0)*30 + (s.champs||0)*100 + (s.confTitles||0)*25
        + (s.draftRound===1?60 : s.draftRound>1?Math.max(0,40-s.draftRound*3) : 0);
    }
    return (s.totalW||0)*2 - (s.totalL||0) + (s.champs||0)*120 + (s.confTitles||0)*25 + (s.cfpApps||0)*15 + (s.hof?100:0) - (s.fired?40:0);
  }
  function renderCareerLeaderboardList(entries, youRank){
    if(!entries || !entries.length) return '<p class="wk-hint">No finishes posted yet — be the first.</p>';
    return '<ol class="lb-list">' + entries.slice(0,10).map((e,i)=>
      `<li class="${youRank===i+1?'me':''}"><span class="lb-rank">${i+1}</span><span class="lb-name">${escLb(e.name)}</span><span class="lb-meta">${escLb(e.record||'')}${e.detail?' · '+escLb(e.detail):''}</span><span class="lb-score">${e.score}</span></li>`
    ).join('') + '</ol>';
  }
  async function submitCareerResult(mode, score, headline, record, detail){
    try{
      const r = await fetch('/api/submit-career', {
        method:'POST', headers:{'content-type':'application/json'},
        body: JSON.stringify({ mode, score, headline, record, detail }),
      });
      return r.ok ? await r.json() : null;
    }catch(e){ return null; }
  }
  async function fetchCareerLeaderboard(mode){
    try{
      const r = await fetch('/api/career-leaderboard?mode='+encodeURIComponent(mode));
      return r.ok ? await r.json() : null;
    }catch(e){ return null; }
  }
  async function showCareerLeaderboard(mode, score, headline, record, detail){
    const box = $('legLbBox'); if(!box) return;
    box.hidden = true;
    await checkAuth();
    if(!authUser) return;   // no account signed in -- nothing to auto-attribute the finish to, stay quiet
    const sub = await submitCareerResult(mode, score, headline, record, detail);
    if(!sub) return;        // no backend on this host -- fail quiet, same as the daily leaderboard
    const board = await fetchCareerLeaderboard(mode);
    box.hidden = false;
    box.innerHTML = '<p class="tape">All-time '+(mode==='player'?'Five-Star':'Hot Seat')+' leaderboard</p>'+
      '<p class="wk-hint">Your best finish ranks #'+(sub.rank||'?')+' of '+sub.total+'.</p>'+
      renderCareerLeaderboardList(board ? board.entries : null, sub.rank);
  }

  // ---------- the hub card ----------
  function renderDailyCard(){
    if(!$('dailyTitle')) return;
    syncDay();
    const d = readDaily(), t = d.days[dayKey()], live = liveStreak(d);
    if(t){
      $('dailyTitle').textContent = t.score+(t.def?' allowed':' points')+' today';
      $('dailyDesc').textContent = (t.beat ? 'Beat' : 'Missed')+' the target of '+t.target+' against '+t.teamName+'. New matchup in '+countdownToMidnight()+'.';
      $('btnGoDaily').textContent = 'Practice run ▸';
    } else {
      $('dailyTitle').textContent = 'One Game. One Rivalry.';
      $('dailyDesc').textContent = 'Today\'s opponent, a score to beat, a rivalry record to chase. One official run a day.';
      $('btnGoDaily').textContent = 'See today\'s matchup ▸';
    }
    const st = $('dailyStreak');
    st.hidden = !live;
    st.textContent = 'Day streak '+live+(d.streak.best>live?' · best '+d.streak.best:'');
  }
