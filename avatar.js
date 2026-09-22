  // ============================================================
  // CHARACTER — the file you fill out before a career: a face, a hometown, a number, a background
  // ============================================================
  const SKIN_TONES = ['#f6d7bd','#efc39b','#d9a066','#c48450','#a86a3f','#8a5230','#6b3e24','#4a2a19'];
  const HAIR_COLORS = ['#14100e','#3a2417','#6b4423','#c9a25a','#a4432a','#b9b8b0'];
  const LOOK_TRAITS = {
    player:[
      { key:'hair', label:'Hair', opts:[['buzz','Buzz'],['fade','Fade'],['curls','Curls'],['afro','Afro'],['twists','Twists'],['braids','Braids'],['long','Long'],['mohawk','Mohawk'],['bald','Bald']] },
      { key:'facial', label:'Facial hair', opts:[['none','Clean'],['stubble','Stubble'],['goatee','Goatee'],['beard','Beard']] },
      { key:'eyeBlack', label:'Eye black', opts:[['none','None'],['bars','Bars']] },
      { key:'band', label:'Headband', opts:[['none','None'],['white','White'],['team','Team color']] }
    ],
    coach:[
      { key:'hair', label:'Hair', opts:[['short','Short'],['part','Side part'],['buzz','Buzz'],['receding','Receding'],['bald','Bald']] },
      { key:'facial', label:'Facial hair', opts:[['none','Clean'],['mustache','Mustache'],['goatee','Goatee'],['beard','Beard']] },
      { key:'glasses', label:'Glasses', opts:[['none','None'],['round','Round'],['aviator','Aviator']] },
      { key:'headwear', label:'Headwear', opts:[['none','None'],['cap','Cap'],['visor','Visor']] },
      { key:'headset', label:'Headset', opts:[['off','Off'],['on','On']] },
      { key:'attire', label:'Attire', opts:[['polo','Polo'],['zip','Quarter-zip'],['jacket','Windbreaker']] }
    ]
  };
  const HOMETOWNS = ['Dothan, AL','Valdosta, GA','Tupelo, MS','Odessa, TX','Massillon, OH','Bakersfield, CA','Compton, CA','Lakeland, FL','Baton Rouge, LA','Cedar Rapids, IA','Bristol, TN','Muskogee, OK','Pahokee, FL','Ruston, LA','Steubenville, OH','Concord, NC','Lubbock, TX','Fort Wayne, IN','Salina, KS','Butte, MT','Eugene, OR','Hattiesburg, MS','Youngstown, OH','Lawton, OK','Scranton, PA','Boise, ID','Rock Hill, SC','Ames, IA','Tulsa, OK','Paducah, KY'];
  // A background is a perk and a cost. The starting meters move at signing day; the rest is a rule that shows up later.
  // Sized so that none of them is a free pick (tests/balance.html checks the first season).
  const BACKGROUNDS = {
    player:[
      { id:'hero', label:'Hometown hero', perk:'Fans +10 at the start, and they forget you more slowly.', cost:'Confidence -4. Everyone expects a lot.', start:{ fans:10, conf:-4 } },
      { id:'chip', label:'Chip on the shoulder', perk:'Confidence +6, and risky answers land more often.', cost:'Respect -8. The room does not know you yet.', start:{ conf:6, resp:-8 } },
      { id:'rat', label:'Film rat', perk:'Respect +8, and your training focus gains an extra point every off-season.', cost:'Fans -6. Nobody is buying a jersey for the guy in the film room.', start:{ resp:8, fans:-6 } },
      { id:'bloomer', label:'Late bloomer', perk:'Every attribute grows about 40% faster.', cost:'Confidence -6, Fans -4. Nobody expected you to be here.', start:{ conf:-6, fans:-4 } }
    ],
    coach:[
      { id:'off', label:'Offensive mind', perk:'Offense +3 all career.', cost:'Defense -2.', start:{} },
      { id:'def', label:'Defensive mind', perk:'Defense +3 all career.', cost:'Offense -2.', start:{} },
      { id:'players', label:'Players\' coach', perk:'Team belief +8 at the start, and it holds better between seasons.', cost:'Job security -6. The AD thinks you are soft.', start:{ conf:8, resp:-6 } },
      { id:'recruiter', label:'Recruiter', perk:'The program grows a little faster every year.', cost:'Team belief -4. You are better at the phone than the whiteboard.', start:{ conf:-4 } }
    ]
  };
  function bgOf(){ return C && C.char ? C.char.bg : null; }
  function applyBackground(){
    const list = BACKGROUNDS[C.mode], bg = list.find(b=>b.id===(C.char&&C.char.bg)) || list[0];
    if(C.char) C.char.bg = bg.id;
    ['conf','resp','fans'].forEach(k=>{ if(bg.start[k]) C.meters[k] = U.clamp(C.meters[k]+bg.start[k], 0, 100); });
  }

  // ---------- the portrait ----------
  function shade(hex, a){          // darken a #rrggbb by a fraction
    const n = parseInt(hex.slice(1),16), r = n>>16&255, g = n>>8&255, b = n&255;
    const f = x=>Math.round(x*(1-a)).toString(16).padStart(2,'0');
    return '#'+f(r)+f(g)+f(b);
  }
  function hairBack(o, hc){
    switch(o.hair){
      case 'afro': return `<circle cx="50" cy="35" r="27" fill="${hc}"/>`;
      case 'long': return `<path d="M27 40 Q24 74 32 84 L44 78 L56 78 L68 84 Q76 74 73 40 Z" fill="${hc}"/>`;
      case 'twists': return [26,31,69,74].map((x,i)=>`<rect x="${x-2}" y="40" width="4" height="${30+i%2*6}" rx="2" fill="${hc}"/>`).join('')+`<rect x="30" y="34" width="40" height="30" fill="${hc}"/>`;
      case 'braids': return [28,34,66,72].map(x=>`<rect x="${x-1.5}" y="42" width="3" height="34" fill="${hc}"/>`).join('');
      default: return '';
    }
  }
  function hairFront(o, hc, isCoach){
    const cap = `M30 42 Q29 20 50 20 Q71 20 70 42 Q66 30 50 30 Q34 30 30 42 Z`;
    switch(o.hair){
      case 'buzz': return `<path d="${cap}" fill="${hc}" opacity=".85"/>`;
      case 'fade': return `<path d="M30 40 Q29 20 50 20 Q71 20 70 40 Q66 31 50 31 Q34 31 30 40 Z" fill="${hc}"/><path d="M30 40 L31 50 L34 44 Z M70 40 L69 50 L66 44 Z" fill="${hc}" opacity=".45"/>`;
      case 'curls': return `<path d="${cap}" fill="${hc}"/>`+[34,41,48,55,62,68].map((x,i)=>`<circle cx="${x}" cy="${i%2?22:25}" r="5" fill="${hc}"/>`).join('');
      case 'afro': return `<path d="${cap}" fill="${hc}"/>`;
      case 'twists': return `<path d="${cap}" fill="${hc}"/>`+[36,44,52,60].map(x=>`<rect x="${x-2}" y="16" width="4" height="10" rx="2" fill="${hc}"/>`).join('');
      case 'braids': return `<path d="${cap}" fill="${hc}"/><path d="M34 26 L34 38 M42 22 L42 34 M50 20 L50 32 M58 22 L58 34 M66 26 L66 38" stroke="${shade(hc,.35)}" stroke-width="1.2" fill="none"/>`;
      case 'long': return `<path d="M29 44 Q28 18 50 18 Q72 18 71 44 Q68 30 58 28 Q46 34 32 34 Z" fill="${hc}"/>`;
      case 'mohawk': return `<path d="M45 12 L55 12 L58 32 L42 32 Z" fill="${hc}"/><path d="M31 40 Q31 33 50 33 Q69 33 69 40 Q64 36 50 36 Q36 36 31 40Z" fill="${hc}" opacity=".35"/>`;
      case 'short': return `<path d="${cap}" fill="${hc}"/>`;
      case 'part': return `<path d="${cap}" fill="${hc}"/><path d="M40 24 L46 30" stroke="${shade(hc,.45)}" stroke-width="1.5"/>`;
      case 'receding': return `<path d="M30 44 Q29 30 36 26 Q33 34 34 44 Z M70 44 Q71 30 64 26 Q67 34 66 44 Z" fill="${hc}"/><path d="M38 24 Q50 19 62 24 Q50 22 38 24Z" fill="${hc}" opacity=".7"/>`;
      default: return '';   // bald
    }
  }
  function facialHair(o, hc){
    switch(o.facial){
      case 'stubble': return `<path d="M32 50 Q50 76 68 50 L68 56 Q50 80 32 56 Z" fill="rgba(20,16,14,0.30)"/>`;
      case 'beard': return `<path d="M31 48 Q32 74 50 74 Q68 74 69 48 L65 50 Q64 66 50 66 Q36 66 35 50 Z" fill="${hc}"/><path d="M44 58 Q50 55 56 58 Q50 60 44 58Z" fill="${hc}"/>`;
      case 'goatee': return `<path d="M44 60 Q50 74 56 60 Q50 63 44 60 Z" fill="${hc}"/><path d="M44 57 Q50 54 56 57 Q50 59 44 57Z" fill="${hc}"/>`;
      case 'mustache': return `<path d="M42 57 Q50 53 58 57 Q50 60 42 57Z" fill="${hc}"/>`;
      default: return '';
    }
  }
  function avatarSVG(o){
    o = o || {};
    const isCoach = !!o.coach;
    const skin = o.skin || SKIN_TONES[2], hc = o.hairColor || (isCoach ? HAIR_COLORS[5] : HAIR_COLORS[0]);
    const team = o.jersey || '#4b5860', num = o.num!=null ? o.num : 7;
    const skinLo = shade(skin,.16);
    const ink = '#1b1512';
    // torso
    let torso;
    if(isCoach){
      const a = o.attire || 'polo';
      const dark = shade(team,.35);
      torso = a==='jacket'
        ? `<path d="M8 112 Q8 78 50 76 Q92 78 92 112 Z" fill="${team}"/><path d="M50 78 L50 112" stroke="${dark}" stroke-width="2"/><path d="M36 78 L50 90 L64 78" fill="none" stroke="${dark}" stroke-width="3"/><rect x="60" y="92" width="12" height="4" fill="${dark}"/>`
        : a==='zip'
        ? `<path d="M10 112 Q10 78 50 76 Q90 78 90 112 Z" fill="${team}"/><path d="M38 77 L38 86 L62 86 L62 77" fill="${shade(team,.15)}"/><path d="M50 84 L50 100" stroke="${dark}" stroke-width="2"/><rect x="56" y="94" width="10" height="3" fill="#e8e5d6" opacity=".8"/>`
        : `<path d="M10 112 Q10 78 50 76 Q90 78 90 112 Z" fill="${team}"/><path d="M38 77 L50 92 L62 77 L57 76 L50 84 L43 76 Z" fill="${shade(team,.25)}"/><path d="M50 86 L50 100" stroke="${shade(team,.4)}" stroke-width="2"/>`;
    } else {
      torso = `<path d="M8 112 Q8 78 50 76 Q92 78 92 112 Z" fill="${team}"/>
        <path d="M14 96 L28 92 M86 96 L72 92" stroke="rgba(255,255,255,.55)" stroke-width="3"/>
        <path d="M38 77 Q50 90 62 77" fill="${skinLo}"/>
        <text x="50" y="106" text-anchor="middle" style="font-family:var(--font-display);font-weight:800;font-size:22px;fill:#f2efe2;">${num}</text>`;
    }
    const eyes = `<ellipse cx="41" cy="46" rx="2.6" ry="2.2" fill="${ink}"/><ellipse cx="59" cy="46" rx="2.6" ry="2.2" fill="${ink}"/>
      <path d="M36 41 L45 40 M55 40 L64 41" stroke="${shade(hc,.1)}" stroke-width="2" stroke-linecap="square"/>`;
    const mouth = `<path d="M44 59 Q50 62 56 59" stroke="${shade(skin,.55)}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
    const nose = `<path d="M50 47 L47 55 L52 55" stroke="${shade(skin,.3)}" stroke-width="1.6" fill="none" stroke-linejoin="round"/>`;
    const eyeBlack = !isCoach && o.eyeBlack==='bars' ? `<rect x="36" y="49" width="10" height="2.6" fill="${ink}" opacity=".85"/><rect x="54" y="49" width="10" height="2.6" fill="${ink}" opacity=".85"/>` : '';
    let acc = '';
    if(!isCoach && o.band && o.band!=='none'){ acc += `<rect x="29" y="33" width="42" height="5" fill="${o.band==='team'?team:'#f2efe2'}"/>`; }
    if(isCoach){
      if(o.glasses==='round') acc += `<g fill="rgba(200,220,230,.18)" stroke="${ink}" stroke-width="1.6"><circle cx="41" cy="46" r="6.5"/><circle cx="59" cy="46" r="6.5"/></g><path d="M47.5 45 L52.5 45 M34.5 45 L30 43 M65.5 45 L70 43" stroke="${ink}" stroke-width="1.6" fill="none"/>`;
      if(o.glasses==='aviator') acc += `<g fill="rgba(20,24,28,.55)" stroke="${ink}" stroke-width="1.4"><path d="M34 42 L48 42 L46 51 Q41 54 36 50 Z"/><path d="M52 42 L66 42 L64 50 Q59 54 54 51 Z"/></g><path d="M48 43 L52 43 M34 42 L30 41 M66 42 L70 41" stroke="${ink}" stroke-width="1.4" fill="none"/>`;
      if(o.headwear==='cap') acc += `<path d="M28 38 Q28 16 50 16 Q72 16 72 38 Z" fill="${team}"/><path d="M28 38 L72 38 L72 41 L26 41 Q18 41 14 46 Q22 39 28 38Z" fill="${shade(team,.3)}"/>`;
      if(o.headwear==='visor') acc += `<path d="M29 34 Q50 27 71 34 L71 38 L29 38 Z" fill="${team}"/><path d="M27 37 L73 37 L73 41 L23 41 Q17 41 13 46 Q22 39 27 37Z" fill="${shade(team,.3)}"/>`;
      if(o.headset==='on') acc += `<path d="M27 46 Q26 12 50 12 Q74 12 73 46" fill="none" stroke="#15181a" stroke-width="3.2"/><rect x="24" y="42" width="6" height="12" rx="2" fill="#15181a"/><rect x="70" y="42" width="6" height="12" rx="2" fill="#15181a"/><path d="M27 54 Q30 66 44 64" fill="none" stroke="#15181a" stroke-width="2"/><circle cx="45" cy="64" r="2.4" fill="#15181a"/>`;
    }
    return `<svg viewBox="0 0 100 112" role="img" aria-label="${isCoach?'Your coach':'Your player'}">
      ${hairBack(o,hc)}
      <rect x="42" y="62" width="16" height="20" fill="${skinLo}"/>
      ${torso}
      <circle cx="30" cy="49" r="4.6" fill="${skinLo}"/><circle cx="70" cy="49" r="4.6" fill="${skinLo}"/>
      <ellipse cx="50" cy="46" rx="20" ry="23" fill="${skin}"/>
      ${eyeBlack}${eyes}${nose}${mouth}
      ${facialHair(o,hc)}
      ${hairFront(o,hc,isCoach)}
      ${acc}
    </svg>`;
  }

  // ---------- your character in the career ----------
  function charLook(){
    const look = Object.assign({}, state.avatar);
    if(C && C.school && C.school.accent) look.jersey = C.school.accent;     // the jersey is the school's
    look.coach = C ? C.mode==='coach' : !!look.coach;
    if(C && C.char && C.char.number!=null) look.num = C.char.number;
    return look;
  }
  function charPortrait(){ return avatarSVG(charLook()); }

  // ---------- the builder ----------
  function randomLook(mode){
    const pick = a=>a[Math.floor(Math.random()*a.length)];
    const look = { coach:mode==='coach', skin:pick(SKIN_TONES), hairColor: mode==='coach' ? pick(HAIR_COLORS.slice(0,3).concat(HAIR_COLORS.slice(5))) : pick(HAIR_COLORS.slice(0,5)) };
    LOOK_TRAITS[mode].forEach(t=>{ look[t.key] = pick(t.opts)[0]; });
    if(mode==='coach'){ look.headset = pick(['on','off']); }
    return look;
  }
  function defaultChar(mode){
    return { hometown:HOMETOWNS[Math.floor(Math.random()*HOMETOWNS.length)], number: mode==='coach' ? 0 : [7,12,22,34,55,80][Math.floor(Math.random()*6)], bg:BACKGROUNDS[mode][0].id };
  }
  function loadSavedChar(mode){
    try{ const s = JSON.parse(store.get('gg.char.v1')||'null'); if(s && s[mode]) return s[mode]; }catch(e){}
    return null;
  }
  function saveChar(mode){
    try{ const s = JSON.parse(store.get('gg.char.v1')||'null') || {}; s[mode] = { look:state.avatar, char:state.char }; store.set('gg.char.v1', JSON.stringify(s)); }catch(e){}
  }
  function ensureChar(mode){
    if(state.charMode===mode && state.avatar && state.char) return;
    const saved = loadSavedChar(mode);
    state.avatar = saved && saved.look ? saved.look : randomLook(mode);
    state.char = saved && saved.char && BACKGROUNDS[mode].some(b=>b.id===saved.char.bg) ? saved.char : defaultChar(mode);
    state.charMode = mode;
  }
  function renderCharacterBuilder(mode){
    const wrap = $('avatarPickerWrap'); if(!wrap) return;
    ensureChar(mode);
    const a = state.avatar, ch = state.char, isP = mode==='player';
    const stepper = t=>{
      const i = Math.max(0, t.opts.findIndex(o=>o[0]===a[t.key])), cur = t.opts[i];
      return `<div class="step-row"><span class="step-label">${t.label}</span>
        <button class="step-btn" data-key="${t.key}" data-dir="-1" aria-label="Previous ${t.label}">‹</button>
        <span class="step-val">${cur[1]}</span>
        <button class="step-btn" data-key="${t.key}" data-dir="1" aria-label="Next ${t.label}">›</button></div>`;
    };
    const sw = (kind, list, cur)=>list.map(c=>`<button class="swatch${cur===c?' active':''}" data-kind="${kind}" data-c="${c}" style="background:${c}" aria-label="${kind} ${c}"></button>`).join('');
    const bgs = BACKGROUNDS[mode].map(b=>`<button class="choice-btn bg-opt${ch.bg===b.id?' active':''}" data-bg="${b.id}"><strong>${b.label}</strong><span class="bg-perk">${b.perk}</span><span class="bg-cost">${b.cost}</span></button>`).join('');
    wrap.innerHTML = `<div class="file-sheet sheet">
      <div class="file-top">
        <div class="avatar-preview">${avatarSVG(Object.assign({}, a, { coach:!isP, num:ch.number, jersey:a.jersey }))}</div>
        <div class="file-fields">
          <label class="file-field"><span>Hometown</span>
            <select id="chHome">${HOMETOWNS.map(h=>`<option${h===ch.hometown?' selected':''}>${h}</option>`).join('')}</select></label>
          <div class="file-field"><span>${isP?'Jersey number':'Number on the door'}</span>
            <div class="step-row tight"><button class="step-btn" data-num="-1" aria-label="Lower number">‹</button><span class="step-val num">${ch.number}</span><button class="step-btn" data-num="1" aria-label="Higher number">›</button></div></div>
          <button class="btn btn-ghost btn-small" id="chRoll">Roll a new look</button>
        </div>
      </div>
      <div class="look-grid">
        <div class="swatch-block"><span class="step-label">Skin</span><div class="swatch-row">${sw('skin',SKIN_TONES,a.skin)}</div></div>
        <div class="swatch-block"><span class="step-label">Hair color</span><div class="swatch-row">${sw('hairColor',HAIR_COLORS,a.hairColor)}</div></div>
        ${LOOK_TRAITS[mode].map(stepper).join('')}
      </div>
      <p class="choice-title bg-title">Background</p>
      <div class="bg-list">${bgs}</div>
    </div>`;
    const redraw = ()=>{ saveChar(mode); renderCharacterBuilder(mode); };
    wrap.querySelectorAll('.swatch').forEach(b=>b.addEventListener('click',()=>{ a[b.dataset.kind] = b.dataset.c; redraw(); }));
    wrap.querySelectorAll('.step-btn[data-key]').forEach(b=>b.addEventListener('click',()=>{
      const t = LOOK_TRAITS[mode].find(x=>x.key===b.dataset.key), i = Math.max(0, t.opts.findIndex(o=>o[0]===a[t.key]));
      a[t.key] = t.opts[(i+Number(b.dataset.dir)+t.opts.length)%t.opts.length][0]; redraw();
    }));
    wrap.querySelectorAll('.step-btn[data-num]').forEach(b=>b.addEventListener('click',()=>{ ch.number = (ch.number+Number(b.dataset.num)+100)%100; redraw(); }));
    wrap.querySelectorAll('.bg-opt').forEach(b=>b.addEventListener('click',()=>{ ch.bg = b.dataset.bg; redraw(); }));
    $('chHome').addEventListener('change', e=>{ ch.hometown = e.target.value; saveChar(mode); });
    $('chRoll').addEventListener('click', ()=>{ const keep = ch.bg; state.avatar = randomLook(mode); state.char = Object.assign(defaultChar(mode), { bg:keep }); redraw(); });
  }
  // kept for the older call sites
  function renderAvatarPicker(id){ renderCharacterBuilder(state.pendingLegacyMode || 'player'); }

