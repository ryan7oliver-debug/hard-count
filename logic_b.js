
  // ---------- presentation: captions, skip, drive runner ----------
  const OUTCOME_OFF = {turnover:'Turnover',punt:'Punt',fg:'Field Goal',td:'Touchdown',td2:'TD + 2pt',tdx:'TD, 2pt no good',downs:'Turned Away'};
  const OUTCOME_DEF = {turnover:'Takeaway!',punt:'Stop (Punt)',fg:'Field Goal Allowed',td:'Touchdown Allowed',td2:'Touchdown Allowed',tdx:'Touchdown Allowed',downs:'Stop On Downs'};
  function outLabel(o){ return (state.defMode?OUTCOME_DEF:OUTCOME_OFF)[o] || o; }
  // Whether THIS play is credited to the position you drafted (r.mine, set in resolvePlay/involvement).
  // Each branch below only says "you" where that's the actual play a build like yours would make — a
  // completion to someone else, on offense, says so; nothing here fakes involvement you didn't have.
  function playCaption(down, distance, yardline, r, gotFirst, scored){
    const head = `${DOWN_LABEL[down-1]} & ${distance} at ${fieldPosText(yardline)}: `;
    const D = state.defMode, pos = state.position, mine = r.mine;
    const foot = gotFirst ? ' First down.' : '';
    if(r.type==='turnover'){
      if(D) return head+(mine && pos==='DB' && r.isPass ? 'YOU JUMP THE ROUTE — INTERCEPTED!'
        : mine && (pos==='EDGE'||pos==='LB') && !r.isPass ? 'YOU RIP IT OUT — FUMBLE RECOVERED!'
        : r.isPass?'INTERCEPTED! Your defense jumps the route.':'FUMBLE! Your defense rips it out and recovers.');
      return head+(mine && pos==='QB' && r.isPass ? 'picked off — right into their hands.'
        : mine && pos==='RB' && !r.isPass ? 'you fumble it away — recovered by the defense!'
        : r.isPass?'throws it up — intercepted!':'fumbles it away — recovered by the defense!');
    }
    if(r.type==='loss'){
      if(D) return head+(mine && (pos==='EDGE'||pos==='LB') && r.isPass ? `YOU GET HOME — sack for a loss of ${Math.abs(r.yards)}!`
        : mine && (pos==='EDGE'||pos==='LB') && !r.isPass ? `YOU BLOW IT UP — stuffed for a loss of ${Math.abs(r.yards)}!`
        : r.isPass?`SACK! Your pass rush buries the QB for a loss of ${Math.abs(r.yards)}.`:`Stuffed! Your front swallows the run for a loss of ${Math.abs(r.yards)}.`);
      return head+(mine && pos==='RB' && !r.isPass ? `stuffed for a loss of ${Math.abs(r.yards)} — right at you.`
        : r.isPass?`sacked for a loss of ${Math.abs(r.yards)}.`:`stuffed for a loss of ${Math.abs(r.yards)}.`);
    }
    if(scored){
      if(D) return head+`${r.yards}-yard ${r.isPass?'pass':'run'} — they score. Touchdown.`;
      if(mine && pos==='RB') return `YOU TAKE IT IN — ${r.yards}-yard ${r.isPass?'catch and run':'run'} — TOUCHDOWN!`;
      if(mine && pos==='WR') return `YOU GO UP AND GET IT — ${r.yards}-yard catch — TOUCHDOWN!`;
      return head+`${r.yards}-yard ${r.isPass?'pass':'run'} — TOUCHDOWN!`;
    }
    if(r.type==='explosive'){
      if(D) return head+(mine && pos==='DB' && r.isPass ? 'they beat you deep' : r.isPass?'they hit the deep ball':'they break a big one')+` for ${r.yards}!${foot}`;
      if(mine && pos==='RB' && !r.isPass) return head+`you break free for ${r.yards}!${foot}`;
      if(mine && pos==='WR' && r.isPass) return head+`you take the top off it for ${r.yards}!${foot}`;
      return head+(r.isPass?'deep shot connects':'breaks free')+` for ${r.yards}!${foot}`;
    }
    if(r.yards<=0){
      if(D) return head+(mine && pos==='DB' && r.isPass ? 'you knock it away — incomplete.'
        : mine && pos==='LB' && !r.isPass ? 'you meet him at the line — no gain.'
        : r.isPass?'incomplete — good coverage.':'no gain — you held the point.');
      if(pos==='WR' && r.isPass) return head+(mine?'off your fingertips — incomplete.':'not coming your way this time — incomplete.');
      return head+(r.isPass?'incomplete.':'no gain.');
    }
    if(D) return head+(mine && pos==='DB' && r.isPass ? `you close and make the stop after ${r.yards}.${foot}`
      : mine && pos==='LB' && !r.isPass ? `you make the stop after ${r.yards}.${foot}`
      : (r.isPass?'they complete it for':'they pick up')+` ${r.yards}.${foot}`);
    if(pos==='RB' && !r.isPass) return head+(mine?`you pick up ${r.yards}.${foot}`:`the backup gets the carry, picks up ${r.yards}.${foot}`);
    if(pos==='WR' && r.isPass) return head+(mine?`you haul it in for ${r.yards}.${foot}`:`it goes to someone else for ${r.yards}.${foot}`);
    return head+(r.isPass?'complete for':'picks up')+` ${r.yards}.${foot}`;
  }
  // ---------- box score: real credit from the plays you just watched ----------
  function resetBox(){ state.box = { att:0,cmp:0,pyd:0,ptd:0,int:0, car:0,ryd:0,rtd:0,rec:0, tkl:0,tfl:0,sk:0,pbu:0, plays:0,minePlays:0 }; }
  function creditPlay(ev){
    if(ev.kind!=='play' || !state.box) return;
    const r = ev.result, B = state.box, pos = state.position, D = state.defMode;
    B.plays++; if(r.mine) B.minePlays++;
    if(!D){
      if(pos==='QB' && r.isPass){
        if(r.type!=='loss'){ B.att++; if(r.type!=='turnover'){ if(r.yards>0){ B.cmp++; B.pyd+=r.yards; if(ev.scored) B.ptd++; } } else B.int++; }
      } else if(pos==='RB' && r.mine){
        if(r.isPass){ if(r.type!=='turnover' && r.yards>0){ B.rec++; B.ryd+=r.yards; if(ev.scored) B.rtd++; } }
        else if(r.type!=='turnover'){ B.car++; B.ryd+=r.yards; if(ev.scored) B.rtd++; } else B.car++;
      } else if(pos==='WR' && r.mine && r.isPass){
        if(r.type!=='turnover' && r.yards>0){ B.rec++; B.ryd+=r.yards; if(ev.scored) B.rtd++; }
      }
    } else {
      if(r.isPass){
        if(pos==='EDGE' && r.mine && r.type==='loss'){ B.sk++; B.tkl++; }
        else if(pos==='DB' && r.mine){
          if(r.type==='turnover') B.int++;
          else if(r.yards<=0 && r.type!=='loss') B.pbu++;
          else B.tkl++;
        } else if(pos==='LB' && r.mine){ if(r.type==='loss'){ B.sk++; B.tkl++; } else B.tkl++; }
      } else {
        if(pos==='LB' && r.mine){ B.tkl++; if(r.type==='loss') B.tfl++; }
        else if(pos==='EDGE' && r.mine){ B.tkl++; if(r.type==='loss') B.tfl++; }
      }
    }
  }
  function kickCaption(ev){
    const head = `4th & ${ev.distance} at ${fieldPosText(ev.y0)}: `;
    if(state.defMode) return head+(ev.fg?'they kick the field goal — it is good. Three for them.':'they punt it away — stop!');
    return head+(ev.fg?'field goal unit trots out. Kick is up... good!':'punt team takes the field.');
  }
  function appendDriveResultLine(result){
    const log = $('simLog'), n = result.drive;
    if([1,4,7,10].includes(n)){
      const tag = document.createElement('div'); tag.className='quarter-tag q-'+n; tag.textContent='Quarter '+Math.ceil(n/3); log.appendChild(tag);
    }
    const line = document.createElement('div');
    line.className = 'drive-line'+(result.isSig?' sig':'')+' result-line';
    line.innerHTML = `<div class="pts">${result.points>0?(state.defMode?'-':'+')+result.points:'—'}</div><div class="txt">${result.isSig?'<span class="sig-badge">SIGNATURE DRIVE</span>':''}Drive ${n}: <b>${outLabel(result.outcome)}</b></div>`;
    log.appendChild(line);
  }
  function updateScoreboard(driveNum, down, distance, yardline){
    if($('fieldSbLeft')) $('fieldSbLeft').textContent = 'DRIVE '+driveNum+' · Q'+Math.ceil(driveNum/3);
    if($('fieldSbRight')) $('fieldSbRight').textContent = DOWN_LABEL[down-1]+' & '+distance;
    updateFieldLines(yardline, distance);
  }

  // skip: state.skip = 0 | 'play' | 'decision' | 'game'
  const skipping = ()=> state.skip==='decision' || state.skip==='game';
  const wait = ms => skipping() ? Promise.resolve() : sleep(ms);
  function feSpeed(){
    if(state.skip==='play') return 40;
    return (state.watch==='full'?1:1.35) * (state.simSpeed||1);
  }
  function setSkip(mode){
    state.skip = mode;
    if(mode==='play' && FE.anim) FE.anim.speed = 40;
    if((mode==='decision'||mode==='game') && FE.anim){ FE.anim.speed = 400; if(FE.anim.done){ const d=FE.anim.done; FE.anim.done=null; d(); } }
    updateSimControls();
  }
  function updateSimControls(){
    const on = !!state.simRunning;
    ['btnSkipPlay','btnSkipDecision','btnSkipGame','btnSpeed'].forEach(id=>{ const b=$(id); if(b) b.disabled = !on; });
    const sp=$('btnSpeed'); if(sp) sp.querySelector('b').textContent = (state.simSpeed||1)+'×';
    ['btnSkipDecision','btnSkipGame'].forEach(id=>{ const b=$(id); if(b) b.classList.toggle('active', state.skip===(id==='btnSkipGame'?'game':'decision')); });
  }

  async function presentEvent(ev, D){
    const tag = D.isSig ? 'SIGNATURE DRIVE — ' : '';
    if(ev.kind==='kick'){
      const cap = tag+kickCaption(ev);
      if(!skipping()){
        $('fieldCaption').textContent = tag+'4th & '+ev.distance+' — '+(ev.fg?'field goal attempt...':'punt...');
        await animateKick(ev.y0, ev.fg);
      }
      await updateBallMarker(ev.fg?82:ev.y0, cap);
      if(state.skip==='play') state.skip=0;
      return;
    }
    if(ev.kind!=='play') return;
    const cap = tag+playCaption(ev.down, ev.distance, ev.y0, ev.result, ev.gotFirst, ev.scored);
    if(!skipping()){
      $('fieldCaption').textContent = tag+DOWN_LABEL[ev.down-1]+' & '+ev.distance+' at '+fieldPosText(ev.y0)+' — '+(ev.result.isPass?'pass play':'run play')+'...';
      await animatePlay(ev.y0, ev.result, ev.newYard, ev.scored);
    }
    await updateBallMarker(ev.scored?100:ev.newYard, cap);
    if(ev.downs){
      $('fieldCaption').textContent = tag+(state.defMode?'They turn it over on downs — big stop!':`4th & ${ev.distance} at ${fieldPosText(D.yardline)}: turned away — turnover on downs.`);
    }
    if(state.skip==='play') state.skip=0;
  }

  async function simulateDrive(driveNum){
    const D = newDrive(driveNum);
    $('simDriveLabel').textContent = 'Drive '+driveNum+' of 12';
    updateScoreboard(driveNum, 1, 10, 25);
    await updateBallMarker(25, 'Drive '+driveNum+' — 1st & 10 at '+(state.defMode?'their own 25.':'the own 25.'));
    await wait(state.watch==='full' ? 650 : 450);
    if(D.isSig) D.sigChoice = await promptChoice(driveNum);
    if(state.seedKey) seedRng(state.seedKey+':'+driveNum);
    while(!D.over){
      updateScoreboard(D.n, D.down, D.distance, D.yardline);
      const ev = stepDrive(D);
      creditPlay(ev);
      await presentEvent(ev, D);
    }
    unseedRng();
    return { drive:driveNum, isSig:D.isSig, choice:D.sigChoice, outcome:D.outcome, points:D.points, playCount:D.plays };
  }

  function promptChoice(d){
    return new Promise(resolve=>{
      if(state.skip==='game'){ resolve(autoChoice()); return; }
      if(state.skip==='decision' || state.skip==='play'){ state.skip=0; updateSimControls(); }
      const quarter = Math.ceil(d/3), wrap = $('sigPanelWrap'), D = state.defMode, read = scoutRead(teamLean(), D);
      wrap.innerHTML = `<div class="sig-panel">
        <h3>Signature Drive — Q${quarter}, Drive ${d}</h3>
        <p>${D?'They have the ball and this is one of the three moments you call the defense yourself. Bring the house, or stay disciplined.':'This is one of the three moments you control yourself. Go for the knockout blow, or take the sure points.'}</p>
        <div class="sig-intel"><span class="tape">${read.tag}</span><span class="tape">Your build: ${buildProfile()}</span><span class="tape">${D?'Allowed':'Score'} ${state.score} · target ${gameTarget()}</span></div>
        <div class="sig-choice-btns">
          <button class="sig-choice attack" id="choiceAttack"><strong>${D?'BLITZ':'ATTACK'}</strong><span>${D?'More sacks and takeaways, and more big plays allowed. Pays when they are shaky under pressure.':'Big plays and takeaways both go up, and it goes for two after a touchdown. Pays against a soft defense with an explosive build.'}</span></button>
          <button class="sig-choice safe" id="choiceSafe"><strong>${D?'PLAY CONTAIN':'PLAY IT SAFE'}</strong><span>${D?'Fewer big plays and fewer takeaways. Pays when they punish pressure.':'Fewer turnovers and fewer big plays, and it kicks from 62 yards in. Pays against ball hawks or with a steady build.'}</span></button>
        </div>
      </div>`;
      wrap.scrollIntoView({behavior:REDUCED?'auto':'smooth', block:'center'});
      $('choiceAttack').addEventListener('click',()=>{ wrap.innerHTML=''; resolve('attack'); });
      $('choiceSafe').addEventListener('click',()=>{ wrap.innerHTML=''; resolve('safe'); });
    });
  }

  async function runSimulation(seedKey){
    state.seedKey = seedKey || null;          // set only for the daily; career games use ordinary dice
    state.defMode = isDefPos(state.position);
    state.skip = 0; state.simRunning = true; state.score = 0; state.driveLog = []; resetBox();
    $('simScore').textContent='0';
    $('simScoreLabel').textContent = state.defMode ? 'Points Allowed' : 'Points';
    $('simTeamLabel').textContent = 'vs '+state.team.name;
    $('simLog').innerHTML=''; $('sigPanelWrap').innerHTML='';
    FE.userDef = state.defMode;
    buildField(); updateSimControls();
    for(let d=1; d<=12; d++){
      const result = await simulateDrive(d);
      state.score += result.points;
      state.driveLog.push(result);
      $('simScore').textContent = state.score;
      appendDriveResultLine(result);
      await wait(state.watch==='full' ? 500 : 350);
    }
    await wait(400);
    state.simRunning = false; state.skip = 0; updateSimControls();
    finishGame();
  }
