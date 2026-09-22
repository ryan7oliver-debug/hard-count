  // ---------- field engine: canvas renderer ----------
  const FW = 53.33;
  const FE = {
    canvas:null, ctx:null, W:0, H:0, dpr:1, VIEW_W:44, scale:10,
    cam:{x:FW/2, y:25}, ents:[], ball:{x:FW/2,y:25,z:0,spin:0,ang:0,vis:true},
    los:25, fd:35, raf:0, last:0, grain:null, seed:1
  };
  function svgY(yardline){ return 90 - (yardline/100)*80; }

  // ---------- team color: real school colors on the field, not a fixed home/away pair ----------
  function hexToRgb(h){ h=(h||'#4b5860').replace('#',''); if(h.length===3) h=h.split('').map(c=>c+c).join(''); const n=parseInt(h,16)||0x4b5860; return [(n>>16)&255,(n>>8)&255,n&255]; }
  function relLum(rgb){ const f=v=>{ v/=255; return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4); }; return 0.2126*f(rgb[0])+0.7152*f(rgb[1])+0.0722*f(rgb[2]); }
  function shadeHex(hex, amt){ const [r,g,b]=hexToRgb(hex); const f=v=>Math.max(0,Math.min(255,Math.round(v+amt*255))); return 'rgb('+f(r)+','+f(g)+','+f(b)+')'; }
  function contrastOn(hex){ return relLum(hexToRgb(hex))>0.42 ? '#15181a' : '#f4f0e6'; }
  const FE_SKIN_TONES = ['#f0c8a0','#d9a066','#c98d5b','#8a5a35','#5c3a21'];
  // one palette per side, built from that team's real accent — jersey and helmet in their color, pants a
  // neutral so the stripe (also their color) is what pops, trim picked for contrast so a number would read.
  function sidePalette(accent){
    accent = accent || '#4b5860';
    return { jersey:accent, trim:contrastOn(accent), helmet:shadeHex(accent,-0.22), stripe:contrastOn(accent), pants:'#dcdfe6', cleats:'#14100e' };
  }
  function fePickSkin(id){ return FE_SKIN_TONES[id % FE_SKIN_TONES.length]; }

  // ---------- jersey numbers: a real number beats a blank swatch ----------
  // Ranges follow the sport's own convention (skill positions low or 80s, line 50s-70s, front-seven 90s/40s,
  // secondary 1-49) so a number belongs to the body wearing it, not just a decoration. Picked once per
  // entity id (stable across frames) via a cheap deterministic hash, not Math.random (would flicker every frame).
  const NUM_RANGE = { qb:[1,19], rb:[1,49], wr1:[1,19], wr2:[1,19], wr3:[1,19], te:[80,89], ol:[50,79], dl:[50,99], lb:[1,59], cb:[1,39], s:[1,39] };
  function feJerseyNum(e){
    if(e.isYou && typeof state!=='undefined' && state.char && state.char.number!=null) return U.clamp(state.char.number,0,99);
    const r = NUM_RANGE[e.role] || [1,99];
    const h = Math.sin(e.id*12.9898+78.233)*43758.5453, frac = h-Math.floor(h);
    return r[0] + Math.floor(frac*(r[1]-r[0]+1));
  }
  // classic 3x5 block-digit font, read left-to-right top-to-bottom, one char per cell (1 = filled)
  const DIGIT_FONT = ['111101101101111','010110010010111','111001111100111','111001111001111','101101111001001','111100111001111','111100111101111','111001001001001','111101111101111','111101111001111'];
  function feDrawDigits(g, num, ox, oy, p, color){
    const digits = String(Math.max(0,Math.min(99,Math.round(num)))).split('').map(Number);
    const gw=3, gh=5, gap=1, totalW = digits.length*gw + (digits.length-1)*gap;
    let dx = ox + (2 + (8-totalW)/2)*p;   // centered in the torso, which spans grid x 2..10
    g.fillStyle = color;
    digits.forEach(d=>{
      const bits = DIGIT_FONT[d];
      for(let ry=0; ry<gh; ry++) for(let rx=0; rx<gw; rx++){
        if(bits[ry*gw+rx]==='1') g.fillRect(dx+rx*p, oy+ry*p, p, p);
      }
      dx += (gw+gap)*p;
    });
  }

  function feMakeGrain(){
    const c = document.createElement('canvas'); c.width = c.height = 96;
    const g = c.getContext('2d'), im = g.createImageData(96,96);
    for(let i=0;i<im.data.length;i+=4){
      const v = Math.random();
      const dark = v<0.5;
      im.data[i]=dark?0:255; im.data[i+1]=dark?0:255; im.data[i+2]=dark?0:255;
      im.data[i+3]=Math.random()<0.5 ? 0 : (dark? 22 : 10);
    }
    g.putImageData(im,0,0);
    return c;
  }
  const fsx = x => FE.W/2 + (x-FE.cam.x)*FE.scale;
  const fsy = y => FE.H/2 - (y-FE.cam.y)*FE.scale;

  function feResize(){
    const cv = FE.canvas; if(!cv) return;
    const r = cv.parentElement.getBoundingClientRect();
    if(!r.width) return;
    FE.dpr = Math.min(2, window.devicePixelRatio||1);
    FE.W = Math.round(r.width); FE.H = Math.round(r.height);
    cv.width = FE.W*FE.dpr; cv.height = FE.H*FE.dpr;
    cv.style.width = FE.W+'px'; cv.style.height = FE.H+'px';
    FE.scale = FE.W/FE.VIEW_W;
  }
  function sizeFieldViz(){
    const viz = $('fieldViz'); if(!viz) return;
    const w = viz.parentElement.clientWidth; if(!w) return;
    viz.style.height = Math.round(Math.min(680, w*1.12))+'px';
    feResize();
  }
  window.addEventListener('resize', sizeFieldViz);

  function feDrawField(g){
    const s = FE.scale, top = FE.cam.y + FE.H/2/s + 2, bot = FE.cam.y - FE.H/2/s - 2;
    g.fillStyle = '#080a0b'; g.fillRect(0,0,FE.W,FE.H);
    // stands: banded rows (a crowd has structure, not just noise) with the odd fleck of each team's color
    g.fillStyle = '#0c0f10';
    g.fillRect(0,0,FE.W,FE.H);
    const rowH = Math.max(5, s*0.26), rowOff = (FE.cam.y*s*0.2) % (rowH*2);
    for(let py=-rowH*2; py<FE.H+rowH*2; py+=rowH*2){
      g.fillStyle='rgba(255,255,255,0.035)'; g.fillRect(0, py+rowOff, FE.W, rowH);
    }
    for(let i=0;i<90;i++){
      const px = (i*97.3 % FE.W), py = ((i*61.7 + FE.cam.y*s*0.2) % FE.H);
      const flick = i%23===0 ? (i%46===0?FE.oppPal:FE.myPal) : null;
      g.fillStyle = flick ? flick.jersey : 'rgba(255,255,255,'+(0.05+(i%5)*0.03)+')';
      g.globalAlpha = flick ? 0.5 : 1; g.fillRect(px,py,flick?3:2,flick?3:2); g.globalAlpha=1;
    }
    // turf stripes every 5 yards
    for(let y=-10; y<110; y+=5){
      const a = fsy(y+5), b = fsy(y);
      if(b<0 || a>FE.H) continue;
      const ez = y<0 || y>=100;
      if(ez){
        const nearSide = y<0, pal = (FE.userDef ? nearSide : !nearSide) ? FE.oppPal : FE.myPal;
        g.fillStyle = '#131a16'; g.fillRect(fsx(0), a, FW*s, b-a+1);
        g.fillStyle = shadeHex((pal||FE.oppPal||{jersey:'#c81f3e'}).jersey, -0.3); g.globalAlpha=0.5;
      }
      else g.fillStyle = (Math.floor(y/5)%2===0) ? '#2c6136' : '#275730';
      g.fillRect(fsx(0), a, FW*s, b-a+1);
      g.globalAlpha = 1;
    }
    // turf grain
    if(!FE.grain) FE.grain = feMakeGrain();
    g.save(); g.beginPath(); g.rect(fsx(0), fsy(110), FW*s, 120*s); g.clip();
    g.fillStyle = g.createPattern(FE.grain,'repeat'); g.translate(-(FE.cam.x*s%96), (FE.cam.y*s%96)); g.fillRect(0,-96,FE.W+192,FE.H+192);
    g.restore();
    // worn turf: mud churned up along the hashes, the middle and the sideline
    const rnd = n => { const x = Math.sin(n*127.1+311.7)*43758.5453; return x-Math.floor(x); };
    g.save(); g.beginPath(); g.rect(fsx(0), fsy(110), FW*s, 120*s); g.clip();
    for(let i=0;i<78;i++){
      const y = -8 + i*1.5 + rnd(i)*1.3, py = fsy(y);
      if(py<-70 || py>FE.H+70) continue;
      const cols = [FW/2-4.6, FW/2+4.6, FW/2, 5+rnd(i+9)*7, FW-5-rnd(i+4)*7];
      const cx = cols[i%5] + (rnd(i+3)-0.5)*3, r = (1.3+rnd(i+1)*2.7)*s, X = fsx(cx);
      const gr = g.createRadialGradient(X,py,0,X,py,r);
      gr.addColorStop(0,'rgba(72,52,30,'+(0.34+rnd(i+2)*0.26)+')'); gr.addColorStop(0.6,'rgba(72,52,30,0.14)'); gr.addColorStop(1,'rgba(72,52,30,0)');
      g.fillStyle = gr; g.fillRect(X-r, py-r, r*2, r*2);
    }
    g.restore();
    // end zone diagonal stripes
    [[-10,0],[100,110]].forEach(([y0,y1])=>{
      const a=fsy(y1), b=fsy(y0); if(b<0||a>FE.H) return;
      g.save(); g.beginPath(); g.rect(fsx(0),a,FW*s,b-a); g.clip();
      g.strokeStyle='rgba(255,255,255,0.07)'; g.lineWidth=s*1.1;
      for(let k=-40;k<90;k+=3.2){ g.beginPath(); g.moveTo(fsx(k),b); g.lineTo(fsx(k+10),a); g.stroke(); }
      g.restore();
    });
    // yard lines
    for(let y=0; y<=100; y+=5){
      const py = fsy(y); if(py<-4||py>FE.H+4) continue;
      g.strokeStyle = y%10===0 ? 'rgba(236,232,218,0.86)' : 'rgba(236,232,218,0.46)';
      g.lineWidth = y===0||y===100 ? Math.max(3,s*0.35) : Math.max(2,s*0.16);
      g.beginPath(); g.moveTo(fsx(0),py); g.lineTo(fsx(FW),py); g.stroke();
    }
    // hash marks & sideline ticks
    g.strokeStyle='rgba(244,240,230,0.55)'; g.lineWidth=Math.max(1.5,s*0.09);
    for(let y=1;y<100;y++){
      const py = fsy(y); if(py<-4||py>FE.H+4) continue;
      [[FW/2-4.6],[FW/2+4.6],[0.4],[FW-2.4]].forEach(([hx])=>{ g.beginPath(); g.moveTo(fsx(hx),py); g.lineTo(fsx(hx+ (hx<1||hx>FW-3 ? 2 : 1.7)),py); g.stroke(); });
    }
    // yard numbers
    g.font = '900 '+Math.round(s*2.7)+'px "Big Shoulders Display", Impact, sans-serif'; g.textAlign='center'; g.textBaseline='middle';
    for(let y=10;y<=90;y+=10){
      const py = fsy(y); if(py<-30||py>FE.H+30) continue;
      const lab = String(y<=50?y:100-y);
      [[FW*0.115],[FW*0.885]].forEach(([nx],i)=>{
        g.save(); g.translate(fsx(nx), py); g.fillStyle='rgba(236,232,218,0.8)'; g.fillText(lab,0,0); g.restore();
      });
    }
    // sidelines
    g.strokeStyle='rgba(244,240,230,0.9)'; g.lineWidth=Math.max(3,s*0.3);
    [0,FW].forEach(x=>{ g.beginPath(); g.moveTo(fsx(x),fsy(110)); g.lineTo(fsx(x),fsy(-10)); g.stroke(); });
    // end zone lettering: each team's real code, stenciled in their own color — the near one right-side
    // up (behind you), the far one flipped (behind them), same as a broadcast's end-zone paint.
    g.textAlign='center'; g.textBaseline='middle';
    g.font = '900 '+Math.round(s*4.4)+'px "Big Shoulders Stencil Display", Impact, sans-serif';
    const nearShort = FE.userDef ? FE.oppShort : FE.myShort, nearPal = FE.userDef ? FE.oppPal : FE.myPal;
    const farShort = FE.userDef ? FE.myShort : FE.oppShort, farPal = FE.userDef ? FE.myPal : FE.oppPal;
    if(nearShort){ g.fillStyle = shadeHex(nearPal.jersey, 0.1); g.globalAlpha=0.4; g.fillText(nearShort, fsx(FW/2), fsy(-5)); g.globalAlpha=1; }
    if(farShort){ g.save(); g.translate(fsx(FW/2), fsy(105)); g.rotate(Math.PI); g.fillStyle = shadeHex(farPal.jersey, 0.1); g.globalAlpha=0.4; g.fillText(farShort,0,0); g.globalAlpha=1; g.restore(); }
    // midfield mark: a faint ring in house amber, the one piece of the field that belongs to neither team
    const my50 = fsy(50); if(my50>-60 && my50<FE.H+60){
      const R = Math.min(9,FW*0.17)*s;
      g.save(); g.strokeStyle='rgba(233,165,28,0.22)'; g.lineWidth=Math.max(2,s*0.09);
      g.beginPath(); g.arc(fsx(FW/2), my50, R, 0, Math.PI*2); g.stroke();
      g.font = '900 '+Math.round(s*1.6)+'px "Big Shoulders Stencil Display", Impact, sans-serif';
      g.fillStyle='rgba(233,165,28,0.22)'; g.fillText('HC', fsx(FW/2), my50);
      g.restore();
    }
    // vignette
    const vg = g.createLinearGradient(0,0,0,FE.H); vg.addColorStop(0,'rgba(0,0,0,0.30)'); vg.addColorStop(0.25,'rgba(0,0,0,0)'); vg.addColorStop(0.75,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,0.34)');
    g.fillStyle=vg; g.fillRect(0,0,FE.W,FE.H);
    const rv = g.createRadialGradient(FE.W/2,FE.H/2,Math.min(FE.W,FE.H)*0.3,FE.W/2,FE.H/2,Math.max(FE.W,FE.H)*0.78); rv.addColorStop(0,'rgba(0,0,0,0)'); rv.addColorStop(1,'rgba(0,0,0,0.42)');
    g.fillStyle=rv; g.fillRect(0,0,FE.W,FE.H);
  }

  function feDrawLines(g){
    const drawL = (y,col)=>{
      const py = fsy(y); if(py<-4||py>FE.H+4) return;
      g.save(); g.shadowColor=col; g.shadowBlur=8; g.strokeStyle=col; g.lineWidth=Math.max(3,FE.scale*0.24);
      g.beginPath(); g.moveTo(fsx(0),py); g.lineTo(fsx(FW),py); g.stroke(); g.restore();
    };
    drawL(FE.fd,'#f2c94c'); drawL(FE.los,'#3f6fe0');
  }
