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
