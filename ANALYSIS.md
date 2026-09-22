# Gridiron Gauntlet — Project Analysis

Read-only review. No code was changed. Reviewed build: **Version 28** (`run-the-rivalry.html`, built from the pipeline in this folder).

## Status update (same day, after the review)

Issues 1, 2 and 3 are done (git repo, career save/resume, safe storage). Issues 4 and 5 were reworked; numbers below are measured with the game's own engine and use the same method as the review.

**Issue 4, plays and signature choices (fixed).** Plans and Attack/Safe no longer add quality. Every call has an aggressiveness that changes the shape of a drive (big plays, turnovers) and pays off by *fit*: how explosive or steady the build is (attributes per position, `STYLE_SETS` in `logic_a.js`) plus how exposed the opponent is (`lean` / `offLean`, shown in the scouting read). At fit 0 every option equals Balanced (calibrated). Measured, 82-OVR QB vs a 70 defense, points per game:
- Plan vs Balanced at fit -1 / 0 / +1: Ball Control **+2.2 / -1.9 / -6.2**; Air Raid **-6.3 / -1.9 / +2.6**. Balanced is right for about |fit| < 0.5; each extreme plan wins at its own extreme.
- Signature drives (all three): Attack vs Safe at fit -1 / 0 / +1: **-2.1 / 0.0 / +2.1** points per game.
- Defense mirrors it (Blitz vs Contain, All-Out Pressure vs Bend, Don't Break).
- Daily targets and the career animated-sim calibration were re-measured.

**Issue 5, consequences (fixed, with one limit).**
- Meters move results more. Wins out of 12, meters pinned, 800 seasons per cell: Confidence 20 to 80 **+1.65** (QB; was +0.6), Fans 10 to 90 **+1.1** (was +0.5), Respect 10 to 90 **+0.7** (was about 0), coach Team belief 20 to 80 **+1.8** (was +1.2). Respect below 25 now gets you benched on quiet weeks.
- Risky answers are priced against the best safe answer in the same scene (`priceScene`, `career_c.js`). All 23 risky options now measure about even with safe at average standing (-1.7 to +0.1), **+1.7 to +5.1 better when Confidence, Respect and streak are high, and -4.5 to -6.3 worse when they are low**. The UI shows the odds ("Risky · likely").
- Field visuals (2026-09-22, user request: "upscale the look of the players and the field, it still looks weak compared to the design of the rest of the game"). [CODE change, no gameplay numbers touched — verified by the full balance suite passing with zero drift.]
  - Sprites: real team colors (jersey/helmet from each school's real accent via a new `sidePalette()`), a facemask (only on the camera-facing side — a facing bug from the first pass, fixed), a helmet center stripe, a chest number block, a pants side stripe, five skin tones cycled per player instead of one fixed tone per side.
  - Field: each end zone is lettered with the real team's short code in their real color (was generic "OPPONENT" / "YOUR END ZONE" text); a faint amber house-brand ring at midfield; the stands textured into rows instead of flat noise, with rare flecks of each team's color.
  - Fixed a real bug found while building this: the end-zone color wash used the CSS `--team-accent` variable (the opponent's color, always, for both end zones) — replaced with the correct per-side real color so your own end zone reads as your team, not theirs.
  - Not done (at the time): the sprites were still simple rect-based pixel art with no literal readable jersey numbers. Fixed in the next visual pass below. The stands are still a background texture, not a stadium bowl.
- Career failure states (2026-09-22, user request — issue 9). [MEASURED, 80 automated coach careers / 60 player careers per point, same method as the original review]:
  - **Player injuries, new mechanic.** A weekly risk while active, shaped by position (RB/EDGE/LB riskiest) and trimmed a little by STA. Minor (55% of injuries, out 1 week), moderate (32%, 2-3 weeks), season-ending (8%). 53% of careers now see at least one injury that costs snaps. Heals fully in the offseason.
  - **Coaches face a tougher league as they win.** Before: 88-95% of coach careers won at least one title, 2.2-2.6 titles/career, only 3-17% ever fired, win rate 73-77%. The league's regression target for every other team used to sit at a flat 72 regardless of the scoreboard, and a coach's own attributes counted for 0.55 of the off/def gap. Now: the non-user league's target climbs up to +34 with years and titles ("prove it and the league answers"), the coach-attribute weight is down to 0.34, and firing thresholds are tighter. Result: fired 31%, titles/career 1.63, any-title 71%, win rate 67.9%. Titles/career is still above my ~0.8-1.3 target — a further pass could tighten it more, but each round has real diminishing returns and risks tipping into "unwinnable" rather than "hard."
  - **Not touched at the time:** Heisman rate was still high (42%). Fixed in a later pass below.
  - Regression checks in `tests/balance.html` (37 total): injury risk shape (durability lowers it) and the arms-race pressure gap between a proven champion and a first-year coach.
- Heisman rate and a second visual pass (2026-09-22, user request: "heisman rate fix that and then also the visuals of the players field and gameplay again ... make this look high level and put together well"). [MEASURED, full automated careers via the real `careerLoop()` — signing day through the draft, same offseason flow a real career runs, not a shortcut]:
  - **Heisman was a bar to clear, not a vote to win — fixed.** `evaluateAwards()` (`career_b.js`) used to hand out the trophy automatically once heiScore ≥ 80, winPct ≥ 0.75, and rank ≤ 12. Clearing that bar now puts you in the race; winning it is a roll (`U.chance`) whose odds rise with how far above the bar your season is (12%-60%), same as a real, contested national vote — a huge season can still lose it, and a good-but-not-legendary one has an honest long-shot chance instead of none or a lock. Measured career rate: the best possible build on the #1 team **100% → 59%**; that same build starting at a more human 75 OVR and growing into it, **89% → 35%**; a good (not maxed) QB on a mid-pack, #14 program, **45% → 16%**; an elite RB on the #1 team, **98.8% → 55.0%**. (Corrected 2026-09-22: the RB figure was first measured with a hand-typed attribute list that didn't match `POSITIONS.RB.attrs` — HAND/PBLK instead of the real REC/PBK, and missing ELU — so it was actually run on a ~79 OVR build, not 85; re-measured against the real `POSITIONS` object.) New regression check in `tests/balance.html` runs real careers end to end and asserts both bands (39 → 40 checks) using QB, which was correct throughout.
  - **Real jersey numbers.** The back-of-jersey number (what's on screen for most of a play, since players mostly face upfield) was a blank colored block; it's now an actual 1-2 digit number, drawn with a compact block-digit font, picked once per player from a position-appropriate real range (QB 1-19, backs/receivers 1-19, tight end 80-89, offensive line 50-79, D-line 50-99, linebacker 1-59, corner/safety 1-39) so the number belongs to the body wearing it. Your own player wears the number you picked at character creation instead of a random one. (`engine_a.js`: `feJerseyNum`, `DIGIT_FONT`, `feDrawDigits`; wired into `feSprite`, `engine_b.js`.)
  - Verified with a full played game (`runAnimated`, not the quick-sim path) to completion, zero console errors; the existing sprite-rendering regression check (builds real play scenarios, asserts nothing throws) still passes unchanged. Balance suite 40/40, and every pre-existing check's measured numbers are unchanged (the Heisman formula's inputs weren't touched, only the last step; the sprite change is purely cosmetic).
  - Not done (at the time): the front chest number stayed a small placeholder block, and the facemask was a couple of translucent dashes. Fixed in the next pass below.
- Third visual pass (2026-09-22, user request: "revisit the game simulation... I want them to look somewhat like this" + a reference image of large, front-facing pixel-art NFL mascot figures with visible facemask grilles, big chest numbers, and defined shoulder pads). [CODE change, no gameplay numbers touched — the sprite is drawn from the same `e.x`/`e.y`/`e.role` data as before, just more shapes on top of it; verified by the balance suite passing with zero drift.]
  - **A real facemask, not translucent dashes.** The prior pass's cage used semi-transparent `rgba` bars stacked over the helmet color, which just muddied into a brownish blob instead of reading as a grille. The face opening is now a solid skin-tone patch (front-facing only — you can't see a face from behind), with an opaque near-black cage of two horizontal and two vertical bars drawn on top. High-contrast, reads clearly even at normal play zoom.
  - **The number is on both sides now**, not just the back — `feDrawDigits` no longer gates on facing direction, since a big readable number was the point of the reference, on every player, every frame.
  - **More shape, matching the reference's silhouette:** a lighter plastic-look cap along the outer edge of each shoulder pad (the existing collar highlight only covered the center); ear holes low on the helmet shell; a light glove cuff where each arm meets the hand; a thin sole highlight on each cleat; a slightly wider dome highlight on the helmet crown.
  - Verified with a full played game to completion, zero console errors, at both normal play zoom and manual close-up inspection (`FE.scale`/`FE.cam` overridden via the dev console — the technique this session uses to inspect sprite detail that's too small to read at the game's own zoom levels). Balance suite 40/40, zero drift.
  - Not done: the helmet shell color is still derived from the team's single accent hex (`sidePalette()`), so it can't independently match a real team's actual helmet-shell color when that differs from the jersey (e.g. a team with a white or silver helmet and a colored jersey) — the data model only carries one accent per school. Widening that would mean a second color field per team in `LEAGUE_DEF`/`TEAMS`, a bigger change not done here.
- Hygiene, three more daily opponents, and draft tension (2026-09-22, user request: "just fix all of it" against three remaining review issues — hygiene/issue 10, the daily loop/issue 6, and the draft/issue 8):
  - **Hygiene (issue 10).** The 🛠 dev nav shipped live for every player; it now only wires up on a local/file origin (`file://`, `127.0.0.1`, `localhost`) — the published artifact never builds it, and automated tests are unaffected since they drive `window.__GG` directly, never the visible panel. Removed confirmed-dead code, re-verified fresh against the current source rather than trusting the original review (`ATTR_LABEL`, `SLOT_PAIRS`, `FLAVOR`, `userTeam`, `rankTag` — each referenced only at its own definition); left `OUTCOME_LABEL` alone since it's actually used (the stale review was wrong there), and left the old `buildRadar()`/`radarPoint` SVG code alone since it's a required patch anchor for `build_theme.py`, not accidental cruft. Added `aria-live="polite"` to `#carStage` and `#fieldCaption`, the two regions that carry the game's actual narrative content turn to turn. Not done: button `type` attributes (no `<form>` on the page, so the default is inert either way — lower value than the size of that diff) and the 29 sub-0.75rem CSS rules.
  - **Three more daily opponents (issue 6, partial).** Only 6 teams meant the week repeated. Added Ohio State (balanced, no clear weakness), Alabama (disciplined trench team), and Oregon (explosive offense, leaky defense — a genuinely new flavor none of the other 6 had). `target`/`allowTarget` were measured the same way the original six were: an 82-OVR reference build's simulated mean score via `simGamePure`, confirmed against each team's *live* runtime value rather than its source-file value — `build_data.py` silently re-patches the original six's `target` numbers downward from what's hand-authored in `base.html` (after the position-involvement rework), a detail that cost real time to find and matters for anyone hand-authoring new teams by eyeballing the source. Still missing from issue 6: a real shared leaderboard, which needs a backend — a hosting/infra decision, not code, and deliberately not started here.
  - **Draft tension (issue 8).** The draft had one dominant strategy — take the biggest number for any open slot, always — because every slot counted equally toward the average and nothing separated a smart pick from a lucky one (measured earlier: greedy 85.7 OVR (SD 1.9) vs. random 79.5, a gap that held regardless of position). Added a hard structural constraint: only `PREMIUM_LIMIT` (2) attributes may exceed `PREMIUM_CAP` (85); every other slot is capped there no matter what a pulled file shows, transparently (a capped file shows the reduced number and a "premium used" note before you pick, never a bait and switch). [MEASURED, 300-400 simulated drafts per strategy, reusing the real `drawPick()`/`draftCfg()`] A naive greedy strategy and a strategy that deliberately reserves both premium slots for a position's signature attributes land at nearly the same overall OVR (~84-85 either way, across cap values 80/82/85 and limits 1/2) — **the cap does not create a large average-power gap between a thoughtful and a careless draft, by design; it creates a real, structural ceiling that didn't exist before** (you can no longer stack 8 elite numbers, mechanically, at any skill level) and puts a genuine choice in front of the player (which 2 attributes are worth going elite for) even though that choice doesn't show up as a big number in a mean-OVR measurement — its payoff is situational, mainly through the existing opponent `favors` matchup bonus. A deeper fix — weighting a position's signature attributes higher in the base quality formula itself (`buildQ`/`attrAvg`) so the choice also moves the average — was considered and set aside: both daily (`logic_a.js`) and career (`career_b.js`) compute quality independently, and reweighting either would mean recalibrating targets, drive odds, and the whole career difficulty curve again, which is a bigger, riskier change than this pass. New regression check in `tests/balance.html`: 60 simulated greedy drafts, asserts the cap holds structurally every time (41 checks total).
  - Verified: balance suite 41/41, zero drift on every pre-existing check (this only touches the draft screen and three new team entries, not any gameplay-quality formula). A capped pick was confirmed visually end to end in the browser — the reduced value displays honestly, locks in correctly, and the locker slot/build OVR update to match.
- Shared daily leaderboard (2026-09-22, user request, after asking for a Netlify-deployable copy and then "how would I make this into a multi user leaderboard type of situation"): the rest of issue 6. This is the first piece of the project that isn't just the one HTML file — it needs somewhere to store scores that every visitor can read and write.
  - **Backend:** two Netlify Functions (`netlify/functions/submit-score.js`, `leaderboard.js`) backed by Netlify Blobs, one JSON blob per calendar day (`{name, score, position, opponent, ts}[]`, sorted, capped at 200). `netlify.toml` publishes `public/` (a copy of the built game, kept in sync automatically — `build_all.py` now copies `run-the-rivalry.html` to `public/index.html` on every build) and points `functions` at `netlify/functions`. `package.json` declares the one dependency (`@netlify/blobs`).
  - **Deliberately not built:** any real anti-cheat. Since the whole game simulates client-side, nothing stops a request from POSTing a fake score directly without playing — this is an honor-system leaderboard, which matches the project's casual, non-commercial posture (see the "why" note in memory). Also not built: any concurrency control — two people posting in the same instant could theoretically clobber each other's write (a plain read-modify-write on the day's blob, not a transaction). Both are named trade-offs, not oversights, for a friends-and-family leaderboard.
  - **Front-end:** `showDailyLeaderboard()` (new, `logic_d.js`) runs from `finishGame()` only on an *official* daily result (never practice, matching the existing official/practice distinction everywhere else in the daily loop). First time, it asks for a display name (stored locally, `gg.leaderboard.name`); after that it silently posts and shows the day's top 10 with your row highlighted. [CODE, no gameplay numbers touched]
  - **Graceful degradation is the important design property here**, since the exact same built HTML file runs on the Claude Artifact (no backend) and on Netlify (with one): every call is wrapped in try/catch, and a failed fetch just hides the leaderboard box rather than erroring or leaving a dead UI element. Verified directly: ran a full game against the local dev server (which has no `/api/*` routes) and confirmed the box never appears for a practice result and, forced into the official path, shows the name prompt, then cleanly disappears after the expected failed POST (a 501 from the plain dev server) — zero console errors, nothing else on the results screen affected.
  - Two new checks in `tests/balance.html` (42 total): the pure, network-free parts (name persistence, HTML-escaping a hostile name in the rendered list, marking the right row as "you"). The live network path (an actual Netlify Blobs round trip) isn't covered by the suite — it can only be verified once this is actually deployed, since the local test harness has no backend to hit.
- Real opponents (2026-09-22, user request): the daily's 6 teams and the career's 28-team league were fictional ("Ironclad State Sentinels"). Replaced with real programs — real names, mascots, colors (28: Ohio State, Oklahoma, Georgia, Oregon, Alabama, Tennessee, Michigan, Penn State, Clemson, Florida, USC, LSU, Notre Dame, Texas, Miami, Auburn, Florida State, Nebraska, Wisconsin, Washington, Texas A&M, Michigan State, Iowa, Colorado, Pittsburgh, Arkansas, Syracuse, West Virginia; daily: Texas, Florida, LSU, Clemson, Notre Dame, Nebraska). Every gameplay number (rating, off/def, target, favors, lean) was kept exactly as tuned, mapped 1:1 by position, so nothing about difficulty or balance moved — confirmed by re-running the full balance suite with zero drift (35/35 pass, same as before the rename). Scouting/flavor text is written as this-season simulated flavor, same convention as EA Sports-style games, not a claim about the real program's real history. Footer disclaimer updated to say the schools are real and the results are simulated. Same legal stance as the real players/coaches: fun project, [ASSUMPTION] the user accepts the risk, revisit before any wider release.
- Film room fix (2026-09-22): pulling a file could come back with every attribute locked, offering no swap at all — the user's report. [MEASURED] At attribute 88 (reachable within 2-3 seasons of training and earlier pulls), 46% of pulls offered zero upgrades; at 94, 88% did. Fixed by retrying a pull up to 20 times for a real upgrade, and only if every retry fails (elite, late-career builds) nudging the single closest-trailing attribute one point past yours, capped at 99. Zero-upgrade pulls measured at 0% from OVR 70 up to the 99 cap; the nudge never exceeds 99 (0/300 at a fully maxed build). Two new checks in tests/balance.html (34 total).
- Position involvement added (2026-09-22): the position you draft now changes what happens on the field, not just which attributes you have. Every play belongs to you or a teammate; your position sets which plays you're eligible for, your quality sets how often you get the touch. Measured (OVR 58 → 96, share of plays credited to you): RB 30% → 68%, WR 15% → 37%, EDGE 21% → 65%, DB 16% → 40%, LB 16% → 60%. QB is the passer on every pass play (unchanged); OL blocks every play (unchanged, no gating — it has no single "touch" to credit). A played game's recap stat line is now built from the real plays instead of a random heuristic; the field animation rings and labels the entity that's "you" on each play. Daily targets and the career animated-sim calibration were re-measured (mean output at OVR 82 shifted since non-featured plays now run on a flat teammate baseline instead of your full build). Known gap: an RB's checkdown-catch credit isn't visually distinguished in the animation (still counted in the box score and captioned), and a QB's own build doesn't influence run-play quality (a deliberate, not accidental, side effect — a great arm doesn't make the run game better).
- Follow-up after a code review: conservative calls (Ball Control, Safe, Contain) used to have exactly zero big plays; they now keep a reduced rate and every style was re-calibrated. A defender's draft hint used the offense's matchup trait. Blackstone Ridge's scouting text contradicted its read. `tests/balance.html` now checks all of the above (17 checks, seeded) and was shown to fail when those bugs are put back.
- Respect spiral fixed. Starting a season at Respect 12: it used to end near 18 with 3.2 benched games and only 8% back above 25; it now ends near 34 with 1.6 benched games and 97% back above 25. A game you sit out no longer costs Respect, weeks played below 35 earn a point back, and the first benching each season opens a scene with the coach (two safe ways back, one risky). Covered by two new checks in `tests/balance.html` (19 total).
- Issue 6 (daily hooks): one official run a day (first finished run vs today's opponent), practice runs after that, a day streak, a hub card that shows today's score, per-drive seeded dice so the same calls give the same game, 9 opponents (was 6), and now an optional shared leaderboard once deployed with a backend (see below). Fully addressed as far as code goes; the leaderboard's actual uptime depends on the user finishing the one-time Netlify+GitHub connection, which is theirs to do.
- Limit: meters saturate late in a career (coach ends near 86/81/95), so the strong-standing pay-off is common. Overall difficulty stayed close to the review's baseline (80 automated careers: player win rate 61.7% vs 62.7%; coach 73.6% vs 75.4%, titles per career 2.45 vs 2.2). Issue 9 (no real failure states) is still open.

## How to read this

Your review template still had its placeholders (`[e.g., ...]`), so I filled them from this session. Correct any that are wrong.

| Field | What I assumed |
|---|---|
| What it is | Browser game: a daily draft-and-sim college football game plus two season modes (Take The Field = player career, Run The Program = coach dynasty) |
| Target player | Right now: you. Intended: fans of daily sports games like RunThe.GG, and college football fans |
| Platform | Web, single HTML file, published as a private Claude Artifact |
| Monetization | None yet. You said you'd handle legal later |
| Stage | Prototype |
| Goal of this review | Decide what to fix next and whether this can grow past a personal project |
| Real data | None. No players, no analytics, no retention numbers |

**Labels used below**
- **[CODE]** read directly from the source.
- **[MEASURED]** I ran the game's own engine in a browser (or a script on its data) and counted. Sample sizes are stated.
- **[OBSERVED]** seen in this session while playing RunThe.GG.
- **[INFERENCE]** my judgment about player behavior or the market. Not tested.
- **[ASSUMPTION]** a number I chose so a calculation can run. Not a benchmark.

Source line references are `file:line`. `run-the-rivalry.html:N` refers to the built file, which is regenerated on every build, so those numbers drift.

---

## 1. Executive summary

1. **The engine and the presentation are ahead of the game.** There is a real drive-by-drive sim, a coherent locker-room look, and a career loop with press rooms and reaction cards. What's missing is meaningful decisions and a reason to come back tomorrow.
2. **The main choices are solved.** Air Raid beats Ball Control by about 12 points and Attack beats Play It Safe on every signature drive [MEASURED]. Most "risky" answers in careers are worse in expectation than the safe one [CODE + MEASURED].
3. **The consequences you asked for are too weak to feel.** Moving Confidence from 20 to 80 is worth about 0.8 wins over 12 games [MEASURED]. Respect does nothing to results in player mode.
4. **Two problems can cost you everything:** no save for careers, and the source lives in a temp folder with no version control [CODE].
5. **You can't monetize or pitch this as built.** It runs on 881 real players and 82 real coaches with estimated stats. It also copies RunThe.GG's core mechanic, and RunThe.GG already ships a college football game [OBSERVED].

---

## 2. Top 5 strengths

1. **A real sim under the spin-to-draft layer.** One state machine (`stepDrive`) drives the animated game, the skip modes, the odds calculator and the career games. RunThe.GG's college football game, as I saw it, resolves a game to a scoreboard, so this is a real difference [CODE, OBSERVED].
2. **The career pacing now works.** Three playable games a year, quiet weeks that pass with news lines, and a few decision scenes with a reaction card (banner, fan posts, rival quote, headline). It's the most memorable part of the game [CODE, plus my playtests].
3. **A strong, consistent identity.** The locker-room treatment is specific and not generic, holds together across all screens, and works at 375px [CODE, checked in a browser pane].
4. **Data breadth that the film-room respin now uses.** 881 players and 82 coaches across seven positions, tinted by school color, so the pool feels like a collection [MEASURED].
5. **A testable engine.** Pure functions, a Monte Carlo odds estimator, and hooks that let me measure it. Dozens of automated career runs (over 50 in the final round) finished with zero uncaught errors [MEASURED].

---

## 3. Top 10 issues (ranked by impact vs. effort)

Order = do these first to last. Impact is what it costs you if left alone. Effort is my estimate for one developer.

### 1. No version control, and the source is in a temp folder — Impact: severe · Effort: low
- [CODE] The project folder has no `.git`, no README, no package file, no tests. It lives in a session scratchpad under `/private/tmp/...`.
- [CODE] The "source" is a chain of six scripts that patch each other's output with exact-string replacements: `build_all.py` → `build_data.py` → `build_logic.py` → `build_engine.py` → `build_theme.py` → `build_career.py`. Any edit to an early stage can make a later `rep_once(...)` assert fail.
- The published artifact is a backup of the built file, but not of the source.
- **Fix:** move to a normal folder, `git init`, commit. Longer term, collapse the pipeline into real modules.

### 2. Careers cannot be saved — Impact: severe · Effort: medium
- [CODE] All career state is one in-memory object: `let C = null;` (`career_b.js:3`). Nothing serializes it. `beginCareer` (`career_d.js:765`) always starts a new one.
- [INFERENCE] A four-season player career or ten-season coach career is tens of minutes to over an hour of clicking (about 28 prompt screens per season in my runs [MEASURED]). A refresh or closed tab loses all of it.
- **Fix:** save `C` (plus `state.avatar`) to storage at each season boundary, offer "Continue career" on the hub. Wrap storage in try/catch (issue 3).

### 3. Storage calls can throw and break screens — Impact: medium · Effort: very low
- [CODE] `localStorage.getItem/setItem` is called with no try/catch at `run-the-rivalry.html:2288, 2292, 2298, 3332, 3336` (record lookups used by the matchup and results screens). Only 2 try blocks exist in the whole 4,000-line script.
- The Artifact runtime notes storage can be empty or throw (private windows, blocked data). If it throws, the preview screen fails to render.
- **Fix:** one `safeStorage` wrapper with a fallback to memory.

### 4. The daily game's main choices have one right answer — Impact: high · Effort: low to medium
- [MEASURED] Points per game, offense, QB build 82 vs a 70 defense, 2,000 games per cell:
  - Ball Control 21.6, Balanced 27.3, Air Raid 34.1 (SD about 10 for each).
  - Chance to beat the 27-point target with an 82 build: **50% Balanced vs 77% Air Raid**. That single click is worth about +8 OVR.
- [MEASURED] Signature drives: Attack beats Play It Safe by **+3.5 to +4.1 points at every build level** (70: 17.2 vs 13.7; 80: 24.9 vs 21.2; 90: 34.6 vs 30.5). The spread is not meaningfully wider for Attack (SD 10.8 vs 10.5), so it is not "boom or bust". It is just better.
- [MEASURED] Defense is the same: All-Out Pressure allows 15.9, Balanced 19.1, "Bend, Don't Break" 22.3. Blitz 17.4 vs Contain 19.3.
- [CODE] Cause: `effQuality` (`run-the-rivalry.html:3110`) gives Attack `+7` quality and extra noise, Safe `-2` and less noise, with no downside model. The three plans differ only by `shift` and `noise`. `PLANS[*].weights` (`:2114-2118`) is defined and never read.
- `autoChoice` (`:3167`) already encodes the "right answer" as `q >= 66 ? attack : safe`.
- **Fix:** give each option a real cost. The sim needs game context (score, clock, field position) so that Safe is correct sometimes. Re-run the same measurement afterward.

### 5. "Consequences" barely change results — Impact: high · Effort: medium
- [MEASURED] Fixed 85-attribute player at a 78-rated program, 400 seasons per cell, meters pinned during games, wins out of 12:
  - Confidence 20 / 50 / 80 → **8.34 / 8.62 / 9.14**.
  - Fans 10 / 90 → **8.44 / 8.89**.
  - Respect 10 / 90 → **8.64 / 8.76** (about zero).
  - Coach mode: Team belief 20 / 80 → 8.37 / 9.30. Fan energy 10 / 90 → 8.70 / 9.10.
- [CODE] Why: Confidence adds `(conf-50)*0.10` to player quality (`career_b.js:62-68`). Fans only add about `±1 pt` of home-field (`career_b.js:85-91`). Player-mode Respect only changes training camp by ±1 (`career_b.js:311-325`). Nothing else reads it.
- [CODE + MEASURED] Risky answers are usually the wrong pick. Across the 20 risky options in `career_c.js` (first-order calc from each option's good/bad deltas and land chance, ignoring temporary modifiers and status flags): **only 3 have a higher expected meter total than the best safe option in the same scene, 1 ties, 16 are lower.** Example: the postgame presser's "Own it" has expected total +0.6 vs +6 for "Give the credit away".
- Net: the player learns quickly to pick safe. The reactions are well written but not felt.
- **Fix:** make meters matter (e.g. Fans → NIL income you spend on something; Respect → snaps, captaincy, benching in player mode) and re-price risky answers so they can be the right call.

### 6. The daily loop is missing what makes daily games stick — Impact: high · Effort: low for the basics, high for leaderboards
- [CODE] No one-attempt rule: `state.attempt` resets on reload (`run-the-rivalry.html:2241, 5075, 5080`).
- [CODE] No streaks and no shared leaderboard. The "rivalry record" is compared to hand-written baselines (`baseRecord`, `recordHolder` at `:1052-1057` and the other five teams), e.g. "held since '91". It is local, and the holder text is fiction.
- [CODE] The sim is unseeded: 63 `Math.random` calls, while the daily only seeds the opponent (`pickTeamForToday`, `:2174`). Two players' scores aren't comparable, and a shared score is just luck plus build.
- [CODE] Only **6 teams** in `TEAMS`, picked by `hash(date) % 6`, so content repeats within a week and the same team can appear two days in a row.
- **Fix:** seed the sim by date + build, add streak and lock, expand the opponent pool, then decide about a backend.

### 7. Real players and coaches block monetization and pitching — Impact: high (business) · Effort: high or a strategy change
- [CODE] `PLAYERS` = 881 real people, `COACHES` = 82 real people, with school, year, tag and eight attribute values that I wrote from memory. They are estimates, not sourced, and not verified.
- I'm not a lawyer. Using real names and career stats in a private game is one thing. Ads, a season pass or a publisher pitch is another.
- RunThe.GG uses real players, cites CollegeFootballData.com, and labels itself an unofficial fan project [OBSERVED]. That does not make it safe for you, but shows what a data pipeline and disclaimer look like.
- **Options:** (a) stay a non-commercial fan project with donations; (b) fictionalize (procedural or era-archetype players) and then monetize; (c) license or source real data properly. You need to pick before spending on business features.

### 8. Draft is nearly solved and the odds panel finishes the job — Impact: medium to high · Effort: medium
- [MEASURED] I simulated 4,000 drafts per row on the actual pool (tier weights 40/32/20/8, 8 picks, 2 re-spins):

| Position | Random picks | Greedy (take best value) | Greedy + re-spin if best < 84 |
|---|---|---|---|
| QB | 80.1 (SD 3.1) | 85.7 (SD 1.9) | 86.8 (SD 1.7) |
| RB | 79.5 (SD 2.7) | 83.4 (SD 2.5) | 84.3 (SD 2.5) |
| EDGE | 82.6 (SD 1.5) | 84.7 (SD 1.3) | 85.3 (SD 1.3) |

  - Outcomes cluster in a 3-to-4 point band around a policy nobody has to learn ("take the biggest number").
  - Attribute values: mean 81.6, SD 7.7; only 1.5% are ≥ 95 and 9% ≥ 90. Tier means run 78.1 (Walk-On) → 81.9 → 84.1 → 85.3 (Heisman), so "Heisman" barely differs from "All-Conference" in stats.
  - Each OVR point moves the win chance about 3 percentage points in the daily (about 3.5–4 near the middle) [MEASURED]. The greedy-vs-random gap of about 5.6 OVR is therefore worth roughly 15–20 points of win chance, while the 12-drive sim's score SD is about 10 points, or about 11 OVR of luck either way.
- [CODE] Position is cosmetic: `buildQ` (`:3101`) averages eight attributes for every position. Nothing about an OL vs a QB changes play, except a small "favors" bonus.
- `renderDraftOdds` shows the exact win chance before kickoff, which invites min-maxing.
- **Fix:** give the draft real tension (budget or costs, chemistry, position-specific play effects) and widen stat spread.

### 9. Career difficulty has almost no failure states — Impact: medium · Effort: medium
- [MEASURED, small sample, rough] 26 automated careers per mode; builds random 74–95 (mean about 84.5); the autopilot picks the first option in every prompt and random scene answers:
  - Player: **54% won the Heisman, 96% went in round 1**, win rate 62.7% including postseason, titles in 27% of careers. The player can't be benched, injured out, or fired.
  - Coach: win rate 75.4%, **2.2 titles per career, 85% won at least one**, only 12% fired.
- Caveat: autopilot behavior isn't a real player, and it takes early-declare / NFL exits, so these are not clean estimates. The direction (too easy) is clear.
- **Fix:** add failure and variance (injuries, benching, transfers, scandals, roster churn), then re-measure.

### 10. Architecture and hygiene will slow every future change — Impact: medium · Effort: low to medium
- [CODE] One 4,056-line IIFE with 195 functions, 59 `innerHTML` assignments and two globals (`state`, `C`). The career code hijacks the daily sim's globals (`state.position/slots/team/plan/draftMode` at `career_d.js:243-252` and `:542`), and the sim reports back through `state.gameHook`, injected by a string replace in `build_career.py`.
- [CODE] Test scaffolding is shipped: `__GG_AUTOPILOT`, `__GG_STOPAT`, `__GG_PLAYBIG` (`career_d.js:5-6, 126`), `window.__GG` assigned three times (`run-the-rivalry.html:3052, 3397, 4943`), and the 🛠 dev panel is on screen for everyone (`:5004-5010`).
- [CODE] Dead code: `PLANS[*].weights`, `ATTR_LABEL`, `SLOT_PAIRS`, `FLAVOR`, `OUTCOME_LABEL`, `rankTag`, `userTeam`, `C.co.contractYrs` (each referenced only at its definition), the whole `screen-legacy-sim` section (`run-the-rivalry.html:987`), and `engine_c.js.bak`.
- [CODE] Naming residue from earlier versions: storage keys `rtr_record_*`, `rtr_recdef_*`, function names like `buildRadar` that no longer draw a radar.
- Also [CODE] a11y and polish gaps: no `aria-live` region (scene changes are silent to screen readers), 35 buttons with no `type`, 29 CSS rules under 0.75rem, no `lang` attribute. Also 12 uses of an SVG-noise background and 8 SVG-noise masks; heavy texture on low-end phones is a performance risk [INFERENCE, untested].

---

## 4. Recommended roadmap

### This week
1. Move the project to a real folder and `git init` (issue 1).
2. Add a safe storage wrapper (issue 3).
3. Hide the dev panel and test hooks behind `?dev` and delete dead code (issue 10).
4. Save and resume a career at each season boundary (issue 2).
5. Fix the dominated choices with the smallest change that creates a real tradeoff, then re-run my exact measurements to prove it (issue 4). Pass condition: neither option beats the other by more than about 1 point at every build level.

### This month
1. **Meters that matter.** Target: Confidence 20→80 worth about 1.5–2 wins; player Respect gating snaps, captaincy and benching; Fans producing a currency. Re-price risky answers so at least half have a positive expected edge in some state (issue 5).
2. **Difficulty and failure states** for careers (issue 9).
3. **Draft tension.** Costs or budget, chemistry, position-specific effects, a wider stat spread (issue 8).
4. **Daily hooks:** seeded sim, one attempt, streaks, share card, more opponents (issue 6).
5. **Instrument it.** Add privacy-light events (screen reached, draft complete, sim finished, share tapped, career season reached, prompt where they quit).
6. **Onboarding.** A 3-step first-run with the vocabulary explained (OVR, tiers, signature drives, target), plus the accessibility items in issue 10.

### Before any launch
1. **Legal path decided** (issue 7). Verify or replace the data. Add ToS, privacy policy, disclaimers.
2. **Backend for leaderboards and accounts** if you want the RunThe.GG-style loop. RunThe.GG gates saves and leaderboards behind a free sign-in [OBSERVED].
3. **Performance pass** on low-end Android and older iPhones for the texture layers and the canvas.
4. **Ten to twenty outside players** and real D1/D7 numbers before any monetization work.

---

## 5. Open questions for real player data

1. Do players who finish a first daily come back the next day? (D1 and D7; nothing in the code tells us.)
2. Where do first-time players stop: hub, preview, draft, sim, results?
3. How many finish the draft with respins unused? Do they understand tiers and the odds panel?
4. What share always picks Air Raid / Attack (I expect nearly everyone [INFERENCE])? Do they notice there is no tradeoff?
5. Which position do players choose? Does anyone pick a defensive position twice?
6. In careers: how many seasons does a typical player complete? At which prompt do they quit? Do they read reaction cards or click through?
7. Do meters change behavior, or do players just pick safe answers?
8. How many pick "Play it" vs "Sim it" on marquee games, and does the postseason pass get used?
9. Would they make an account to save a career or reach a leaderboard?
10. Does the game get shared, and what do people share?

---

## Appendix A — What the project is (Step 1)

**What it does [CODE].** A single-file browser game with three modes on a locker-room-themed hub.
- **Daily Challenge:** pick a position (QB, RB, WR, OL, EDGE, DB, LB), a game plan and a watch speed. Spin and draft eight attributes from real college legends (two re-spins). The sim runs 12 drives with real downs and distance on an animated pixel field. Three "signature drives" give you Attack/Safe (or Blitz/Contain on defense). You beat or fail a target set by an 82-OVR reference build.
- **Take The Field:** a player career of 4–5 seasons: signing day, redshirt or play, 12 games plus conference title, 12-team playoff and bowls, press rooms and off-field scenes, awards, portal, film-room respin, training camp, Draft Night.
- **Run The Program:** a coach dynasty of up to 10 seasons: three job offers, recruiting classes, athletic director reviews, film-room staff swaps, firing and Hall of Fame.

**Core loop.** Draft attributes → play or sim games → see consequences → improve the build. In the career, three playable games a year; the rest sim.

**Tech stack [CODE].** Vanilla HTML/CSS/JS in one file (about 465 KB, 5,093 lines built, script about 393 KB). Canvas for the field (rAF loop), inline SVG for jerseys and icons, Google Fonts (7 families). No framework, no bundler, no runtime dependencies, no backend. Built by a Python pipeline that patches string blocks.

**Uncertain.**
- No README or design doc, so goals are inferred from our conversation.
- I have not run this on a real phone or on production infrastructure.
- I did not verify any real-world facts about players, schools or awards.

## Appendix B — Game design review (Step 2)

**Core loop: engaging?** [INFERENCE + MEASURED] The moment-to-moment sim is watchable (animated plays, camera, skip controls). The interaction is thin: three prompts per 12 drives, and Attack is always right (issue 4). The draft is the most active part, but a greedy pick is nearly optimal (issue 8).

**Onboarding / first session [CODE + INFERENCE].** Hub → intro (a four-step list) → matchup preview → draft → odds panel → sim → result. It is clean and quick (a few minutes), but:
- The preview asks for three choices (position, plan, watch) before the player understands any of them, with jargon (OVR, "favors", tiers, signature drives).
- One dismissible info box is the only explanation of the draft.
- The first result doesn't teach why they won or lost.

**Progression, pacing, difficulty [MEASURED].**
- Daily: difficulty is set by one number (target); win chance moves about 3 percentage points per OVR point; an SD of about 10 points means luck matters roughly as much as build.
- Career: pacing improved (three playable games), but about 28 prompt screens per season remain, and progression is a straight power fantasy (issue 9).
- Pool depth: 66% of players are from 2004 or later; only 17 pre-1960. So "legends across the decades" is really "mostly modern".

**Retention hooks.**
- Present: daily rotating opponent (6 teams), local record, copy-to-clipboard share text, career narrative.
- Missing: streaks, one-attempt rule, global leaderboard, achievements, collection view (players you've used), saves, notifications, seasonal events, social.

**Where players get confused, bored or frustrated [INFERENCE].**
- Confused: "target" and odds; what OVR means; why a position matters.
- Bored: quiet-week sim once it's obvious that safe answers win; repeated 6-team daily rotation; identical reaction copy after a few careers (few variants per scene).
- Frustrated: losing a long career to a refresh; a lopsided loss after a "perfect" draft (SD of about 10 points).

## Appendix C — Code and technical review (Step 3)

**Bugs and fragile logic [CODE].**
- Conference title is decided by rating, not by simulated conference standings; other teams' conference records are never tracked (`career_d.js:318+`, `runPostseason`). You can be conference champion without a real conference race.
- Ranking (`computeRanks`, `career_b.js:94`) is a hand-tuned score of wins, losses, rating and margin; there's no strength-of-schedule or head-to-head.
- The daily and the career share globals; a career's `runAnimated` overwrites `state.slots/position/team`. Returning to the daily afterward works only because the daily draft resets them.
- `escape` is applied inconsistently: `esc()` only escapes `&` and `<`, and some strings (`pushFeed(`${esc(C.name)}...`)`) are escaped twice. This is low risk (self-inflicted, sandboxed), but it will show `&amp;` for names with `&`.
- Time-based pacing uses `sleep()` in several places; the pane can throttle timers when hidden (I hit this while testing).

**Performance risks [INFERENCE, untested].**
- Canvas redraw builds a radial gradient for each visible mud patch (up to about 10) per frame, plus sprites (`engine_a.js`), fine on desktop, unmeasured on low-end phones.
- CSS uses 12 SVG-noise backgrounds, 8 SVG-noise masks and 42 box-shadows; scroll and animation cost on cheap devices is unknown.
- `estimateOdds(400)` runs 400 sims synchronously each time the odds box renders; fine now, worth a worker if the sim grows.

**Architecture [CODE].** Covered in issues 1 and 10. Additional: content (players, coaches, teams, events, text) is embedded in code, so a content update is a code update. There are no tests other than my ad hoc harness.

**Release blockers [CODE].** No save (2), no storage guards (3), test hooks and dev panel exposed (10), unsourced data and legal question (7), no analytics, no privacy policy, no error reporting (0 `console` calls, 2 try blocks).

## Appendix D — Business analysis (Step 4)

**Positioning.**
- **Direct:** RunThe.GG "Perfect Season: College Football" [OBSERVED]: draft six players (2005–2025) under an $11M NIL budget, then 12 games and a 12-team playoff, with chemistry and coach's-take feedback, plus its golf career mode with confidence/respect/popularity scenes. It also has accounts, leaderboards, a season pass (Tour Pass, 60 tiers, free plus paid lane), coins and a shop, an ads-settings link in the footer, and a Ko-fi donation link [OBSERVED].
- **Adjacent (from general knowledge, not verified in this session):** Football GM (free browser franchise sim, deep career), Retro Bowl (mobile pixel football), EA's College Football (licensed console dynasty), and daily-grid style sports games.
- **Your differentiation today [CODE]:** a visible drive-by-drive sim, the "play three games a year" career, media-driven scenes, and a strong art direction. Weakness: the draft mechanic itself is RunThe.GG's, and they already have a college football game and the audience.

**Monetization fit.** No plan yet, and the current design supports none well:
- **Ads:** need repeat sessions per day (daily hooks missing) and clean data rights (issue 7).
- **Season pass / cosmetics:** no economy exists. Fans could become a currency, but the meters don't matter yet (issue 5).
- **Premium or one-time unlock:** hard on the open web; possible for careers if saves and depth exist.
- **Donations:** matches what RunThe.GG does [OBSERVED] and fits a fan project; low revenue.
- Best fit now: **free web game with optional support/donations**, then ads or a small subscription for saved careers only if retention justifies it and the data question is solved.

**Rough unit economics (all [ASSUMPTION]; not benchmarks).**

*Ad-supported*, revenue per daily active user per month = impressions per DAU per day × eCPM ÷ 1,000 × 30:

| Scenario | Impressions/DAU/day | eCPM | $/DAU/month | DAU for $2,000/mo |
|---|---|---|---|---|
| Low | 3 | $4 | $0.36 | ~5,600 |
| Mid | 5 | $8 | $1.20 | ~1,700 |
| High | 8 | $12 | $2.88 | ~700 |

- The game has zero ad slots today, so impressions per DAU is currently 0.
- To hold 1,000 DAU with an assumed average player lifetime of about 6 days (sum of the retention curve), you need about 170 new players a day, or about 5,000 a month. That inflow number is only as good as the assumed lifetime.

*Subscription / pass:* assume MAU = 4 × DAU, 2% convert, $4 a month → 1,000 DAU ≈ 4,000 MAU ≈ 80 payers ≈ $320/mo. Small next to the mid ad case, so a subscription is a supplement.

*Retention you'd want to see to justify building further* (targets, not industry facts): D1 around 30–35%, D7 around 12–15%, D30 around 5%+ for the daily; for careers, most starters reaching season 2. I don't have your numbers, so I can't say if you're above or below.

*Costs:* hosting a static file is near zero. Real costs are your time, a backend if you add leaderboards, legal review, and payment fees (general knowledge: card processors charge a few percent plus a fixed fee; app stores 15–30% if you wrap it).

**Biggest business risks.**
1. **Rights to names, likenesses and stats** (issue 7). Everything monetizable is downstream of this.
2. **Being a derivative of a live competitor** who already has the same audience, accounts and a college football game.
3. **No retention evidence** and no daily hook yet (issue 6).
4. **Solo-dev scope:** the content pipeline (players, teams, scenes) is hand-authored and unverified.

**Go-to-market suggestion for a prototype.**
1. Do not pitch a publisher yet. You have nothing they can measure, and the data question would end the meeting.
2. Fix issues 1–6, add light analytics, and put it in front of 20–50 real players (friends, a college football community you're already part of). Watch D1/D7 and where careers stall.
3. Decide the data path (fictionalize vs. fan project) using what those players say.
4. Only then add ads or a supporter tier, and only if D7 justifies it.

## Appendix E — Method and limits

- Measurements ran in a desktop browser pane against the game's own exposed functions (`newDrive`, `stepDrive`, `newCareer`, `resolveQuick`, and so on). No production instrumentation exists.
- Sim cells: 1,500–3,000 games; career-season cells: 400 seasons; draft policies: 4,000 drafts each on the parsed pool; automated careers: 26 per mode.
- The meter experiments pin meters during games to isolate each effect. Real careers move meters over time, so total swing depends on how a player behaves.
- The risky-vs-safe calculation ignores temporary game modifiers (`mod`) and status flags (hurt, sluggish, sit), which shift some options slightly.
- I did not test on real phones, screen readers or slow networks.
