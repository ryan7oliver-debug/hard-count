import re, json, subprocess, sys, importlib
subprocess.check_call(['python3','build_logic.py'])
p='run-the-rivalry.html'
s=open(p,encoding='utf-8').read()
J=lambda v: json.dumps(v, ensure_ascii=False)

from schools_existing import SCHOOL
from school_colors import COLORS
import new_coaches, more_coaches, more_colors, more_players
COLORS.update(more_colors.COLORS)
mods={pos:importlib.import_module('new_'+pos.lower()) for pos in ['QB','RB','WR','OL','EDGE','DB','LB']}
ATTRS={'QB':['ARM','ACC','DEEP','MOB','IQ','POC','CLU','LEAD'],'RB':['SPD','POW','ELU','VIS','REC','PBK','STA','CLU'],
 'WR':['SPD','RTE','HND','YAC','CTR','BLK','IQ','CLU'],'OL':['RBK','PBK','STR','ANC','FT','IQ','DIS','STA'],
 'EDGE':['RSH','RS','STR','GET','MOT','STA','IQ','DIS'],'DB':['COV','TKL','SPD','BALL','IQ','PHY','STA','CLU'],
 'LB':['TKL','COV','RS','BLZ','SPD','STR','IQ','STA']}
RANK={'walkon':0,'allconf':1,'allamerican':2,'heisman':3}; NAMES=['walkon','allconf','allamerican','heisman']
def ekey(y): return 'leather' if y<=1935 else 'ironman' if y<=1959 else 'option' if y<=1984 else 'prostyle' if y<=2003 else 'spread' if y<=2017 else 'portal'
def rep_once(old,new):
    global s
    assert s.count(old)==1, ('not unique/missing',old[:70],s.count(old)); s=s.replace(old,new)

# ---- existing players: add school ----
for (pos,name),sc in SCHOOL.items():
    pat="{name:'"+name+"',pos:'"+pos+"',"
    assert s.count(pat)==1,(pos,name,s.count(pat))
    s=s.replace(pat,pat+"school:"+J(sc)+",")
existing_names={n for (_,n) in SCHOOL}

# ---- new players ----
out=[]; seen=set(existing_names); tiers_new={}; counts={}
for pos,m in mods.items():
    for (name,school,year,tier,tag,st) in list(m.ROWS)+more_players.ROWS_BY_POS[pos]:
        assert name not in seen,('duplicate',name); seen.add(name)
        assert len(st)==8 and all(40<=v<=99 for v in st),(name,st)
        assert school in COLORS,('no color',school)
        off={'heisman':2,'allamerican':-3,'allconf':-3,'walkon':-4}[tier]
        st=[max(45,min(99,v+off)) for v in st]
        mean=sum(st)/8
        srank=2 if mean>=81.85 else 1 if mean>=79.3 else 0
        final=min(RANK[tier],srank) if tier!='heisman' else (3 if mean>=82 else 2)
        tn=NAMES[final]; tiers_new.setdefault(tn,[]).append(mean)
        stats=','.join(k+':'+str(v) for k,v in zip(ATTRS[pos],st))
        out.append("    {name:%s,pos:'%s',school:%s,era:%s,eraKey:'%s',tier:'%s',tag:%s,stats:{%s}},"%(J(name),pos,J(school),J("'"+str(year%100).zfill(2)),ekey(year),tn,J(tag),stats))
        counts[pos]=counts.get(pos,0)+1
i=s.index('const PLAYERS = [')
j=s.index('];',i)
pre=s[:j].rstrip(); pre+=('' if pre.endswith(',') else ',')
s=pre+'\n'+'\n'.join(out)+'\n  '+s[j:]

# ---- coaches ----
for name,sc in new_coaches.EXISTING.items():
    pat="{name:'"+name+"',era:"
    assert s.count(pat)==1,(name,s.count(pat))
    s=s.replace(pat,"{name:'"+name+"',school:"+J(sc)+",era:")
