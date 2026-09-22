  // ============================================================
  // CAREER ENGINE — shared by Five-Star (player) and Hot Seat (coach)
  // ============================================================
  // ---------- safe storage ----------
  // Every read/write goes through here. Browsers can block or fill localStorage (private windows,
  // blocked site data, quota), and a bare call would throw and freeze the game. Falls back to memory.
  const store = (function(){
    const mem = {};
    function ls(){ try{ return window.localStorage; }catch(e){ return null; } }
    return {
      get(k){ try{ const l = ls(); if(l){ const v = l.getItem(k); if(v!==null) return v; } }catch(e){} return Object.prototype.hasOwnProperty.call(mem,k) ? mem[k] : null; },
      set(k,v){ v = String(v); mem[k] = v; try{ const l = ls(); if(l){ l.setItem(k,v); return true; } }catch(e){} return false; },
      del(k){ delete mem[k]; try{ const l = ls(); if(l) l.removeItem(k); }catch(e){} }
    };
  })();

  const U = {
    clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),
    rint:(a,b)=>a+Math.floor(Math.random()*(b-a+1)),
    pick:(arr)=>arr[Math.floor(Math.random()*arr.length)],
    chance:(p)=>Math.random()<p,
    gauss:()=>{ let u=0,v=0; while(!u)u=Math.random(); while(!v)v=Math.random(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); },
    shuffle:(a)=>{ a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; },
    ord:(n)=>{ const s=['th','st','nd','rd'], v=n%100; return n+(s[(v-20)%10]||s[v]||s[0]); },
    fans:(n)=> n>=1e6 ? (n/1e6).toFixed(1)+'M' : n>=1e3 ? Math.round(n/1e3)+'K' : String(Math.round(n)),
    sign:(n)=> (n>0?'+':n<0?'−':'')+Math.abs(n)
  };
  const FIRST = ['Marcus','Devon','Jalen','Tre','Cam','Isaiah','Rashad','Landon','Bryce','Malik','Colt','Dante','Eli','Grady','Hunter','Jaxon','Keon','Micah','Nolan','Omar','Quincy','Ryder','Terrence','Wyatt','Zeke','Amari','Brock','Corey','Darius','Emmett'];
  const LAST = ['Cross','Whitfield','Okafor','Barnett','Delaney','Holloway','Vance','Rourke','Sutter','Beckett','Lawson','Mercer','Tolliver','Nash','Prescott','Ridley','Stokes','Tanner','Voss','Wexler','Yates','Alder','Boone','Calloway','Dupree','Fontaine','Garrity','Haskell','Ingram','Keller'];
  const rndName = ()=> U.pick(FIRST)+' '+U.pick(LAST);

  // 28 fictional programs — [id, place, mascot, accent, off, def]
  const LEAGUE_DEF = [
    ['ohio-st','Ohio State','Buckeyes','#BB0000',82,74,'OSU'],
    ['oklahoma','Oklahoma','Sooners','#841617',86,65,'OU'],
    ['georgia','Georgia','Bulldogs','#BA0C2F',83,87,'UGA'],
    ['oregon','Oregon','Ducks','#154733',90,55,'ORE'],
    ['alabama','Alabama','Crimson Tide','#9E1B32',85,70,'BAMA'],
    ['tennessee','Tennessee','Volunteers','#FF8200',78,48,'TENN'],
    ['michigan','Michigan','Wolverines','#00274C',84,79,'MICH'],
    ['penn-st','Penn State','Nittany Lions','#041E42',80,76,'PSU'],
    ['clemson','Clemson','Tigers','#F56600',78,80,'CLEM'],
    ['florida','Florida','Gators','#0021A5',77,69,'FLA'],
    ['usc','USC','Trojans','#990000',79,72,'USC'],
    ['lsu','LSU','Tigers','#461D7C',76,70,'LSU'],
    ['notre-dame','Notre Dame','Fighting Irish','#0C2340',75,73,'ND'],
    ['texas','Texas','Longhorns','#BF5700',71,64,'TEX'],
    ['miami','Miami (FL)','Hurricanes','#F47321',74,62,'MIA'],
    ['auburn','Auburn','Tigers','#E87722',73,71,'AUB'],
    ['florida-st','Florida State','Seminoles','#782F40',71,75,'FSU'],
    ['nebraska','Nebraska','Cornhuskers','#E41C38',70,74,'NEB'],
    ['wisconsin','Wisconsin','Badgers','#C5050C',72,67,'WISC'],
    ['washington','Washington','Huskies','#4B2E83',72,68,'WASH'],
    ['texas-am','Texas A&M','Aggies','#500000',70,66,'TAMU'],
    ['michigan-st','Michigan State','Spartans','#18453B',69,69,'MSU'],
    ['iowa','Iowa','Hawkeyes','#C9A400',66,72,'IOWA'],
    ['colorado','Colorado','Buffaloes','#8A7A3B',68,66,'COLO'],
    ['pittsburgh','Pittsburgh','Panthers','#003594',67,63,'PITT'],
    ['arkansas','Arkansas','Razorbacks','#9D2235',68,71,'ARK'],
    ['syracuse','Syracuse','Orange','#D44500',65,68,'SYR'],
    ['west-virginia','West Virginia','Mountaineers','#002855',63,64,'WVU']
  ];
  function makeLeague(){
    return LEAGUE_DEF.map(d=>({
      id:d[0], place:d[1], nick:d[2], name:d[1]+' '+d[2], accent:d[3],
      short:d[6],
      off:d[4], def:d[5], rating:Math.round((d[4]+d[5])/2),
      rec:{w:0,l:0}, pf:0, pa:0, conf:false, rank:0, pow:0
    }));
  }

  // ---------- tiers / labels ----------
  const METER_TIERS = {
    conf:{ player:['Rattled','Shaky','Steady','Locked in','Unshakable'], coach:['Fragile','Tense','Steady','Confident','Fearless'] },
    resp:{ player:['Overlooked','Accepted','Respected','Trusted','Team leader'], coach:['Hot seat','Uneasy','Secure','Backed','Untouchable'] },
    fans:{ player:['Unknown','Known','Fan favorite','Star','Icon'], coach:['Restless','Watching','Buying in','Loud','Fired up'] }
  };
  function meterTier(key, v){ const i = v<=20?0 : v<=40?1 : v<=60?2 : v<=80?3 : 4; return METER_TIERS[key][C.mode==='coach'?'coach':'player'][i]; }
  const METER_LABEL = {
    player:{ conf:'Confidence', resp:'Respect', fans:'Fans' },
    coach:{ conf:'Team belief', resp:'Job security', fans:'Fan energy' }
  };

  // league average offense runs ~6 points above average defense, so the base sits below 26 to keep games near 26 a side
  const BASE_PTS = 24;
  // ---------- score generation ----------
  function footballPts(mean){
    mean = U.clamp(mean, 3, 58);
    const tds = Math.max(0, Math.round(mean*0.80/7 + U.gauss()*1.25));
    const fgs = Math.max(0, Math.round(mean*0.20/3 + U.gauss()*0.9));
    let p = tds*7 + fgs*3;
    const r = Math.random();
    if(r<0.05 && tds>0) p -= 1; else if(r<0.08 && tds>0) p += 1;
    if(Math.random()<0.03) p += 2;
    return Math.max(0, p);
  }
  function finishScores(my, opp){
    let ot = false;
    if(my===opp){ ot = true; if(Math.random()<0.5) my += Math.random()<0.6?3:7; else opp += Math.random()<0.6?3:7; }
    return { my, opp, ot, W: my>opp };
  }

  // ---------- opponent flavour ----------
  function oppBlurb(t){
    const d = t.off - t.def;
    if(t.blurb) return t.blurb;
    if(t.off>=84 && t.def>=78) return 'A complete team. No obvious soft spot, and they know it.';
    if(d>=12) return 'Shootout merchants. They score on anybody and give it right back.';
    if(d>=5) return 'Offense-first squad — the defense is where you can get at them.';
    if(d<=-10) return 'A defense-first outfit that wins ugly and wins low.';
    if(d<=-4) return 'Physical and patient. They shorten the game and dare you to keep up.';
    if(t.rating<=66) return 'Rebuilding, but dangerous when nothing is expected of them.';
    return 'Balanced and well-coached. It usually comes down to the fourth quarter.';
  }
  // Per-team override blurbs used to live here, keyed to the old fictional league. Real programs (see
  // LEAGUE_DEF) use oppBlurb()'s generic, stat-driven line instead — it never states anything about the
  // real school, only about this year's simulated off/def numbers.
  const KNOWN_BLURB = {};

  // ---------- reporters (fictional) ----------
  const CAST = {
    beat:{ name:'Rita Vasquez', role:'Beat writer', outlet:'The Campus Ledger' },
    anchor:{ name:'Big Jim Tolliver', role:'Studio anchor', outlet:'Sunday Sideline' },
    analyst:{ name:'Dale "Cutback" Merrick', role:'Analyst', outlet:'Gridiron Wire' },
    reporter:{ name:'Tori Sands', role:'Sideline reporter', outlet:'Gridiron Wire' },
    numbers:{ name:'Priya Nair', role:'Numbers desk', outlet:'Gridiron Wire' }
  };
  const FAN_HANDLES = ['@sundaycellar','@hailmary_hank','@tailgate_tess','@bluechip_bob','@thegridwriter','@third_and_long','@filmroom_finn','@dawg_pound_dan','@studentsection_sam','@cfbchaos'];
  const POST_GOOD = [
    '{n} said it and then went out and did it. Unreal.','okay {n} might actually be him','{school} fans eating good tonight, {n} is HIM','not a lot of people can talk like that AND back it up. {n} can.','bookmark this, {n} is a problem for the whole conference','the way {n} carries himself... this team follows that'
  ];
  const POST_BAD = [
    '{n} talking like that after THAT? bookmark this','someone take {n}\'s phone away','{opp} fans are going to frame this quote','reading the room has never been {n}\'s strong suit','this is going to age like milk','the pressure on {n} just doubled and he did it to himself'
  ];
  const POST_SAFE = [
    '{n} handled that with class.','boring answer, good team man. respect.','no drama out of {n}. love it.','{n} is the last guy who\'ll ever say the wrong thing. that\'s a compliment.','say what you want, {n} gives credit where it\'s due'
  ];
  const HEAD_GOOD = ['{n} backs it up: "{school} isn\'t done"','The {school} face of the program has arrived','{n} owns the moment, and the room believes it','Big words, bigger results for {n}'];
  const HEAD_BAD = ['{n} walks it back amid backlash','Bold words come back to bite {school}\'s {n}','{n} hands {opp} some bulletin-board material','{school} leader under fire after comments'];
  const HEAD_SAFE = ['{n} keeps it professional','Steady voice in the {school} locker room','{n}: "It\'s about the guys next to me"'];
  const INSIDERS = ['A staffer, on background','A teammate, off the record','Someone in the building','A source close to the program','A team manager'];
  const INSIDE_GOOD = ['{n} handled that like a pro. The room noticed.','Word around the facility: that earned {n} real points today.','It got quiet, then it all clicked. {n} is trending up in there.','Nobody said it out loud, but the mood shifted toward {n}.'];
  const INSIDE_BAD = ['That one did not land with anybody. Somebody\'s going to talk.','Teammates are talking, and it isn\'t flattering to {n}.','Not the kind of thing that stays in the room.','The whole building knows by lunch.'];
  const INSIDE_SAFE = ['Quiet day. {n} did what was asked.','Nothing to see here, and that is how the staff likes it.','No drama out of {n}. The room noticed that too.'];
  const HEAD_IN_GOOD = ['Sources: {n} is winning the room at {school}','Inside {school}: the standard is {n}\'s to set','{n} earns quiet respect behind closed doors'];
  const HEAD_IN_BAD = ['Trouble behind closed doors at {school}?','Sources: friction inside the {nick} program','Tension in the building as {opp} week arrives'];
  const HEAD_IN_SAFE = ['Business as usual at {school}','{school} keeps it in-house','No drama at {school} ahead of {opp}'];
  const RIVAL_GOOD = ['"Good for him. See you on the field."','"Talk is cheap. He earned this one."'];
  const RIVAL_BAD = ['"New bulletin-board quote, thanks {n}."','"Somebody let him keep talking."','"We\'ll take that. Thank you."'];
