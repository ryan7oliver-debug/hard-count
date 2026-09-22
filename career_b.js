
  // ---------- career state ----------
  let C = null;
  const POS_W = { QB:1.0, RB:0.6, WR:0.5, OL:0.45, EDGE:0.6, DB:0.5, LB:0.55 };
  const CLASS_NAME = ['Freshman','Sophomore','Junior','Senior','Senior (5th year)'];
  const BOWLS = ['Harvest Bowl','Lakefront Bowl','Copper State Bowl','Founders Bowl','Palmetto Bowl','Gateway Bowl','Sun Coast Bowl','Cornerstone Bowl'];
  const STAT_DEF = {
    QB:[['pyd','Pass yds'],['ptd','Pass TD'],['int','INT']],
    RB:[['ryd','Rush yds'],['rtd','Rush TD'],['rec','Rec']],
    WR:[['rec','Catches'],['ryd','Rec yds'],['rtd','TD']],
    OL:[['pan','Pancakes'],['sk','Sacks allowed'],['gr','Grade']],
    EDGE:[['tkl','Tackles'],['tfl','TFL'],['sk','Sacks']],
    DB:[['tkl','Tackles'],['int','INT'],['pbu','PBU']],
    LB:[['tkl','Tackles'],['tfl','TFL'],['sk','Sacks']]
  };

  // ---------- injuries: a real snap-cost risk, not just a bad-week flavor line ----------
  const INJ_WORDS = ['ankle','hamstring','shoulder','knee','wrist','back'];
  const INJ_POS_RISK = { QB:0.014, RB:0.030, WR:0.022, OL:0.018, EDGE:0.028, DB:0.024, LB:0.028 };
  function injuryRisk(){
    const sta = attrsOf()['STA'];
    const guard = sta!=null ? (sta-70)*0.0006 : 0;   // durability trims the odds a little; not every position tracks it
    return Math.max(0.006, (INJ_POS_RISK[C.pl.pos]||0.022) - guard);
  }
  // called once per week, after that week's game — an injury is the cost of having played, not of the matchup itself
  function rollInjury(){
    if(!U.chance(injuryRisk())) return null;
    const r = Math.random(), word = U.pick(INJ_WORDS);
    if(r<0.6) return { sev:'minor', weeks:1, word };
    if(r<0.92) return { sev:'moderate', weeks:2+U.rint(0,1), word };
    return { sev:'season', weeks:99, word };
  }
  function attrsOf(){ return C.mode==='player' ? C.pl.attrs : C.co.attrs; }
  function attrAvg(){ const v = Object.values(attrsOf()); return v.reduce((a,b)=>a+b,0)/v.length; }
  function teamById(id){ return C.league.find(t=>t.id===id); }
  function surname(){ const p = C.name.trim().split(/\s+/); return p[p.length-1]; }

  function newCareer(mode, name){
    C = {
      mode, name: (name||rndName()).trim() || rndName(), year:1, maxYears: mode==='player'?5:10,
      league: makeLeague(), school:null, rival:null,
      meters:{ conf:50, resp:50, fans:30 }, story:[], hist:[], flags:{}, mod:{}, feed:[], auto:false,
      pl:null, co:null, season:null, done:false, fired:false, champs:0, cfpApps:0, confTitles:0, rivalWins:0, rivalGames:0,
      awards:[], career:{}, retiredEarly:false
    };
    if(mode==='player'){
      const pos = state.position, attrs = {};
      POSITIONS[pos].attrs.forEach(k=>{ attrs[k] = state.slots[k]!=null ? state.slots[k] : 70; });
      C.pl = { pos, attrs, cls:0, redshirted:false, redshirtYear:false, transferred:0, inj:0, out:0, injWord:null, role:'starter', startOvr:0, draftDeclared:false };
      C.pl.startOvr = Math.round(attrAvg());
    } else {
      const attrs = {}; COACH_ATTRS.forEach(k=>{ attrs[k] = state.slots[k]!=null ? state.slots[k] : 70; });
      C.co = { attrs, natties:0, contractYrs:5, talent:0, class:0, hof:false, startOvr:0 };
      C.co.startOvr = Math.round(attrAvg());
    }
    return C;
  }

  // ---------- program / conference ----------
  function joinProgram(team){
    C.league.forEach(t=>{ t.isUser=false; });
    team.isUser = true; C.school = team;
    setupConference();
  }
  function setupConference(){
    const others = C.league.filter(t=>!t.isUser);
    const near = others.slice().sort((a,b)=>Math.abs(a.rating-C.school.rating)-Math.abs(b.rating-C.school.rating));
    const rival = near[U.rint(0,2)];
    C.rival = rival.id;
    const mates = U.shuffle(others.filter(t=>t.id!==rival.id)).slice(0,7);
    C.league.forEach(t=>t.conf=false);
    rival.conf = true; mates.forEach(t=>t.conf=true);
  }
  function rivalTeam(){ return teamById(C.rival); }

  // ---------- team strength ----------
  // A career in progress sits above 50 on every meter (winning feeds all three), so results are measured against the
  // level a healthy program expects, not against 50. At the pivot a meter adds nothing; below it, it costs you.
  const PIV = { conf:58, resp:58, fans:55 };
  const RESP_BENCH = 25, RESP_REBUILD = 35;      // below the first the coach benches you; below the second you rebuild by showing up
  function playerQ(){
    let q = attrAvg();
    q += (C.meters.conf-PIV.conf)*0.22 + (C.mod.q||0);
    if(C.flags.hurt) q -= 8;
    if(C.flags.sluggish) q -= 4;
    return q;
  }
  function unitNow(){
    const t = C.school; let off = t.off, def = t.def;
    if(C.mode==='player'){
      const q = playerQ(), sit = !!C.flags.sit;
      const w = POS_W[C.pl.pos]*(C.pl.role==='backup'?0.35:1);
      const bump = (sit || C.pl.redshirtYear) ? (sit?-4:0) : (q-72)*w;
      if(isDefPos(C.pl.pos)) def += bump; else off += bump;
      // the room: a player the locker room trusts (Respect) and believes in (Confidence) lifts the whole team
      const room = (C.meters.resp-PIV.resp)*0.05, swag = (C.meters.conf-PIV.conf)*0.05;
      off += room + swag; def += room + swag*0.6;
    } else {
      const c = C.co.attrs;
      const co = c.SCH*0.35 + c.MGT*0.25 + c.DEV*0.15 + c.MOT*0.15 + c.CLU*0.10;
      const cd = c.SCH*0.30 + c.DIS*0.25 + c.MGT*0.20 + c.MOT*0.15 + c.RES*0.10;
      const bel = (C.meters.conf-PIV.conf)*0.16 + (C.mod.team||0);
      const bg = bgOf();      // a coach's background: a specialty and a blind spot
      off += (co-72)*0.34 + bel + (bg==='off'?3:bg==='def'?-2:0); def += (cd-72)*0.34 + bel + (bg==='def'?3:bg==='off'?-2:0);
    }
    return { off, def };
  }
  // the fans: a full house is worth real points at home, and a traveling crowd a few on the road
  function crowdFor(g){
    if(g.kind!=='reg' && g.kind!=='rival') return 0;
    return (C.meters.fans-PIV.fans) * (g.home ? 0.04 : 0.008);
  }
  function spreadFor(g){
    const me = unitNow(), t = teamById(g.oppId);
    const home = g.kind==='reg'||g.kind==='rival' ? (g.home?2.2:-2.2) : 0;
    return ((me.off - t.def) - (t.off - me.def))*0.34 + home*2 + crowdFor(g)*2;
  }
  function winProb(g){ const s = spreadFor(g); return 1/(1+Math.exp(-s/7.5)); }

  // ---------- league table ----------
  function computeRanks(){
    C.league.forEach(t=>{
      const games = t.rec.w+t.rec.l;
      t.pow = t.rec.w*9 - t.rec.l*2 + t.rating*0.42 + (t.pf-t.pa)*0.05 + (games? 0 : 0);
    });
    const sorted = C.league.slice().sort((a,b)=>b.pow-a.pow || b.rating-a.rating);
    sorted.forEach((t,i)=>{ t.rank = i+1; });
    return sorted;
  }
  function simLeagueWeek(skipIds){
    const free = U.shuffle(C.league.filter(t=>!skipIds.includes(t.id)));
    for(let i=0;i+1<free.length;i+=2){
      const a = free[i], b = free[i+1];
      const r = finishScores(footballPts(BASE_PTS+(a.off-b.def)*0.34+1.5), footballPts(BASE_PTS+(b.off-a.def)*0.34-1.5));
      if(r.W){ a.rec.w++; b.rec.l++; } else { b.rec.w++; a.rec.l++; }
      a.pf+=r.my; a.pa+=r.opp; b.pf+=r.opp; b.pa+=r.my;
    }
  }

  // ---------- schedule ----------
  function buildSchedule(){
    const others = C.league.filter(t=>!t.isUser);
    const rival = rivalTeam();
    const confMates = U.shuffle(others.filter(t=>t.conf && t.id!==rival.id)).slice(0,7);
    const nonConf = U.shuffle(others.filter(t=>!t.conf)).slice(0,4);
    let opps = U.shuffle(confMates.concat(nonConf));
    // two marquee games a year in the regular season: the rivalry and the toughest opponent. The third playable game is a postseason pass.
    const hi = opps.slice().sort((a,b)=>b.rating-a.rating)[0].id;
    const games = opps.map(t=>({ oppId:t.id, conf:t.conf, kind:'reg', marquee:t.id===hi, home:false }));
    games.push({ oppId:rival.id, conf:true, kind:'rival', marquee:true, home:false });
    games.forEach((g,i)=>{ g.wk=i+1; g.home = i%2===0; });
    if(U.chance(0.5)) games.forEach(g=>g.home=!g.home);
    games[11].home = C.year%2===1;
    return games;
  }
  function newSeason(){
    C.league.forEach(t=>{ t.rec={w:0,l:0}; t.pf=0; t.pa=0; });
    computeRanks();
    const sched = buildSchedule();
    const eventWeeks = U.shuffle(sched.filter(g=>!g.marquee && g.wk>=3 && g.wk<=10).map(g=>g.wk)).slice(0,2);
    C.season = {
      pass:1, eventWeeks, played:0,
      n:C.year, games:sched, idx:0, w:0, l:0, cw:0, cl:0, pf:0, pa:0,
      post:[], stage:'regular', feed:[], notes:[], bigW:0, bigL:0, streak:0, bestPerf:0, perfSum:0, perfN:0,
      pw:0, pl:0, stats:{}, champion:null, finalRank:null, cfp:null, bowl:null, confChamp:false, startFans:C.meters.fans, startConf:C.meters.conf, perfBig:[]
    };
    C.mod = {}; C.flags = {};
    return C.season;
  }
  // "big" = high stakes (meters, headlines). "marquee" / postseason pass = the games you can actually play.
  function isBigGame(g){
    if(g.marquee || (g.kind!=='reg' && g.kind!=='rival')) return true;
    return teamById(g.oppId).rank<=5;
  }

  // ---------- meters ----------
  function bump(d){
    const out = { conf:0, resp:0, fans:0 };
    ['conf','resp','fans'].forEach(k=>{
      const before = C.meters[k];
      let dv = d[k]||0;
      if(dv>0 && before>75) dv = Math.max(1, Math.round(dv*0.5));
      if(dv<0 && before<25) dv = Math.min(-1, Math.round(dv*0.5));
      C.meters[k] = U.clamp(before + dv, 0, 100);
      out[k] = C.meters[k]-before;
    });
    return out;
  }
  function fanCount(){
    const base = C.school ? (0.6 + C.school.rating/60) : 1;
    return Math.round(1200*Math.pow(1.095, C.meters.fans)*base*(1+(C.hist.length*0.04)));
  }
  function addStory(text, tone){ C.story.push({ yr:C.year, text, tone:tone||'' }); }
  function pushFeed(head, tone){ C.feed.unshift({ head, tone:tone||'', yr:C.year, wk:C.season?C.season.idx+1:0 }); if(C.feed.length>12) C.feed.pop(); }

  // ---------- player stat lines ----------
  function playerLine(pos, perfQ, res, g){
    const p = U.clamp((perfQ-55)/45, 0.05, 1);
    const big = g.big ? 1 : 0;
    let add = {}, txt = '';
    const r = (a,b)=>U.rint(a,b);
    if(pos==='QB'){
      const att = r(22,38), cmp = Math.round(att*U.clamp(0.50+0.24*p+U.gauss()*0.04,0.4,0.85));
      const yds = Math.round(cmp*(9.6+p*2.6+U.gauss()*1.1)), td = U.clamp(Math.round(res.my/9*(0.6+0.7*p)+U.gauss()*0.6),0,6);
      const it = U.clamp(Math.round((1.15-p)*1.4+U.gauss()*0.7),0,4);
      add = { pyd:yds, ptd:td, int:it, cmp, att }; txt = cmp+'/'+att+' · '+yds+' yds · '+td+' TD · '+it+' INT';
    } else if(pos==='RB'){
      const car = r(14,26), yds = Math.round(car*(3.2+p*3.2+U.gauss()*0.6)), td = U.clamp(Math.round(res.my/12*(0.5+0.8*p)+U.gauss()*0.5),0,4);
      const rec = r(1,5); add = { ryd:yds, rtd:td, rec, car }; txt = car+' carries · '+yds+' yds · '+td+' TD · '+rec+' rec';
    } else if(pos==='WR'){
      const rec = Math.round(3+p*7+U.gauss()*1.5), yds = Math.round(rec*(10.5+p*5+U.gauss()*2)), td = U.clamp(Math.round(res.my/14*(0.5+0.9*p)+U.gauss()*0.5),0,4);
      add = { rec:Math.max(1,rec), ryd:Math.max(9,yds), rtd:td }; txt = Math.max(1,rec)+' catches · '+Math.max(9,yds)+' yds · '+td+' TD';
    } else if(pos==='OL'){
      const pan = Math.round(3+p*7+U.gauss()*1.5), sk = U.clamp(Math.round((1.1-p)*1.6+U.gauss()*0.6),0,3), gr = Math.round(58+p*36+U.gauss()*4);
      add = { pan:Math.max(0,pan), sk, gr, gn:1 }; txt = Math.max(0,pan)+' pancakes · '+sk+' sack'+(sk===1?'':'s')+' allowed · '+gr+' grade';
    } else if(pos==='EDGE'||pos==='LB'){
      const tkl = Math.round(3+p*7+U.gauss()*1.4), tfl = U.clamp(Math.round(p*3.2+U.gauss()*0.8),0,5), sk = U.clamp(Math.round(p*2.6+U.gauss()*0.8-(pos==='LB'?0.5:0)),0,4);
      add = { tkl:Math.max(1,tkl), tfl, sk }; txt = Math.max(1,tkl)+' tackles · '+tfl+' TFL · '+sk+' sack'+(sk===1?'':'s');
    } else {
      const tkl = Math.round(2+p*6+U.gauss()*1.2), it = U.chance(0.06+p*0.28)?1:0, pbu = U.clamp(Math.round(p*3+U.gauss()*0.8),0,5);
      add = { tkl:Math.max(1,tkl), int:it, pbu }; txt = Math.max(1,tkl)+' tackles · '+it+' INT · '+pbu+' PBU';
    }
    return { txt, add, p };
  }
  // A game you actually watched gets its stat line from the real plays (state.box, built while it ran),
  // not the heuristic below. OL has no per-play credit (see involvement() in logic_a.js), so it still uses
  // the heuristic even for a played game.
  function boxToLine(pos, box){
    const b = box || {};
    if(pos==='QB'){ const cmp=b.cmp||0, att=b.att||0, yds=b.pyd||0, td=b.ptd||0, it=b.int||0;
      return { txt: cmp+'/'+att+' · '+yds+' yds · '+td+' TD · '+it+' INT', add:{ pyd:yds, ptd:td, int:it } }; }
    if(pos==='RB'){ const car=b.car||0, yds=b.ryd||0, td=b.rtd||0, rec=b.rec||0;
      return { txt: car+' carries · '+yds+' yds · '+td+' TD · '+rec+' rec', add:{ ryd:yds, rtd:td, rec } }; }
    if(pos==='WR'){ const rec=b.rec||0, yds=b.ryd||0, td=b.rtd||0;
      return { txt: rec+' catches · '+yds+' yds · '+td+' TD', add:{ rec, ryd:yds, rtd:td } }; }
    if(pos==='EDGE'||pos==='LB'){ const tkl=b.tkl||0, tfl=b.tfl||0, sk=b.sk||0;
      return { txt: tkl+' tackles · '+tfl+' TFL · '+sk+' sack'+(sk===1?'':'s'), add:{ tkl, tfl, sk } }; }
    if(pos==='DB'){ const tkl=b.tkl||0, it=b.int||0, pbu=b.pbu||0;
      return { txt: tkl+' tackles · '+it+' INT · '+pbu+' PBU', add:{ tkl, int:it, pbu } }; }
    return null;   // OL
  }
  function addStats(target, add){ Object.keys(add).forEach(k=>{ target[k] = (target[k]||0)+add[k]; }); }
  function statSummary(stats, pos){
    return STAT_DEF[pos].map(([k,l])=>{
      let v = stats[k]||0; if(k==='gr') v = stats.gn ? Math.round(v/stats.gn) : 0; return [l, v];
    });
  }

  // ---------- coach notebook line ----------
  function coachLine(res, g){
    const tot = Math.round(280 + res.my*7 + U.gauss()*35), tov = U.rint(0,3), tovO = U.rint(0,3);
    const diff = tovO - tov;
    return (tot+' total yards · turnovers '+(diff>0?'+':diff<0?'−':'even ')+(diff===0?'':Math.abs(diff))+' · '+(res.W?'staff got the answers right':'the plan didn\'t hold'));
  }

  // ---------- resolve a game ----------
  function resolveQuick(g){
    const me = unitNow(), t = teamById(g.oppId);
    const home = g.kind==='reg'||g.kind==='rival' ? (g.home?2.2:-2.2) : 0;
    const crowd = crowdFor(g);
    const res = finishScores(
      footballPts(BASE_PTS + (me.off-t.def)*0.34 + home + crowd),
      footballPts(BASE_PTS + (t.off-me.def)*0.34 - home - crowd)
    );
    res.played = false; return res;
  }
  function makeGameRecord(g, res, extra){
    const r = Object.assign({ my:res.my, opp:res.opp, ot:res.ot, W:res.W, played:!!res.played, perfBias:res.perfBias||0, sat:!!C.flags.sit }, extra||{});
    if(C.mode==='player'){
      const q = playerQ() + (res.played ? (res.perfBias||0)*1.1 + U.gauss()*3 : U.gauss()*7) + (res.W?1:-1);
      const line = C.flags.sit ? { txt:'Did not play — held out', add:{}, p:0 } : playerLine(C.pl.pos, q, res, g);
      if(!C.flags.sit && res.played && res.box){                 // a played game: credit the real plays, keep the heuristic's `p` for awards
        const real = boxToLine(C.pl.pos, res.box);
        if(real){ line.txt = real.txt; line.add = real.add; }
      }
      r.line = line;
      if(!C.flags.sit){
        addStats(C.season.stats, line.add); C.season.perfSum += line.p; C.season.perfN++;
        if(g.big){ C.season.perfBig.push(line.p); }
        C.season.bestPerf = Math.max(C.season.bestPerf, line.p);
      }
    } else {
      r.line = { txt:coachLine(res,g) };
    }
    return r;
  }
  function applyGame(g, res){
    const s = C.season, t = teamById(g.oppId);
    g.res = res; g.done = true;
    const expected = winProb(g) >= 0.55;
    const margin = res.my - res.opp;
    const reg = g.kind==='reg' || g.kind==='rival';
    const d = { conf:0, resp:0, fans:0 };
    if(res.W){
      if(reg){ s.w++; if(g.conf) s.cw++; } else s.pw++;
      s.streak = s.streak>0 ? s.streak+1 : 1; if(g.big) s.bigW++;
      t.rec.l++; t.pf += res.opp; t.pa += res.my; C.school.rec.w++;
      d.conf += g.big?3:2; d.fans += g.big?2:1;
      if(C.mode==='coach') d.resp += expected?1:2; else if(!res.sat && res.line && res.line.p>=0.65) d.resp += 1;
      if(!expected){ d.conf+=1; d.fans+=1; d.resp+=1; }
      if(margin>=21){ d.fans += 1; }
      if(s.streak>=4) d.fans += 1;
    } else {
      if(reg){ s.l++; if(g.conf) s.cl++; } else s.pl++;
      s.streak = s.streak<0 ? s.streak-1 : -1; if(g.big) s.bigL++;
      t.rec.w++; t.pf += res.opp; t.pa += res.my; C.school.rec.l++;
      d.conf -= g.big?4:3; d.fans -= 1;
      if(C.mode==='coach') d.resp -= expected?3:1; else if(!res.sat && res.line && res.line.p<0.35) d.resp -= 1;
      if(expected){ d.conf-=1; d.fans-=1; if(C.mode==='coach') d.resp-=1; }
      if(s.streak<=-3){ d.fans -= 1; if(C.mode==='coach') d.resp -= 2; }
    }
    // Respect below 35 rebuilds by showing up: a week of work is worth a point back (only on weeks you actually play).
    if(C.mode==='player' && !res.sat && C.meters.resp<RESP_REBUILD) d.resp += 1;
    C.school.pf += res.my; C.school.pa += res.opp;
    s.pf += res.my; s.pa += res.opp;
    if(g.kind==='rival'){ C.rivalGames++; if(res.W) C.rivalWins++; d.fans += res.W?3:-3; d.conf += res.W?1:-1; if(C.mode==='coach') d.resp += res.W?2:-2; }
    res.d = bump(d);
    C.flags.hurt = false; C.flags.sluggish = false; C.flags.sit = false; C.mod = {};
    return res;
  }

  // ---------- awards, heisman, draft stock ----------
  function perfIndex(){ const s = C.season; return s.perfN ? s.perfSum/s.perfN : 0; }
  function isSkill(){ return ['QB','RB','WR'].includes(C.pl.pos); }
  function evaluateAwards(){
    const s = C.season, out = [];
    if(C.mode!=='player') return out;
    const winPct = s.w/Math.max(1,s.w+s.l), rank = C.school.rank;
    const pi = perfIndex();
    const heiScore = 40*pi + 36*winPct + 0.15*C.meters.fans + (rank<=5?8:rank<=12?4:0) + (isSkill()?8:-16) + (C.season.perfBig.length? 6*(C.season.perfBig.reduce((a,b)=>a+b,0)/C.season.perfBig.length):0);
    s.heiScore = heiScore;
    // Clearing the bar puts you in the race, not the winner's circle -- the real award is a national vote
    // against every other qualifying season, so even a front-runner can lose it. Margin above the bar buys
    // real odds (a signature year is a live favorite), but nothing above 60%: some years the vote just doesn't break your way.
    if(heiScore>=80 && winPct>=0.75 && rank<=12 && !C.awards.some(a=>a.id==='heisman')){
      const winChance = U.clamp(0.15 + (heiScore-80)*0.012, 0.12, 0.60);
      out.push(U.chance(winChance) ? { id:'heisman', label:'HEISMAN WINNER', tone:'gold' } : { id:'heiFin', label:'HEISMAN FINALIST', tone:'gold' });
    }
    else if(heiScore>=66 && winPct>=0.66){ out.push({ id:'heiFin', label:'HEISMAN FINALIST', tone:'gold' }); }
    if(pi>=0.62) out.push({ id:'aa', label:'ALL-AMERICAN', tone:'gold' });
    else if(pi>=0.45) out.push({ id:'ac', label:'ALL-CONFERENCE', tone:'' });
    if(s.confChamp) out.push({ id:'conf', label:'CONFERENCE CHAMPION', tone:'' });
    if(s.champion==='you') out.push({ id:'natty', label:'NATIONAL CHAMPION', tone:'gold' });
    s.awards = out; out.forEach(a=>C.awards.push({ yr:C.year, id:a.id, label:a.label }));
    return out;
  }
  function draftStock(){
    const ovr = attrAvg();
    const pi = C.hist.length ? C.hist.reduce((a,h)=>a+(h.perf||0),0)/C.hist.length : 0.5;
    const hei = C.awards.some(a=>a.id==='heisman') ? 12 : C.awards.some(a=>a.id==='heiFin') ? 6 : 0;
    const aa = C.awards.filter(a=>a.id==='aa').length;
    return ovr*0.75 + pi*18 + hei + Math.min(8,aa*3.5) + (C.meters.fans-50)*0.06 + (C.meters.resp-50)*0.04 + (C.pl.inj*-1.5);
  }
  function draftSlot(stock){
    if(stock>=93) return { round:1, pick:U.rint(1,4) };
    if(stock>=89) return { round:1, pick:U.rint(5,14) };
    if(stock>=85) return { round:1, pick:U.rint(15,32) };
    if(stock>=81) return { round:2, pick:U.rint(33,64) };
    if(stock>=76) return { round:3, pick:U.rint(65,96) };
    if(stock>=71) return { round:U.rint(4,5), pick:U.rint(97,160) };
    if(stock>=66) return { round:U.rint(6,7), pick:U.rint(161,250) };
    return { round:0, pick:0 };
  }

  // ---------- development ----------
  function trainingPlan(focus){
    const a = C.pl.attrs, changes = {}, keys = Object.keys(a);
    const dev = [1.0,1.0,0.75,0.5,0.4][Math.min(4,C.pl.cls)] * (bgOf()==='bloomer' ? 1.4 : 1);
    keys.forEach(k=>{
      let inc = Math.round(U.rint(0,2)*dev);
      if(k===focus){ inc = Math.round(U.rint(3,5)*Math.max(0.7,dev)); if(C.meters.resp>=65) inc += 1; if(C.meters.resp<=25) inc -= 1; if(bgOf()==='rat') inc += 1; }
      inc = U.clamp(inc, k===focus?1:0, 6);
      if(a[k]+inc>99) inc = 99-a[k];
      changes[k] = inc;
    });
    return changes;
  }
  // The rest of the league answers your success — otherwise a strong build just keeps beating a flat-average
  // pool forever, with less at stake every year you're good. Every other team's drift target climbs with your
  // years in charge and your titles, up to +14, instead of sitting at a fixed 72 regardless of the scoreboard.
  function programDrift(){
    const pressure = Math.min(34, (C.year-1)*2.8 + (C.champs||0)*6 + (C.confTitles||0)*2.6);
    const oppTarget = 72 + pressure;
    C.league.forEach(t=>{
      if(t.isUser) return;
      t.off = U.clamp(Math.round(t.off + (oppTarget-t.off)*0.08 + U.gauss()*2.4), 52, 96);
      t.def = U.clamp(Math.round(t.def + (oppTarget-t.def)*0.08 + U.gauss()*2.4), 48, 96);
      t.rating = Math.round((t.off+t.def)/2);
    });
    const t = C.school;
    t.off = U.clamp(Math.round(t.off + (72-t.off)*0.10 + U.gauss()*1.4), 52, 92);
    t.def = U.clamp(Math.round(t.def + (72-t.def)*0.10 + U.gauss()*1.4), 48, 92);
    t.rating = Math.round((t.off+t.def)/2);
  }
