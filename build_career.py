"""Career pass — Take The Field + Run The Program. Runs AFTER build_theme.py."""
p = 'run-the-rivalry.html'
s = open(p, encoding='utf-8').read()
def rep_once(old, new):
    global s
    assert s.count(old) == 1, ('not unique/missing', old[:80], s.count(old)); s = s.replace(old, new)

# ---- css ----
css = open('career.css', encoding='utf-8').read()
j = s.index('</style>'); s = s[:j] + css + s[j:]

# ---- replace the old legacy modes with the career engine ----
a = s.index('  // ---------- Take The Field (player legacy) ----------')
b = s.index('  // ---------- dev nav (bounce between screens without playing through) ----------')
js = ''.join(open(f, encoding='utf-8').read() for f in ['career_a.js','career_b.js','career_c.js','career_d.js'])
s = s[:a] + js + '\n' + s[b:]

# ---- the animated sim hands its result to the career when one is waiting ----
rep_once("    state.simRunning = false; state.skip = 0; updateSimControls();\n    finishGame();",
         "    state.simRunning = false; state.skip = 0; updateSimControls();\n    if(state.gameHook){ const h = state.gameHook; state.gameHook = null; h({ score:state.score, log:state.driveLog, box:state.box }); } else finishGame();")

# ---- dev nav ----
rep_once("else if(action==='legacy-sim-player'){ state.draftMode='player'; devFillSlots(); startPlayerCareer(); }","else if(action==='legacy-sim-player'){ devStartCareer('player'); }")
rep_once("else if(action==='legacy-sim-coach'){ state.draftMode='coach'; devFillSlots(); startCoachDynasty(); }","else if(action==='legacy-sim-coach'){ devStartCareer('coach'); }")
rep_once("else if(action==='legacy-results-player'){ devFakePlayerLegacy(); finishPlayerCareer(); }","else if(action==='legacy-results-player'){ devCareerFinish('player'); }")
rep_once("else if(action==='legacy-results-coach'){ devFakeCoachLegacy(); finishCoachDynasty(); }","else if(action==='legacy-results-coach'){ devCareerFinish('coach'); }")
rep_once("['Legacy Sim — Player','legacy-sim-player'], ['Legacy Sim — Coach','legacy-sim-coach'],","['Career — Player season','legacy-sim-player'], ['Career — Coach season','legacy-sim-coach'],")
# drop the stale fake-legacy builders
a = s.index('  function devFakePlayerLegacy(){'); b = s.index('  function devJump(action){')
s = s[:a] + s[b:]

# ---- the character file replaces the old two-swatch avatar ----
a = s.index('  // ---------- avatar ----------'); b = s.index('  // ---------- field engine: canvas renderer ----------')
s = s[:a] + open('avatar.js', encoding='utf-8').read() + '\n' + s[b:]

# ---- wiring ----
rep_once("showLegacyIntro(state.legacy ? state.legacy.mode : 'player');","showLegacyIntro(C ? C.mode : 'player');")
# ---- resume a saved career from the hub ----
rep_once("    $('btnGoCoach').addEventListener('click', ()=>{ showLegacyIntro('coach'); });",
         "    $('btnGoCoach').addEventListener('click', ()=>{ showLegacyIntro('coach'); });\n    initResume(); renderDailyCard();")
rep_once("    $(id).setAttribute('data-active','true');\n    window.scrollTo(",
         "    $(id).setAttribute('data-active','true');\n    if(id==='screen-hub'){ renderResume(); renderDailyCard(); }\n    window.scrollTo(")
open(p, 'w', encoding='utf-8').write(s)
print('career applied, bytes', len(s.encode('utf-8')))
