import re,subprocess
subprocess.check_call(['python3','build_engine.py'])
p='run-the-rivalry.html'
s=open(p,encoding='utf-8').read()
def rep(old,new,count=1):
    global s
    assert old in s, 'missing: '+old[:60]
    s=s.replace(old,new,count)
# 1. logic block
a=s.index('  function fieldPosText(yardline){')
b=s.index('  // ---------- Take The Field (player legacy) ----------')
logic=''.join(open(f,encoding='utf-8').read() for f in ['logic_a.js','logic_b.js','logic_d.js','logic_c.js'])
s=s[:a]+logic+'\n'+s[b:]
# 2. preview
rep("    $('pvTarget').textContent = t.target;\n    $('pvRecord').textContent = getRecord(t);\n    $('pvRecordHolder').textContent = getRecordHolderText(t);\n","")
rep("    renderPositionButtons('posButtons');\n    renderPlanButtons();","    renderPositionButtons('posButtons', updatePreviewStats);\n    updatePreviewStats();")
# 3. plan buttons
rep("    Object.keys(PLANS).forEach(key=>{\n      const p = PLANS[key];\n      const b = document.createElement('button');\n      b.className = 'choice-btn'+(state.plan===key?' active':'');\n      b.innerHTML = `<strong>${p.label}</strong><span>${p.sub}</span>`;\n      b.addEventListener('click',()=>{ state.plan=key; renderPlanButtons(); });",
    "    Object.keys(PLANS).forEach(key=>{\n      const p = isDefPos() ? Object.assign({},PLANS[key],PLAN_DEF[key]) : PLANS[key];\n      const b = document.createElement('button');\n      b.className = 'choice-btn'+(state.plan===key?' active':'');\n      b.innerHTML = `<strong>${p.label}</strong><span>${p.sub}</span>`;\n      b.addEventListener('click',()=>{ state.plan=key; renderPlanButtons(); });")
# 4. HTML
rep('<p class="stat-label">Target · Beat the Ranked Avg</p>','<p class="stat-label" id="pvTargetLabel">Target · Beat the Ranked Avg</p>')
rep('<p class="stat-foot">what a ranked offense averages here</p>','<p class="stat-foot" id="pvTargetFoot">what a ranked offense averages here</p>')
rep('<p class="stat-label">Rivalry Record</p>','<p class="stat-label" id="pvRecordLabel">Rivalry Record</p>')
rep('<div class="choice-btns" id="posButtons" style="grid-template-columns:repeat(3,1fr);"></div>','<div class="choice-btns" id="posButtons" style="grid-template-columns:repeat(3,1fr);"></div>\n        <p class="stat-foot" id="pvModeNote" style="margin-top:10px;"></p>')
rep('<p class="sim-score-label">Points</p>','<p class="sim-score-label" id="simScoreLabel">Points</p>')
rep('''<div class="field-caption-bar"><p class="field-caption" id="fieldCaption">Kickoff.</p></div>
        </div>''','''<div class="field-caption-bar"><p class="field-caption" id="fieldCaption">Kickoff.</p></div>
        </div>
        <div class="sim-controls" id="simControls">
          <button class="sim-ctl" id="btnSpeed" disabled><b>1×</b><span>Speed</span></button>
          <button class="sim-ctl" id="btnSkipPlay" disabled><b>&#9656;|</b><span>Skip Play</span></button>
          <button class="sim-ctl" id="btnSkipDecision" disabled><b>&#9656;&#9656;</b><span>To Decision</span></button>
          <button class="sim-ctl sim-ctl-end" id="btnSkipGame" disabled><b>&#9656;&#9656;|</b><span>Sim To End</span></button>
        </div>''')
