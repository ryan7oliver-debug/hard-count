
  // ============================================================
  // OFF-FIELD EVENTS — decisions with weighed (not scripted) outcomes
  // ============================================================
  const O = (label, sub, o) => Object.assign({ label, sub }, o);
  const isP = () => C.mode==='player';
  const who = () => isP() ? surname() : 'Coach '+surname();
  function fill(s, ctx){
    const t = ctx && ctx.opp ? ctx.opp : null;
    return String(s)
      .replace(/\{home\}/g, C.char ? C.char.hometown.split(',')[0] : 'home').replace(/\{n\}/g, who()).replace(/\{school\}/g, C.school.place).replace(/\{nick\}/g, C.school.nick)
      .replace(/\{opp\}/g, t ? t.place : 'the other side').replace(/\{oppn\}/g, t ? t.name : 'the other side')
      .replace(/\{rival\}/g, rivalTeam().place).replace(/\{pos\}/g, isP() ? POSITIONS[C.pl.pos].label.toLowerCase() : 'coach');
  }

  const EVENTS = [
    // ---------- both modes: the post-game presser ----------
    { id:'presser', when:'post', w:0, ok:()=>true, build(ctx){
      const won = ctx.res.W, ps = isP();
      if(won){
        return { tag:'Press room', speaker:CAST.beat, ask: ps
            ? `"{oppn} pushed you all the way to the wire, ${surname()}. What did that win say about this team?"`
            : `"That's a statement win over {oppn}, Coach. What does it tell you about this team?"`,
          opts:[
            O(ps?'Give the credit away':'Credit the players', ps?'Talk about the guys up front':'Say it was the players\' win', { good:{conf:1,resp:4,fans:1}, quote: ps?'"Honestly, it\'s the guys around me. The line protected, the defense got stops — I just got to be part of it."':'"That\'s all them. Those kids prepared, they executed, and they earned every second of it."' }),
            O(ps?'Own it':'Set the standard', ps?'Say what everyone is thinking':'"This is what we do here"', { risky:true, land:0.55, good:{conf:4,resp:ps?-1:2,fans:6}, bad:{conf:-4,resp:-4,fans:-3}, quote: ps?'"I put in the work for nights like this. I expect to be the best player on the field every single Saturday."':'"That\'s the standard here. Nobody should be surprised, and nobody should be satisfied."' }),
            O('Keep it short','Move on to next week', { good:{conf:0,resp:1,fans:0}, quote:'"Good win. Back to work tomorrow. Next question."' })
          ] };
      }
      return { tag:'Press room', speaker:CAST.beat, ask: ps
          ? `"That one stings, ${surname()}. What went wrong out there against {oppn}?"`
          : `"Give the fans a reason to keep believing, Coach. What went wrong against {oppn}?"`,
        opts:[
          O(ps?'Take the blame':'Own it as head coach', 'Put it on yourself', { good:{conf:-1,resp:4,fans:1}, quote: ps?'"That one\'s on me. I have to be better in the moments that matter, and I will be."':'"That one\'s on me. I didn\'t have them ready, and I won\'t make that mistake twice."' }),
          O('Call out the effort','Say it plainly', { risky:true, land:0.45, good:{conf:2,resp:3,fans:0}, bad:{conf:-3,resp:-6,fans:-2}, quote: ps?'"We didn\'t play to our standard, and that starts with everybody in that locker room, including some guys who know who they are."':'"Our effort wasn\'t where it has to be. That\'s not a scheme problem. That\'s a want-to problem."' }),
          O('Keep it in the building','Nothing to add', { good:{conf:0,resp:2,fans:0}, quote:'"We\'ll handle it as a team, in the building. That\'s all I\'ve got."' })
        ] };
    } },

    // ---------- player events ----------
    // The first time a season the coach benches you for lack of trust, he offers a way back (see runWeek). Not in the random pool.
    { id:'benchtalk', private:true, modes:['player'], when:'bench', w:0, ok:()=>false, build(ctx){
      return { tag:'Coach\'s office', speaker:{name:'Coach Halloran',role:'Head coach',outlet:C.school.place}, ask:`"You\'re not starting this week. The room doesn\'t trust you right now, and I can\'t fix that for you. What are you going to do about it?"`,
        opts:[
          O('Work your way back','Extra reps, no complaints', { good:{conf:1,resp:5,fans:0}, quote:'"Give me the scout-team reps. I\'ll earn it back."' }),
          O('Face the room','Own it in front of the guys', { good:{conf:0,resp:6,fans:0}, quote:'"I let you down. I\'m here to fix it, and I\'ll show it on Saturday."' }),
          O('Demand your job back','Tell him you\'re the guy', { risky:true, land:0.4, good:{conf:3,resp:6,fans:1}, bad:{conf:-3,resp:-4,fans:-1}, quote:'"Bench me if you want, Coach. You\'ll want me out there when it counts."' })
        ] };
    } },
    { id:'social', modes:['player'], when:'post', w:3, ok:()=>C.meters.fans>=20, build(ctx){
      return { tag:'Timeline', speaker:CAST.numbers, ask:`Someone from the {opp} fan base is dunking on your game in front of thousands of people. Your phone won't stop buzzing.`,
        opts:[
          O('Ignore it','Mute and move on', { good:{conf:0,resp:2,fans:0}, quote:'(You mute the thread and put the phone in the locker.)' }),
          O('Post the receipts','Answer with the stats', { risky:true, land:0.6, good:{conf:3,resp:0,fans:4}, bad:{conf:0,resp:-2,fans:-2}, quote:'"Stats are public. Check them, then come back."' }),
          O('Fire back','Match the energy', { risky:true, land:0.45, good:{conf:2,resp:-2,fans:7}, bad:{conf:-3,resp:-5,fans:-4}, quote:'"Cute. See you in the stands, champ."' })
        ] };
    } },
    { id:'coachmeet', private:true, modes:['player'], when:'pre', w:4, ok:()=>C.season.streak<0 || C.meters.conf<40, build(ctx){
      return { tag:'Film room', speaker:{name:'Coach Halloran',role:'Head coach',outlet:C.school.place}, ask:`"My office. Now." The film from last week wasn't kind, and {opp} is next.`,
        opts:[
          O('Own it','Say nothing but yes, Coach', { good:{conf:-1,resp:3,fans:0}, quote:'"I saw it too, Coach. It won\'t happen again."' }),
          O('Ask for extra film','Get in the building early', { good:{conf:2,resp:2,fans:0}, mod:{q:1}, quote:'"Can we go through it play by play? I want to see what I\'m missing."' }),
          O('Push back','Argue the tape', { risky:true, land:0.45, good:{conf:4,resp:4,fans:0}, bad:{conf:-2,resp:-7,fans:0}, flag:'sluggish', quote:'"Respectfully, Coach — that\'s not what I saw. Run it back with me."' })
        ] };
    } },
    { id:'nightbefore', private:true, modes:['player'], when:'pre', w:5, ok:(c)=>c.big, build(ctx){
      return { tag:'Group chat', speaker:CAST.reporter, ask:`The guys are heading out the night before {oppn}. It's a big one, and everyone's watching who shows up.`,
        opts:[
          O('Stay in','Early night, film, bed', { good:{conf:1,resp:2,fans:0}, mod:{q:1}, quote:'"I\'m good, fellas. I\'ll see you at breakfast."' }),
          O('Go for an hour','Show your face, be back by ten', { risky:true, land:0.6, good:{conf:2,resp:3,fans:0}, bad:{conf:-5,resp:-3,fans:0}, flag:'sluggish', quote:'"One hour. Nobody talks to me about football."' }),
          O('Run a team dinner','Keep everyone in the building', { good:{conf:1,resp:4,fans:0}, quote:'"Dinner\'s on me. Seven o\'clock. Everybody\'s invited."' })
        ] };
    } },
    { id:'injury', private:true, modes:['player'], when:'pre', w:1.3, ok:()=>C.season.idx>=2, build(ctx){
      return { tag:'Training room', speaker:{name:'Doc Ferrell',role:'Head trainer',outlet:C.school.place}, ask:`Ankle tweaked in Thursday's practice. The trainer says you can go, barely, against {opp}.`,
        opts:[
          O('Play through it','Trust the tape job', { risky:true, land:0.5, good:{conf:4,resp:5,fans:2}, bad:{conf:-3,resp:0,fans:0}, flag:'hurt', quote:'"Tape it. I\'m playing."' }),
          O('Test it at warmups','Decide on the field', { good:{conf:0,resp:1,fans:0}, mod:{q:-2}, quote:'"I\'ll know at warmups. Doc, be ready."' }),
          O('Sit it out','Heal for the games that count', { good:{conf:-2,resp:-1,fans:-1}, flag:'sit', quote:'"Not worth the risk. I\'ll be ready next week."' })
        ] };
    } },
    { id:'teammate', private:true, modes:['player'], when:'pre', w:2.5, ok:()=>C.pl.cls>=1, build(ctx){
      return { tag:'Locker room', speaker:CAST.reporter, ask:`A young teammate is grumbling about playing time, and it's leaking into the locker room ahead of {opp}.`,
        opts:[
          O('Mentor him','Take him under your wing', { good:{conf:1,resp:4,fans:0}, quote:'"Stick with me this week. I\'ll show you what I look for."' }),
          O('Tell him to earn it','Straight talk', { risky:true, land:0.5, good:{conf:2,resp:3,fans:0}, bad:{conf:-1,resp:-4,fans:0}, quote:'"Nobody handed me anything. Nobody\'s handing you anything either."' }),
          O('Stay out of it','Not your job', { good:{conf:0,resp:0,fans:0}, quote:'(You keep your head down and get to work.)' })
        ] };
    } },
    { id:'nil', modes:['player'], when:'post', w:2, ok:()=>C.meters.fans>=40, build(ctx){
      return { tag:'Agent call', speaker:{name:'Marcy Bell',role:'Your agent',outlet:''}, ask:`A regional car dealership wants you as the face of its whole spring campaign. Big money, big billboards.`,
        opts:[
          O('Sign it','Take the money', { good:{conf:1,resp:-2,fans:5}, quote:'"Send it over. I\'ll be at the shoot Tuesday."' }),
          O('Decline','Football first', { good:{conf:1,resp:2,fans:0}, quote:'"Appreciate it. I\'m locked in on the season right now."' }),
          O('Counter higher','Ask for the moon', { risky:true, land:0.5, good:{conf:2,resp:0,fans:7}, bad:{conf:0,resp:-3,fans:-1}, quote:'"Double it and put my name above the logo."' })
        ] };
    } },
    { id:'scouts', private:true, modes:['player'], when:'pre', w:3, ok:(c)=>c.big && C.pl.cls>=2, build(ctx){
      return { tag:'Press box', speaker:CAST.analyst, ask:`Pro scouts fill the press box for {oppn}. Every eye in the building is on you.`,
        opts:[
          O('Play your game','Ignore the noise', { good:{conf:1,resp:1,fans:0}, mod:{q:1}, quote:'"Same job, same standard. Let the tape talk."' }),
          O('Hunt highlights','Swing for the fences', { risky:true, land:0.5, good:{conf:3,resp:0,fans:3}, bad:{conf:-3,resp:-1,fans:0}, mod:{q:4}, badMod:{q:-3}, quote:'"If they came to see something, I\'m going to give them something."' })
        ] };
    } },
    { id:'rumors', modes:['player'], when:'post', w:2, ok:()=>C.pl.cls>=1 && !C.pl.transferred, build(ctx){
      return { tag:'Portal watch', speaker:CAST.beat, ask:`Transfer-portal rumors are swirling: "Is ${surname()} looking to leave {school}?"`,
        opts:[
          O('Shut it down','"I\'m right where I want to be"', { good:{conf:0,resp:3,fans:1}, quote:'"I\'m a {nick}. I\'m not going anywhere."' }),
          O('Keep them guessing','Say nothing at all', { risky:true, land:0.5, good:{conf:2,resp:0,fans:5}, bad:{conf:-2,resp:-6,fans:-2}, quote:'"I\'m focused on Saturday. Everything else is just noise."' })
        ] };
    } },
    { id:'hospital', modes:['player','coach'], when:'post', w:1.5, ok:()=>true, build(ctx){
      return { tag:'Community', speaker:CAST.reporter, ask:`The children's hospital invited the team for a visit. Cameras are optional.`,
        opts:[
          O('Go, no cameras','Just show up', { good:{conf:1,resp:3,fans:2}, quote:'"We\'re just here to hang out."' }),
          O('Go, with the cameras','Let the story out', { risky:true, land:0.75, good:{conf:0,resp:0,fans:5}, bad:{conf:0,resp:-2,fans:-2}, quote:'"Come on in, everybody. Let\'s make some noise for these kids."' })
        ] };
    } },
    { id:'hometown', modes:['player'], when:'post', w:2, ok:()=>true, build(ctx){
      return { tag:'Hometown news', speaker:CAST.reporter, ask:`The paper back in {home} wants a quote for a feature on the local kid playing big-time football.`,
        opts:[
          O('Keep it humble','Talk about the people back home', { good:{conf:0,resp:3,fans:2}, quote:'"None of this happens without {home}. I carry it with me out there."' }),
          O('Talk your goals','Say what you\'re chasing', { risky:true, land:0.55, good:{conf:3,resp:0,fans:4}, bad:{conf:-2,resp:-2,fans:-1}, quote:'"I didn\'t come this far to stop here. {home} is going to see my name in lights."' })
        ] };
    } },
    { id:'brand', modes:['player'], when:'post', w:2, ok:()=>C.meters.fans>=55 && C.meters.fans<90, build(ctx){
      return { tag:'Agent call', speaker:{name:'Marcy Bell',role:'Your agent',outlet:''}, ask:`A shoe brand wants to fly you out for a full campaign shoot — a real jump from local deals.`,
        opts:[
          O('Take the deal','Sign now', { good:{conf:1,resp:-1,fans:6}, quote:'"Let\'s do it. Book the flight."' }),
          O('Let your agent negotiate','Patience pays', { good:{conf:1,resp:1,fans:2}, quote:'"Get me the best version of this. I can wait a week."' }),
          O('Pass — stay off the radar','Keep the season simple', { good:{conf:0,resp:3,fans:-1}, quote:'"Not this season. I want the noise to be about the games."' })
        ] };
    } },
    { id:'classroom', private:true, modes:['player'], when:'pre', w:1.5, ok:()=>C.pl.cls>=1, build(ctx){
      return { tag:'Academic office', speaker:{name:'Ms. Okafor',role:'Academic advisor',outlet:C.school.place}, ask:`A midterm landed the same week as {opp}, and your advisor wants to talk about the study plan before it becomes a problem.`,
        opts:[
          O('Make the plan','Lock in study hall time', { good:{conf:0,resp:3,fans:0}, quote:'"Set the hours. I\'ll be there."' }),
          O('Say you\'ve got it','Handle it your own way', { risky:true, land:0.55, good:{conf:2,resp:1,fans:0}, bad:{conf:-2,resp:-3,fans:0}, mod:{q:-1}, badMod:{q:-2}, quote:'"I\'ve got a system, Ms. Okafor. Trust me on this one."' })
        ] };
    } },
    { id:'podcast', modes:['player'], when:'post', w:2, ok:()=>C.pl.cls>=1, build(ctx){
      return { tag:'Podcast booth', speaker:CAST.analyst, ask:`A national college football podcast wants you on for twenty minutes, live, no editing.`,
        opts:[
          O('Play it safe','Stick to coach-speak', { good:{conf:0,resp:2,fans:1}, quote:'"We\'re taking it one week at a time. That\'s really it."' }),
          O('Say something real','Give them a real opinion', { risky:true, land:0.5, good:{conf:3,resp:-1,fans:6}, bad:{conf:-2,resp:-4,fans:-2}, quote:'"Honestly? {rival} is beatable this year, and everyone in that building knows it."' })
        ] };
    } },
    { id:'oldcoach', private:true, modes:['player'], when:'pre', w:2, ok:(c)=>c.big, build(ctx){
      return { tag:'Old phone number', speaker:{name:'Coach Devereux',role:'Your high school coach',outlet:''}, ask:`A text from the coach who first believed in you, the night before {oppn}: "Proud of you either way. Go play free."`,
        opts:[
          O('Call him back','Take five minutes', { good:{conf:2,resp:2,fans:0}, quote:'"Means a lot, Coach. I won\'t waste it."' }),
          O('Read it and refocus','Save it for later', { good:{conf:1,resp:1,fans:0}, quote:'(You read it twice, then put the phone away.)' })
        ] };
    } },
    { id:'familyvisit', private:true, modes:['player'], when:'pre', w:2, ok:(c)=>c.big, build(ctx){
      return { tag:'Family in town', speaker:CAST.reporter, ask:`Your whole family made the trip in for {oppn}. Tickets, hotel rooms, the works — and they want time with you before the game.`,
        opts:[
          O('Make time for them','Dinner, then focus', { good:{conf:2,resp:1,fans:0}, quote:'"An hour with them, then I lock in. That\'s the trade."' }),
          O('Stay locked in','Football first, visit after', { good:{conf:1,resp:2,fans:0}, mod:{q:1}, quote:'"They get it. We celebrate after the win."' })
        ] };
    } },
    { id:'draftbuzz', modes:['player'], when:'post', w:2, ok:()=>C.pl.cls>=2, build(ctx){
      return { tag:'Draft boards', speaker:CAST.analyst, ask:`A national draft analyst put out an early mock with your name in the first two rounds. It's everywhere by lunchtime.`,
        opts:[
          O('Downplay it','Keep the focus on the team', { good:{conf:0,resp:2,fans:1}, quote:'"Flattering, but I\'m not thinking about that right now."' }),
          O('Own the moment','Let it fuel you', { risky:true, land:0.55, good:{conf:3,resp:-1,fans:4}, bad:{conf:-2,resp:-3,fans:-1}, quote:'"I see it. Now I have to go prove it every week."' })
        ] };
    } },
    { id:'roommate', private:true, modes:['player'], when:'pre', w:2, ok:()=>C.pl.cls>=1, build(ctx){
      return { tag:'Off campus', speaker:CAST.reporter, ask:`Your roommate and fellow starter is dealing with a rough week at home, and it's showing up in practice ahead of {opp}.`,
        opts:[
          O('Be there for him','Check in, no pressure', { good:{conf:1,resp:3,fans:0}, quote:'"Whatever you need, man. Football can wait a minute."' }),
          O('Get him back on schedule','Structure helps', { good:{conf:1,resp:2,fans:0}, mod:{q:1}, quote:'"Practice, film, sleep. Let\'s just get through the routine together."' })
        ] };
    } },

    // ---------- coach events ----------
    { id:'booster', private:true, modes:['coach'], when:'pre', w:3, ok:()=>C.season.idx>=2 && C.meters.resp<75, build(ctx){
      return { tag:'Booster dinner', speaker:{name:'Walt Pruitt',role:'Booster club chair',outlet:C.school.place}, ask:`The booster dinner is tonight, Coach. Everyone at the head table wants to know when this program wins something.`,
        opts:[
          O('Promise a title run','Guarantee it', { risky:true, land:0.5, good:{conf:1,resp:5,fans:5}, bad:{conf:-2,resp:-6,fans:-3}, quote:'"We\'ll be playing for it in January. Mark it down."' }),
          O('Ask for patience','Talk process', { good:{conf:0,resp:1,fans:0}, quote:'"Good programs are built, not bought. I need time and trust."' }),
          O('Ask for facility money','Make the case', { risky:true, land:0.55, good:{conf:3,resp:2,fans:0}, bad:{conf:0,resp:-4,fans:0}, quote:'"If you want to win like the big boys, we have to build like the big boys."' })
        ] };
    } },
    { id:'suspension', private:true, modes:['coach'], when:'pre', w:3, ok:(c)=>c.big, build(ctx){
      return { tag:'Head coach\'s office', speaker:CAST.reporter, ask:`Your starting corner got flagged for a team violation the night before {oppn}. The whole building is waiting to see what you do.`,
        opts:[
          O('Suspend him','Team rules apply', { good:{conf:-2,resp:3,fans:0}, mod:{team:-2}, quote:'"Rules are rules. He sits."' }),
          O('Play him, handle it Monday','Big game, big stakes', { risky:true, land:0.5, good:{conf:2,resp:-1,fans:2}, bad:{conf:-3,resp:-6,fans:-2}, mod:{team:1}, quote:'"He plays. We\'ll deal with it in-house on Monday."' }),
          O('Half the game','Split the difference', { good:{conf:0,resp:1,fans:0}, mod:{team:-1}, quote:'"First half on the bench. Then he earns the rest."' })
        ] };
    } },
    { id:'rivaltrash', modes:['coach'], when:'pre', w:8, ok:(c)=>c.g.kind==='rival', build(ctx){
      return { tag:'Radio row', speaker:CAST.analyst, ask:`The {rival} head coach told a morning show that {school} "doesn't belong on the same field." Every mic in the state wants your reaction.`,
        opts:[
          O('Ignore it','Say nothing', { good:{conf:0,resp:1,fans:0}, quote:'"No comment. We\'ll answer Saturday."' }),
          O('Fire back','Give them a line', { risky:true, land:0.5, good:{conf:3,resp:0,fans:6}, bad:{conf:-2,resp:-4,fans:-2}, quote:'"He\'ll have plenty of time to figure out who belongs where, right after the game."' })
        ] };
    } },
    { id:'speech', private:true, modes:['coach'], when:'pre', w:5, ok:(c)=>c.big, build(ctx){
      return { tag:'Locker room', speaker:CAST.reporter, ask:`The locker room is waiting on you before {oppn}. It's the one speech everyone's going to remember, good or bad.`,
        opts:[
          O('Fire them up','Turn up the heat', { risky:true, land:0.55, good:{conf:4,resp:0,fans:0}, bad:{conf:-3,resp:0,fans:0}, mod:{team:3}, badMod:{team:-3}, quote:'"Nobody in this building blinks tonight. Nobody. Let\'s GO!"' }),
          O('Stay steady','Trust the prep', { good:{conf:1,resp:1,fans:0}, mod:{team:1}, quote:'"You know the plan. Do your job, trust the guy next to you."' }),
          O('Read the letter','A message from a captain', { good:{conf:2,resp:1,fans:0}, mod:{team:1}, quote:'"I want to read you something from a guy who sat in that seat."' })
        ] };
    } },
    { id:'hotseat', private:true, modes:['coach'], when:'post', w:6, ok:()=>C.season.streak<=-2 || C.meters.resp<35, build(ctx){
      return { tag:'Athletic director', speaker:{name:'Marlene Osei',role:'Athletic director',outlet:C.school.place}, ask:`The AD's office called. "Come see me." The message on your phone doesn't say why, but everyone can guess.`,
        opts:[
          O('Show her the plan','Bring the binder', { good:{conf:0,resp:4,fans:0}, quote:'"Here\'s what I see, here\'s what we\'re fixing, and here\'s how we\'ll know it\'s working."' }),
          O('Demand backing','Put your name on it', { risky:true, land:0.35, good:{conf:2,resp:5,fans:0}, bad:{conf:-3,resp:-8,fans:0}, quote:'"If I don\'t have your full support, I don\'t want the job."' }),
          O('Restructure the staff','Offer to make changes', { good:{conf:-1,resp:2,fans:0}, quote:'"I\'ll make changes. You\'ll have names on your desk by Friday."' })
        ] };
    } },
    { id:'collective', modes:['coach'], when:'post', w:2, ok:()=>C.meters.fans>=40, build(ctx){
      return { tag:'The collective', speaker:{name:'Dolph Renner',role:'Collective president',outlet:C.school.place}, ask:`A collective is offering a big splash of NIL money for a transfer quarterback. The locker room has opinions.`,
        opts:[
          O('Take the money','Bring in the star', { risky:true, land:0.6, good:{conf:2,resp:1,fans:5}, bad:{conf:-4,resp:-2,fans:2}, quote:'"We\'re in. Get him on a plane."' }),
          O('Build through the roster','Trust your guys', { good:{conf:2,resp:0,fans:0}, quote:'"Our guys are earning it. We ride with them."' })
        ] };
    } },
    { id:'recruit', modes:['coach'], when:'post', w:2, ok:()=>true, build(ctx){
      return { tag:'Recruiting', speaker:CAST.analyst, ask:`A five-star wide receiver is wavering between {school} and {rival}. His family wants to hear from you tonight.`,
        opts:[
          O('Drive to his house','Make the personal visit', { good:{conf:0,resp:1,fans:1}, prog:{class:1}, quote:'"I\'m in the driveway. Can I come in?"' }),
          O('Promise early playing time','Guarantee snaps', { risky:true, land:0.5, good:{conf:0,resp:0,fans:3}, bad:{conf:-3,resp:-1,fans:0}, prog:{class:2}, badProg:{class:0}, quote:'"He\'ll be on the field as a freshman. You have my word."' })
        ] };
    } },
    { id:'donor', private:true, modes:['coach'], when:'pre', w:2.5, ok:()=>C.season.idx>=1, build(ctx){
      return { tag:'Donor call', speaker:{name:'Walt Pruitt',role:'Booster club chair',outlet:C.school.place}, ask:`Your single biggest donor calls personally with "a suggestion" about who should be starting ahead of {oppn}.`,
        opts:[
          O('Hear him out, decide yourself','Stay polite, stay in charge', { good:{conf:1,resp:3,fans:0}, quote:'"I appreciate the call. The depth chart is mine to set."' }),
          O('Shut it down','Draw the line now', { risky:true, land:0.5, good:{conf:3,resp:1,fans:0}, bad:{conf:-1,resp:-4,fans:0}, quote:'"With respect, that\'s not how this program runs. Ever."' })
        ] };
    } },
    { id:'assistantpoach', modes:['coach'], when:'post', w:2, ok:()=>C.season.idx>=2, build(ctx){
      return { tag:'Staff room', speaker:CAST.beat, ask:`{rival} just offered your recruiting coordinator more money and a bigger title. He hasn't said no.`,
        opts:[
          O('Counter the offer','Keep him in the building', { risky:true, land:0.55, good:{conf:1,resp:2,fans:0}, bad:{conf:-2,resp:-3,fans:0}, quote:'"We\'ll match it and then some. You\'re part of what we\'re building."' }),
          O('Let him go','Wish him well', { good:{conf:0,resp:1,fans:0}, quote:'"No hard feelings. Go get that title."' })
        ] };
    } },
    { id:'mediaday', modes:['coach'], when:'pre', w:3, ok:(c)=>c.big, build(ctx){
      return { tag:'Media day', speaker:CAST.anchor, ask:`Every camera in the conference is on the podium ahead of {oppn}. National TV wants a soundbite.`,
        opts:[
          O('Stay measured','Respect the opponent', { good:{conf:0,resp:2,fans:0}, quote:'"They\'re well-coached and we\'re not taking anything for granted."' }),
          O('Make a prediction','Give them the headline', { risky:true, land:0.5, good:{conf:3,resp:0,fans:6}, bad:{conf:-2,resp:-4,fans:-2}, quote:'"We didn\'t come here to keep it close. We came here to win it."' })
        ] };
    } },
    { id:'walkonstory', modes:['coach'], when:'post', w:2, ok:()=>true, build(ctx){
      return { tag:'Community', speaker:CAST.reporter, ask:`A walk-on who made the two-deep the hard way has a story the local news wants to tell — practice-squad grinder to real contributor.`,
        opts:[
          O('Put him in front of the cameras','Let the story breathe', { good:{conf:0,resp:1,fans:4}, quote:'"Go tell it. He\'s earned every word of it."' }),
          O('Keep it low-key','Team over individual stories', { good:{conf:1,resp:2,fans:0}, quote:'"We appreciate it, but we\'d rather talk about the team."' })
        ] };
    } },
    { id:'playcalling', modes:['coach'], when:'post', w:2.5, ok:()=>C.season.streak<0, build(ctx){
      return { tag:'Talk radio', speaker:CAST.analyst, ask:`The fan base is loud about the play-calling after that one. Every call-in show wants to relitigate the fourth quarter.`,
        opts:[
          O('Defend the staff','Back your coordinators publicly', { good:{conf:1,resp:2,fans:-1}, quote:'"We call what we practice. That\'s not changing because of one bad week."' }),
          O('Admit it needs work','Give the fans something honest', { risky:true, land:0.55, good:{conf:0,resp:3,fans:3}, bad:{conf:-2,resp:-2,fans:-2}, quote:'"We didn\'t put our guys in the best spots. That\'s on the staff, and we\'ll fix it."' })
        ] };
    } },
    { id:'campusvisit', modes:['coach'], when:'pre', w:2, ok:()=>true, build(ctx){
      return { tag:'Recruiting', speaker:CAST.analyst, ask:`A top target is on an official visit this weekend, timed for {oppn}. His whole family is in the stands.`,
        opts:[
          O('Give him the full experience','Personal attention all weekend', { good:{conf:0,resp:1,fans:1}, prog:{class:1}, quote:'"He\'s not just a visitor. He\'s family this weekend."' }),
          O('Let the game speak for itself','No extra show', { good:{conf:1,resp:1,fans:0}, quote:'"We don\'t recruit with smoke and mirrors. We recruit with what happens on the field."' })
        ] };
    } },
    { id:'alumnigame', private:true, modes:['coach'], when:'pre', w:2, ok:()=>C.season.idx>=1, build(ctx){
      return { tag:'Alumni weekend', speaker:CAST.beat, ask:`Alumni weekend lands the same week as {oppn}. Former players want time with the current team.`,
        opts:[
          O('Open the building to them','Let the history in', { good:{conf:1,resp:2,fans:2}, quote:'"Come see what you built. The door\'s open."' }),
          O('Keep the week normal','Protect the routine', { good:{conf:0,resp:1,fans:0}, quote:'"We love our alumni. This week, we need to be a football team first."' })
        ] };
    } }
  ];

  // ---------- pricing ----------
  // Authors write the DIRECTION of a risky answer (which meters it moves). The size is set here, relative to the best
  // safe answer in the same scene, so that a risky answer is slightly worse than safe when your standing is average,
  // clearly better when it is strong (high Confidence and Respect, a winning streak) and clearly worse when it is weak.
  // Value is in "meter points": Confidence counts double because it moves results the most.
  const MW = { conf:2, resp:1, fans:1 };
  const mval = d => d ? (d.conf||0)*MW.conf + (d.resp||0)*MW.resp + (d.fans||0)*MW.fans : 0;
  const modVal = m => m ? (m.q||0)*3 + (m.team||0)*3 : 0;
  const PRICE = { spread:18.75, edge:-1 };       // good minus bad, and expected value vs. the best safe answer at land = base odds
  function scaleTo(d, target){
    const v = mval(d); if(!v) return d;
    const k = target/v, out = {};
    ['conf','resp','fans'].forEach(m=>{ out[m] = Math.round((d[m]||0)*k); });
    return out;
  }
  function priceScene(scene){
    const safe = scene.opts.filter(o=>!o.risky).map(o=>mval(o.good)+modVal(o.mod));
    const S = safe.length ? Math.max.apply(null, safe) : 0;
    scene.opts.forEach(o=>{
      if(!o.risky) return;
      const b = Math.min(-2, S + PRICE.edge - o.land*PRICE.spread), g = b + PRICE.spread;
      o.good = scaleTo(o.good, g - modVal(o.mod));
      o.bad = scaleTo(o.bad, b - modVal(o.badMod||o.mod));
    });
    return scene;
  }
  function oddsWord(p){ return p<0.35 ? 'long shot' : p<0.5 ? 'uphill' : p<0.62 ? 'even' : 'likely'; }

  // ---------- picking + resolving ----------
  function pickEvent(when, ctx, force){
    const pool = EVENTS.filter(e=>e.id!=='presser' && e.when===when && (!e.modes||e.modes.includes(C.mode)) && !C.recentEv.includes(e.id) && e.ok(ctx));
    if(!pool.length) return null;
    const total = pool.reduce((s,e)=>s+e.w,0);
    if(!force){ const chanceAny = when==='pre' ? 0.48 : 0.40; if(Math.random() > chanceAny + Math.min(0.3, total*0.02)) return null; }
    let r = Math.random()*total;
    for(const e of pool){ if(r < e.w) return e; r -= e.w; }
    return pool[0];
  }
  function landProb(opt){
    const s = C.season;
    let p = opt.land + (bgOf()==='chip' ? 0.05 : 0) + (C.meters.conf-50)*0.004 + (C.meters.resp-50)*0.003 + (s?Math.max(-0.08,Math.min(0.08,s.streak*0.02)):0);
    return U.clamp(p, 0.12, 0.88);
  }
  function resolveOption(scene, i, ctx){
    const opt = scene.opts[i];
    let landed = true, eff = opt.good, mod = opt.mod;
    if(opt.risky){
      landed = Math.random() < landProb(opt);
      eff = landed ? opt.good : opt.bad; mod = landed ? opt.mod : (opt.badMod||opt.mod);
    }
    const deltas = bump(eff);
    if(mod) C.mod = Object.assign(C.mod||{}, mod);
    if(opt.flag && (!opt.risky || !landed)) C.flags[opt.flag] = true;
    if(opt.prog && C.co){ const p = (opt.risky&&!landed)?(opt.badProg||{class:0}):opt.prog; C.co.class += (p.class||0); }
    const sum = deltas.conf+deltas.resp+deltas.fans;
    const tone = opt.risky ? (landed?'good':'bad') : (sum>=3?'good':sum<=-2?'bad':'safe');
    return { opt, landed, deltas, tone };
  }
  function buildReaction(scene, r, ctx){
    const pv = !!scene.private;
    const topic = pv ? (r.tone==='good' ? INSIDE_GOOD : r.tone==='bad' ? INSIDE_BAD : INSIDE_SAFE) : (r.tone==='good' ? POST_GOOD : r.tone==='bad' ? POST_BAD : POST_SAFE);
    const posts = U.shuffle(topic).slice(0,2).map((t,i)=>({ who: pv ? U.pick(INSIDERS) : FAN_HANDLES[U.rint(0,FAN_HANDLES.length-1)], text:fill(t,ctx), likes:U.rint(40,900) }));
    const head = fill(U.pick(pv ? (r.tone==='good'?HEAD_IN_GOOD:r.tone==='bad'?HEAD_IN_BAD:HEAD_IN_SAFE) : (r.tone==='good'?HEAD_GOOD:r.tone==='bad'?HEAD_BAD:HEAD_SAFE)), ctx);
    const rival = (r.tone==='bad' || ctx.g.kind==='rival') && Math.random()<0.7 ? { who: ctx.opp? ctx.opp.place+' star':'A rival', text: fill(U.pick(r.tone==='bad'?RIVAL_BAD:RIVAL_GOOD), ctx) } : null;
    const line = r.opt.risky
      ? (r.landed ? (isP()?'That\'s the kind of answer that moves a locker room — and a fan base.':'Bold words, and you looked ready to earn them. The room believes you.')
                  : (isP()?'You can\'t spend that kind of confidence when the room hasn\'t seen it yet.':'You wrote a check the room isn\'t sure you can cash.'))
      : (r.tone==='good' ? 'Nobody\'s going to clip that for social media, and that is exactly why it works.' : 'Careful, measured. It won\'t make a headline, and that\'s fine.');
    return { banner: r.opt.risky ? (r.landed?'IT LANDED':'IT BACKFIRED') : null, tone:r.tone, speaker:CAST.analyst, line, posts, rival, head };
  }

  // ---------- things that just happen (no decision, they go by) ----------
  const PASSIVE = [
    { modes:['player'], ok:()=>C.season.streak>=1, d:{fans:1,resp:0}, text:'{home} hangs a banner for {n} on Main Street.' },
    { modes:['player'], ok:()=>true, d:{conf:1}, text:'A voicemail from back in {home}: the whole town is watching {n} on Saturdays.' },
    { modes:['player'], ok:()=>C.meters.fans>=45, d:{fans:1}, text:'The barber shop in {home} is selling {n} shirts.' },
    { modes:['coach'], ok:()=>true, d:{fans:1}, text:'A local paper in {home} runs a "hometown coach makes good" feature.' },
    { modes:['player'], ok:()=>C.season.streak>=2, d:{conf:1,fans:1}, text:'The student section starts a {n} chant after the win.' },
    { modes:['player'], ok:()=>C.season.streak<=-2, d:{conf:-1}, text:'A rough week of practice leaves {n} second-guessing things.' },
    { modes:['player'], ok:()=>true, d:{resp:1}, text:'Coach Halloran singles {n} out in film session for the preparation.' },
    { modes:['player'], ok:()=>true, d:{fans:1,resp:1}, text:'A local paper runs a profile on {n}\'s work ethic.' },
    { modes:['player'], ok:()=>true, d:{fans:2}, text:'An old highlight of {n} goes viral again.' },
    { modes:['player'], ok:()=>C.meters.resp>=55, d:{resp:2}, text:'Teammates vote {n} a game-day captain.' },
    { modes:['player'], ok:()=>true, d:{conf:1,fans:1}, text:'A five-star recruit says he wants to play alongside {n}.' },
    { modes:['player'], ok:()=>true, d:{conf:-1,fans:1}, text:'A hot-take show calls {n} overrated. The clip gets shared plenty.' },
    { modes:['player'], ok:()=>C.season.streak<0, d:{fans:-1}, text:'Fans on the message boards start asking for a change at the position.' },
    { modes:['coach'], ok:()=>C.season.streak>=2, d:{fans:2}, text:'Ticket sales surge as the winning streak grows.' },
    { modes:['coach'], ok:()=>true, d:{resp:1}, text:'The booster newsletter praises the staff\'s game-week preparation.' },
    { modes:['coach'], ok:()=>true, d:{conf:-1}, text:'A grumbling assistant makes the rounds. The staff huddles up.' },
    { modes:['coach'], ok:()=>C.season.streak<=-2, d:{resp:-1,fans:-1}, text:'A local radio host calls for a change at the top.' },
    { modes:['coach'], ok:()=>true, d:{fans:1}, text:'A big recruit posts a photo in {school} gear.' },
    { modes:['coach'], ok:()=>true, d:{resp:1}, text:'The athletic director is spotted smiling at practice.' },
    { modes:['coach'], ok:()=>true, d:{conf:1}, text:'Senior leaders give the freshmen a speech. The room tightens up.' },
    { modes:['coach'], ok:()=>true, d:{conf:-1}, text:'The injury bug hits the depth chart and the staff reshuffles.' },
    { modes:['coach'], ok:()=>true, d:{fans:1,resp:1}, text:'A former player praises the program on a national broadcast.' }
  ];
  function pickPassive(ctx){
    if(Math.random() > 0.5) return null;
    const pool = PASSIVE.filter(e=>e.modes.includes(C.mode) && e.ok());
    if(!pool.length) return null;
    const e = U.pick(pool), d = bump(e.d), sum = d.conf+d.resp+d.fans;
    pushFeed(fill(e.text, ctx), sum>0?'good':sum<0?'bad':'');
    return { txt:fill(e.text, ctx), tone:sum>0?'good':sum<0?'bad':'', d };
  }
