  // ---------- game logic (pure) ----------
  const DEF_POSITIONS = ['EDGE','DB','LB'];
  const DOWN_LABEL = ['1st','2nd','3rd','4th'];
  function isDefPos(k){ return DEF_POSITIONS.includes(k||state.position); }
  function fieldPosText(yardline){
    const y = Math.round(yardline);
    if(y===50) return 'midfield';
    if(state.defMode) return y<50 ? ('their own '+y) : ('your '+(100-y));
    return y<50 ? ('the own '+y) : ('the opp '+(100-y));
  }
  // ---------- random numbers for the sim ----------
  // Everything that decides a play draws from rnd(). Normally that is Math.random. The daily game seeds it per drive
  // (see seedRng) so that every player gets the same dice on the same day, whatever they did on earlier drives.
  let RNGF = null;
  function rnd(){ return RNGF ? RNGF() : Math.random(); }
  function seedRng(key){
    let a = hashStr(String(key)) >>> 0;
    RNGF = function(){ a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a>>>15, 1|a); t = t + Math.imul(t ^ t>>>7, 61|t) ^ t; return ((t ^ t>>>14)>>>0)/4294967296; };
  }
  function unseedRng(){ RNGF = null; }

  // ---------- style: how aggressive a call is ----------
  // Every call has a style from conservative (-1) to aggressive (+1): Ball Control / Play It Safe / Contain,
  // up to Air Raid / Attack / Blitz. Style never adds quality on its own. It changes the SHAPE of a drive
  // (more big plays and takeaways, or steadier gains) and it pays off or costs depending on FIT: how much
  // the build (explosive vs. steady attributes) and the opponent (its `lean` / `offLean`) favor aggression.
  const PLAN_AGG = { control:-1, balanced:0, airraid:1 };
  // explosive (E) vs. steady (S) attributes for each position; the rest are neutral
  const STYLE_SETS = {
    QB:{ E:['ARM','DEEP','MOB'], S:['ACC','IQ','POC'] },
    RB:{ E:['SPD','ELU','REC'], S:['POW','VIS','PBK'] },
    WR:{ E:['SPD','YAC','CTR'], S:['RTE','HND','IQ'] },
    OL:{ E:['PBK','FT','ANC'], S:['RBK','STR','DIS'] },
    EDGE:{ E:['RSH','GET','MOT'], S:['RS','DIS','IQ'] },
    DB:{ E:['BALL','SPD','PHY'], S:['COV','TKL','IQ'] },
    LB:{ E:['BLZ','SPD','STR'], S:['TKL','COV','RS'] }
  };
  function slotMean(keys){
    let s=0, n=0; keys.forEach(k=>{ if(state.slots[k]!=null){ s+=state.slots[k]; n++; } });
    return n ? s/n : 70;
  }
  // -1 (steady, game-manager profile) .. +1 (explosive, gunslinger profile)
  function buildLean(){
    const st = STYLE_SETS[state.position]; if(!st) return 0;
    return Math.max(-1, Math.min(1, (slotMean(st.E)-slotMean(st.S))/TUNE.spread));
  }
  // stable pseudo-random lean in -0.8..0.8 for teams that have no hand-set value (the career league)
  function hashLean(id, salt){
    let h = 2166136261; const str = id+':'+salt;
    for(let i=0;i<str.length;i++){ h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return ((h>>>0) % 1601 - 800)/1000;
  }
  function buildProfile(){ const b = buildLean(); return b>0.35 ? 'explosive' : b<-0.35 ? 'steady' : 'balanced'; }
  // what the scouting report says about an opponent's weakness, from its lean
  function scoutRead(lean, def){
    if(lean>=0.6) return def ? { tag:'Falls apart under pressure', text:'Their line and quarterback crack when you bring heat. Pressure pays.' }
                             : { tag:'Soft against big plays', text:'Their defense gives up chunk plays. Attacking pays.' };
    if(lean>=0.25) return def ? { tag:'Shaky under pressure', text:'A little vulnerable to the blitz, but not by much.' }
                              : { tag:'Leans exposed', text:'A little vulnerable to the aggressive game, but not by much.' };
    if(lean>-0.25) return { tag:'No clear weakness', text:'No obvious hole. Balanced is the safe call.' };
    if(lean>-0.6) return def ? { tag:'Careful offense', text:'They protect the ball and punish the blitz. Stay home.' }
                             : { tag:'Disciplined defense', text:'They punish mistakes. Patience is rewarded.' };
    return def ? { tag:'Built to beat the blitz', text:'They make anyone who sends pressure pay for it. Contain.' }
               : { tag:'Ball hawks', text:'They take the ball away. Ball control beats risk.' };
  }
  // `def` says which side of the ball the player is on. Callers outside the sim must pass it: state.defMode is only set while a sim runs.
  function teamLean(def){ const t = state.team||{}; return ((def===undefined ? state.defMode : def) ? t.offLean : t.lean) || 0; }
  // -2 .. +2. Positive: aggression is favored (soft defense / explosive build). Negative: patience is.
  function styleFit(def){ return buildLean() + teamLean(def); }
  function styleOf(isSig, sigChoice){
    const fit = styleFit(), F = state.defMode ? TUNE.fixDef : TUNE.fixOff;
    if(isSig){ const ag = sigChoice==='attack' ? 1 : -1; return { ag, dq: TUNE.sigA*ag*fit + (ag>0 ? F.atk : F.safe) }; }
    const ag = PLAN_AGG[state.plan] || 0;
    return { ag, dq: ag===0 ? 0 : (ag>0 ? TUNE.planAup : TUNE.planAdn)*ag*fit - (state.defMode ? TUNE.planCDef : TUNE.planC) + (ag>0 ? F.air : F.ctl) };
  }
  // ---------- involvement: whose play is this? ----------
  // Every play belongs either to you or to a teammate. Your position decides which plays you're eligible
  // for at all; your quality (not a team average) decides how often you get the touch and, when you do,
  // the play runs on YOUR number instead of a generic teammate's. A position with no role in this play type
  // (a WR on a run play, a corner in run defense) never touches it: the play runs on the teammate baseline.
  const ROLE_BY_POS = {
    QB:{ pass:'you' },                 // the passer, every pass play
    RB:{ run:0.70, pass:0.16 },        // the carrier most of the time; a checkdown target sometimes
    WR:{ pass:0.46 },                  // the target on a big share of pass plays
    OL:null,                           // blocks every play; no single "touch" to gate
    EDGE:{ pass:0.5, run:0.22 },       // mostly a pass-rush threat, sometimes in on a run stop
    DB:{ pass:0.45 },                  // coverage: interceptions, pass breakups, the tackle after a catch
    LB:{ run:0.42, pass:0.24 }         // run support first, underneath coverage too
  };
  const TEAM_Q = 74;          // an average, un-drafted teammate's quality on a play that isn't yours
  const INVOLVE_SPREAD = 26;  // how far your OVR (roughly 40..99) swings your own usage share
  function involvement(isPass){
    const r = ROLE_BY_POS[state.position];
    if(!r) return null;                                  // OL: always full personal quality, no gating
    const base = r[isPass ? 'pass' : 'run'];
    if(base===undefined) return { mine:false, role:null };    // has a role, just not in this play type
    if(base==='you') return { mine:true, role:'passer' };
    const q = buildQ().q;
    const p = Math.max(0.06, Math.min(0.92, base + (q-72)/INVOLVE_SPREAD*0.30));
    return { mine: rnd()<p, p, role: state.defMode ? 'stop' : (isPass ? 'target' : 'carry') };
  }
  function buildQ(){
    const pos = POSITIONS[state.position] || POSITIONS.QB;
    let sum=0; pos.attrs.forEach(k=>{ sum += (state.slots[k]||0); });
    const avg = sum/pos.attrs.length;
    const favors = state.defMode ? (state.team.offFavors||[]) : (state.team.favors||[]);
    let bonus=0; favors.forEach(k=>{ if(state.slots[k]!=null){ bonus += (state.slots[k]-70)*0.14; } });
    return { avg, q: avg + bonus, noise: TUNE.noise };
  }
  function effQuality(isSig, sigChoice, st, inv){
    const b = buildQ(); let q = inv && !inv.mine ? TEAM_Q : b.q; st = st || styleOf(isSig, sigChoice);
    if(!state.defMode){
      q -= ((state.team.defRating!=null?state.team.defRating:65)-55)*TUNE.defK;
      q += st.dq;
    } else {
      q = (state.team.offRating!=null?state.team.offRating:66) - (q-55)*TUNE.defK;
      q -= st.dq;
    }
    return q + (rnd()*2-1)*b.noise;
  }
  const TUNE = { b0:2.85, slope:0.025, big:0.001, bigMin:0.02, to:0.0008, toBase:0.07, defK:0.55,
    noise:8.4, spread:10,
    planAup:5.9, planAdn:4.3, planC:2.5, planCDef:1.8, sigA:5,        // fit payoff (per unit of fit) and flat cost of leaning on a plan
    bigUp:1.0, bigDn:0.6, toAg:0.5, lossAg:0.5, gainAg:0, // shape per unit of aggression: big plays (more when aggressive, cut but never to zero when conservative), turnovers, negative plays, steady gains
    // keep the average equal to Balanced at fit 0 (measured: 82-OVR build; QB vs a 70 defense, DB vs an 82 offense)
    fixOff:{ air:1.0, ctl:-3.4, atk:-6.3, safe:-4.3 }, fixDef:{ air:-2.8, ctl:5.0, atk:-2.0, safe:5.2 },
    twoTry:0.47, fgSafe:62 };
  function resolvePlay(isSig, sigChoice){
    const st = styleOf(isSig, sigChoice), ag = st.ag;
    const passP = state.defMode ? 0.55 : (isSig ? (sigChoice==='attack'?0.62:0.4) : (state.plan==='airraid'?0.65:(state.plan==='control'?0.35:0.5)));
    const isPass = rnd() < passP;
    const inv = involvement(isPass);
    const quality = effQuality(isSig, sigChoice, st, inv);
    const mine = !!(inv && inv.mine), role = inv ? inv.role : null;
    const turnoverChance = Math.max(0.01, TUNE.toBase - quality*TUNE.to) * (1 + TUNE.toAg*ag);
    if(rnd() < turnoverChance) return { type:'turnover', yards:0, isPass, mine, role };
    if(rnd() < 0.05*(1 + TUNE.lossAg*ag)){ return { type:'loss', yards: -Math.round(1+rnd()*6), isPass, mine, role }; }
    const bigChance = Math.max(TUNE.bigMin, (quality-60)*TUNE.big) * (1 + (ag>0 ? TUNE.bigUp : TUNE.bigDn)*ag);
    if(rnd() < bigChance){ return { type:'explosive', yards: Math.round(16+rnd()*34), isPass, mine, role }; }
    const base = TUNE.b0 + (quality-60)*TUNE.slope;
    const gain = Math.max(0, Math.round(base*(1 + TUNE.gainAg*ag) + (rnd()*6-2)));
    return { type:'normal', yards: gain, isPass, mine, role };
  }

  function newDrive(n){
    return { n, isSig:SIGNATURE.includes(n), sigChoice:null, down:1, distance:10, yardline:25, outcome:'punt', points:0, plays:0, over:false, guard:0 };
  }
  function stepDrive(D){
    if(++D.guard>20){ D.over=true; return {kind:'end'}; }
    if(D.down===4){
      const goForIt = state.defMode
        ? (D.distance<=2 && D.yardline>=40 && rnd()<0.4)
        : (D.isSig && D.sigChoice==='attack' && D.yardline<68 && D.distance<=4 && rnd()<0.5);
      if(!goForIt){
        const fgLine = (!state.defMode && D.isSig && D.sigChoice==='safe') ? TUNE.fgSafe : 65;
        D.outcome = D.yardline>=fgLine ? 'fg' : 'punt'; D.points = D.outcome==='fg' ? 3 : 0; D.over = true;
        return { kind:'kick', fg:D.outcome==='fg', y0:D.yardline, down:4, distance:D.distance };
      }
    }
    const result = resolvePlay(D.isSig, D.sigChoice);
    D.plays++;
    const isTO = result.type==='turnover';
    const newYard = isTO ? D.yardline : Math.min(100, Math.max(0, D.yardline + result.yards));
    const scored = !isTO && newYard>=100;
    const gotFirst = !isTO && !scored && (result.yards>=D.distance);
    const ev = { kind:'play', result, y0:D.yardline, down:D.down, distance:D.distance, newYard, scored, gotFirst, isTO, downs:false };
    if(isTO){ D.outcome='turnover'; D.points=0; D.over=true; return ev; }
    if(scored){
      if(!state.defMode && D.isSig && D.sigChoice==='attack'){      // Attack goes for two: 8 if it works, 6 if it doesn't
        const good = rnd()<TUNE.twoTry;
        D.outcome = good?'td2':'tdx'; D.points = good?8:6; D.over=true; return ev;
      }
      D.outcome = 'td'; D.points = 7; D.over=true; return ev;
    }
    if(gotFirst){ D.yardline=newYard; D.down=1; D.distance=10; return ev; }
    D.yardline = newYard; D.distance = Math.max(1, D.distance - Math.max(0, result.yards));
    if(D.down<4){ D.down++; return ev; }
    D.outcome='downs'; D.points=0; D.over=true; ev.downs=true; return ev;
  }
  function autoChoice(){ return styleFit() > 0.1 ? 'attack' : 'safe'; }
  function simGamePure(){
    let total=0;
    for(let n=1;n<=12;n++){
      const D = newDrive(n); if(D.isSig) D.sigChoice = autoChoice();
      while(!D.over) stepDrive(D);
      total += D.points;
    }
    return total;
  }
  function gameTarget(){ return state.defMode ? state.team.allowTarget : state.team.target; }
  function estimateOdds(n){
    n = n||400;
    const prev = state.defMode; state.defMode = isDefPos(state.position);
    let sum=0, beat=0; const tgt = gameTarget();
    for(let i=0;i<n;i++){ const s = simGamePure(); sum+=s; if(state.defMode ? s<=tgt : s>=tgt) beat++; }
    state.defMode = prev;
    return { avg:sum/n, beat:beat/n, target:tgt, def:isDefPos(state.position) };
  }
