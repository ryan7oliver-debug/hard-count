import re
p='run-the-rivalry.html'
s=open('base.html',encoding='utf-8').read()
eng=''.join(open(f,encoding='utf-8').read() for f in ['engine_a.js','engine_b.js','engine_c.js','engine_d.js'])
a=s.index('  // ---------- field visualization ----------')
b=s.index('  function outcomeYardline(outcome){')
s=s[:a]+eng+'\n'+s[b:]
# rewrite play section of simulateDrive
i=s.index("      const result = resolvePlay(isSig, sigChoice);")
j=s.index("      if(scored){\n        const td2")
new='''      const result = resolvePlay(isSig, sigChoice);
      playCount++;
      const isTO = result.type==='turnover';
      const newYard = isTO ? yardline : Math.min(100, Math.max(0, yardline + result.yards));
      const scored = !isTO && newYard>=100;
      const gotFirst = !isTO && !scored && (result.yards>=distance);
      const cap = playCaption(down, distance, yardline, result, gotFirst, scored);
      const tag = isSig?'SIGNATURE DRIVE — ':'';
      $('fieldCaption').textContent = tag+DOWN_LABEL[down-1]+' & '+distance+' at the '+fieldPosText(yardline)+' — '+(result.isPass?'pass play':'run play')+'...';
      await animatePlay(yardline, result, newYard, scored);
      const resetP = updateBallMarker(scored?100:newYard, tag+cap);
      await resetP;
      if(isTO){ outcome='turnover'; points=0; break; }
'''
s=s[:i]+new+s[j:]
old_k="          updateBallMarker(outcome==='fg'?82:yardline, (isSig?'SIGNATURE DRIVE — ':'')+cap);\n          await sleep(state.watch==='full'?850:600);"
assert old_k in s
s=s.replace(old_k,"          $('fieldCaption').textContent=(isSig?'SIGNATURE DRIVE — ':'')+'4th & '+distance+' — '+(outcome==='fg'?'field goal attempt...':'punt...');\n          await animateKick(yardline, outcome==='fg');\n          await updateBallMarker(outcome==='fg'?82:yardline, (isSig?'SIGNATURE DRIVE — ':'')+cap);")
open(p,'w',encoding='utf-8').write(s)
print('built', len(s))
