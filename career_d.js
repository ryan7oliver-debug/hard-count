
  // ============================================================
  // CAREER UI + FLOW
  // ============================================================
  const AUTOPILOT = () => !!window.__GG_AUTOPILOT;
  const autoOK = st => AUTOPILOT() && !(window.__GG_STOPAT && window.__GG_STOPAT.test(st.innerText));
  const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');

  function focusStage(){
    const st = $('carStage'); if(!st) return;
    const top = st.getBoundingClientRect().top;
    if(top < 90 || top > window.innerHeight*0.6) window.scrollTo({ top: window.scrollY + top - 110, behavior: REDUCED?'auto':'smooth' });
  }
  function stageHTML(html, cls){
    const st = $('carStage'); st.className = 'car-stage'+(cls?' '+cls:''); st.innerHTML = html;
    st.classList.remove('in'); void st.offsetWidth; st.classList.add('in');
    return st;
  }
  function stageAsk(html, buttons, cls){
    return new Promise(resolve=>{
      const st = stageHTML(html, cls);
      const bar = document.createElement('div'); bar.className = 'stage-actions';
      buttons.forEach(b=>{
        const el = document.createElement('button');
        el.className = 'btn '+(b.cls||'btn-primary')+(b.small?' btn-small':'');
        el.innerHTML = b.label; el.addEventListener('click', ()=>resolve(b.id)); bar.appendChild(el);
      });
      st.appendChild(bar);
      if(autoOK(st)) setTimeout(()=>resolve(buttons[0].id), 0); else focusStage();
    });
  }
  function stageTimed(html, ms){
    stageHTML(html); if(!AUTOPILOT()){ focusStage(); return sleep(ms); } return Promise.resolve();
  }
  function stagePick(html, opts, cls){
    return new Promise(resolve=>{
      const st = stageHTML(html, cls);
      const list = document.createElement('div'); list.className = 'opt-list';
      opts.forEach((o,i)=>{
        const b = document.createElement('button'); b.className = 'choice-btn opt';
        b.innerHTML = `<strong>${o.label}${o.risky?'<em class="risky">Risky'+(o.odds?' · '+o.odds:'')+'</em>':''}</strong><span>${o.sub||''}</span>`;
        b.addEventListener('click', ()=>resolve(i)); list.appendChild(b);
      });
      st.appendChild(list);
      if(autoOK(st)) setTimeout(()=>resolve(Math.floor(Math.random()*opts.length)), 0); else focusStage();
    });
  }

  // ---------- hub rendering ----------
  function renderAll(d){ renderHead(); renderMeters(d); renderStrip(); renderFeed(); }
  function renderHead(){
    const s = C.season, t = C.school;
    let sub;
    if(C.mode==='player'){ const p = C.pl; sub = POSITIONS[p.pos].label+' · '+(p.redshirtYear?'Redshirt year':(CLASS_NAME[Math.min(p.cls,4)]+(p.redshirted&&p.cls===0?' (RS)':'')))+' · OVR '+Math.round(attrAvg()); }
    else sub = 'Head coach · Season '+C.year+' of '+C.maxYears+' · Staff OVR '+Math.round(attrAvg());
    const rk = t.rank && t.rank<=25 ? '#'+t.rank : 'NR';
    $('carHead').innerHTML = `
      <div class="car-id"><div class="car-face">${charPortrait()}</div>
        <div class="car-who"><p class="tape car-tape">${C.mode==='player'?'Five-Star':'Hot Seat'} · Year ${C.year}</p>
        <h2>${esc(C.name)}</h2><p class="car-sub">${sub}</p>${C.char?`<p class="car-from">${C.mode==='player'?'#'+C.char.number+' · ':''}${esc(C.char.hometown)}</p>`:''}</div></div>
      <div class="car-school"><i style="background:${t.accent}"></i><div><b>${t.name}</b><small>${C.mode==='coach'?'Program rating '+t.rating:'Team rating '+t.rating}</small></div></div>
      <div class="car-rec">
        <span class="chip">Record<b>${s?s.w:0}–${s?s.l:0}</b></span>
        <span class="chip">Conf<b>${s?s.cw:0}–${s?s.cl:0}</b></span>
        <span class="chip">Rank<b>${rk}</b></span>
        <span class="chip">To play<b>${s?(s.games.filter(x=>x.marquee&&!x.done).length+s.pass):0}</b></span>
      </div>`;
  }
  function renderMeters(d){
    const L = METER_LABEL[C.mode];
    const cell = (k)=>{
      const v = C.meters[k], dd = d && d[k];
      const arrow = dd ? `<em class="m-d ${dd>0?'up':'dn'}">${dd>0?'▲':'▼'} ${Math.abs(dd)}</em>` : '';
      const extra = k==='fans' ? `<span class="m-note">${U.fans(fanCount())} fans</span>` : '';
      return `<div class="meter m-${k}"><p class="m-label">${L[k]}</p><p class="m-val">${v}${arrow}</p><p class="m-tier">${meterTier(k,v)}${extra}</p><div class="m-bar"><i style="width:${v}%"></i></div></div>`;
    };
    $('carMeters').innerHTML = cell('conf')+cell('resp')+cell('fans');
  }
  function renderStrip(){
    const s = C.season; if(!s){ $('carStrip').innerHTML=''; return; }
    const all = s.games.concat(s.post);
    const next = all.findIndex(g=>!g.done);
    $('carStrip').innerHTML = all.map((g,i)=>{
      const t = teamById(g.oppId);
      const cls = ['wk', g.done?(g.res.W?'W':'L'):'', i===next?'cur':'', g.marquee||(g.kind!=='reg'&&g.kind!=='rival')?'big':''].join(' ');
      const lab = g.kind==='reg'||g.kind==='rival' ? 'WK '+g.wk : ({confT:'CONF',cfp1:'R1',cfpQ:'QF',cfpS:'SF',cfpF:'FINAL',bowl:'BOWL'})[g.kind];
      const res = g.done ? (g.res.W?'W':'L')+' '+g.res.my+'–'+g.res.opp : ((g.home?'vs':'@')+(t.rank<=25?' #'+t.rank:''));
      return `<div class="${cls}"><small>${lab}${g.marquee||(g.kind!=='reg'&&g.kind!=='rival')?' ★':''}</small><b>${t.short}</b><em>${res}</em></div>`;
    }).join('');
  }
  function renderFeed(){
    $('carFeed').innerHTML = C.feed.length ? `<p class="tape feed-title">The clippings</p>`+C.feed.slice(0,5).map(f=>`<div class="clip ${f.tone}"><small>Yr ${f.yr}${f.wk?' · Wk '+f.wk:''}</small><b>${esc(f.head)}</b></div>`).join('') : '';
  }
  function deltaPlates(d){
    const L = METER_LABEL[C.mode];
    return `<div class="delta-row">`+['conf','resp','fans'].map(k=>{
      const v = d ? d[k]||0 : 0;
      return `<div class="delta ${v>0?'up':v<0?'dn':''}"><small>${L[k]}</small><b>${v>0?'▲ +'+v:v<0?'▼ '+v:'—'}</b><em>${C.meters[k]}/100</em></div>`;
    }).join('')+`</div>`;
  }

  // ---------- headlines ----------
  function gameHeadline(g, res){
    const t = teamById(g.oppId), n = surname(), my = res.my, op = res.opp, sc = C.school.place;
    const ln = res.line && res.line.add || {};
    if(C.mode==='player' && !C.flags.sit){
      const pos = C.pl.pos;
      if(pos==='QB' && ln.pyd>=300) return `${n} throws for ${ln.pyd} and ${ln.ptd} TD as ${sc} ${res.W?'beats':'falls to'} ${t.place}`;
      if(pos==='RB' && ln.ryd>=120) return `${n} rushes for ${ln.ryd} yards, ${sc} ${res.W?'grinds out':'drops'} ${my}–${op}`;
      if(pos==='WR' && ln.ryd>=110) return `${n} torches ${t.place} for ${ln.ryd} yards and ${ln.rtd} TD`;
      if((pos==='EDGE'||pos==='LB') && ln.sk>=2) return `${n} terrorizes the backfield: ${ln.sk} sacks vs ${t.place}`;
      if(pos==='DB' && ln.int>=1) return `${n} picks off ${t.place}, ${sc} ${res.W?'holds on':'still falls'} ${my}–${op}`;
      if(pos==='OL' && ln.pan>=9) return `The ${sc} line is a wall: ${n} paves the way in ${my}–${op} ${res.W?'win':'loss'}`;
    }
    if(g.kind==='rival') return res.W ? `${sc} keeps the trophy: ${my}–${op} over ${t.place}` : `${t.place} spoils rivalry week, ${op}–${my}`;
    if(g.kind==='cfpF') return res.W ? `${sc} are national champions!` : `${sc} falls one game short of the title`;
    if(g.kind==='confT') return res.W ? `${sc} claims the conference crown` : `${t.place} takes the conference title game`;
    if(res.ot) return res.W ? `${sc} survives ${t.place} in overtime` : `${t.place} wins it in overtime`;
    if(res.W && t.rank<=10 && t.rank>0 && C.school.rank>t.rank) return `${sc} stuns #${t.rank} ${t.place}`;
    if(res.W && my-op>=21) return `${sc} rolls past ${t.place}, ${my}–${op}`;
    if(!res.W && op-my<=3) return `${sc} falls just short vs ${t.place}, ${my}–${op}`;
    return res.W ? `${sc} takes care of ${t.place}, ${my}–${op}` : `${t.place} hands ${sc} a setback, ${op}–${my}`;
  }

  // ---------- week card ----------
  async function weekCard(g){
    if(AUTOPILOT() && !window.__GG_PLAYBIG) return 'sim';
    const s = C.season, post = g.kind!=='reg' && g.kind!=='rival';
    const t = teamById(g.oppId), sp = spreadFor(g);
    const me = unitNow();
    const line = Math.round(Math.abs(sp)*2)/2;
    const fav = Math.abs(sp)<0.75 ? 'Pick’em' : (sp>0 ? 'You by '+line : t.short+' by '+line);
    const tag = g.kind==='rival' ? 'Rivalry game' : g.label || ('Week '+g.wk);
    const stamp = g.kind==='rival' ? '<span class="stamp big">Rivalry</span>' : '<span class="stamp big">'+(post?'Postseason':'Marquee')+'</span>';
    const notes = [];
    if(C.mode==='player'){
      if(C.flags.sit) notes.push('You are sitting this one out.');
      if(C.flags.hurt) notes.push('Playing through the ankle — expect a step slower.');
      if(C.pl.role==='backup') notes.push('Role: backup this year — limited snaps.');
    }
    if(C.mod && C.mod.q>0) notes.push('Feeling sharp this week.');
    if(C.mod && C.mod.team>0) notes.push('The room is fired up.');
    const defSide = C.mode==='player' && isDefPos(C.pl.pos);
    const readNow = scoutRead(hashLean(t.id, defSide ? 'o' : 'd'), defSide);
    const autoLog = C.autoLog && C.autoLog.length ? `<div class="auto-log"><p class="tape">Since last time</p>${C.autoLog.slice(-8).map(l=>`<p class="${l.tone||''}"><b>${l.tag}</b> ${esc(l.txt)}</p>`).join('')}</div>` : '';
    C.autoLog = [];
    const html = `${autoLog}<div class="wk-card sheet">
      <div class="wk-top"><span class="tape">${tag} · ${g.kind==='reg'||g.kind==='rival'?(g.home?'Home':'Away'):'Neutral site'}</span>${stamp}</div>
      <h3 class="wk-opp">${t.rank<=25?'<span class="rk">#'+t.rank+'</span> ':''}${t.name}</h3>
      <p class="wk-rec">${t.rec.w}–${t.rec.l} · ${t.conf?'Conference':'Non-conference'} · ${fav}</p>
      <p class="wk-blurb">${KNOWN_BLURB[t.id]||oppBlurb(t)}</p>
      <p class="wk-read"><b>${readNow.tag}.</b> ${readNow.text}</p>
      <div class="wk-plates">
        <div><small>Your offense</small><b>${Math.round(me.off)}</b></div><div><small>Their defense</small><b>${t.def}</b></div>
        <div><small>Their offense</small><b>${t.off}</b></div><div><small>Your defense</small><b>${Math.round(me.def)}</b></div>
      </div>
      ${notes.length?`<p class="wk-notes">${notes.join(' ')}</p>`:''}
    </div>`;
    if(C.flags.sit) return await stageAsk(html, [{id:'sim',label:'Continue ▸'}]);
    const isD = C.mode==='player' && isDefPos(C.pl.pos);
    const left = s.games.filter(x=>x.marquee && !x.done && x!==g).length + (post?0:s.pass);
    const hint = post
      ? 'You have one postseason game to play yourself. Use it here, or save it for the title game.'
      : (C.mode==='coach' ? 'One of your three playable games this year. You call the three signature drives.' : (isD ? 'One of your three playable games this year. You defend a full game with three signature calls.' : 'One of your three playable games this year. You run a full game with three signature drives.'));
    return await stageAsk(html+`<p class="wk-hint">${hint}</p>`, [
      {id:'play',label:post?'Play it — use my postseason game ▸':'Play it ▸'},{id:'sim',label:'Sim it',cls:'btn-ghost'}
    ]);
  }

  // ---------- results ----------
  async function resultCard(g, rec){
    const t = teamById(g.oppId), head = gameHeadline(g, rec);
    pushFeed(head, rec.W?'good':'bad');
    const line = C.mode==='player'
      ? `<div class="res-line sheet"><small>${rec.sat?'Held out':esc(C.name)+' · '+C.pl.pos}</small><p>${esc(rec.line.txt)}</p></div>`
      : `<div class="res-line sheet"><small>Coach's notebook</small><p>${esc(rec.line.txt)}</p></div>`;
    const html = `<div class="res-card">
      <p class="tape">${g.kind==='reg'||g.kind==='rival'?'Week '+g.wk:g.label} · Final${rec.ot?' / OT':''}</p>
      <div class="score-plate ${rec.W?'win':'loss'}">
        <div><small>${C.school.short}</small><b>${rec.my}</b></div>
        <span class="stamp ${rec.W?'win':'loss'}">${rec.W?'Win':'Loss'}</span>
        <div><small>${t.short}</small><b>${rec.opp}</b></div>
      </div>
      <p class="clip-head clip"><small>${C.mode==='coach'?'The Sunday Sideline':'The Campus Ledger'}</small><b>${esc(head)}</b></p>
      ${line}${deltaPlates(rec.d)}
    </div>`;
    renderAll(rec.d);
    await stageAsk(html, [{id:'c',label:'Continue ▸'}]);
  }

  async function timedResult(g, rec){
    const t = teamById(g.oppId), head = gameHeadline(g, rec);
    pushFeed(head, 'good'); renderAll(rec.d);
    await stageTimed(`<div class="res-card"><p class="tape">${g.label} · Final</p>
      <div class="score-plate win"><div><small>${C.school.short}</small><b>${rec.my}</b></div><span class="stamp win">Win</span><div><small>${t.short}</small><b>${rec.opp}</b></div></div>
      <p class="clip-head clip"><small>The Campus Ledger</small><b>${esc(head)}</b></p></div>`, 1700);
  }

  // ---------- events ----------
  function recapHTML(){
    if(!C.autoLog || !C.autoLog.length) return '';
    return `<div class="auto-log"><p class="tape">The season so far</p>${C.autoLog.slice(-5).map(l=>`<p class="${l.tone||''}"><b>${l.tag}</b> ${esc(l.txt)}</p>`).join('')}</div>`;
  }
  async function doEvent(ev, ctx){
    const scene = priceScene(ev.build(ctx)); scene.private = !!ev.private;
    C.recentEv.push(ev.id); if(C.recentEv.length>3) C.recentEv.shift();
    const sp = scene.speaker;
    const i = await stagePick(`${recapHTML()}<div class="scene"><p class="tape scene-tag">${scene.tag}</p>
      <div class="speaker"><b>${sp.name}</b><span>${sp.role}${sp.outlet?' · '+sp.outlet:''}</span></div>
      <p class="scene-line">${esc(fill(scene.ask, ctx))}</p></div>`,
      scene.opts.map(o=>({ label:o.label, sub:o.sub, risky:o.risky, odds:o.risky ? oddsWord(landProb(o)) : '' })));
    const r = resolveOption(scene, i, ctx);
    const rx = buildReaction(scene, r, ctx);
    if(r.opt.risky) addStory(`${r.opt.label} — ${r.landed?'it landed':'it backfired'}${ctx.opp?' (vs '+ctx.opp.place+')':''}.`, r.landed?'good':'bad');
    pushFeed(rx.head, rx.tone==='bad'?'bad':rx.tone==='good'?'good':'');
    renderAll(r.deltas);
    const posts = rx.posts.map(p=>`<div class="post"><b>${p.who}</b><p>${esc(p.text)}</p><small>♥ ${p.likes.toLocaleString()}</small></div>`).join('');
    await stageAsk(`<div class="scene react ${rx.tone}">
      <p class="scene-line q">${esc(fill(r.opt.quote, ctx))}</p>
      ${rx.banner?`<p class="banner ${r.landed?'land':'back'}">${rx.banner}</p>`:'<p class="tape scene-tag">The reaction</p>'}
      <div class="speaker"><b>${rx.speaker.name}</b><span>${rx.speaker.role} · ${rx.speaker.outlet}</span></div>
      <p class="scene-line">${esc(rx.line)}</p>
      ${deltaPlates(r.deltas)}
      <div class="posts">${posts}</div>
      ${rx.rival?`<p class="rival-q"><b>${esc(rx.rival.who)}:</b> ${esc(rx.rival.text)}</p>`:''}
      <p class="clip-head clip"><small>The headline</small><b>${esc(rx.head)}</b></p>
    </div>`, [{id:'c',label:'Continue ▸'}]);
  }

  // ---------- the game itself ----------
  // measured with 500-game runs: points vs. drive quality, offense and defense POV
  const SIM_OFF = { q:78.1, slope:0.777 }, SIM_DEF = { q:69.8, slope:0.95 }, SIM_BASEPTS = 25;   // re-measured after position-involvement (QB/DB now blend with a teammate baseline on plays that aren't theirs)
  function simSetup(g){
    const me = unitNow(), t = teamById(g.oppId);
    const home = g.kind==='reg'||g.kind==='rival' ? (g.home?2.2:-2.2) : 0;
    const crowd = crowdFor(g);
    const myMean = BASE_PTS + (me.off-t.def)*0.34 + home + crowd;
    const oppMean = BASE_PTS + (t.off-me.def)*0.34 - home - crowd;
    const offensePOV = C.mode==='coach' || !isDefPos(C.pl.pos);
    const pos = C.mode==='coach' ? 'QB' : C.pl.pos;
    // every player plays at the same average (80) so the calibration below holds, but keeps the SHAPE of their build:
    // an explosive player stays explosive, a steady one stays steady. That shape decides which calls fit.
    const X = 80, slots = {}, keys = POSITIONS[pos].attrs;
    const mine = C.mode==='player' ? C.pl.attrs : null;
    const avg = mine ? keys.reduce((a,k)=>a+mine[k],0)/keys.length : X;
    keys.forEach(k=>{ slots[k] = mine ? U.clamp(Math.round(X + (mine[k]-avg)), 40, 99) : X; });
    const team = { id:t.id, name:t.name, short:t.short, accent:t.accent, favors:[], offFavors:[], defRating:65, offRating:66, target:Math.round(myMean), allowTarget:Math.round(oppMean),
      lean:hashLean(t.id,'d'), offLean:hashLean(t.id,'o') };
    if(offensePOV){ const qEff = SIM_OFF.q + (myMean-SIM_BASEPTS)/SIM_OFF.slope; team.defRating = 55 + (X - qEff)/TUNE.defK; }
    else { const qEff = SIM_DEF.q + (oppMean-SIM_BASEPTS)/SIM_DEF.slope; team.offRating = qEff + (X-55)*TUNE.defK; }
    return { slots, pos, team, myMean, oppMean, offensePOV };
  }
  async function runAnimated(g){
    const su = simSetup(g);
    state.position = su.pos; state.slots = su.slots; state.team = su.team; state.plan = 'balanced';
    setTeamAccent(su.team);
    state.myAccent = C.school.accent; state.myShort = C.school.short;   // your real program's colors and code on your side of the field
    showScreen('screen-sim');
    const out = await new Promise(resolve=>{ state.gameHook = resolve; runSimulation(); });
    const other = footballPts(su.offensePOV ? su.oppMean : su.myMean);
    const res = su.offensePOV ? finishScores(out.score, other) : finishScores(other, out.score);
    res.played = true;
    res.perfBias = su.offensePOV ? (out.score - su.myMean) : (su.oppMean - out.score);
    res.box = out.box;              // the real per-play credit from the game just watched
    await new Promise(resolve=>{
      const wrap = $('sigPanelWrap');
      const t = teamById(g.oppId);
      wrap.innerHTML = `<div class="decision-panel final-panel">
        <h3>Final — ${res.W?'Win':'Loss'}${res.ot?' (OT)':''}</h3>
        <p>${su.offensePOV?'Your offense put up':'Your defense allowed'} <b>${out.score}</b>. ${t.place} ${su.offensePOV?'answered with':'—'} <b>${other}</b> on the other side of the ball.</p>
        <div class="final-score"><span>${C.school.short} <b>${res.my}</b></span><span>${t.short} <b>${res.opp}</b></span></div>
        <button class="btn btn-primary" id="btnGameDone">Continue ▸</button></div>`;
      wrap.scrollIntoView({behavior:REDUCED?'auto':'smooth',block:'center'});
      $('btnGameDone').addEventListener('click', resolve);
      if(AUTOPILOT()) setTimeout(resolve,0);
    });
    resetTeamAccent();
    showScreen('screen-career'); renderAll();
    return res;
  }

  // ---------- one week ----------
  // Only marquee games (rivalry, toughest opponent) and one postseason pass are playable. Everything else sims itself,
  // with news going by and a couple of decisions a year.
  function quietStage(){
    stageHTML(`<div class="sim-run"><p class="tape">The season, week by week</p>${C.autoLog.slice(-9).map(l=>`<p class="sim-line ${l.tone||''}"><b>${l.tag}</b> ${esc(l.txt)}</p>`).join('')}</div>`);
  }
  async function runWeek(g){
    const s = C.season, t = teamById(g.oppId), post = g.kind!=='reg' && g.kind!=='rival';
    computeRanks(); g.big = isBigGame(g);
    const redshirt = C.mode==='player' && C.pl.redshirtYear;
    const hurt = C.mode==='player' && C.pl.out>0;
    const playable = !redshirt && !hurt && (g.marquee || (post && s.pass>0));
    const eventWeek = !post && !redshirt && s.eventWeeks.includes(g.wk);
    const ctx = { g, opp:t, big:!!(g.marquee || post) };
    renderAll();
    const eventAfter = eventWeek && U.chance(0.5);          // event weeks get one moment, before or after the game
    const pPre = eventWeek ? (eventAfter?0:1) : g.marquee ? 0.5 : post ? 0.3 : 0;
    if(!redshirt && pPre && U.chance(pPre)){
      const ev = pickEvent('pre', ctx, true);
      if(ev) await doEvent(ev, ctx);
    }
    if(hurt) C.flags.sit = true;
    let act = 'sim';
    if(playable) act = await weekCard(g);
    if(C.flags.sit) act = 'sim';
    const exposed = C.mode==='player' && !redshirt && !hurt && !C.flags.sit;   // eligible for a new injury from THIS week's game
    if(act==='play'){ if(post) s.pass--; s.played++; }
    // Respect is the room's trust. Below 25 the coach starts sitting you on the quiet weeks.
    const benched = C.mode==='player' && !redshirt && !post && !playable && !C.flags.sit && C.meters.resp<RESP_BENCH && U.chance(0.3);
    const wasSit = C.flags.sit; if(benched) C.flags.sit = true;
    const raw = act==='play' ? await runAnimated(g) : resolveQuick(g);
    const rec = makeGameRecord(g, raw);
    if(benched){
      C.flags.sit = wasSit; rec.line = { txt:'Benched — no snaps', add:{}, p:0 };
      bump({ conf:-1 }); addStory('Benched for a week. The locker room has stopped backing '+surname()+'.','bad');
      C.autoLog.push({ tag:'Wk '+g.wk, txt:'Benched. Coach Halloran goes with someone the room trusts.', tone:'bad' });
    }
    if(redshirt){ rec.line = { txt:'Scout team — no snaps', add:{}, p:0 }; }
    if(hurt){ rec.line = { txt:'Out — '+C.pl.injWord+' recovery', add:{}, p:0 }; }
    applyGame(g, rec);
    if(hurt){ C.pl.out--; if(C.pl.out<=0){ C.pl.out=0; C.pl.injWord=null; addStory('Back from the '+rec.line.txt.split('— ')[1]+'.','good'); pushFeed(esc(C.name)+' is back at practice', 'good'); } }
    else if(exposed){
      const inj = rollInjury();
      if(inj){
        C.pl.out = inj.weeks; C.pl.injWord = inj.word; C.pl.inj++;
        if(inj.sev==='season'){
          bump({ conf:-6, fans:-3 });
          addStory('Lost for the season to a '+inj.word+' injury.','bad');
        } else {
          bump({ conf: inj.sev==='moderate' ? -3 : -1 });
          addStory((inj.sev==='moderate'?'Banged up — a ':'A ')+inj.word+' injury will cost '+(inj.sev==='moderate'?'a couple of weeks':'this week')+'.','bad');
        }
        pushFeed(esc(C.name)+' goes down with a '+inj.word+' injury'+(inj.sev==='season'?' — out for the year':''), 'bad');
        C.autoLog.push({ tag:'Injury', txt:(inj.sev==='season'?'Lost for the season':'Hurt — out '+inj.weeks+' wk'+(inj.weeks>1?'s':''))+' — '+inj.word+'.', tone:'bad' });
      }
    }
    simLeagueWeek([C.school.id, t.id]); computeRanks();
    ctx.res = rec;
    if(benched && !s.benchTalk){ s.benchTalk = true; await doEvent(EVENTS.find(e=>e.id==='benchtalk'), ctx); }   // once a season: a way back
    if(playable || post){
      // a postseason win you simmed just goes by; a loss or the title game gets a real beat
      if(!playable && rec.W && g.kind!=='cfpF') await timedResult(g, rec);
      else await resultCard(g, rec);
      if(act==='play' && !redshirt) await doEvent(EVENTS.find(e=>e.id==='presser'), ctx);
    } else {
      pushFeed(gameHeadline(g, rec), rec.W?'good':'bad');
      C.autoLog.push({ tag:'Wk '+g.wk, txt:(rec.W?'W':'L')+' '+rec.my+'–'+rec.opp+' '+(g.home?'vs':'@')+' '+t.short+(rec.ot?' (OT)':''), tone:rec.W?'good':'bad' });
      if(eventAfter){ const ev = pickEvent('post', ctx, true); if(ev) await doEvent(ev, ctx); }
      else if(!eventWeek){ const ps = pickPassive(ctx); if(ps) C.autoLog.push({ tag:'News', txt:ps.txt, tone:ps.tone }); }
      renderAll(rec.d); quietStage();
      if(!AUTOPILOT()) await sleep(520);
    }
    renderAll();
  }

  // ---------- postseason ----------
  function bestOpp(list){ return list.slice().sort((a,b)=>b.rating-a.rating)[0]; }
  async function runPostseason(){
    const s = C.season; s.stage = 'post'; computeRanks();
    const me = C.school;
    const eligible = s.cw>=7 || (s.cw===6 && me.rank<=8);
    if(eligible){
      const opp = bestOpp(C.league.filter(t=>t.conf && !t.isUser));
      const g = { oppId:opp.id, kind:'confT', label:'Conference Championship', wk:13, big:true, home:false, conf:true };
      s.post.push(g); await runWeek(g);
      if(g.res.W){ s.confChamp = true; C.confTitles++; bump({conf:2,fans:3,resp:C.mode==='coach'?2:1}); addStory('Won the conference championship.','good'); }
    }
    computeRanks();
    const field = C.league.slice().sort((a,b)=>a.rank-b.rank).slice(0,12);
    const seed = field.indexOf(me)+1;
    const rows = field.map((t,i)=>`<tr class="${t.isUser?'me':''}"><td>${i+1}</td><td>${t.name}</td><td>${t.rec.w}–${t.rec.l}</td><td>${i<4?'Bye':''}</td></tr>`).join('');
    const bubble = seed ? '' : `<p class="wk-hint">You are #${me.rank}. The committee left you out.</p>`;
    await stageAsk(`<div class="scene"><p class="tape scene-tag">Selection Sunday</p>
      <div class="speaker"><b>${CAST.anchor.name}</b><span>${CAST.anchor.role} · ${CAST.anchor.outlet}</span></div>
      <p class="scene-line">${seed?`The committee has spoken. ${me.place} is in — the ${U.ord(seed)} seed.`:'The 12-team field is set. Here is who made it.'}</p>
      <div class="sheet seed-table"><table class="recap-table"><thead><tr><th>Seed</th><th>Team</th><th>Rec</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>${bubble}</div>`,
      [{id:'c',label:seed?'Into the bracket ▸':'Continue ▸'}]);
    if(seed){
      s.cfp = { seed, out:null }; C.cfpApps++;
      const rounds = seed<=4 ? ['cfpQ','cfpS','cfpF'] : ['cfp1','cfpQ','cfpS','cfpF'];
      const LAB = { cfp1:'CFP First Round', cfpQ:'CFP Quarterfinal', cfpS:'CFP Semifinal', cfpF:'National Championship' };
      let used = [], lastLoss = null;
      for(const k of rounds){
        let pool;
        if(k==='cfp1') pool = [field[16-seed]];
        else if(k==='cfpQ') pool = seed<=4 ? field.slice(4,8) : field.slice(0,4);
        else if(k==='cfpS') pool = field.slice(0,6);
        else pool = field.slice(0,8);
        pool = pool.filter(t=>!t.isUser && !used.includes(t.id)); if(!pool.length) pool = field.filter(t=>!t.isUser && !used.includes(t.id));
        const opp = U.pick(pool); used.push(opp.id);
        const g = { oppId:opp.id, kind:k, label:LAB[k], wk:14, big:true, home:false, conf:false };
        s.post.push(g); await runWeek(g);
        if(!g.res.W){ s.cfp.out = LAB[k]; lastLoss = { k, opp }; break; }
        if(k==='cfpF'){ s.champion = 'you'; s.cfp.out = 'National Champions'; }
      }
      if(s.champion==='you'){ C.champs++; if(C.co) C.co.natties++; addStory('Won the national championship.','good'); s.finalRank = 1; }
      else {
        s.champion = lastLoss && lastLoss.k==='cfpF' ? lastLoss.opp.id : U.pick(field.filter(t=>!t.isUser).slice(0,4)).id;
        s.finalRank = lastLoss ? ({cfpF:2,cfpS:3,cfpQ:6,cfp1:10})[lastLoss.k] : 8;
      }
    } else if(s.w>=6){
      const near = C.league.filter(t=>!t.isUser).sort((a,b)=>Math.abs(a.rating-me.rating)-Math.abs(b.rating-me.rating)).slice(0,5);
      const opp = U.pick(near);
      const g = { oppId:opp.id, kind:'bowl', label:U.pick(BOWLS), wk:14, big:true, home:false, conf:false };
      s.post.push(g); await runWeek(g); s.bowl = { name:g.label, W:g.res.W };
      s.finalRank = Math.max(13, me.rank - (g.res.W?2:0));
      s.champion = U.pick(field.slice(0,4)).id;
    } else { s.finalRank = me.rank; s.champion = U.pick(field.slice(0,4)).id; }
    s.stage = 'done';
    renderAll();
  }

  // ---------- season review ----------
  function evalGoals(){
    const s = C.season, exp = Math.round(4+(C.school.rating-60)*0.22), want = U.clamp(exp+(C.mode==='coach'?1:0),6,11);
    const rivalG = s.games.find(x=>x.kind==='rival'), gl = [];
    gl.push({ t:'Win '+want+'+ games', ok:s.w>=want, p:s.w+' / '+want });
    gl.push({ t:'Beat '+rivalTeam().place, ok:!!(rivalG.res&&rivalG.res.W), p:rivalG.res&&rivalG.res.W?'Done':'Not this year' });
    if(C.mode==='player'){
      const big = s.perfBig.some(p=>p>=0.7);
      gl.push({ t:'Post a big-game grade of 70+', ok:big, p:big?'Done':'Not yet' });
      gl.push({ t:'Finish with confidence 55+', ok:C.meters.conf>=55, p:C.meters.conf+' / 55' });
      gl.push({ t:'Grow the fan base', ok:C.meters.fans>=s.startFans+3, p:(C.meters.fans-s.startFans>=0?'+':'')+(C.meters.fans-s.startFans) });
    } else {
      gl.push({ t:'Reach the postseason', ok:!!(s.cfp||s.bowl), p:s.cfp?'CFP':s.bowl?'Bowl':'Missed' });
      gl.push({ t:'Keep the job secure (45+)', ok:C.meters.resp>=45, p:C.meters.resp+' / 45' });
      gl.push({ t:'Fire up the fan base', ok:C.meters.fans>=Math.min(60,s.startFans+2), p:C.meters.fans+'' });
    }
    const n = gl.filter(x=>x.ok).length;
    return { goals:gl, n, grade:['F','F','D','C','B','A'][n] };
  }
  function aroundLeague(){
    const s = C.season, ch = s.champion==='you' ? null : teamById(s.champion);
    const rank1 = C.league.slice().sort((a,b)=>a.rank-b.rank)[0];
    const out = [];
    out.push(ch ? `${ch.name} win the national championship.` : `You are the national champions.`);
    const rising = C.league.filter(t=>!t.isUser).sort((a,b)=>(b.rec.w-b.rating/9)-(a.rec.w-a.rating/9))[0];
    out.push(`${rising.name} (${rising.rec.w}–${rising.rec.l}) are the surprise of the year.`);
    if(C.mode==='player'){
      const hei = s.awardsList && s.awardsList.some(a=>a.id==='heisman');
      if(!hei && s.heiOther) out.push(`${s.heiOther.name} of ${s.heiOther.team} wins the Heisman.`);
    } else {
      out.push(`${U.pick(['Coach '+U.pick(LAST),'Coach '+U.pick(LAST)])} of ${U.pick(C.league.filter(t=>!t.isUser)).place} is named national coach of the year.`);
    }
    return out;
  }
  async function seasonReview(){
    const s = C.season;
    s.awardsList = evaluateAwards();
    s.heiOther = { name:rndName(), team:U.pick(C.league.filter(t=>!t.isUser)).place };
    const ge = evalGoals();
    const post = s.cfp ? (s.cfp.out||'CFP') : s.bowl ? s.bowl.name+' — '+(s.bowl.W?'W':'L') : (s.w>=6?'Bowl-eligible':'Missed the postseason');
    const rank = s.finalRank || C.school.rank;
    const H = { yr:C.year, w:s.w, l:s.l, pw:s.pw, pl:s.pl, cw:s.cw, cl:s.cl, rank, post, perf:perfIndex(), awards:(s.awardsList||[]).map(a=>a.label), grade:ge.grade, champ:s.champion==='you', school:C.school.name, stats:Object.assign({},s.stats), redshirt:C.mode==='player'&&C.pl.redshirtYear };
    C.hist.push(H);
    let statBlock = '';
    if(C.mode==='player' && !H.redshirt){
      statBlock = `<div class="season-stat-row">${statSummary(s.stats, C.pl.pos).map(([l,v])=>`<div><b>${v}</b>${l}</div>`).join('')}<div><b>${Math.round(perfIndex()*100)}</b>Avg grade</div></div>`;
    }
    const aw = (s.awardsList||[]).map(a=>`<span class="trophy-pill">${a.label}</span>`).join('');
    const lines = C.story.filter(x=>x.yr===C.year).slice(-4).map(x=>`<li class="${x.tone}">${esc(x.text)}</li>`).join('');
    const gl = ge.goals.map(x=>`<li class="${x.ok?'ok':''}"><span>${x.ok?'✓':'·'}</span>${x.t}<em>${x.p}</em></li>`).join('');
    const comment = { A:'A season people will talk about for years.', B:'A strong year. Not perfect, but plenty to build on.', C:'A workmanlike year — steady as she goes.', D:'A season to forget, with lessons in it.', F:'Nothing went right. Time for a long look in the mirror.' }[ge.grade];
    await stageAsk(`<div class="review sheet">
      <p class="tape">Season ${C.year} · Report card</p>
      <div class="review-top"><div class="grade-plate"><small>Grade</small><b>${ge.grade}</b></div>
        <div><h3>${C.school.name}</h3><p class="wk-rec">${s.w}–${s.l} (${s.cw}–${s.cl}) · finished ${rank<=25?'#'+rank:'unranked'} · ${post}</p><div class="trophy-row">${aw}</div></div></div>
      ${statBlock}
      <ul class="goal-list">${gl}</ul><p class="wk-hint">${comment}</p>
      ${lines?`<div class="story"><p class="tape">Your story this year</p><ul>${lines}</ul></div>`:''}
      <div class="around"><p class="tape">Around the league</p>${aroundLeague().map(l=>`<p>${esc(l)}</p>`).join('')}</div>
    </div>`, [{id:'c',label:'Into the offseason ▸'}]);
  }

  // ---------- player offseason ----------
  async function awardNight(){
    const s = C.season, list = s.awardsList||[];
    if(!list.length || C.pl.redshirtYear) return;
    const hei = list.find(a=>a.id==='heisman'), fin = list.find(a=>a.id==='heiFin');
    if(hei || fin){
      const others = [s.heiOther, { name:rndName(), team:U.pick(C.league.filter(t=>!t.isUser)).place }];
      const names = [`<li class="me"><b>${esc(C.name)}</b> · ${C.school.place}</li>`].concat(others.map(o=>`<li><b>${o.name}</b> · ${o.team}</li>`)).join('');
      await stageAsk(`<div class="scene"><p class="tape scene-tag">Heisman ceremony</p>
        <div class="speaker"><b>${CAST.anchor.name}</b><span>${CAST.anchor.role} · ${CAST.anchor.outlet}</span></div>
        <p class="scene-line">${hei?`And the winner of this year's Heisman Trophy — ${esc(C.name)}, ${C.school.place}.`:`Three finalists in New York. ${esc(C.name)} is one of them.`}</p>
        <ul class="finalists">${names}</ul></div>`, [{id:'c',label:'Continue ▸'}]);
      if(hei){ bump({fans:8,conf:4,resp:3}); addStory('Won the Heisman Trophy.','good'); }
      else {
        await stageAsk(`<div class="scene"><p class="tape scene-tag">Heisman ceremony</p><p class="scene-line">The winner is <b>${s.heiOther.name}</b> of ${s.heiOther.team}. ${esc(C.name)} finishes in the top three.</p></div>`, [{id:'c',label:'Continue ▸'}]);
        bump({fans:3,conf:1}); addStory('Finished as a Heisman finalist.','good');
      }
    }
    renderAll();
  }
  function roleAt(team){
    const ovr = attrAvg(), gap = ovr - team.rating;
    return gap>=6 ? { role:'starter', txt:'Starter from day one' } : gap>=-2 ? { role:'starter', txt:'Starter, with competition' } : { role:'backup', txt:'Backup in year one' };
  }
  function offersFor(){
    const list = C.league.filter(t=>!t.isUser && t.id!==C.rival);
    const cur = C.school ? C.school.rating : 72;
    const byR = list.slice().sort((a,b)=>b.rating-a.rating);
    const hi = byR.find(t=>t.rating>=cur+6) || byR[0];
    const mid = list.filter(t=>t!==hi).sort((a,b)=>Math.abs(a.rating-cur)-Math.abs(b.rating-cur))[0];
    const lo = list.filter(t=>t!==hi && t!==mid).sort((a,b)=>a.rating-b.rating)[U.rint(0,3)];
    return [hi,mid,lo];
  }
  async function signingDay(){
    let offers;
    const ovr = attrAvg();
    const pool = C.league.slice();
    const hi = U.pick(pool.filter(t=>t.rating>=78)), mid = U.pick(pool.filter(t=>t.rating>=70&&t.rating<=76)), lo = U.pick(pool.filter(t=>t.rating<=68));
    offers = [hi,mid,lo].filter((t,i,a)=>t&&a.indexOf(t)===i);
    const opts = offers.map(t=>{ const r = C.mode==='player' ? roleAt(t) : { txt:t.rating>=78?'High expectations, deep talent':t.rating>=70?'A real chance to build':'A rebuild with a long leash' };
      return { label:t.name+' <em class="rt">'+t.rating+'</em>', sub:r.txt+' · off '+t.off+' / def '+t.def, t }; });
    const i = await stagePick(`<div class="scene"><p class="tape scene-tag">${C.mode==='player'?'Signing day':'Introductory press conference'}</p>
      <div class="speaker"><b>${CAST.beat.name}</b><span>${CAST.beat.role} · ${CAST.beat.outlet}</span></div>
      <p class="scene-line">${C.mode==='player'?`Offers are on the table for ${esc(C.name)}. Pick the program, and the role that comes with it.`:`Three programs want ${esc(C.name)} to run their football team. Which job do you take?`}</p></div>`, opts);
    const t = offers[i];
    joinProgram(t);
    if(C.mode==='player'){ C.pl.role = roleAt(t).role; C.meters.fans = 20+Math.round((t.rating-60)*0.6); C.meters.resp = C.pl.role==='backup'?42:50; }
    else { C.meters.resp = t.rating>=78?55:60; C.meters.fans = 25+Math.round((t.rating-60)*0.9); C.meters.conf = 55; }
    applyBackground();
    setTeamAccent({accent:t.accent});
    addStory(C.mode==='player'?`Signed with ${t.name}.`:`Took the head coaching job at ${t.name}.`);
  }
  async function redshirtDecision(){
    const p = C.pl;
    const c = await stageAsk(`<div class="decision-panel"><h3>Redshirt or play?</h3>
      <p>${p.role==='backup'?'You are a backup on the depth chart this year. A redshirt costs you nothing in the record book.':'Burn a year of eligibility for early reps, or sit, develop, and keep five years ahead of you.'}</p></div>`,
      [{id:'play',label:'Play now'},{id:'rs',label:'Redshirt (+4 rating, five-year career)',cls:'btn-ghost'}]);
    if(c==='rs'){
      p.redshirtYear = true; p.redshirted = true; C.maxYears = 5;
      const keys = U.shuffle(Object.keys(p.attrs)).slice(0,2); keys.forEach(k=>{ p.attrs[k] = Math.min(99, p.attrs[k]+2); });
      p.attrs[keys[0]] = Math.min(99, p.attrs[keys[0]]+2);
      addStory('Redshirted year one.');
    } else C.maxYears = 4;
  }
  async function portalDecision(){
    const p = C.pl; if(C.year>=C.maxYears || p.cls>=3) return;
    if(!(p.role==='backup' || C.meters.resp<40 || C.meters.fans<25 || U.chance(0.3))) return;
    const c = await stageAsk(`<div class="decision-panel"><h3>The portal is open</h3>
      <p>Stay and fight for the job at ${C.school.place}, or go looking for a bigger stage. Leaving costs you some of the locker room and the home crowd.</p></div>`,
      [{id:'stay',label:'Stay at '+C.school.place},{id:'go',label:'Enter the portal',cls:'btn-ghost'}]);
    if(c==='stay'){ bump({resp:2,fans:1}); return; }
    const offers = offersFor();
    const opts = offers.map(t=>{ const r = roleAt(t); return { label:t.name+' <em class="rt">'+t.rating+'</em>', sub:r.txt+' · off '+t.off+' / def '+t.def, t }; });
    opts.push({ label:'Change your mind — stay', sub:'Withdraw from the portal', t:null });
    const i = await stagePick(`<div class="scene"><p class="tape scene-tag">Portal offers</p><p class="scene-line">Three programs want ${esc(C.name)}.</p></div>`, opts);
    const t = opts[i].t;
    if(!t){ bump({resp:1}); return; }
    const from = C.school.place;
    joinProgram(t); p.transferred++; p.role = roleAt(t).role;
    const d = bump({ resp:-8, fans:-6, conf:3 });
    addStory(`Left ${from} for ${t.name}.`,'bad');
    setTeamAccent({accent:t.accent});
    pushFeed(`${esc(C.name)} leaves ${from} for ${t.place}`, 'bad');
    renderAll(d);
  }
  async function trainingCamp(){
    const p = C.pl, keys = Object.keys(p.attrs);
    const i = await stagePick(`<div class="scene"><p class="tape scene-tag">Training camp</p>
      <div class="speaker"><b>Coach Halloran</b><span>Head coach · ${C.school.place}</span></div>
      <p class="scene-line">One skill gets your full summer. Pick what to work on.${C.meters.resp>=65?' The coaches like you — expect a little extra from the work.':C.meters.resp<=25?' The staff isn\'t all-in on you right now, and the reps will show it.':''}</p></div>`,
      keys.map(k=>({ label:POSITIONS[p.pos].attrLabel[k], sub:'Now '+p.attrs[k]+' · '+k })));
    const focus = keys[i], ch = trainingPlan(focus), before = Object.assign({},p.attrs);
    keys.forEach(k=>{ p.attrs[k] = Math.min(99, p.attrs[k]+ch[k]); });
    const rows = keys.map(k=>`<li class="${ch[k]>0?'ok':''}"><span>${POSITIONS[p.pos].attrLabel[k]}</span><em>${before[k]} → ${p.attrs[k]}</em>${ch[k]>0?`<b>+${ch[k]}</b>`:''}</li>`).join('');
    await stageTimed(`<div class="scene"><p class="tape scene-tag">Camp report</p><p class="scene-line">Overall is now <b>${Math.round(attrAvg())}</b>.</p><ul class="goal-list camp">${rows}</ul></div>`, 2600);
  }
  async function declareDecision(){
    const p = C.pl; if(p.cls<2 || C.year>=C.maxYears) return false;
    const stock = draftStock(), slot = draftSlot(stock);
    if(slot.round<1 || slot.round>2) return false;
    const txt = slot.round===1 ? 'Projected first-round pick' : 'Projected second-round pick';
    const c = await stageAsk(`<div class="decision-panel"><h3>Declare for the draft?</h3>
      <p>${txt}. Come back and you can improve your stock — or watch it slide.</p></div>`,
      [{id:'go',label:'Declare for the NFL Draft'},{id:'stay',label:'Return for another year',cls:'btn-ghost'}]);
    if(c==='go'){ p.draftDeclared = true; C.retiredEarly = true; addStory('Declared early for the NFL Draft.'); return true; }
    bump({resp:2,fans:2}); return false;
  }

  // ---------- off-season film room: pull a legend, swap in one better attribute ----------
  // A pull with nothing better than what you've already got is a dead scene, not a choice — especially once
  // training and earlier pulls have you into the 80s and up. Retry for a REAL upgrade first; only once that
  // keeps failing (elite builds, late career) does one attribute get nudged so there's still something to take.
  function drawFilmPick(cfg, cur){
    let p;
    for(let i=0;i<20;i++){ p = drawPick(); if(cfg.attrs.some(k=>p.stats[k]>cur[k])) return p; }
    let best=null, bestGap=Infinity;
    cfg.attrs.forEach(k=>{ if(cur[k]>=99) return; const gap = cur[k]-p.stats[k]; if(gap>=0 && gap<bestGap){ bestGap=gap; best=k; } });
    if(best==null) return p;                          // every attribute is already at the 99 cap — nothing left to offer, honestly
    return Object.assign({}, p, { stats: Object.assign({}, p.stats, { [best]: cur[best]+1 }) });
  }
  function stageRespin(html, upgrades, canPull){
    return new Promise(resolve=>{
      const st = stageHTML(html);
      st.querySelectorAll('.attr-pick').forEach(b=>b.addEventListener('click', ()=>resolve({ take:b.getAttribute('data-attr') })));
      const bar = document.createElement('div'); bar.className = 'stage-actions';
      if(canPull){ const b = document.createElement('button'); b.className='btn btn-ghost'; b.textContent = 'Pass — pull another file'; b.addEventListener('click', ()=>resolve({ pull:true })); bar.appendChild(b); }
      const k = document.createElement('button'); k.className='btn btn-ghost'; k.textContent = 'Keep my bag as it is'; k.addEventListener('click', ()=>resolve({ keep:true })); bar.appendChild(k);
      st.appendChild(bar);
      if(autoOK(st)){ const best = upgrades.slice().sort((a,b)=>b.diff-a.diff)[0]; setTimeout(()=>resolve(best && best.diff>=3 ? { take:best.key } : { keep:true }), 0); } else focusStage();
    });
  }
  async function filmRoom(){
    const isP = C.mode==='player';
    state.draftMode = isP ? 'player' : 'coach'; if(isP) state.position = C.pl.pos;
    const cfg = draftCfg(), cur = attrsOf();
    const go = await stageAsk(`<div class="scene"><p class="tape scene-tag">${isP?'Film room':'Staff shake-up'}</p>
      <div class="speaker"><b>${isP?'Coach Halloran':CAST.beat.name}</b><span>${isP?'Head coach · '+C.school.place:CAST.beat.role+' · '+CAST.beat.outlet}</span></div>
      <p class="scene-line">${isP?'The off-season is when a player gets better. Pull up to two files on legends at your position. If one of them does something better than you, take it and swap it into your bag.':'The staff has room for one big change. Pull up to two files on coaching legends and swap in one trait you want to steal.'}</p></div>`,
      [{id:'pull',label:'Pull a file'},{id:'skip',label:'Skip — keep my bag',cls:'btn-ghost'}]);
    if(go==='skip') return;
    let pulls = 2, n = 0;
    while(pulls>0){
      const p = drawFilmPick(cfg, cur); pulls--; n++;
      const ups = cfg.attrs.map(k=>({ key:k, diff:p.stats[k]-cur[k] }));
      const rows = cfg.attrs.map(k=>{
        const d = p.stats[k]-cur[k], up = d>0;
        return `<div class="attr-row${up?' up':''}"><div class="name">${cfg.label[k]}<small>${k} · yours ${cur[k]}</small></div>
          <div style="display:flex;align-items:center;gap:8px;"><span class="val${p.stats[k]>=90?' hot':''}">${p.stats[k]}</span>
          ${up?`<button class="attr-pick" data-attr="${k}" aria-label="Swap in ${cfg.label[k]}">+${d}</button>`:'<span class="attr-lock">—</span>'}</div></div>`;
      }).join('');
      const col = schoolColor(p.school), ink = inkOn(col);
      const era = ERAS[p.eraKey||p.era] ? ERAS[p.eraKey||p.era].label : '';
      const html = `<div class="player-card respin-card">
        <div class="file-strip"><span>${isP?'Scouting file · '+p.pos:'Coaching file'}</span><span>File ${n} of 2</span></div>
        <div class="player-card-head"><div class="player-portrait" style="background-color:${col};color:${ink};">${isP?p.pos:'HC'}</div>
          <div><span class="tier-ribbon tier-${normTier(p.tier)}">${cfg.tiers[p.tier].label}</span>${era?`<span class="era-badge">${era}</span>`:''}
            <p class="player-name">${dispName(p.name)}</p><p class="player-school"><i style="background:${col}"></i>${p.school||''}</p></div></div>
        <p class="player-tag">${p.tag}</p><div class="attr-grid">${rows}</div>
        <p class="wk-hint" style="color:var(--sheet-soft);">Tap a green swap to replace that attribute. Only upgrades are offered.</p></div>`;
      const res = await stageRespin(html, ups, pulls>0);
      if(res.take){
        const k = res.take, old = cur[k]; cur[k] = p.stats[k];
        addStory(`Reworked ${cfg.label[k]}: ${old} to ${cur[k]}, modeled on ${dispName(p.name)}.`,'good');
        pushFeed(`${esc(C.name)} adds ${dispName(p.name)}'s ${cfg.label[k].toLowerCase()} to the game`, 'good');
        renderAll();
        await stageTimed(`<div class="scene"><p class="tape scene-tag">Locked in</p><p class="scene-line"><b>${cfg.label[k]}</b> goes from ${old} to <b>${cur[k]}</b>, borrowed from ${dispName(p.name)}. ${isP?'Overall':'Staff overall'} is now <b>${Math.round(attrAvg())}</b>.</p></div>`, 2200);
        return;
      }
      if(res.keep) return;
    }
  }

  async function playerOffseason(){
    const p = C.pl;
    await awardNight();
    if(C.year>=C.maxYears) return true;
    if(await declareDecision()) return true;
    await portalDecision();
    await filmRoom();
    await trainingCamp();
    if(p.redshirtYear){ p.redshirtYear = false; } else p.cls++;
    if(p.role==='backup') p.role = 'starter';
    p.out = 0; p.injWord = null;   // heals up over the offseason
    return false;
  }

  // ---------- coach offseason: recruiting + staff flavor pools ----------
  // Text-only variety -- the ratings math below is untouched and still what's tuned/tested. Only which recruit
  // is on the board, how the signing lands, and which staff spot opens up change from year to year now.
  const RECRUIT_TARGETS = [
    { label:'a five-star quarterback', short:'the quarterback' },
    { label:'a five-star edge rusher', short:'the pass rusher' },
    { label:'a five-star receiver', short:'the receiver' },
    { label:'a five-star left tackle', short:'the tackle' },
    { label:'a five-star cornerback', short:'the corner' },
    { label:'a five-star running back', short:'the running back' },
    { label:'a five-star linebacker', short:'the linebacker' },
  ];
  const RECRUIT_WIN_TXT = [
    (short, place)=>`The signing is official: ${short} picks ${place}. The whole class follows.`,
    short=>`It's a live broadcast commitment — ${short} signs on national signing day.`,
    short=>`The staff lands ${short} in the eleventh hour, and the class jumps in the rankings.`,
  ];
  const RECRUIT_LOSE_TXT = [
    short=>`Bad news off the board: ${short} goes elsewhere. The class is thin.`,
    short=>`It's official — ${short} picks a rival on signing day. The board scrambles for a plan B.`,
    short=>`The staff loses ${short} at the wire, and the phones do not stop ringing.`,
  ];
  const RECRUIT_DEPTH_TXT = [
    'A steady, deep class. Nothing flashy, everything usable.',
    'Twenty-two signatures, not a headline among them, and a two-deep that actually holds up.',
    'The class grades out average on the recruiting sites and well ahead of it on the practice field.',
  ];
  const RECRUIT_PORTAL_TXT = [
    'Portal money buys instant help.',
    'Three portal transfers sign in a week. The roster looks different by August.',
    'The transfer haul plugs the two biggest holes on the depth chart overnight.',
  ];
  const STAFF_HIRE_EVENTS = [
    { tag:'Staff room', speaker:CAST.beat, ask:`An NFL team wants your offensive coordinator. Promote from within, or go big on a name hire?`,
      opts:[ O('Promote from within','Keep continuity',{ good:{conf:1,resp:1,fans:0}, quote:'"He knows our guys. Nothing changes."' }),
             O('Hire a big name','Make a splash',{ risky:true, land:0.55, good:{conf:3,resp:1,fans:4}, bad:{conf:-2,resp:-3,fans:-1}, quote:'"We got the best coordinator available. Watch what he does with this group."' }) ] },
    { tag:'Staff room', speaker:CAST.beat, ask:`Your defensive coordinator just interviewed for a head coaching job across the conference. Match his ask, or let him walk and promote the linebackers coach?`,
      opts:[ O('Match the ask','Pay to keep continuity',{ good:{conf:0,resp:2,fans:0}, quote:'"We take care of our own. He\'s staying."' }),
             O('Let him walk','Promote from the room',{ risky:true, land:0.5, good:{conf:2,resp:2,fans:1}, bad:{conf:-2,resp:-4,fans:0}, quote:'"New voice, same standard. We\'re not slowing down."' }) ] },
    { tag:'Staff room', speaker:{name:'Marlene Osei',role:'Athletic director',outlet:'Athletics'}, ask:`The strength staff is asking for a real budget bump — new equipment, another assistant, the works. Fund it, or hold the line?`,
      opts:[ O('Fund it','Invest in the room',{ risky:true, land:0.55, good:{conf:3,resp:0,fans:0}, bad:{conf:-1,resp:-3,fans:0}, quote:'"If we want to hold up in November, we pay for it in June."' }),
             O('Hold the line','Not this year',{ good:{conf:0,resp:1,fans:0}, quote:'"We make do with what we\'ve got. Same as always."' }) ] },
    { tag:'Staff room', speaker:CAST.analyst, ask:`A hotshot young recruiter from a rival staff is available, and the price is steep for a first-time coordinator hire. Take the swing, or stay the course?`,
      opts:[ O('Take the swing','Bet on the young hire',{ risky:true, land:0.5, good:{conf:2,resp:0,fans:2}, bad:{conf:-2,resp:-2,fans:-1}, quote:'"He\'s hungry, and hungry wins recruiting battles."' }),
             O('Stay the course','Trust the current staff',{ good:{conf:0,resp:1,fans:0}, quote:'"We\'re not chasing every name on the market. We trust our people."' }) ] },
  ];

  // ---------- coach offseason ----------
  async function coachOffseason(){
    const s = C.season, co = C.co;
    // AD review
    const s1 = C.meters.resp;
    const losing = s.w<=4;
    const fired = s1<=28 || (s1<=38 && losing) || (s1<=48 && s.w<=3) || (s1<=58 && s.w<=1);
    if(fired){
      await stageAsk(`<div class="scene"><p class="tape scene-tag">Athletic director</p>
        <div class="speaker"><b>Marlene Osei</b><span>Athletic director · ${C.school.place}</span></div>
        <p class="scene-line">"Coach, I appreciate what you tried to do. We're going in a different direction. Clean out your office by Friday."</p></div>`, [{id:'c',label:'Continue ▸'}]);
      addStory(`Fired by ${C.school.place} after season ${C.year}.`,'bad'); C.fired = true; return true;
    }
    const strong = s1>=70 && s.w>=10;
    if(strong && co.natties>=1 && C.year>=5 && U.chance(0.55)){
      const c = await stageAsk(`<div class="decision-panel"><h3>The pros come calling</h3>
        <p>A pro franchise wants you as head coach. The money is enormous and the challenge is new. Or you can stay and keep building what's yours.</p></div>`,
        [{id:'go',label:'Take the job'},{id:'stay',label:'Stay and build',cls:'btn-ghost'}]);
      if(c==='go'){ addStory('Left for a pro head coaching job.'); C.retiredEarly = true; return true; }
      bump({resp:4,fans:4});
    } else if(strong){
      await stageAsk(`<div class="scene"><p class="tape scene-tag">Athletic director</p><p class="scene-line">"You've earned it. New extension on my desk, and a raise. We're building this thing around you."</p></div>`, [{id:'c',label:'Continue ▸'}]);
      bump({resp:4,fans:2,conf:2});
    } else if(s1<=40){
      await stageAsk(`<div class="scene"><p class="tape scene-tag">Athletic director</p><p class="scene-line">"I'll be direct. Next season matters. The fan base is restless and I can only protect you so much."</p></div>`, [{id:'c',label:'Understood ▸'}]);
    }
    if(C.year>=C.maxYears) return true;
    await filmRoom();
    // recruiting
    const rec = co.attrs.REC;
    const target = U.pick(RECRUIT_TARGETS);
    const i = await stagePick(`<div class="scene"><p class="tape scene-tag">Recruiting</p>
      <div class="speaker"><b>${CAST.analyst.name}</b><span>${CAST.analyst.role} · ${CAST.analyst.outlet}</span></div>
      <p class="scene-line">Signing class is on the board — ${target.label} headlines it. Recruiting rating: <b>${rec}</b>. How do you build it?</p></div>`, [
      { label:'Chase '+target.short, sub:'Swing for a program-changing name', risky:true },
      { label:'Sign the depth', sub:'A safe class of high-floor guys' },
      { label:'Splash in the portal', sub:'Buy help now — the locker room may grumble' }
    ]);
    let dRating = (rec-60)*0.10 + U.gauss()*1.0 + (co.class||0)*0.6 + (bgOf()==='recruiter' ? 0.6 : 0), txt = '', dm = {};
    if(i===0){ const ok = U.chance(U.clamp(0.35+(rec-60)*0.008+(C.meters.fans-50)*0.003,0.2,0.75)); dRating += ok?4:-0.5; txt = ok?U.pick(RECRUIT_WIN_TXT)(target.short, C.school.place):U.pick(RECRUIT_LOSE_TXT)(target.short); dm = ok?{fans:5,conf:2}:{fans:-3,conf:-2}; }
    else if(i===1){ dRating += 1.6; txt = U.pick(RECRUIT_DEPTH_TXT); dm = {conf:1}; }
    else { dRating += 3; txt = U.pick(RECRUIT_PORTAL_TXT); dm = {fans:3,conf:-2,resp:1}; }
    co.class = 0;
    const cls = C.school;
    cls.off = U.clamp(Math.round(cls.off + dRating*0.35), 50, 92); cls.def = U.clamp(Math.round(cls.def + dRating*0.35), 45, 92); cls.rating = Math.round((cls.off+cls.def)/2);
    const d = bump(dm);
    await stageAsk(`<div class="scene"><p class="tape scene-tag">Signing day</p><p class="scene-line">${txt}</p><p class="wk-rec">Program rating now ${cls.rating}</p>${deltaPlates(d)}</div>`, [{id:'c',label:'Next season ▸'}]);
    // staff
    if(U.chance(0.3)){
      await doEvent({ build:()=>U.pick(STAFF_HIRE_EVENTS) }, { g:{kind:'reg'}, opp:null });
    }
    // program drift with coach development
    programDrift(); const dev = (co.attrs.DEV-72)*0.03;
    C.school.off = U.clamp(Math.round(C.school.off+dev), 50, 92); C.school.def = U.clamp(Math.round(C.school.def+dev), 45, 92); C.school.rating = Math.round((C.school.off+C.school.def)/2);
    return false;
  }

  // ---------- season + career loop ----------
  // `resume` = { phase } when picking a saved career back up mid-season ('week' | 'post' | 'review').
  async function runSeason(resume){
    const phase = resume ? resume.phase : 'season';
    let s;
    if(phase==='season'){
      saveCareer('season');
      s = newSeason();
      if(C.mode==='player' && C.pl.redshirtYear){
        await stageAsk(`<div class="scene"><p class="tape scene-tag">Redshirt year</p><p class="scene-line">A year on the scout team. The staff runs the season without you, and you get to work on your game.</p></div>`, [{id:'c',label:'Run the year ▸'}]);
      }
      C.autoLog = []; C.recentEv = C.recentEv||[];
    } else { s = C.season; C.autoLog = C.autoLog||[]; C.recentEv = C.recentEv||[]; }
    renderAll();
    if(phase==='season' || phase==='week'){
      for(s.idx = (phase==='week' ? s.idx : 0); s.idx<s.games.length; s.idx++){ saveCareer('week'); await runWeek(s.games[s.idx]); }
      s.idx = s.games.length;
    }
    if(phase!=='review'){ saveCareer('post'); await runPostseason(); }
    saveCareer('review');
    await seasonReview();
  }
  // `resume` = { phase } from a save: 'season' | 'week' | 'post' | 'review' | 'off' | 'draft'.
  async function careerLoop(resume){
    let ph = resume ? resume.phase : 'season';
    if(ph!=='draft'){
      while(true){
        if(ph!=='off') await runSeason(ph==='season' ? null : { phase:ph });
        ph = 'season';
        saveCareer('off');
        const end = C.mode==='player' ? await playerOffseason() : await coachOffseason();
        if(end) break;
        C.year++; C.auto = false;
        if(C.mode==='player') programDrift();
        C.meters.conf = Math.round(50+(C.meters.conf-50)*(bgOf()==='players'?0.85:0.7)); C.meters.resp = Math.round(50+(C.meters.resp-50)*0.85); C.meters.fans = Math.round(50+(C.meters.fans-50)*(bgOf()==='hero'?0.95:0.9));
        $('carStage').innerHTML='';
      }
    }
    if(C.mode==='player'){ saveCareer('draft'); await draftNight(); }
    C.mode==='player' ? finishPlayerCareer() : finishCoachDynasty();
  }

  // ---------- save / resume ----------
  // A checkpoint is written at every point where the game is between prompts (start of each week,
  // postseason, review, off-season, draft night). Coming back re-enters the loop at that checkpoint,
  // so a refresh replays only the current step, with fresh dice.
  const SAVE_KEY = 'gg.career.v1', SAVE_VER = 1;
  let saveWarned = false;
  function saveCareer(phase){
    if(!C || C.done || (C.autopilot && !window.__GG_SAVETEST)) return;   // test runs don't touch a real save
    let ok = false;
    try{ ok = store.set(SAVE_KEY, JSON.stringify({ ver:SAVE_VER, phase, at:Date.now(), avatar:state.avatar, C })); }catch(e){ ok = false; }
    const note = $('saveNote');
    if(note){ if(!ok && !saveWarned){ saveWarned = true; note.hidden = false; } else if(ok){ note.hidden = true; } }
    if(ok) pushCloudSave();   // best-effort mirror to the account, if one is signed in -- see logic_d.js
  }
  function clearSave(){ store.del(SAVE_KEY); clearCloudSave(); }
  // the career screen's explicit "leave" button -- the checkpoint is already current (saveCareer just ran
  // at the top of this week/phase), so this just needs to get back to the hub, not force another save.
  function exitCareerToHub(){
    resetTeamAccent();
    showScreen('screen-hub');
  }
  function readSave(){
    try{
      const raw = store.get(SAVE_KEY); if(!raw) return null;
      const sv = JSON.parse(raw);
      if(!sv || sv.ver!==SAVE_VER || !sv.C || !Array.isArray(sv.C.league) || !sv.C.league.length || sv.C.done) return null;
      const school = sv.C.league.find(t=>t.isUser); if(!school) return null;
      if(!['season','week','post','review','off','draft'].includes(sv.phase)) return null;
      if(sv.phase==='week' && !(sv.C.season && sv.C.season.games)) return null;
      sv.C.school = school;            // the school object is shared with the league list; restore the link
      return sv;
    }catch(e){ return null; }
  }
  function saveSummary(sv){
    const c = sv.C, at = { season:'Start of the season', week:'', post:'Postseason', review:'Season review', off:'Off-season', draft:'Draft night' }[sv.phase];
    const where = sv.phase==='week' ? 'Week '+(c.season.idx+1)+' of '+c.season.games.length : at;
    const who = c.mode==='player' ? c.name+' · '+POSITIONS[c.pl.pos].label : c.name+' · Head coach';
    return { title: who+' · '+c.school.name, detail: 'Year '+c.year+' of '+c.maxYears+' · '+where+' · '+c.hist.reduce((a,h)=>a+h.w+(h.pw||0),0)+'–'+c.hist.reduce((a,h)=>a+h.l+(h.pl||0),0)+' so far' };
  }
  async function resumeCareer(){
    const sv = readSave(); if(!sv) return false;
    C = sv.C; C.autopilot = AUTOPILOT(); C.autoLog = C.autoLog||[]; C.recentEv = C.recentEv||[];
    state.avatar = sv.avatar || state.avatar;
    state.draftMode = C.mode==='coach' ? 'coach' : 'player';
    ['carStage','carHead','carMeters','carStrip','carFeed'].forEach(id=>{ $(id).innerHTML=''; });
    setTeamAccent({accent:C.school.accent});
    showScreen('screen-career');
    renderAll();
    await careerLoop({ phase:sv.phase });
    return true;
  }
  function renderResume(){
    const bar = $('resumeBar'); if(!bar) return;
    const sv = readSave();
    if(!sv){ bar.hidden = true; return; }
    const sm = saveSummary(sv);
    $('resumeTitle').textContent = sm.title; $('resumeDetail').textContent = sm.detail;
    $('btnResumeDrop').textContent = 'Discard save'; $('btnResumeDrop').dataset.armed = '';
    bar.hidden = false;
  }
  function initResume(){
    $('btnResume').addEventListener('click', ()=>{ resumeCareer(); });
    $('btnResumeDrop').addEventListener('click', ()=>{
      const b = $('btnResumeDrop');
      if(b.dataset.armed!=='1'){ b.dataset.armed = '1'; b.textContent = 'Really discard?'; return; }
      clearSave(); renderResume();
    });
    renderResume();
  }

  // ---------- draft night ----------
  async function draftNight(){
    const stock = draftStock(), slot = draftSlot(stock);
    C.draft = slot;
    const pros = ['Northgate Ironworks','Lakefront Mariners','Ridgeline Rangers','Copperhead Cannons','Harbor Steel','Prairie Kings','Summit Peaks','Bayside Bandits'];
    C.draftTeam = U.pick(pros);
    const txt = slot.round===0 ? `The last name is called and it isn't yours. Undrafted — but the phone starts ringing within the minute.`
      : slot.round===1 ? `With the ${U.ord(slot.pick)} pick in the NFL Draft, the ${C.draftTeam} select ${esc(C.name)}, ${POSITIONS[C.pl.pos].label}, ${C.school.name}.`
      : `Round ${slot.round}, pick ${slot.pick}: the ${C.draftTeam} select ${esc(C.name)}, ${C.school.name}.`;
    await stageAsk(`<div class="scene"><p class="tape scene-tag">Draft night</p>
      <div class="speaker"><b>${CAST.anchor.name}</b><span>${CAST.anchor.role} · ${CAST.anchor.outlet}</span></div>
      <p class="scene-line">${txt}</p><p class="wk-rec">Draft stock ${Math.round(stock)}</p></div>`, [{id:'c',label:'Final page ▸'}]);
  }

  // ---------- finish screens ----------
  function careerTable(rows){
    const body = $('legRecapBody'); body.innerHTML='';
    rows.forEach(r=>{ const tr=document.createElement('tr'); tr.innerHTML = `<td>${r[0]}</td><td>${r[1]}</td><td class="pts">${r[2]}</td>`; body.appendChild(tr); });
  }
  function finishPlayerCareer(){
    C.done = true; clearSave();
    const slot = C.draft || draftSlot(draftStock());
    const totalW = C.hist.reduce((a,h)=>a+h.w+(h.pw||0),0), totalL = C.hist.reduce((a,h)=>a+h.l+(h.pl||0),0);
    const heis = C.awards.some(a=>a.id==='heisman'), fin = C.awards.some(a=>a.id==='heiFin');
    const aa = C.awards.filter(a=>a.id==='aa').length;
    $('legResAvatar').innerHTML = charPortrait();
    $('legResFlag').textContent = 'Career Over — Draft Night · '+POSITIONS[C.pl.pos].label;
    $('legResHeadline').textContent = slot.round===0 ? 'UDFA' : slot.round===1 ? '#'+slot.pick : 'R'+slot.round;
    $('legResVerdict').innerHTML = (heis?'<span style="color:var(--gold)">Heisman winner.</span> ':fin?'Heisman finalist. ':'')+(slot.round===0?'Went undrafted.':'Drafted in round <b>'+slot.round+'</b>.');
    $('legResVerdict').className = 'result-verdict'+(heis?' record':'');
    const tr = [];
    if(heis) tr.push('HEISMAN WINNER'); else if(fin) tr.push('HEISMAN FINALIST');
    if(aa) tr.push('ALL-AMERICAN ×'+aa);
    if(C.champs) tr.push('NATIONAL TITLE'+(C.champs>1?' ×'+C.champs:''));
    if(C.confTitles) tr.push('CONF TITLE'+(C.confTitles>1?' ×'+C.confTitles:''));
    tr.push(C.pl.transferred?'PORTAL VETERAN':'ONE-PROGRAM LOYALIST');
    if(C.meters.fans>=75) tr.push('FAN ICON');
    $('legTrophyRow').innerHTML = tr.map(x=>`<span class="trophy-pill">${x}</span>`).join('');
    $('legRecapCol1').textContent = 'Season';
    careerTable(C.hist.map(h=>[`Yr ${h.yr}${h.champ?' ★':''}${h.redshirt?' (RS)':''}`, h.school.split(' ')[0]+' · '+h.post, h.w+'–'+h.l+((h.pw||h.pl)?' (+'+h.pw+'–'+h.pl+')':'')]));
    $('legShareBox').textContent = 'FIVE-STAR — '+C.name+' · '+POSITIONS[C.pl.pos].label+'\n'+totalW+'–'+totalL+' across '+C.hist.length+' seasons · OVR '+Math.round(attrAvg())+'\n'+(heis?'Heisman winner · ':'')+(C.champs?C.champs+'× national champion · ':'')+(slot.round===0?'Undrafted':'Round '+slot.round+(slot.round===1?', pick '+slot.pick:''))+'\nConfidence '+C.meters.conf+' · Respect '+C.meters.resp+' · '+U.fans(fanCount())+' fans';
    $('legCopyStatus').textContent = '';
    const pScore = careerScore('player', { totalW, totalL, heisman:heis, heisFinalist:fin, aa, champs:C.champs, confTitles:C.confTitles, draftRound:slot.round });
    showCareerLeaderboard('player', pScore, heis?'Heisman winner':fin?'Heisman finalist':(slot.round===0?'Undrafted':'Round '+slot.round+' pick'), totalW+'–'+totalL, POSITIONS[C.pl.pos].label+' · '+C.school.name);
    resetTeamAccent(); showScreen('screen-legacy-results');
  }
  function finishCoachDynasty(){
    C.done = true; clearSave();
    const totalW = C.hist.reduce((a,h)=>a+h.w+(h.pw||0),0), totalL = C.hist.reduce((a,h)=>a+h.l+(h.pl||0),0);
    const wp = totalW/Math.max(1,totalW+totalL);
    const hof = !C.fired && (C.champs>=2 || (C.champs>=1 && wp>=0.75) || totalW>=100);
    C.co.hof = hof;
    $('legResAvatar').innerHTML = charPortrait();
    $('legResFlag').textContent = C.fired ? 'Fired — Dynasty Over' : C.retiredEarly ? 'Left For The Pros' : 'Dynasty Complete';
    $('legResHeadline').textContent = totalW+'–'+totalL;
    $('legResVerdict').innerHTML = hof ? '<span style="color:var(--gold)">Hall of Fame career.</span> '+C.champs+' national title'+(C.champs===1?'':'s')+'.' : C.champs>0 ? C.champs+' national title'+(C.champs===1?'':'s')+' — building toward the Hall.' : C.fired ? 'Shown the door. It ends here.' : 'A career built, one signing class at a time.';
    $('legResVerdict').className = 'result-verdict'+(hof?' record':'');
    const tr = [];
    for(let i=0;i<C.champs;i++) tr.push('NATIONAL CHAMPION');
    if(C.confTitles) tr.push('CONF TITLES ×'+C.confTitles);
    if(C.cfpApps) tr.push('CFP ×'+C.cfpApps);
    if(C.rivalGames) tr.push('VS RIVAL '+C.rivalWins+'–'+(C.rivalGames-C.rivalWins));
    if(hof) tr.push('HALL OF FAME');
    if(C.fired) tr.push('FIRED');
    $('legTrophyRow').innerHTML = tr.map(x=>`<span class="trophy-pill">${x}</span>`).join('');
    $('legRecapCol1').textContent = 'Year';
    careerTable(C.hist.map(h=>[`Yr ${h.yr}${h.champ?' ★':''}`, h.post, h.w+'–'+h.l+((h.pw||h.pl)?' (+'+h.pw+'–'+h.pl+')':'')]));
    $('legShareBox').textContent = 'HOT SEAT — '+C.name+' · '+C.school.name+'\n'+totalW+'–'+totalL+' across '+C.hist.length+' seasons · '+C.champs+' national title(s)'+(hof?' · HALL OF FAME':'')+(C.fired?' · fired':'')+'\nTeam belief '+C.meters.conf+' · Job security '+C.meters.resp+' · '+U.fans(fanCount())+' fans';
    $('legCopyStatus').textContent = '';
    const cScore = careerScore('coach', { totalW, totalL, champs:C.champs, confTitles:C.confTitles, cfpApps:C.cfpApps, hof, fired:C.fired });
    showCareerLeaderboard('coach', cScore, hof?'Hall of Fame':C.champs?C.champs+'x champion':C.fired?'Fired':'Dynasty built', totalW+'–'+totalL, C.school.name);
    resetTeamAccent(); showScreen('screen-legacy-results');
  }

  // ---------- entry points ----------
  async function beginCareer(mode){
    const inp = $('carName'); const nm = inp && inp.value.trim() ? inp.value.trim() : rndName();
    ensureChar(mode);
    newCareer(mode, nm); C.recentEv = []; C.autoLog = [];
    C.char = { hometown:state.char.hometown, number:state.char.number, bg:state.char.bg };
    C.autopilot = AUTOPILOT();
    $('carStage').innerHTML=''; $('carHead').innerHTML=''; $('carMeters').innerHTML=''; $('carStrip').innerHTML=''; $('carFeed').innerHTML='';
    showScreen('screen-career');
    await signingDay();
    if(mode==='player') await redshirtDecision();
    await careerLoop();
  }
  function startPlayerCareer(){ return beginCareer('player'); }
  function startCoachDynasty(){ return beginCareer('coach'); }

  async function showLegacyIntro(mode){
    if(!(await requireLogin(mode))) return;
    resetTeamAccent();
    state.pendingLegacyMode = mode;
    $('legPosGroup').style.display = mode==='player' ? 'block' : 'none';
    if(mode==='player'){ renderPositionButtons('legPosButtons'); }
    renderCharacterBuilder(mode);
    $('charTitle').textContent = mode==='player' ? 'Your Recruiting File' : 'Your Coaching File';
    const inp = $('carName'); if(inp){ inp.value = rndName(); inp.placeholder = mode==='player'?'Your player':'Your coach'; }
    if(mode==='player'){
      $('legIntroKicker').textContent = 'Five-Star';
      $('legIntroTitle').innerHTML = 'LIVE A<br>PLAYING CAREER.';
      $('legIntroLede').innerHTML = 'Draft your recruit, then live a whole college career. <strong>Three games a year are yours to play</strong>, the rest sim themselves. What you do off the field, and what you say to the media, changes how you play.';
      $('legIntroHowto').innerHTML = `
        <li><span class="howto-num">1</span><div><strong>Build your recruit.</strong> Same draft, eight skills, legends across the decades. Then pick your school on signing day.</div></li>
        <li><span class="howto-num">2</span><div><strong>Three games a year are yours.</strong> The rivalry, the toughest team on the schedule, and one postseason game you choose. Everything else sims through while the news goes by.</div></li>
        <li><span class="howto-num">3</span><div><strong>Watch your three meters.</strong> Confidence changes how you play. Respect keeps the locker room. Fans pay the bills and move the Heisman vote.</div></li>
        <li><span class="howto-num">4</span><div><strong>A few big moments a year.</strong> Press rooms, group chats, phone calls. Bold answers can land or backfire. There is no safe answer.</div></li>
        <li><span class="howto-num">5</span><div><strong>Every off-season, the film room.</strong> Pull a legend's file and steal one better attribute, then chase the Heisman and Draft Night.</div></li>`;
    } else {
      $('legIntroKicker').textContent = 'Hot Seat';
      $('legIntroTitle').innerHTML = 'BUILD A<br>DYNASTY.';
      $('legIntroLede').innerHTML = 'Draft your coaching staff, take a job, then coach <strong>up to ten seasons</strong>. Three games a year are yours to call, the rest sim through. Win, and keep the boosters, the fans and the locker room with you.';
      $('legIntroHowto').innerHTML = `
        <li><span class="howto-num">1</span><div><strong>Build your staff.</strong> Eight coaching traits spun from legends across the decades. Pick your job on introduction day.</div></li>
        <li><span class="howto-num">2</span><div><strong>Three games a year are yours.</strong> The rivalry, the toughest opponent, and one postseason game you choose. The staff handles the rest on the way to the 12-team playoff.</div></li>
        <li><span class="howto-num">3</span><div><strong>Meters that can end you.</strong> Team belief moves the whole roster. Job security is one bad run from zero. Fan energy fills the stadium.</div></li>
        <li><span class="howto-num">4</span><div><strong>Boosters, holdouts, rival coaches.</strong> Every press room answer can land or backfire.</div></li>
        <li><span class="howto-num">5</span><div><strong>Shake up the staff every off-season.</strong> Pull a coaching legend and steal one trait. Win titles and reach the Hall, or get fired and it's over.</div></li>`;
    }
    showScreen('screen-legacy-intro');
  }

  // ---------- dev: jump straight into a season ----------
  function devStartCareer(mode, skipTo){
    state.draftMode = mode==='coach'?'coach':'player';
    devFillSlots();
    Object.keys(state.slots).forEach(k=>{ if(state.slots[k]!=null) state.slots[k] = 74+U.rint(0,21); });
    beginCareer(mode);
  }

  // ---------- dev: skip to the last page ----------
  function devCareerFinish(mode){
    state.draftMode = mode; devFillSlots();
    if(mode==='coach'){ COACH_ATTRS.forEach(k=>{ state.slots[k] = 70+U.rint(0,22); }); }
    newCareer(mode, 'Marcus Cross'); C.recentEv = []; C.autoLog = [];
    joinProgram(C.league.find(t=>t.id==='foundry'));
    const yrs = mode==='player' ? 4 : 8;
    for(let y=1;y<=yrs;y++){
      const w = 8+U.rint(0,4), champ = y===yrs;
      C.hist.push({ yr:y, w, l:12-w, cw:w-2, cl:2, rank:U.rint(3,14), post: champ?'National Champions':'CFP Quarterfinal', perf:0.6, awards:[], grade:'B', champ, school:C.school.name, stats:{}, redshirt:false });
    }
    C.champs = 1; C.confTitles = 2; C.cfpApps = 3; C.rivalGames = yrs; C.rivalWins = Math.round(yrs*0.7);
    C.meters = { conf:72, resp:68, fans:81 };
    if(mode==='player'){ C.awards.push({yr:3,id:'heisman',label:'HEISMAN WINNER'},{yr:3,id:'aa',label:'ALL-AMERICAN'},{yr:4,id:'aa',label:'ALL-AMERICAN'}); C.draft = { round:1, pick:3 }; finishPlayerCareer(); }
    else finishCoachDynasty();
  }
  window.__GG = Object.assign(window.__GG||{}, { rollInjury, injuryRisk, programDrift, filmRoom, drawFilmPick, boxToLine, avatarSVG, BACKGROUNDS, LOOK_TRAITS, HOMETOWNS, randomLook, bgOf, applyBackground, charPortrait, runWeek, EVENTS, landProb, priceScene, mval, modVal, saveCareer, readSave, resumeCareer, clearSave, store, getC:()=>C, footballPts, simSetup, unitNow, beginCareer, newCareer, joinProgram, newSeason, resolveQuick, makeGameRecord, applyGame, simLeagueWeek, computeRanks, isBigGame, teamById, winProb, spreadFor, playerOffseason, evaluateAwards, careerLoop, runSeason });
