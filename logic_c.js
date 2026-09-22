
  // ---------- records, results, preview, odds ----------
  function recDefKey(t){ return 'rtr_recdef_'+t.id; }
  function getRecordDef(t){
    const v = parseInt(store.get(recDefKey(t))||'',10);
    return isNaN(v) ? t.baseAllow : Math.min(v, t.baseAllow);
  }
  function setRecordIfLower(t, s){
    if(s < getRecordDef(t)){ store.set(recDefKey(t), String(s)); return true; }
    return false;
  }
  function finishGame(){
    const t = state.team, score = state.score, D = !!state.defMode;
    const target = D ? t.allowTarget : t.target;
    const beat = D ? score<=target : score>=target;
    const newRecord = D ? setRecordIfLower(t,score) : setRecordIfHigher(t,score);
    const record = D ? getRecordDef(t) : getRecord(t);
    const official = isOfficial();
    const rec = official ? recordDailyResult({ team:t.id, teamName:t.name, pos:state.position, plan:state.plan, score, def:D, target, beat }) : null;
    $('resScore').innerHTML = score+'<span> '+(D?'allowed':'pts')+'</span>';
    $('resFlag').textContent = (D?'Defense · ':'')+'Final vs '+t.name;
    let verdict='', cls='';
    if(newRecord){ verdict = D ? 'NEW DEFENSIVE RECORD — nobody has held them lower.' : 'NEW RIVALRY RECORD — you own this matchup.'; cls='record'; }
    else if(beat){ verdict = D ? 'Held them under '+target+'. Ranked-caliber defense.' : 'Beat the target ('+target+'). Ranked-caliber performance.'; cls='win'; }
    else { verdict = D ? 'They got to '+score+' — the target was under '+target+'. Go again.' : 'Fell short of the target ('+target+'). Go again.'; }
    const v = $('resVerdict'); v.textContent = verdict; v.className = 'result-verdict'+(cls?' '+cls:'');
    $('resDaily').innerHTML = dailyResultNote(official, rec);
    showDailyLeaderboard(official, { score, pos:state.position, teamName:t.name });
    const body = $('recapBody'); body.innerHTML='';
    state.driveLog.forEach(r=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${r.drive}${r.isSig?' ★':''}</td><td>${outLabel(r.outcome)}</td><td class="pts">${r.points}</td>`;
      body.appendChild(tr);
    });
    const takeaways = state.driveLog.filter(r=>r.outcome==='turnover').length;
    const share = 'HARD COUNT · '+fmtDate()+(official?'':' (practice)')+(official && rec.daily.streak.n>1 ? ' · day '+rec.daily.streak.n+' streak':'')+'\n'+t.name+(D?' (DEFENSE)':'')+'\n'+
      score+(D?' allowed (hold under ':' pts (target ')+target+', record '+record+')\n'+
      (newRecord?'NEW RECORD':(beat?(D?'Held the target':'Beat the target'):'Fell short'))+' · '+(D?PLAN_DEF[state.plan].label:PLANS[state.plan].label)+' · '+state.position+(D?' · '+takeaways+' takeaways':'');
    $('shareBox').textContent = share; $('copyStatus').textContent = '';
    showScreen('screen-results');
  }

  const PLAN_DEF = {
    control:{label:"Bend, Don't Break", sub:'Contain everything. Fewer big plays allowed and fewer takeaways.'},
    balanced:{label:'Balanced Defense', sub:'Mix coverages. No bias, no risk.'},
    airraid:{label:'All-Out Pressure', sub:'Blitz relentlessly. More sacks and takeaways, more big plays allowed.'}
  };
  function updatePreviewStats(){
    const t = state.team, D = isDefPos(state.position);
    $('pvTargetLabel').textContent = D ? 'Target · Hold Them Under' : 'Target · Beat the Ranked Avg';
    $('pvTarget').textContent = D ? t.allowTarget : t.target;
    $('pvTargetFoot').textContent = D ? 'what an 82-rated defender allows here' : 'what an 82-rated build averages here';
    $('pvRecordLabel').textContent = D ? 'Fewest Allowed' : 'Rivalry Record';
    $('pvRecord').textContent = D ? getRecordDef(t) : getRecord(t);
    $('pvRecordHolder').textContent = D ? (getRecordDef(t)<t.baseAllow ? 'held by you, just now' : t.recordHolder) : getRecordHolderText(t);
    $('btnGoDraft').textContent = D ? 'DRAFT YOUR DEFENDER ▸' : 'DRAFT YOUR PLAYER ▸';
    $('pvModeNote').textContent = D ? 'You play defense: they run 12 drives at you. Your build decides how many points get through.' : 'You play offense: you run 12 drives against their defense. Your build decides how many points you score.';
    const rd = scoutRead((D ? t.offLean : t.lean) || 0, D);
    $('pvRead').innerHTML = '<b>'+rd.tag+'.</b> '+rd.text+' <span>Your drafted build changes this. Explosive builds like aggression, steady builds like patience.</span>';
    renderPlanButtons();
  }
  function fitNote(){
    const f = styleFit(isDefPos(state.position));
    return f>0.5 ? 'aggression fits this matchup' : f<-0.5 ? 'patience fits this matchup' : 'no strong lean either way';
  }
  function renderDraftOdds(){
    const box = $('draftOdds'); if(!box) return;
    if(state.draftedCount<8 || state.draftMode!=='player' || state.afterDraft!=='daily'){ box.style.display='none'; return; }
    const pos = POSITIONS[state.position]; let sum=0; pos.attrs.forEach(k=>{ sum+=(state.slots[k]||0); });
    const ovr = Math.round(sum/pos.attrs.length);
    const o = estimateOdds(400), pct = Math.round(o.beat*100);
    const tier = pct>=75?'Dominant':pct>=55?'Strong':pct>=35?'Coin flip':pct>=15?'Underdog':'Long shot';
    box.style.display='block';
    box.innerHTML = `<div class="odds-head"><span>YOUR BUILD</span><b>${ovr} OVR</b></div>
      <div class="odds-bar"><i style="width:${pct}%"></i></div>
      <div class="odds-row"><b>${pct}%</b><span>${o.def?'chance to hold them under':'chance to beat the target of'} ${o.target} · <em>${tier}</em></span></div>
      <p class="odds-foot">Build profile: <b>${buildProfile()}</b> · ${fitNote()}</p>
      <p class="odds-foot">Projected ${o.def?'points allowed':'score'}: <b>${o.avg.toFixed(1)}</b> · a better build means better odds — re-draft attributes to move this.</p>`;
  }

  window.__GG = Object.assign(window.__GG||{}, {TUNE,state,TEAMS,POSITIONS,estimateOdds,simGamePure,buildQ,newDrive,stepDrive,resolvePlay,involvement,playCaption,resetBox,creditPlay,styleFit,buildLean,scoutRead,hashLean,fitNote,seedRng,unseedRng,readDaily,nextStreak,liveStreak,recordDailyResult,dayKey,yesterdayKey,DAILY_KEY,draftAttribute,resetDraft,PREMIUM_CAP,PREMIUM_LIMIT,leaderboardName,setLeaderboardName,renderLeaderboardList,showDailyLeaderboard});