rep('<button class="btn btn-primary" id="btnKickoff"','<div id="draftOdds" class="odds-box" style="display:none;"></div>\n      <button class="btn btn-primary" id="btnKickoff"')
# 5. CSS
css='''
  .sim-controls{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:14px;}
  .sim-ctl{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:10px 4px;border-radius:14px;border:1px solid var(--line);background:var(--paper-2);color:var(--ink);cursor:pointer;transition:transform .12s ease, background .15s ease;}
  .sim-ctl b{font-family:var(--font-display);font-weight:400;font-size:1.15rem;letter-spacing:0.02em;line-height:1;}
  .sim-ctl span{font-family:var(--font-mono);font-size:0.6rem;letter-spacing:0.06em;text-transform:uppercase;color:var(--ink-soft);}
  .sim-ctl:hover:not(:disabled){background:var(--paper);}
  .sim-ctl:active:not(:disabled){transform:scale(0.96);}
  .sim-ctl:disabled{opacity:0.4;cursor:default;}
  .sim-ctl.active{border-color:var(--gold);background:color-mix(in srgb, var(--gold) 16%, var(--paper-2));}
  .sim-ctl-end{background:linear-gradient(180deg, var(--gold-soft) 0%, var(--gold) 100%);color:#fff;border-color:transparent;}
  .sim-ctl-end span{color:rgba(255,255,255,0.85);}
  .sim-ctl-end:hover:not(:disabled){background:linear-gradient(180deg, var(--gold-soft) 0%, var(--gold) 100%);filter:brightness(1.06);}
  .odds-box{border:1px solid var(--line);border-radius:16px;padding:16px 18px;margin:16px 0 4px;background:var(--paper-2);}
  .odds-head{display:flex;justify-content:space-between;align-items:baseline;font-family:var(--font-mono);font-size:0.7rem;letter-spacing:0.1em;color:var(--ink-soft);}
  .odds-head b{font-family:var(--font-display);font-weight:400;font-size:1.4rem;letter-spacing:0.02em;color:var(--ink);}
  .odds-bar{height:10px;border-radius:6px;background:var(--line);margin:10px 0 12px;overflow:hidden;}
  .odds-bar i{display:block;height:100%;border-radius:6px;background:linear-gradient(90deg, var(--turf-bright), var(--gold));}
  .odds-row{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;}
  .odds-row b{font-family:var(--font-display);font-weight:400;font-size:2rem;color:var(--gold);line-height:1;}
  .odds-row span{font-size:0.86rem;color:var(--ink-soft);} .odds-row em{font-style:normal;color:var(--ink);font-weight:700;}
  .odds-foot{margin:10px 0 0;font-size:0.78rem;color:var(--ink-soft);line-height:1.5;}
  .odds-foot b{color:var(--ink);}
'''
rep('  /* dev nav',css+'\n  /* dev nav')
# 6. teams
T={'baseRecord:52, defRating:74,':'lean:0.5, offLean:-0.4, offRating:82, allowTarget:22, baseAllow:6, offFavors:[\'STR\',\'TKL\',\'PHY\'],',
   'baseRecord:56, defRating:65,':'lean:0.8, offLean:0.6, offRating:86, allowTarget:25, baseAllow:7, offFavors:[\'COV\',\'BALL\',\'RSH\'],',
   'baseRecord:41, defRating:87,':'lean:-0.6, offLean:-0.5, offRating:83, allowTarget:22, baseAllow:3, offFavors:[\'IQ\',\'DIS\',\'STA\'],',
   'baseRecord:58, defRating:55,':'lean:0.0, offLean:0.3, offRating:90, allowTarget:29, baseAllow:9, offFavors:[\'COV\',\'SPD\',\'BALL\'],',
   'baseRecord:49, defRating:70,':'lean:-0.5, offLean:0.0, offRating:85, allowTarget:25, baseAllow:6, offFavors:[\'STA\',\'GET\',\'MOT\'],',
   'baseRecord:61, defRating:48,':'lean:-0.7, offLean:0.7, offRating:78, allowTarget:18, baseAllow:10, offFavors:[\'RSH\',\'STR\',\'RS\'],',
   'baseRecord:40, defRating:78,':'lean:0.3, offLean:-0.3, offRating:88, allowTarget:28, baseAllow:7, offFavors:[\'COV\',\'SPD\',\'BALL\'],',
   'baseRecord:38, defRating:82,':'lean:-0.4, offLean:-0.6, offRating:80, allowTarget:20, baseAllow:6, offFavors:[\'TKL\',\'STR\',\'DIS\'],',
   'baseRecord:62, defRating:52,':'lean:0.9, offLean:0.5, offRating:92, allowTarget:31, baseAllow:8, offFavors:[\'SPD\',\'COV\',\'STA\'],'}
for k,v in T.items(): rep(k,k+' '+v)
# 7. draft odds hook
rep("      }\n    }\n  }\n  function renderSlotsGrid(){","      }\n    }\n    renderDraftOdds();\n  }\n  function renderSlotsGrid(){")
# 8. watch text
rep("quick:{ label:'Quick Play', sub:'~90 sec · every play, brisk pace' }","quick:{ label:'Quick Play', sub:'brisk pace · skip any time' }")
rep("full:{ label:'Full Game', sub:'~2-3 min · every play, full drama' }","full:{ label:'Full Game', sub:'full drama · skip any time' }")
# 9. wiring
rep("    $('btnSpin').addEventListener('click', doSpin);","""    $('btnSkipPlay').addEventListener('click',()=>setSkip('play'));
    $('btnSkipDecision').addEventListener('click',()=>setSkip('decision'));
    $('btnSkipGame').addEventListener('click',()=>setSkip('game'));
    $('btnSpeed').addEventListener('click',()=>{ const seq=[1,2,4,0.5]; state.simSpeed=seq[(seq.indexOf(state.simSpeed||1)+1)%seq.length]; if(FE.anim && !skipping() && state.skip!=='play') FE.anim.speed=feSpeed(); updateSimControls(); });
    $('btnSpin').addEventListener('click', doSpin);""")
open(p,'w',encoding='utf-8').write(s)
print('ok',len(s))
