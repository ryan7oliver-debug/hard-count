
  // ---------- field engine: formations + timelines ----------
  const FC = FW/2;
  const clampX = x => Math.max(2.2, Math.min(FW-2.2, x));
  const P = (t,x,y)=>({t,x,y});
  const sm = u => u*u*(3-2*u);
  function pathPos(path,t){
    if(t<=path[0].t) return path[0];
    for(let i=1;i<path.length;i++){
      if(t<=path[i].t){
        const a=path[i-1], b=path[i], u=(t-a.t)/Math.max(1e-6,b.t-a.t), k=0.25*sm(u)+0.75*u;
        return {x:a.x+(b.x-a.x)*k, y:a.y+(b.y-a.y)*k};
      }
    }
    return path[path.length-1];
  }
  function formSpecs(y0){
    const O=(role,x,y)=>({side:'off',role,x,y,face:'up'}), D=(role,x,y)=>({side:'def',role,x,y,face:'down'});
    return [
      O('ol',FC-6,y0-0.8),O('ol',FC-3,y0-0.8),O('ol',FC,y0-0.8),O('ol',FC+3,y0-0.8),O('ol',FC+6,y0-0.8),
      O('te',FC+9.2,y0-0.8),O('qb',FC,y0-6.8),O('rb',FC+3.6,y0-6.8),
      O('wr1',FC-17,y0-0.8),O('wr2',FC+17,y0-0.8),O('wr3',FC-11,y0-2.6),
      D('dl',FC-7.5,y0+3),D('dl',FC-2.5,y0+3),D('dl',FC+2.5,y0+3),D('dl',FC+7.5,y0+3),
      D('lb',FC-8,y0+7.4),D('lb',FC,y0+8),D('lb',FC+8,y0+7.4),
      D('cb',FC-17,y0+5.6),D('cb',FC+17,y0+5.6),D('s',FC-6.5,y0+15),D('s',FC+6.5,y0+15)
    ];
  }
  function feMakeEnts(y0){
    FE.ents = formSpecs(y0).map((s,i)=>Object.assign({id:i,moving:0,phase:Math.random()*6,state:'stand',carrier:false,path:null,downAt:null,cheerAt:null,throwAt:null,cFrom:null,cTo:null},s));
  }
  const byRole = r => FE.ents.filter(e=>e.role===r);
  const one = r => FE.ents.find(e=>e.role===r);

  function feSetBall(x,y,z){ FE.ball.x=x; FE.ball.y=y; FE.ball.z=z||0; FE.ball.vis=true; }
  FE.t = 0; FE.camTarget = {x:FC,y:25}; FE.anim = null;

  FE.tick = function(dt){
    const A = FE.anim; if(!A) return;
    A.t += dt*A.speed;
    const t = A.t;
    FE.ents.forEach(e=>{
      if(e.path){
        const p = pathPos(e.path,t), dx=p.x-e.x, dy=p.y-e.y, d=Math.hypot(dx,dy);
        e.moving = d/Math.max(dt*A.speed,1e-3)/6;
        e.phase += d*2.0;
        if(Math.abs(dy)>0.004) e.face = dy>0?'up':'down';
        e.x=p.x; e.y=p.y;
      } else e.moving = 0;
      if(e.downAt!=null && t>=e.downAt) e.state='down';
      else if(e.cheerAt!=null && t>=e.cheerAt) e.state='cheer';
      else if(e.throwAt!=null && t>=e.throwAt-0.15 && t<=e.throwAt+0.4) e.state='throw';
      else if(e.state!=='down') e.state='stand';
      e.carrier = e.cFrom!=null && t>=e.cFrom && (e.cTo==null || t<=e.cTo);
    });
    // ball
    const segs = A.ball; let seg = segs[segs.length-1];
    for(const s of segs){ if(t<=s.t1){ seg=s; break; } }
    const b = FE.ball;
    if(seg.type==='hold'){ b.x=seg.who.x+seg.dx; b.y=seg.who.y+seg.dy; b.z=seg.z; b.ang=(seg.who.face==='up'?-0.9:0.9); }
    else if(seg.type==='fly'){
      const u = Math.max(0,Math.min(1,(t-seg.t0)/Math.max(1e-6,seg.t1-seg.t0)));
      b.x=seg.fx+(seg.tx-seg.fx)*u; b.y=seg.fy+(seg.ty-seg.fy)*u; b.z=seg.z0+4*seg.peak*u*(1-u)+(seg.z1-seg.z0)*u;
      const sdx=(seg.tx-seg.fx), sdy=-(seg.ty-seg.fy); b.ang=Math.atan2(sdy,sdx)+u*seg.spin;
    } else { b.x=seg.x; b.y=seg.y; b.z=0; }
    FE.camTarget.x = b.x*0.55+FC*0.45; FE.camTarget.y = b.y+4;
    if(t>=A.dur && A.done){ const d=A.done; A.done=null; d(); }
  };

  const H = (who,t0,t1,dx,dy,z)=>({type:'hold',t0,t1,who,dx:dx==null?0.5:dx,dy:dy==null?0.7:dy,z:z==null?1.1:z});
  const F = (t0,t1,fx,fy,tx,ty,peak,z0,z1,spin)=>({type:'fly',t0,t1,fx,fy,tx,ty,peak,z0:z0==null?1.1:z0,z1:z1==null?1.1:z1,spin:spin||0});
  const R = (t1,x,y)=>({type:'rest',t1,x,y});
  const RUN_V = 7;

  function routeFor(e,air,T){
    // returns path to catch point ending at time T
    const dir = e.x<FC ? 1 : -1, x0=e.x, y0=e.y+0.5;
    const depth = air;
    if(depth<=4)  return [P(0,x0,e.y),P(T*0.35,x0+dir*0.6,y0+depth*0.9),P(T,x0+dir*5.5,y0+depth)];
    if(depth<=10) return (Math.random()<0.5)
      ? [P(0,x0,e.y),P(T*0.7,x0,y0+depth+1.6),P(T,x0-dir*1.2,y0+depth)]
      : [P(0,x0,e.y),P(T*0.65,x0,y0+depth),P(T,x0-dir*4.5,y0+depth)];
    return (Math.random()<0.5)
      ? [P(0,x0,e.y),P(T*0.5,x0,y0+depth*0.55),P(T,x0+dir*5,y0+depth)]
      : [P(0,x0,e.y),P(T,x0+dir*1.5,y0+depth)];
  }

  function buildPlay(y0,res,newYard,scored){
    const ents=FE.ents, qb=one('qb'), rb=one('rb'), ols=byRole('ol'), dls=byRole('dl'), lbs=byRole('lb'), cbs=byRole('cb'), ss=byRole('s'), te=one('te');
    const wrs=[one('wr1'),one('wr2'),one('wr3')];
    const rcv=[wrs[0],wrs[1],wrs[2],te];
    const defs=[...dls,...lbs,...cbs,...ss];
    // the entity that stands in for your drafted position on this play, so the "YOU" ring lands on the
    // right jersey. Only set where the game actually credited you (res.mine) — otherwise you're just
    // one of the eleven, on the field but not the story of this snap.
    const pos = state.position, isDef = state.defMode, mine = !!res.mine;
    let youEnt = null;
    if(!isDef && pos==='QB' && res.isPass) youEnt = qb;
    else if(!isDef && pos==='RB' && !res.isPass && mine) youEnt = rb;
    else if(isDef && pos==='DB' && res.isPass && mine) youEnt = cbs[0];
    else if(isDef && pos==='LB' && mine) youEnt = lbs[1];
    // EDGE: the pass-rusher isn't picked until the sack branch knows which lineman got the win — set there.
    if(youEnt) youEnt.isYou = true;
    const g = res.yards; const ev=[]; let ball=[]; let dur=2.5;
    const set=(e,path)=>{e.path=path;};
    const hold=(e,path)=>{ e.path = path; };
    const hasBall = [];
    const yFinal = y0+g;
    const tackleTeam=(car,tackT,fx,fy,fast)=>{
      const cands = defs.filter(d=>!d.path||true).map(d=>({d,dist:Math.hypot(d.x-fx,(d.y-fy)*0.8)})).sort((a,b)=>a.dist-b.dist);
      cands.forEach(({d,dist},i)=>{
        const base = d.path? d.path[d.path.length-1] : P(0,d.x,d.y);
        const arrive = tackT + (i<3?0.0:0.25) + Math.min(0.8,dist*0.03);
        const off = [[0.6,-0.5],[-0.7,-0.3],[0.2,-1.1],[-0.3,0.6],[1.1,0.2]][i%5];
        const pth = (d.path||[P(0,d.x,d.y)]).filter(p=>p.t<tackT-0.35);
        const last = pth[pth.length-1];
        const tStart = Math.max(last.t+0.05, tackT-0.9);
        pth.push(P(tStart,last.x,last.y)); pth.push(P(Math.max(tStart+0.1,arrive), clampX(fx+off[0]), fy+off[1]));
        d.path = pth;
        if(i===0) d.downAt = arrive+0.28; if(i===1) d.downAt = arrive+0.34;
      });
    };
    const decoy=(e,T,depth)=>{
      const dir=e.x<FC?1:-1;
      set(e,[P(0,e.x,e.y),P(T*0.6,e.x+dir*0.4,e.y+depth*0.6),P(T+0.5,e.x+dir*3,e.y+depth)]);
    };
    // ---- OL/DL baseline ----
    const passBlock=(win)=>{
      ols.forEach(o=>set(o,[P(0,o.x,o.y),P(0.9,o.x,o.y-0.9)]));
      dls.forEach((d,i)=>set(d,[P(0,d.x,d.y),P(1.1,d.x*0.8+FC*0.2,y0-0.1-(i===win?0.6:0))]));
    };
    const runBlock=(push,hx)=>{
      ols.forEach(o=>set(o,[P(0,o.x,o.y),P(1.1,o.x+(hx-FC)*0.08,o.y+push)]));
      dls.forEach(d=>set(d,[P(0,d.x,d.y),P(1.1,d.x+(hx-FC)*0.18,d.y+push*0.7)]));
    };

    if(res.isPass && res.type!=='loss'){
      const isInt = res.type==='turnover';
      const complete = !isInt && g>0;
      let air = isInt ? 7+Math.random()*7 : (complete ? (g>=16? Math.round(g*(0.55+Math.random()*0.35)) : Math.max(2,Math.round(g*(0.6+Math.random()*0.4)))) : 6+Math.random()*7);
      air = Math.min(air, complete? g : air);
      const yac = complete ? g-air : 0;
      const tgt = (!isDef && pos==='WR' && mine) ? wrs[0] : rcv[Math.floor(Math.random()*rcv.length)];
      if(!isDef && pos==='WR' && mine) tgt.isYou = true;
      const throwT=1.3, fd=Math.min(1.5,0.5+air*0.03), catchT=throwT+fd;
      set(qb,[P(0,qb.x,qb.y),P(0.8,qb.x,qb.y-3),P(1.3,qb.x,qb.y-3.4),P(catchT+0.6,qb.x,qb.y-3.4)]);
      qb.throwAt=throwT;
      passBlock(-1);
      set(rb,[P(0,rb.x,rb.y),P(0.9,rb.x-0.5,rb.y-0.4)]);
      const route=routeFor(tgt,Math.round(air),catchT); set(tgt,route);
      const cp=route[route.length-1];
      rcv.forEach(r=>{ if(r!==tgt) decoy(r,catchT,8+Math.random()*7); });
      // coverage
      const covers=[[cbs[0],wrs[0]],[cbs[1],wrs[1]],[ss[0],wrs[2]],[lbs[2],te]];
      covers.forEach(([d,r])=>{
        const rp=(r===tgt)?route:r.path;
        const a=pathPos(rp,catchT*0.5), b=pathPos(rp,catchT);
        set(d,[P(0,d.x,d.y),P(catchT*0.5,a.x+0.5,a.y+1.7),P(catchT,b.x+0.6,b.y+1.0)]);
      });
      lbs.slice(0,2).forEach((d,i)=>set(d,[P(0,d.x,d.y),P(1.2,d.x*0.9+FC*0.1,y0+7+i),P(catchT,d.x*0.8+FC*0.2,y0+8+i)]));
      set(ss[1],[P(0,ss[1].x,ss[1].y),P(catchT,ss[1].x*0.8+FC*0.2,y0+13)]);
      ball=[H(qb,0,throwT), F(throwT,catchT,qb.x+0.5,qb.y+0.7,cp.x,cp.y,1.2+air*0.08,1.1,1.1,7)];
      if(isInt){
        const d = cbs[cp.x<FC?0:1];
        set(d,[P(0,d.x,d.y),P(catchT*0.6,cp.x+0.4,cp.y+4),P(catchT,cp.x+0.2,cp.y+0.6)]);
        const retY = 5+Math.random()*8, tackT=catchT+0.3+retY/RUN_V;
        d.path.push(P(tackT,clampX(cp.x+(Math.random()-0.5)*8),cp.y-retY));
        d.cFrom=catchT; d.downAt=tackT+0.15;
        tgt.path.push(P(tackT,d.path[d.path.length-1].x+0.8,d.path[d.path.length-1].y+0.8)); tgt.downAt=tackT+0.4;
        ball.push(H(d,catchT,tackT+2)); ball.push(R(99,d.path[d.path.length-1].x,d.path[d.path.length-1].y));
        dur=tackT+0.9; ball[ball.length-2].t1=dur;
      } else if(complete){
        const fx = clampX(cp.x+(Math.random()-0.5)*Math.min(9,yac*0.6+1));
        const endY = scored ? 101.8 : yFinal;
        const tackT = catchT+0.2+Math.max(0,(endY-cp.y))/(g>=30?10:(g>=18?8.3:RUN_V));
        tgt.path.push(P(tackT, scored? clampX(cp.x+(fx-cp.x)*0.3):fx, endY));
        tgt.cFrom=catchT;
        ball.push(H(tgt,catchT,99));
        if(scored){ tgt.cheerAt=tackT+0.05; dur=tackT+1.1;
          defs.forEach(d=>{ const l=(d.path||[P(0,d.x,d.y)]); const q=l[l.length-1]; d.path=l.concat([P(tackT,clampX(q.x*0.5+fx*0.5),Math.min(y0+q.y-y0, endY-2.5-Math.random()*4))]); });
        } else { tackleTeam(tgt,tackT,fx,endY); tgt.downAt=tackT+0.3; dur=tackT+0.95; }
        ball[ball.length-1].t1=dur;
        rcv.forEach(r=>{ if(r!==tgt && r.path){ const l=r.path[r.path.length-1]; r.path=r.path.concat([P(Math.max(l.t+0.1,dur),l.x,l.y)]); }});
      } else {
        // incomplete: ball flies past/short, bounces
        const ox=(Math.random()-0.5)*3, oy=(Math.random()<0.5?-2.4:2.6);
        const lx=clampX(cp.x+ox), ly=cp.y+oy;
        ball.pop(); ball.push(F(throwT,catchT+0.1,qb.x+0.5,qb.y+0.7,lx,ly,1.2+air*0.08,1.1,0,7));
        ball.push(F(catchT+0.1,catchT+0.4,lx,ly,lx+0.6,ly+(oy>0?0.9:-0.9),0.55,0,0,3));
        ball.push(R(99,lx+0.6,ly+(oy>0?0.9:-0.9)));
        dur=catchT+1.3;
      }
    } else if(res.isPass){
      // sack
      const win = 1+Math.floor(Math.random()*2);
      if(isDef && pos==='EDGE' && mine) dls[win].isYou = true;
      const tSack=1.55, sy=Math.min(qb.y-0.5, y0+g);
      set(qb,[P(0,qb.x,qb.y),P(0.9,qb.x,qb.y-2.2),P(tSack,qb.x+0.5,sy)]);
      qb.downAt=tSack+0.1; qb.throwAt=null;
      passBlock(win);
      ols.forEach((o,i)=>{ if(i>=1&&i<=3) set(o,[P(0,o.x,o.y),P(0.9,o.x,o.y-0.9),P(tSack,o.x+(i===win?0.8:0),o.y-1.6)]); });
      const d1=dls[win], d2=dls[win===1?2:3];
      set(d1,[P(0,d1.x,d1.y),P(1.0,d1.x*0.6+FC*0.4,y0-1.5),P(tSack+0.05,qb.x+0.5,sy+1.0)]); d1.downAt=tSack+0.35;
      set(d2,[P(0,d2.x,d2.y),P(1.2,d2.x*0.6+FC*0.4,y0-1.2),P(tSack+0.2,qb.x-0.4,sy+0.8)]);
      rcv.forEach(r=>decoy(r,tSack,7+Math.random()*4));
      set(rb,[P(0,rb.x,rb.y),P(0.9,rb.x-0.5,rb.y-0.4)]);
      ball=[H(qb,0,tSack+0.2),R(99,qb.x+0.5,sy)]; ball[0].t1=tSack+0.2;
      qb.cFrom=null; dur=tSack+1.0;
    } else {
      // run
      const fumble = res.type==='turnover';
      const side = Math.random()<0.5?-1:1, hx = clampX(FC+side*(1.6+Math.random()*3.2));
      const tHand=0.55, tHole=1.05;
      set(qb,[P(0,qb.x,qb.y),P(tHand,qb.x+0.4,qb.y-0.5),P(tHand+0.5,qb.x+0.4,qb.y-0.5)]);
      const rbPath=[P(0,rb.x,rb.y),P(tHand,FC+1.3,y0-4.4)];
      let endY = scored? 101.8 : yFinal;
      if(fumble) endY = y0+1.5;
      const gainDist = Math.max(0,endY-(y0+0.4));
      rbPath.push(P(tHole,hx,y0+0.4));
      let tEnd=tHole;
      if(g<=0 && !scored && !fumble){ rbPath.pop(); tEnd=1.0+Math.abs(g)*0.05; rbPath.push(P(tEnd,clampX(hx),endY)); }
      else if(gainDist>0.6){
        const v = g>=30 ? 10 : (g>=15 ? 8.4 : RUN_V);
        const mid = clampX(hx+(Math.random()-0.5)*4);
        tEnd = tHole+0.15+gainDist/v;
        if(gainDist>4){ rbPath.push(P(tHole+(tEnd-tHole)*0.45, mid, y0+0.4+gainDist*0.45)); }
        rbPath.push(P(tEnd, clampX(mid+(Math.random()-0.5)*5), endY));
      }
      rb.path=rbPath; rb.cFrom=tHand+0.08;
      runBlock(Math.min(2.4,0.6+g*0.2), hx);
      const fxx=rbPath[rbPath.length-1].x;
      wrs.forEach(w=>{ const dir=w.x<FC?1:-1; set(w,[P(0,w.x,w.y),P(1.4,w.x+dir*1.5,w.y+3+Math.min(8,Math.max(0,g))*0.6)]); });
      set(te,[P(0,te.x,te.y),P(1.0,te.x-0.6,te.y+0.6)]);
      ball=[H(qb,0,tHand-0.05), F(tHand-0.05,tHand+0.08,qb.x+0.4,qb.y+0.5,FC+1.3,y0-4.3,0.15,1.1,1.1,0), H(rb,tHand+0.08,99)];
      if(scored){ rb.cheerAt=tEnd+0.05; dur=tEnd+1.0;
        defs.forEach(d=>{ const l=(d.path||[P(0,d.x,d.y)]); const q=l[l.length-1]; d.path=l.concat([P(tEnd,clampX(q.x*0.6+fxx*0.4),endY-2-Math.random()*5)]); });
      } else {
        tackleTeam(rb,tEnd,fxx,endY);
        rb.downAt=tEnd+0.3; dur=tEnd+0.95;
        if(fumble){
          const lb=lbs[1]; const bx=fxx+1.5, by=endY+0.9;
          ball=[H(qb,0,tHand-0.05), F(tHand-0.05,tHand+0.08,qb.x+0.4,qb.y+0.5,FC+1.3,y0-4.3,0.15,1.1,1.1,0), H(rb,tHand+0.08,tEnd-0.1), F(tEnd-0.1,tEnd+0.25,fxx,endY,bx,by,0.7,1.1,0,6), R(tEnd+0.5,bx,by)];
          rb.cTo=tEnd-0.1; lb.path=(lb.path||[P(0,lb.x,lb.y)]).filter(p=>p.t<tEnd-0.4).concat([P(tEnd+0.3,bx,by-0.5)]); lb.cFrom=tEnd+0.3; lb.downAt=tEnd+0.9;
          ball.push(H(lb,tEnd+0.5,99)); dur=tEnd+1.3;
        }
      }
      ball[ball.length-1].t1 = dur;
      // ensure non-tacklers still have trailing paths
    }
    if(ball[ball.length-1].type!=='rest') ball[ball.length-1].t1=Math.max(dur,ball[ball.length-1].t1);
    return {dur,ball};
  }

  function animatePlay(y0,res,newYard,scored){
    return new Promise(resolve=>{
      feMakeEnts(y0);
      FE.ents.forEach(e=>{e.path=null;e.downAt=null;e.cheerAt=null;e.throwAt=null;e.cFrom=null;e.cTo=null;});
      const plan = buildPlay(y0,res,newYard,scored);
      const speed = feSpeed();
      FE.ents.forEach(e=>{ if(e.path && e.path.length===1) e.path=null; });
      FE.anim = {t:0,speed,dur:plan.dur,ball:plan.ball,done:()=>{ setTimeout(resolve,180/speed); }};
      feSetBall(FC,y0,1.1);
    });
  }


  function animateKick(y0,isFG){
    return new Promise(resolve=>{
      feMakeEnts(y0);
      const qb=one('qb'), cb=cbsOf(), ols=byRole('ol'), dls=byRole('dl');
      const kx=FC, ky=y0-8;
      qb.path=[P(0,qb.x,qb.y),P(0.7,kx,ky)];
      ols.forEach(o=>{ o.path=[P(0,o.x,o.y),P(1.2,o.x,o.y-0.4)]; });
      dls.forEach(d=>{ d.path=[P(0,d.x,d.y),P(1.4,d.x*0.85+FC*0.15,y0+0.6)]; });
      byRole('rb').forEach(r=>{ r.path=[P(0,r.x,r.y),P(0.7,FC+4,y0-5)]; });
      const tk=1.0;
      const tx = clampX(FC+(Math.random()-0.5)*4), ty = isFG ? 111 : Math.min(98,y0+40+Math.random()*8);
      const fly = isFG ? 1.6 : 2.0;
      qb.throwAt=tk+0.05;
      const ret = cb[0]; ret.path=[P(0,ret.x,ret.y),P(tk+fly,tx,ty)];
      const ball=[F(0,0.35,FC,y0-0.8,kx,ky,0.5,0.8,1.1,4),H(qb,0.35,tk,0,0.2,0.6),F(tk,tk+fly,kx,ky,tx,ty,isFG?7:13,0.4,0.4,10),R(99,tx,isFG?ty:ty)];
      const dur=tk+fly+(isFG?0.6:0.9);
      ball[ball.length-1].t1=dur;
      FE.anim={t:0,speed:feSpeed(),dur,ball,done:()=>{ setTimeout(resolve,150); }};
      feSetBall(FC,y0,0.6);
    });
  }
  const cbsOf = ()=>byRole('cb');

  function feReset(y0){
    return new Promise(resolve=>{
      const specs = formSpecs(y0);
      if(!FE.ents.length) feMakeEnts(y0);
      let maxD=0.4;
      const far = FE.ents.some((e,i)=>Math.hypot(specs[i].x-e.x,specs[i].y-e.y)>13);
      FE.ents.forEach((e,i)=>{
        const s=specs[i]; e.role=s.role; e.side=s.side;
        if(far){ e.x=s.x; e.y=s.y; }
        const d=Math.hypot(s.x-e.x,s.y-e.y); maxD=Math.max(maxD,d);
        e.path=[P(0,e.x,e.y),P(Math.max(0.35,d/8),s.x,s.y)];
        e.downAt=null;e.cheerAt=null;e.throwAt=null;e.cFrom=null;e.cTo=null;e.carrier=false; if(e.state==='down'||e.state==='cheer') e.state='stand';
        e.faceEnd=s.face;
      });
      const dur=far?0.7:Math.max(0.5,maxD/8)+0.15;
      const ballSeg=[R(99,FC,y0)];
      FE.ball.z=0; FE.ball.vis=true; FE.ball.ang=0;
      FE.anim={t:0,speed:feSpeed(),dur,ball:ballSeg,done:()=>{
        FE.ents.forEach((e,i)=>{ e.path=null; e.moving=0; e.face=specs[i].face; e.x=specs[i].x; e.y=specs[i].y; });
        FE.anim=null; feSetBall(FC,y0,0); resolve();
      }};
    });
  }
  window.__GG = {FE,animatePlay,animateKick,feReset,feMakeEnts,buildPlay,drawPick,draftCfg,sidePalette,shadeHex,contrastOn,hexToRgb,fePickSkin,buildField};
