# Hard Count: design system

The look is the **locker room**: a cinder-block wall, steel locker doors, masking-tape labels, photocopied scouting sheets, stenciled jersey numerals. One dark world, committed to. The only place that is not a physical object is the sim field, which is a live pixel-art game board. That contrast is the identity: you stand in the locker room, and the game happens on a screen.

This file is the source of truth. New screens should be built from it, not from taste.

## What we are not

RunThe.GG (checked 2026-09-21): near-black navy ground, neon lime accent, chunky pixel display headings, rounded cards with a green glow, pill chips, gradient buttons, scoreboard-only game presentation. Our rule is to share none of it.

| | RunThe.GG | Hard Count |
|---|---|---|
| Ground | flat navy/black | cinder-block wall with grain |
| Accent | neon lime | amber (`--amber`), used sparingly |
| Display type | pixel font | condensed and stencil sans |
| Containers | rounded glowing cards, pills | steel doors, paper sheets, tape, hard offset shadows |
| Game view | scoreboard | animated pixel field |
| Where pixel type is allowed | headlines | inside the field only |

Guardrail: `tests/balance.html` fails if the shipped page names another game.

## Materials (what things are made of)

| Object | Used for | Rules |
|---|---|---|
| **Locker door** (`.locker`, `.panel`) | Containers for a whole screen or a mode | Steel with vents and scuffs. Big jersey numeral as the graphic. Never nested inside another door. |
| **Scouting sheet** (`.sheet`) | Reading material: tables, briefings, results detail | Photocopy grey, dark ink, typewriter type, a strip of tape on top, hard shadow `5px 6px 0`. |
| **Masking tape** (`.tape`) | Labels and status, one line | Marker handwriting, uppercase (it is a physical label), slightly rotated, torn ends. Sits on the object it names. `align-self:flex-start` inside columns so it never stretches. |
| **Stamp** (`.stamp`) | A verdict on a thing: Official, Practice, Rivalry, win, loss | Double border, stencil, rotated. One per screen. |
| **Scoreboard plate** | The score | Near-black plate, amber numerals. |
| **Jersey** | Attributes and OVR | SVG jersey with the number on it, team color. |
| **Sim-field sprite** | The pixel players (`feSprite`, engine_b.js) | Real team colors via `sidePalette()`: jersey = the school's accent, helmet a shade darker, a center stripe, a pants side-stripe, ear holes, shoulder pad caps, glove cuffs, a cleat sole highlight. A real 1-2 digit jersey numeral in a 3x5 block-digit font (`feDrawDigits`, engine_a.js) on both front and back, position-appropriate (QB 1-19, line 50-79, etc.), not a blank swatch. Front-facing gets a real skin-tone face opening with an opaque near-black facemask cage over it — solid color, not a translucent wash, so it reads at normal play zoom. Never mixed with the locker-room palette — these colors come from the matchup, not from `--amber`/`--brick`.

Corners are square (1 to 3px at most). No glows, no blur, no color-wash gradients; a gradient is allowed only as material shading (sheen, scuffs, wear). Shadows are hard offsets. Roundness only where a real object is round (rivets).

## Color

| Token | Hex | Use |
|---|---|---|
| `--wall` | `#161b1e` | Page ground |
| `--steel` / `--steel-lo` / `--steel-deep` | `#3b454c` / `#262e33` / `#0d1113` | Doors, plates, insets |
| `--chalk` / `--chalk-soft` | `#e8e5d6` / `#adb3b0` | Text on dark |
| `--amber` (`-hi`, `-lo`) | `#e9a51c` | The one accent: buttons, scores, stencil highlights |
| `--brick` (`-hi`) | `#b4402a` | Danger, rivalry, losses, the risky tag |
| `--tape` / `--tape-ink` | `#dbd3b2` / `#1f1c14` | Tape |
| `--sheet` / `--sheet-ink` | `#d8d9cf` / `#1b1e20` | Paper |
| `--green` | `#86b56b` | Wins and gains only. Never decoration. |

Team colors appear on jerseys and as `--team-accent` on the sim screen only.

## Type

| Role | Family | Rules |
|---|---|---|
| Wall headline, locker numerals | Big Shoulders Stencil Display | Stencil gaps get unreadable below about 3rem. Never use it for scores or the wordmark. |
| Wordmark, scores, headings | Big Shoulders Display | Solid, not stencil. |
| Body | Barlow | Sentence case, 65 characters or fewer per line. |
| Paper and typewriter text | Special Elite | Sheets and notes only. |
| Tape | Permanent Marker | One line, short. |
| Small data labels | Barlow Condensed | Tracking allowed. |
| Field only | Press Start 2P | Never outside the sim canvas and its HUD. |

## Layout

- One column, centered, generous top space. A screen is one steel door.
- Mode choice is three lockers in a row (stack on phones). Numbers 1, 5, infinity: daily, career, dynasty.
- Left-aligned reading text. Centered only for a score and its verdict.
- Side gutter at least 16px. Nothing wider than the screen.

## Motion

Almost none. The field animates because it is the game. Everything else moves only in answer to a tap. Respect `prefers-reduced-motion`.

## Voice

Plain and physical. Say what happens: "Continue career", "Practice again", "Discard save". Sentence case for buttons and body. Tape and stamps are uppercase because they are labels. No hype words, no puns on the sport.

## Adding a screen

1. What object is this? A door, a sheet, a plate, a tape label. If it is none of them, it is probably the wrong component.
2. Is amber used once, for the thing that matters?
3. Any pixel type outside the field? Remove it.
4. Any real radius, glow, or decorative gradient? Remove it.
5. Does it match a screenshot of the hub at 375px wide?
