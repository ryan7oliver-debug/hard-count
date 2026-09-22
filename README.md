# Hard Count

College-football daily draft-and-sim game plus two season modes (Five-Star = player career, Hot Seat = coach dynasty). Single-file HTML game.

Published prototype (private Claude Artifact): https://claude.ai/artifact/FPMnbWpNS7pdEXU9ZbDirw (v28)

## Layout
- `run-the-rivalry.html` — the built game. This is the file that gets published.
- `build_all.py` — rebuilds it: `build_data.py` (runs `build_logic.py` → `build_engine.py` from `base.html` first) → `build_theme.py` → `build_career.py`. Verified to reproduce the checked-in HTML byte-for-byte.
- Data: `more_players.py`, `new_qb/rb/wr/ol/edge/db/lb.py`, `new_coaches.py`, `more_coaches.py`, `schools_existing.py`, `school_colors.py`, `more_colors.py`.
- Code: `engine_*.js` (canvas field), `logic_*.js` (sim/odds), `career_*.js` + `career.css` (career modes), `theme.css` + `theme_body.html` (locker-room look).
- `serve.py` — local server on 127.0.0.1:8765 for testing.
- `history/` — pre-git snapshots of v23–v28.
- `ANALYSIS.md` — the 2026-09-21 product/tech/business review and roadmap.
- `DESIGN.md` — the locked visual system (materials, color, type, what we avoid). Read it before adding a screen.
- `logic_d.js` — daily hooks: one official run a day, seeded dice, streak.
- `avatar.js` — the character file for Five-Star and Hot Seat: portrait builder, hometown, number, backgrounds (each a perk and a cost).
- Field visuals upgraded (2026-09-22, user request — "still looks weak compared to the design of the rest of the game"). Sprites (`feSprite` in `engine_b.js`) now carry real team colors, a facemask, a helmet stripe, a jersey number block, a pants stripe, and per-player skin variety, instead of one fixed color pair. Colors come from `sidePalette()` (`engine_a.js`), fed by each real school's accent — the opponent's from `state.team.accent`, your own program's from `state.myAccent` (career only; the daily has none and falls back to a neutral blue, cleared between games so it can't leak a stale program's color in). The field itself gained real end-zone lettering in each team's color (`FE.oppShort`/`FE.myShort`), a faint house-brand ring at midfield, and a more structured stands texture. `feAccent()`, the old CSS-variable-based end-zone tint, was removed — the wash is per-side team color now, not one shared accent.
- Career failure states (2026-09-22): players can now be injured (`rollInjury`/`injuryRisk` in `career_b.js`) — a weekly, position-shaped risk that scales down a little with STA, with minor (1 week), moderate (2-3 weeks) and season-ending tiers; heals over the offseason. Coaches face a league that gets tougher as they win (`programDrift`'s `pressure` term climbs with years and titles) and a coach-attribute influence trimmed from 0.55 to 0.34, plus tighter firing thresholds in `coachOffseason`.
- Opponents are real programs (2026-09-22): the daily's 6 teams and the career's 28-team league (`LEAGUE_DEF` in `career_a.js`) use real school names, mascots and colors. Ratings, targets and every gameplay number are simulated and untouched by the rename — see ANALYSIS.md.
- Position involvement (`ROLE_BY_POS` in `logic_a.js`, `feSprite`'s YOU ring in `engine_b.js`, `youEnt` in `engine_c.js`): every play belongs to you or a teammate. Your position decides which plays you're eligible for; your quality decides how often you get the touch. A play that's yours runs on your build; a play that isn't runs on a flat teammate baseline (`TEAM_Q`). QB is the passer on every pass play; OL blocks every play (no gating). A played game's stat line (`career_b.js`'s `boxToLine`) is built from the real plays, not a random heuristic — only OL still uses the heuristic, since it has no discrete touch to credit.
- Heisman is now a vote, not a bar (2026-09-22): `evaluateAwards` in `career_b.js` used to hand out the trophy the moment your season cleared a score threshold. It's now a `U.chance` roll whose odds rise with how far past the threshold you are (12%-60%) — clearing the bar gets you in the race, it doesn't win it. Career win rate for a top-tier build dropped from ~90-100% to ~55-60%; a good-but-not-maxed build from ~45% to ~16%.
- Real jersey numbers (2026-09-22): every sprite shows an actual 1-2 digit number, front and back (`feJerseyNum`/`feDrawDigits`/`DIGIT_FONT` in `engine_a.js`, wired into `feSprite` in `engine_b.js`) instead of a blank color block, drawn with a 3x5 block-digit font and picked from a real position-appropriate number range; your own player wears the number from character creation.
- Sprite detail pass (2026-09-22, matched to a reference image of pixel-art NFL mascot figures): the facemask is now a solid opaque cage over a real skin-tone face opening instead of translucent bars that muddied into the helmet color; shoulder pad caps, ear holes, glove cuffs and a cleat sole highlight were added (`feSprite`, `engine_b.js`).
- Dev nav gated to local/file origins only (2026-09-22): `initDevPanel()` no longer runs on the published artifact, only on `file://`, `127.0.0.1` or `localhost` (`base.html`). Dead code removed after re-checking against the current source (`ATTR_LABEL`, `SLOT_PAIRS`, `FLAVOR`, `userTeam`, `rankTag`). `aria-live="polite"` added to `#carStage`/`#fieldCaption`.
- Three more daily opponents (2026-09-22): Ohio State, Alabama, Oregon added to `TEAMS` (`base.html`) and `build_logic.py`'s per-team stat patch, 6 → 9. `target`/`allowTarget` measured the same way as the original six — see ANALYSIS.md for a build-pipeline gotcha worth knowing before adding more (`build_data.py` silently re-patches the original six's `target` values after the fact; new teams should be authored with the final number directly).
- Draft tension (2026-09-22): only `PREMIUM_LIMIT` (2) attributes can exceed `PREMIUM_CAP` (85, both in `base.html`); every other slot caps there regardless of what a pulled file shows, shown honestly before you pick (`draftAttribute`, `base.html`; the scouting-sheet rendering that actually ships is `build_theme.py`'s wholesale replacement of `renderPlayerCard()`, not `base.html`'s own copy — the same patch-anchor pattern as `buildRadar`).

