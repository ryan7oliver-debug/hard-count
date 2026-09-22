
  // ---------- field engine: sprites + ball ----------
  // Palettes are set per game in buildField() (engine_d.js) from real team colors — FE.myPal for your
  // side, FE.oppPal for theirs, swapped by FE.userDef like everything else here.
  function feSprite(g, e){
    const s = FE.scale, p = Math.max(2, Math.round(s*0.215));
    const c = (FE.userDef ? (e.side==='off'?FE.oppPal:FE.myPal) : (e.side==='off'?FE.myPal:FE.oppPal)) || {jersey:'#4b5860',trim:'#eee',helmet:'#2e3438',stripe:'#eee',pants:'#dcdfe6',cleats:'#14100e'};
    const gold = e.carrier;
    const jersey = gold ? '#f2c94c' : c.jersey, helmet = gold ? '#ffe9a3' : c.helmet, skin = fePickSkin(e.id);
    const cx = fsx(e.x), cy = fsy(e.y);
    const up = e.face==='up';
    // shadow
    g.fillStyle='rgba(0,0,0,0.38)'; g.beginPath(); g.ellipse(cx, cy+p*0.5, p*5.2, p*2, 0, 0, Math.PI*2); g.fill();
    if(gold){
      const pulse = 0.55+0.25*Math.sin(FE.t*7);
      g.save(); g.shadowColor='#f2c94c'; g.shadowBlur=14; g.strokeStyle='rgba(242,201,76,'+pulse+')'; g.lineWidth=2;
      g.beginPath(); g.ellipse(cx, cy+p*0.5, p*6.6, p*2.7, 0, 0, Math.PI*2); g.stroke(); g.restore();
    }
    // the entity your drafted position is riding on THIS play (set in buildPlay) — a quiet ring while
    // you're not carrying, so you can find yourself on the field before the ball ever gets to you.
    if(e.isYou && !gold){
      const pulse = 0.6+0.3*Math.sin(FE.t*5);
      g.save(); g.shadowColor='#ffffff'; g.shadowBlur=12; g.strokeStyle='rgba(255,255,255,'+pulse+')'; g.lineWidth=2.4;
      g.beginPath(); g.ellipse(cx, cy+p*0.5, p*5.8, p*2.4, 0, 0, Math.PI*2); g.stroke(); g.restore();
    }
    if(e.isYou){
      g.save(); g.font = '900 '+Math.round(s*0.78)+'px "Big Shoulders Display", Impact, sans-serif'; g.textAlign='center'; g.textBaseline='alphabetic';
      g.lineWidth = 3; g.strokeStyle = 'rgba(10,15,28,0.85)'; g.strokeText('YOU', cx, cy-p*15.5);
      g.fillStyle = gold ? '#ffe9a3' : '#ffffff'; g.fillText('YOU', cx, cy-p*15.5); g.restore();
    }
    // 12 x 18 grid; origin at feet-center
    const ox = cx - p*6, oy = cy - p*17;
    if(e.state==='down'){
      const parts = [
        [1,12,12,4,jersey],[12,12,3,4,helmet],[0,13,2,2,c.pants],[4,16,6,2,c.pants]
      ];
      [[1,'#0a0f1c'],[0,null]].forEach(([grow,col])=>parts.forEach(([x,y,w,h,f])=>{
        g.fillStyle = col||f; g.fillRect(ox+(x-grow)*p, oy+(y-grow+1)*p, (w+grow*2)*p, (h+grow*2)*p);
      }));
      return;
    }
    const run = e.moving>0.25, ph = e.phase;
    const sw = run ? Math.round(Math.sin(ph)*2) : 0;
    const bob = run ? -Math.abs(Math.sin(ph))*p*0.9 : 0;
    const armUp = e.state==='throw' ? -3 : (e.state==='cheer' ? -5 : 0);
    const armY1 = 7+(run?sw:0)+armUp, armY2 = 7+(run?-sw:0)+armUp;
    const cleatY1 = 16+Math.max(0,sw), cleatY2 = 16+Math.max(0,-sw);
    const parts = [
      // legs then cleats
      [3,12+Math.max(0,-sw)*0, 2,4+Math.max(0,sw), c.pants],[7,12, 2,4+Math.max(0,-sw), c.pants],
      [3,cleatY1,2,1,c.cleats],[7,cleatY2,2,1,c.cleats],
      // waist band (wider than the legs, ties the pants together) + a side stripe in team color
      [2,11,9,2,c.pants],
      // torso + shoulders
      [2,8,8,5,jersey],[1,6,10,3,jersey],
      // arms
      [0,armY1,1,5,skin],[11,armY2,1,5,skin],
      // helmet
      [3,1,6,6,helmet]
    ];
    // face: the back of the helmet just hints at a seam; front-facing gets a real skin-tone opening — a
    // helmet reads as worn by someone, not just a dome — with an opaque cage over it, not a translucent
    // wash (that just muddies into whatever color is underneath instead of reading as a grille).
    const face = up ? [[4,1,4,1,'rgba(0,0,0,0.25)']] : [[3.8,3,4.4,3,skin]];
    // facemask cage (front-facing only, never seen from behind): two horizontal bars and two vertical bars,
    // solid near-black — enough to read as a real grille over the face, not a couple of floating dashes.
    const mask = !up ? [
      [3.8,3.5,4.4,0.5,'#15151a'],[3.8,4.6,4.4,0.5,'#15151a'],
      [4.4,3,0.5,3,'#15151a'],[7.1,3,0.5,3,'#15151a']
    ] : [];
    const stripe = [[5.5,1,1,6,c.stripe]];
    const all = parts.concat(face, stripe, mask);
    g.save(); g.translate(0,bob);
    // outline pass
    g.fillStyle='#0a0f1c';
    parts.forEach(([x,y,w,h])=>g.fillRect(ox+(x-1)*p, oy+(y-1)*p, (w+2)*p, (h+2)*p));
    all.forEach(([x,y,w,h,f])=>{ g.fillStyle=f; g.fillRect(ox+x*p, oy+y*p, w*p, h*p); });
    // jersey shading: a collar highlight, a waist shadow, a stripe on each side of the pants
    g.fillStyle='rgba(255,255,255,0.20)'; g.fillRect(ox+3*p, oy+6*p, 6*p, 1*p);
    g.fillStyle='rgba(0,0,0,0.22)'; g.fillRect(ox+2*p, oy+12*p, 8*p, 1*p);
    g.fillStyle=c.stripe; g.globalAlpha=0.85; g.fillRect(ox+2*p, oy+11*p, 1*p, 6*p); g.fillRect(ox+9*p, oy+11*p, 1*p, 6*p); g.globalAlpha=1;
    // shoulder pad caps: a lighter plastic edge along the outer top of each pad (the collar highlight above
    // already covers the center, so these are the two flanks it doesn't reach)
    g.fillStyle='rgba(255,255,255,0.26)'; g.fillRect(ox+1*p, oy+6*p, 3*p, 0.8*p); g.fillRect(ox+8*p, oy+6*p, 3*p, 0.8*p);
    // real jersey number on both sides now — a big readable number is the point, not just on the back
    feDrawDigits(g, feJerseyNum(e), ox, oy+8*p, p, c.trim);
    // gloves: a light cuff where the arm meets the hand
    g.fillStyle=c.trim; g.fillRect(ox+0*p, oy+(armY1+4)*p, 1*p, 1*p); g.fillRect(ox+11*p, oy+(armY2+4)*p, 1*p, 1*p);
    // cleats: a thin sole highlight
    g.fillStyle='rgba(255,255,255,0.3)'; g.fillRect(ox+3*p, oy+(cleatY1+0.65)*p, 2*p, 0.35*p); g.fillRect(ox+7*p, oy+(cleatY2+0.65)*p, 2*p, 0.35*p);
    // ear holes: a small dark dot low on each side of the helmet shell
    g.fillStyle='rgba(10,10,14,0.4)'; g.fillRect(ox+3*p, oy+3.6*p, 0.7*p, 1*p); g.fillRect(ox+8.3*p, oy+3.6*p, 0.7*p, 1*p);
    // helmet shine: a rounder dome highlight, a touch wider than before
    g.fillStyle='rgba(255,255,255,0.24)'; g.fillRect(ox+3.4*p, oy+1.3*p, 2.4*p, 1.6*p);
    g.restore();
  }

  function feBall(g){
    const b = FE.ball; if(!b.vis) return;
    const s = FE.scale, px = fsx(b.x), py = fsy(b.y);
    const lift = b.z*s;
    // ground shadow
    g.fillStyle='rgba(0,0,0,'+(0.4-Math.min(0.25,b.z*0.02))+')';
    g.beginPath(); g.ellipse(px, py, s*0.9*(1-Math.min(0.4,b.z*0.03)), s*0.36, 0,0,Math.PI*2); g.fill();
    g.save(); g.translate(px, py-lift-(b.z>0.2?0:s*0.4)); g.rotate(b.ang);
    const L = s*1.05, W = s*0.6;
    g.fillStyle='#0a0f1c'; g.beginPath(); g.ellipse(0,0,L+2,W+2,0,0,Math.PI*2); g.fill();
    g.fillStyle='#8a4f24'; g.beginPath(); g.ellipse(0,0,L,W,0,0,Math.PI*2); g.fill();
    g.fillStyle='#a8683a'; g.beginPath(); g.ellipse(-L*0.15,-W*0.25,L*0.6,W*0.35,0,0,Math.PI*2); g.fill();
    g.fillStyle='#f4f0e6'; g.fillRect(-L*0.35,-1,L*0.7,2);
    for(let i=-2;i<=2;i++) g.fillRect(i*L*0.16-1,-W*0.35,2,W*0.7);
    g.restore();
  }

  function feFrame(now){
    const g = FE.ctx; if(!g || !FE.canvas || !FE.canvas.isConnected){ FE.raf=0; return; }
    const pw = FE.canvas.parentElement.clientWidth;
    if(!pw){ FE.raf=requestAnimationFrame(feFrame); return; }
    if(pw!==FE.W || !FE.H) sizeFieldViz();
    const dt = Math.min(0.05, (now-(FE.last||now))/1000); FE.last = now; FE.t += dt;
    if(FE.tick) FE.tick(dt);
    // camera follow
    const tx = Math.max(FE.VIEW_W/2, Math.min(FW-FE.VIEW_W/2, FE.camTarget.x));
    const k = 1-Math.exp(-dt*5.5);
    const halfH = FE.H/2/FE.scale, ty = Math.max(-10+halfH, Math.min(110-halfH, FE.camTarget.y));
    FE.cam.x += (tx-FE.cam.x)*k; FE.cam.y += (ty-FE.cam.y)*k;
    g.setTransform(FE.dpr,0,0,FE.dpr,0,0);
    feDrawField(g); feDrawLines(g);
    const list = FE.ents.slice().sort((a,b)=>b.y-a.y);
    list.forEach(e=>feSprite(g,e));
    feBall(g);
    FE.raf = requestAnimationFrame(feFrame);
  }
  function feStart(){
    if(FE.raf) return;
    FE.last = 0; FE.raf = requestAnimationFrame(feFrame);
  }
