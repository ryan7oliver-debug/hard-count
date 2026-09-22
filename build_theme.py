"""Locker Room theme pass. Runs AFTER build_data.py (use build_all.py)."""
import re
p = 'run-the-rivalry.html'
s = open(p, encoding='utf-8').read()

def rep_once(old, new):
    global s
    assert s.count(old) == 1, ('not unique/missing', old[:80], s.count(old))
    s = s.replace(old, new)

# ---- viewport (phones lay out at 980px without it) ----
rep_once('<meta charset="utf-8">', '<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">')

# ---- fonts ----
m = re.search(r'<link rel="stylesheet" href="https://fonts\.googleapis\.com/css2[^"]*">', s)
assert m
s = s.replace(m.group(0),
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@500;600;700&family=Big+Shoulders+Display:wght@700;800;900&family=Big+Shoulders+Stencil+Display:wght@800;900&family=Permanent+Marker&family=Press+Start+2P&family=Special+Elite&display=swap">')

# ---- stylesheet: wholesale replace ----
i = s.index('<style>'); j = s.index('</style>')
css = open('theme.css', encoding='utf-8').read()
s = s[:i] + '<style>\n' + css + s[j:]

# ---- body markup: wholesale replace ----
i = s.index('<div class="hashline"'); j = s.index('</footer>') + len('</footer>')
body = open('theme_body.html', encoding='utf-8').read()
s = s[:i] + body.rstrip() + s[j:]

# ---- JS: labels ----
rep_once("bagLabel:'Your Staff'", "bagLabel:'Your Staff Lockers'")
rep_once("bagLabel:'Your '+pos.label+' Bag'", "bagLabel:'Your Lockers'")
rep_once("""Don't like them? Use a <b>re-spin</b> to pass. 8 picks + 2 re-spins, then your ${state.draftMode==='coach'?'staff':'build'}'s set.""",
         """Don't like them? Use a <b>re-spin</b> to pass. 8 picks + 2 re-spins, then your ${state.draftMode==='coach'?'staff':'build'}'s set.""")
rep_once("""<p style="font-family:var(--font-mono);font-size:0.85rem;">Tap below to reveal your next ${cfg.noun}</p>""",
         """<p>Pull the next file to see which ${cfg.noun} turns up.</p>""")

# ---- JS: jersey helper + OVR board (replaces the radar) ----
a = s.index('  function buildRadar(){')
b = s.index("    $('radarWrap').innerHTML = svg;\n  }", a) + len("    $('radarWrap').innerHTML = svg;\n  }")
s = s[:a] + r"""  function jerseySVG(num, fill, ink, cls){
    const t = String(num), big = t.length <= 1 ? 58 : 46;
    return `<svg class="${cls||'jersey'}" viewBox="0 0 100 112" aria-hidden="true">
      <path d="M30 8 L41 5 Q50 17 59 5 L70 8 L97 22 L89 47 L75 41 L75 106 L25 106 L25 41 L11 47 L3 22 Z" fill="${fill}" stroke="rgba(0,0,0,0.6)" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M41 5 Q50 17 59 5" fill="none" stroke="rgba(0,0,0,0.5)" stroke-width="3.2"/>
      <path d="M9 30 L28 21.5 M8 37 L27 28.5 M91 30 L72 21.5 M92 37 L73 28.5" stroke="${ink}" stroke-opacity="0.55" stroke-width="2.6" fill="none"/>
      <path d="M75 41 L75 106 L64 106 L64 42 Z" fill="rgba(0,0,0,0.13)"/>
      <text x="51.5" y="${t.length<=1?88:83}" text-anchor="middle" style="font-family:var(--font-display);font-weight:900;font-size:${big}px;" fill="rgba(0,0,0,0.35)">${t}</text>
      <text x="50" y="${t.length<=1?86:81}" text-anchor="middle" style="font-family:var(--font-display);font-weight:900;font-size:${big}px;" fill="${ink}">${t}</text>
    </svg>`;
  }
  function buildRadar(){
    const cfg = draftCfg();
    let filled = 0, sum = 0;
    cfg.attrs.forEach(k=>{ const v = state.slots[k]; if(v!=null){ filled++; sum += v; } });
    const ovr = filled ? Math.round(sum/filled) : null;
    $('radarWrap').innerHTML = `<div class="ovr-board">
      ${jerseySVG(ovr!=null?ovr:'--', ovr!=null?'#d9d5c2':'#4a565d', ovr!=null?'#10192e':'#8f9aa0', 'jersey')}
      <div class="ovr-meta"><p class="tape">Build OVR</p><p>${filled ? 'Average of '+filled+' locker'+(filled>1?'s':'') : 'Nothing hung up yet'}</p></div>
    </div>`;
  }""" + s[b:]

# ---- JS: locker stalls ----
a = s.index('  function renderSlotsGrid(){')
b = s.index('  function weightedTierPick', a)
s = s[:a] + r"""  function renderSlotsGrid(){
    const cfg = draftCfg();
    const wrap = $('slotsGrid'); wrap.innerHTML='';
    cfg.slotPairs.flat().forEach((key,i)=>{
      const v = state.slots[key];
      const div = document.createElement('div');
      div.className = 'slot'+(v!=null?' done':'');
      let win, nm;
      if(v!=null){
        const src = state.draftedFrom[key], sc = schoolOf(src), col = schoolColor(sc);
        win = `<span class="stall-door"></span><div class="stall-jersey">${jerseySVG(v, col, inkOn(col))}</div>`;
        nm = `<span class="slot-label">${cfg.label[key]}</span>${src?`<span class="slot-from">${dispName(src)}${sc?' · '+sc:''}</span>`:''}`;
      } else {
        win = `<span class="stall-ghost">${i+1}</span><span class="stall-latch"></span>`;
        nm = `<span class="slot-label">${cfg.label[key]}</span>`;
      }
      div.innerHTML = `<div class="stall-top"><span class="stall-key">${key}</span></div><div class="stall-window">${win}</div><div class="slot-name">${nm}</div>`;
      wrap.appendChild(div);
    });
  }

""" + s[b:]

# ---- JS: scouting sheet ----
a = s.index('  function renderPlayerCard(){')
b = s.index('  function normTier', a)
s = s[:a] + r"""  function renderPlayerCard(){
    const cfg = draftCfg();
    const p = state.currentPlayer;
    const tierMeta = cfg.tiers[p.tier];
    const eraLookupKey = p.eraKey || p.era;
    const eraMeta = ERAS[eraLookupKey] ? `<span class="era-badge">${ERAS[eraLookupKey].label}</span>` : '';
    const premiumLeft = PREMIUM_LIMIT - (state.premiumUsed||0);
    let rows = '';
    cfg.attrs.forEach(key=>{
      const filled = state.slots[key]!=null, raw = p.stats[key];
      const capped = raw>PREMIUM_CAP && premiumLeft<=0;
      const v = capped ? PREMIUM_CAP : raw;
      const valHtml = capped
        ? `<span class="val capped">${v}</span><small class="cap-note">premium used</small>`
        : `<span class="val${raw>PREMIUM_CAP?' hot':''}">${v}</span>`;
      rows += `<div class="attr-row${filled?' filled':''}">
        <div class="name">${cfg.label[key]}<small>${key}</small></div>
        <div style="display:flex;align-items:center;gap:8px;">
          ${valHtml}
          ${filled ? '<span class="attr-lock">✓</span>' : `<button class="attr-pick" data-attr="${key}" aria-label="Draft ${cfg.label[key]} at ${v}">Take</button>`}
        </div>
      </div>`;
    });
    const metaLine = state.draftMode==='coach' ? (ERAS[eraLookupKey]?ERAS[eraLookupKey].years:'') : (p.pos+' · '+p.era);
    const portraitInit = state.draftMode==='coach' ? 'HC' : (p.pos.length<=2 ? p.pos : p.pos.slice(0,2));
    const portraitColor = schoolColor(p.school), portraitInk = inkOn(portraitColor);
    const starN = {walkon:2,allconf:3,allamerican:4,heisman:5}[normTier(p.tier)] || 2;
    const stars = '★'.repeat(starN) + '☆'.repeat(5-starN);
    $('playerCardWrap').innerHTML = `
      <div class="player-card">
        <div class="file-strip"><span>Scouting file · ${state.draftMode==='coach' ? 'Coaching staff' : p.pos}</span><span>Pull ${state.draftedCount+1} of 8</span></div>
        <div class="player-card-head">
          <div class="player-portrait" style="background-color:${portraitColor};color:${portraitInk};">${portraitInit}</div>
          <div>
            <span class="tier-ribbon tier-${normTier(p.tier)}">${tierMeta.label}</span>${eraMeta}
            <p class="player-name">${dispName(p.name)}</p>
            <p class="player-school"><i style="background:${portraitColor}"></i>${p.school||""}</p>
            <p class="player-meta">${metaLine}</p>
            <p class="player-stars">${stars}</p>
          </div>
        </div>
        <p class="player-tag">${p.tag}</p>
        <div class="attr-grid">${rows}</div>
      </div>`;
    $('playerCardWrap').querySelectorAll('.attr-pick').forEach(btn=>{
      btn.addEventListener('click', ()=> draftAttribute(btn.getAttribute('data-attr')));
    });
  }
""" + s[b:]

# ---- JS: dev filler names the source so stalls look right ----
rep_once("cfg.attrs.forEach(k=>{ state.slots[k] = 58+Math.floor(Math.random()*38); });",
         "cfg.attrs.forEach(k=>{ state.slots[k] = 58+Math.floor(Math.random()*38); const src = cfg.pool[Math.floor(Math.random()*cfg.pool.length)]; state.draftedFrom[k] = src.name; });")

open(p, 'w', encoding='utf-8').write(s)
print('theme applied, bytes', len(s.encode('utf-8')))