## Rebuild and run
    python3 build_all.py
    python3 serve.py     # then open http://127.0.0.1:8765/run-the-rivalry.html

Never edit `run-the-rivalry.html` by hand; edit the source files and rebuild.

## Saves
Careers checkpoint to `localStorage` key `gg.career.v1` at the start of every week, postseason, review, off-season and draft night (`saveCareer` in `career_d.js`). The hub shows a "Career in progress" sheet with Continue / Discard. All storage goes through `store` (`career_a.js`), which never throws and falls back to memory. Test flag `window.__GG_SAVETEST` lets autopilot runs save.

## Tests
`tests/balance.html` loads the built game with seeded random numbers and checks the numbers the design depends on: plans and signature drives pay off only by fit, conservative calls still allow big plays, daily targets match a simulated reference build, the three meters move wins, risky answers are priced against safe ones, and a save round-trips. Run `python3 serve.py`, open `http://127.0.0.1:8765/tests/balance.html`, and wait for the green "All checks passed" banner (about 20 seconds). Run it after any change to `logic_a.js` (`TUNE`), `career_b.js` (meters) or `career_c.js` (event pricing). If a check fails, the row shows what was measured.

## The daily
The first finished run against today's opponent is the official one. It is stored under `gg.daily.v1` (last 60 days) and feeds the day streak; every later run that day is practice. Each drive's dice are seeded from the date, the opponent and the drive number (`seedRng` in `logic_a.js`), so two players who make the same calls get the same game. Career games use ordinary dice.

## Netlify deploy + shared leaderboard
The Claude Artifact publish is still the primary way this ships, but the project can also run on Netlify with a real shared daily leaderboard:
- `public/index.html` is a copy of the built game (`run-the-rivalry.html`), kept in sync automatically by `build_all.py` on every build. Never edit it directly.
- `netlify/functions/submit-score.js` and `leaderboard.js` are two small serverless functions backed by Netlify Blobs — one JSON blob per calendar day, no other database needed.
- `netlify.toml` publishes `public/` and points `functions` at `netlify/functions`. `package.json` declares the one dependency, `@netlify/blobs`.
- The game only *tries* to use these — `showDailyLeaderboard()` in `logic_d.js` wraps every network call in try/catch and hides the leaderboard box on any failure, so the exact same build still works fine with no backend at all (the Claude Artifact, or Netlify before it's connected). Nothing else on the page depends on it.
- It's an honor-system leaderboard by design: no replay validation (a POST with a plausible score is trusted) and no write locking (two simultaneous posts on the same day could rarely clobber each other). Both are named trade-offs for a casual, non-commercial project, not oversights — see ANALYSIS.md if this ever needs to hold up under real traffic.

**One-time setup (needs your own GitHub + Netlify accounts — this is the only manual part):**
1. Push this repo to a GitHub repo you own.
2. On [netlify.com](https://netlify.com), "Add new site" → "Import an existing project" → pick that repo. Netlify reads `netlify.toml` automatically; no build command to configure.
3. In the new site's dashboard: **Integrations → Netlify Blobs** (or it may already be enabled by default on newer accounts) — the functions need this to have anywhere to write.
4. Deploy. Every push to the repo after that redeploys automatically, game and leaderboard together.