seen_c=set(new_coaches.EXISTING); cout=[]; CRANK={'gradasst':0,'coordinator':1,'headcoach':2,'hof':3}; CN=['gradasst','coordinator','headcoach','hof']
for (name,school,era,tier,tag,st) in list(new_coaches.ROWS)+list(more_coaches.ROWS):
    assert name not in seen_c,('dup coach',name); seen_c.add(name)
    assert school in COLORS,('no color',school); assert len(st)==8
    mean=sum(st)/8; sr=3 if mean>=85 else 2 if mean>=77 else 1 if mean>=70 else 0
    tn=CN[min(CRANK[tier],sr)]
    stats=','.join(k+':'+str(v) for k,v in zip(['REC','SCH','DEV','DIS','MOT','MGT','RES','CLU'],st))
    cout.append("    {name:%s,school:%s,era:'%s',tier:'%s',tag:%s,stats:{%s}},"%(J(name),J(school),era,tn,J(tag),stats))
i=s.index('const COACHES = [')
j=s.index('];',i)
pre=s[:j].rstrip(); pre+=('' if pre.endswith(',') else ',')
s=pre+'\n'+'\n'.join(cout)+'\n  '+s[j:]

# ---- colors + helpers ----
used={m for m in COLORS}
rep_once('  const PLAYERS = [', '  const SCHOOL_COLORS = '+J(COLORS)+';\n  const PLAYERS = [')

# ---- UI: school on cards, tinted portraits, slots ----
rep_once("  function renderPlayerCard(){","""  function schoolColor(sc){ const k=String(sc||'').split(' / ')[0]; return SCHOOL_COLORS[k]||'#4d5875'; }
  function inkOn(hex){ const n=parseInt(hex.slice(1),16), r=(n>>16)&255, g=(n>>8)&255, b=n&255; return (0.299*r+0.587*g+0.114*b)>150 ? '#10192e' : '#ffffff'; }
  function dispName(n){ return String(n||'').replace(/ \\([^)]*\\)$/,''); }
  function schoolOf(name){ const pool = state.draftMode==='coach' ? COACHES : PLAYERS; const p = pool.find(x=>x.name===name); return p&&p.school ? p.school : ''; }
  function renderPlayerCard(){""")
rep_once("const portraitColor = state.draftMode==='coach' ? 'var(--team-accent)' : (DEF_POS.includes(p.pos) ? 'var(--def-red)' : 'var(--off-blue)');","const portraitColor = schoolColor(p.school), portraitInk = inkOn(portraitColor);")
rep_once('<div class="player-portrait" style="background:${portraitColor};">${portraitInit}</div>','<div class="player-portrait" style="background:${portraitColor};color:${portraitInk};">${portraitInit}</div>')
rep_once('<p class="player-name">${p.name}</p>','<p class="player-name">${dispName(p.name)}</p>\n            <p class="player-school"><i style="background:${portraitColor}"></i>${p.school||""}</p>')
rep_once("<span>${state.draftedFrom[key]}</span>","<span>${dispName(state.draftedFrom[key])} · ${schoolOf(state.draftedFrom[key])}</span>")
rep_once("  /* dev nav","""  .player-school{display:inline-flex;align-items:center;gap:7px;margin:6px 0 0;font-family:var(--font-mono);font-size:0.74rem;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;color:var(--ink);}
  .player-school i{width:11px;height:11px;border-radius:50%;display:inline-block;box-shadow:0 0 0 1.5px var(--line);}
  /* dev nav""")

# ---- targets derived from simulation (82-OVR reference build; mean of QB/RB/WR/OL, 2500 games each; re-measured after the position-involvement rework) ----
for old,new in [("target:27, baseRecord:52","target:20, baseRecord:52"),("target:30, baseRecord:56","target:24, baseRecord:56"),("target:21, baseRecord:41","target:15, baseRecord:41"),("target:33, baseRecord:58","target:28, baseRecord:58"),("target:29, baseRecord:49","target:22, baseRecord:49"),("target:35, baseRecord:61","target:33, baseRecord:61")]:
    rep_once(old,new)
rep_once("  const TEAMS = [","  // target = mean score of an 82-OVR reference build vs this opponent (8,000 simulated games)\n  const TEAMS = [")
rep_once("  .player-school{","  .tier-ribbon{color:#10192e !important;}\n  .player-school{")
open(p,'w',encoding='utf-8').write(s)
print('new players',counts,'total new',sum(counts.values()),'coaches',len(cout))
for t,v in tiers_new.items(): print('new tier',t,len(v),'mean',round(sum(v)/len(v),1))
from collections import Counter
print('coach tiers',Counter(re.findall(r"tier:'(gradasst|coordinator|headcoach|hof)'",s[s.index('const COACHES'):s.index('];',s.index('const COACHES'))])))
