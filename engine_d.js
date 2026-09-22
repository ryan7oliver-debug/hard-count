
  // ---------- field engine: game glue ----------
  function buildField(){
    const wrap = $('fieldViz'); if(!wrap) return;
    wrap.innerHTML = '<canvas id="fieldCanvas"></canvas>';
    FE.canvas = $('fieldCanvas'); FE.ctx = FE.canvas.getContext('2d');
    sizeFieldViz();
    FE.los=25; FE.fd=35; FE.anim=null;
    FE.cam.x=FC; FE.cam.y=29; FE.camTarget={x:FC,y:29};
    FE.userDef = !!state.defMode;
    // real colors: the opponent's real accent, and yours if a career program has one (the daily has none — you're a walk-on, so it stays a neutral home blue)
    FE.oppPal = sidePalette(state.team && state.team.accent);
    FE.myPal = sidePalette(state.myAccent || '#2e63c9');
    FE.oppShort = (state.team && state.team.short) || 'OPP';
    FE.myShort = state.myShort || 'HC';
    feMakeEnts(25); feSetBall(FC,25,0); FE.ball.ang=0;
    feStart();
  }
  function updateFieldLines(yardline, distance){
    FE.los = yardline; FE.fd = Math.min(100, yardline+distance);
  }
  function updateBallMarker(yardline, caption){
    if(caption) $('fieldCaption').textContent = caption;
    if(yardline>=99) return Promise.resolve();
    if(skipping()){ feSnap(yardline); return Promise.resolve(); }
    return feReset(yardline);
  }
  function feSnap(y){
    feMakeEnts(y); FE.anim=null; feSetBall(FC,y,0); FE.ball.ang=0;
    FE.camTarget.x=FC; FE.camTarget.y=y+4; FE.cam.x=FC; FE.cam.y=y+4;
  }
