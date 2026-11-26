# Higher Powers

A painterly tabletop game of divine organization and heavenly bureaucracy for
2–5 players. Three rounds, twelve Angels, and one promotion. Bring a standard
106-tile Rummikub set and racks; print the heavenly paperwork here.

## Run

```sh
bun install
bun run dev
```

- Home: http://127.0.0.1:5198/
- Shared touchscreen tabletop: http://127.0.0.1:5198/tabletop
- Component gallery: http://127.0.0.1:5198/gallery
- Digital component study: http://127.0.0.1:5198/gallery?collection=digital
- Illustrated rulebook: http://127.0.0.1:5198/rules.html
- Print & play: http://127.0.0.1:5198/gallery/print

Built with SvelteKit, TypeScript, and Bun, following the shared-component approach
of Hell’s Bells and the physical print layouts of Pantheon. `bun run check`,
`bun test`, and `bun run build` verify the project. The GitHub workflow builds
the complete static site as a downloadable PR artifact and publishes a retained
GitHub Pages preview at `https://anicolao.github.io/higherpowers/pr<number>/`.
Each PR’s preview URL is listed in its workflow summary.
The workflow does not merge the PR.

Production builds from `main` publish at https://anicolao.github.io/higherpowers/.
Preview builds use their own base path and preserve other previews on `gh-pages`.
Only the trusted `main` publisher deploys the combined Pages site; same-repository
PRs stage their built files and dispatch that publisher. Fork PRs cannot stage
or publish. This follows Hell’s Bells’ retained-preview convention.

The [digital component study](docs/digital-components.md) adds painted soul tiles,
Favor medallions, both Sanctuaries, Purgatory, and an interactive layer inspector.
Its freeform Heaven supports single-click/drag splits, double-tap group selection, drop-to-join,
undo, ordinary-formation legality emblems and completion hints. Matching ranks
or suits snap north/south; the transpose control regroups an aligned stack
into complementary formations and leftover pieces.
Run `bun run review:digital` for its browser checks.

## Shared touchscreen table

Open `/tabletop` on a horizontal touchscreen. Eight positions surround Heaven:
three on each long edge and one on each short edge. Join at any two to five
positions. Tap a free position, choose one of two random Angels, and take that
Angel’s name; no name entry is needed. Once everyone has chosen, touch the central
deck to deal the souls. Play order follows the
occupied positions clockwise. Computers may occupy chosen positions too.
Heaven and its public controls turn toward the current player. With only
long-edge seats occupied it uses the full available width; an occupied short
edge makes it square so every quarter-turn fits. Rack stations stay in place.
Select rack tiles and tap Heaven to place them together, or drag them there.
Undo reverses one rearrangement; Restore Heaven resets the entire uncommitted action.

Place a physical privacy screen over each player's rack area before touching
**Reveal rack**. Racks, bag inspection, and Communion
choices appear inside that player's rotated area. Cover the rack before removing
the physical screen. Racks are covered on reload, tab hiding/window blur, and at
each new round; reveal choices are never stored or sent to Firebase.

The shared browser controls its seated human players and computers. Firebase
stores the same deterministic event log used by personal-screen play, with seat
positions included in the log. The Tabletop menu supports fullscreen and replay
export. `/tabletop?local=1` provides a separate browser-local table for offline
play and UI review. `bun run review:tabletop` checks seating, privacy, rotated
rack interaction, and portrait layout.

## Game Room and tabletop launcher

Both launchers read the existing LauncherUI `Applications/higherpowers` document.
Its `URL` opens `/tabletop/` directly: eight join positions, Angel selection without
names, and the tabletop menu’s Exit action (`window.close()`). Its `WebURL` opens
`/play/` for personal-screen play. `GameroomEnabled: integrated` enables Game Room;
`Hidden: false` keeps the game visible on the tabletop launcher.

Game Room supplies `?launch=create|join&table=CODE&name=NAME`. Higher Powers creates
that eight-character table or waits for its host and joins automatically. Firebase
anonymous Auth identifies each player; names are display preferences and may
repeat. Reopening either invitation resumes the same seat without writing another
event. A different owner cannot take over an existing code. A full or started
lobby rejects new arrivals. Legacy `returnTo` parameters are accepted without
navigation: Game Room stays open in its original tab. Regular sharing still shows
a five-letter invitation code. The protocol manifest is available at both
`/gameroom-launch.json` and `/play/gameroom-launch.json`.

`bun run test:launch` runs independent-browser launch checks against demo Auth,
Firestore, and Realtime Database emulators on this repository’s dedicated ports.
It covers guest-first arrival, duplicate names, invitation reloads, concurrent
joins, collisions, capacity, dealing, alias reloads, and tabletop entry.

`bun run catalogue:register` previews a single-document registration. Add `--apply`
to register after deployment; `--site=https://anicolao.github.io/higherpowers/pr6/`
selects a retained preview while the PR is under review. Omitting `--site` selects
production. The script checks deployed URLs and the matching launch manifest,
backs up the catalogue, uses an update-time precondition, and reads the result
back. Existing titles, visibility, unrelated fields, and other documents are
preserved. No changes to either launcher’s source are needed.

The dedicated gold-and-green catalogue cover can be reviewed at
`/gallery/launchers`. Use `--artwork-only` to update only the shared Icon without
changing either launch destination. Source artwork and the generation prompt
are documented in [the cover notes](docs/art/launcher-cover.md).

## Learned computer players

Practice, friends tables, and shared tabletops offer the installed trained levels.
Choose **Computer difficulty** before adding a computer, or choose **New computers**
in the tabletop menu. The selected level is recorded in the registration event;
existing games without a level retain the original heuristic. New tables default
to standard. Bot calculations run in a worker, cancel obsolete requests, and hand
legal commands back to the same animated, event-sourced game.

The [training notes](docs/rl-training.md) describe the reinforcement-learning
ladder, public-information boundary, frozen models, and independent benchmarks.
`bun run review:bots` checks the browser handoff and reloads; `bun run rl:verify`
reproduces the installed models’ saved benchmarks.

## The tabletop kit

Print one each of **12 Angel cards, 10 Heavenly Decrees, and 5 Final Judgments**.
Every card measures **63 × 88 mm**. Front footers show “Higher Powers” on the
left and a unique category code plus a global set number (1–27) on the right. Category-specific backs conceal identities;
pages alternate fronts and horizontally mirrored backs for long-edge duplex.
The print shop supports A4 and US Letter, full color or low-ink fronts with
grayscale painted backs, collection
filters, fronts/backs separately, and back-alignment offsets.

Table essentials include five Favor tracks, two Sanctuary/Purgatory region mats (so both Sanctuary Angels can play),
and a five-player score ledger. Choose fewer players in the print shop to reduce
track quantities. Bring an opaque bag, coins for Favor, and pencils. Tiles and
racks are deliberately not included in the printable kit.

Ready-made PDFs live in [`static/downloads`](static/downloads). Print at **100% /
actual size**, with browser headers/footers disabled. Enable background graphics
for color, use portrait paper, and test the first front/back pair before cutting.
The special-area mat is used only for the Angel that needs it; Scales commitments
remain separate on their owner’s rack.

## Rules and card text

At game setup, deal two Angels to each player and let them choose one, revealing
choices together. Keep the chosen Angels for all three rounds. Each round, a
player must first meld a complete legal formation entirely from their own hand;
there is no 30-point minimum. They may then extend or rearrange Heaven in that
same Organize action and on later turns.

Jokers already in Heaven may be freely rearranged and given new legal identities;
no matching hand tile or replacement is required. All of Heaven must be legal
when the action ends, and Sanctuary protection still applies. Only an explicit
retrieval power may take a table joker into a hand or Purgatory.

[`HIGHER_POWERS_RULES.md`](HIGHER_POWERS_RULES.md) is authoritative and contains all
confirmed rulings. The two earlier Markdown files are historical inputs.
`bun run catalog` extracts complete Angel, Decree, and Judgment rules into
`src/lib/data/catalog.json`. Every card has `brief` and `detailed` text metadata. The friendly `brief` text
in `src/lib/data/game.ts` is used on card faces and SVG exports; `detailed` comes
from the authoritative Markdown for reference use. Card faces and gallery
inspectors show only the brief text and link to the full rulebook.

`GameCard.svelte` is shared by gallery, teaching examples, and printable sheets.
The rulebook contains five illustrated learning pages followed by the full
authoritative reference, in both A4 and US Letter PDFs.

## Layered artwork

All 27 cards have original, individually generated painterly illustrations.
The palette is cream, ivory, antique gold, and muted blue-grey. Source art is
separate from typography and frames:

- `static/art/source/`: 32 current source PNGs (plus archived variants): 27 foreground illustrations with real
  alpha, one transparent ornamental frame, one painted Heaven backdrop, and
  three distinct, fully painted card backs.
- `static/art/cards/`: aspect-preserving WebP assets used by the shared renderer.
- `static/art/layers/`: 27 self-contained card-front SVGs with named Inkscape
  layers for paper, painted background, transparent illustration, editable native
  text, and frame. Three image-only back SVGs embed the finished paintings.
  Assets and fonts are embedded for independent download. Install Cormorant
  Garamond and Atkinson Hyperlegible for matching text in source editors.
- `static/art/back-prompts.json`: exact prompts for the three painted card backs,
  with no typography or design overlays.
- `static/art/prompts.json`: exact prompts and transparency settings, generated
  with the built-in `image_gen` tool. No API/CLI image-generation fallback used.

Run `bun run art:prepare` after adding source art. With the dev server running,
`bun run art:layers` refreshes the SVG sources. `python3 scripts/bundle-art.py`
packages the 30 SVGs, prompts, and licenses into the gallery’s downloadable ZIP.
Original paintings remain in Git;
the static build omits their large PNG copies, retaining web artwork and layers.
See [`docs/artwork.md`](docs/artwork.md) for editing and license notes.

## Export and visual review

With the dev server running, use `bun run review` to exercise gallery interaction,
check card text overflow, capture desktop/mobile screenshots, and export all nine
PDFs. It uses Playwright’s installed Chromium, or
`PLAYWRIGHT_CHROMIUM_EXECUTABLE`. On macOS it can use an existing Playwright cache.
On a fresh machine, `bunx playwright install chromium` installs the browser.
Set `REVIEW_URL` for another server URL.

`bun run book:export` refreshes just the two rulebook PDFs after rules edits.

`python3 scripts/optimize-pdfs.py` (requires PyMuPDF) compresses PDF color streams
while retaining vector text and alpha masks. This leaves original art untouched.
The committed PDFs are already exported and optimized, so Python and a browser
are unnecessary for normal builds. QA screenshots and machine reports are in
ignored `tmp/qa/` when review runs.

## License

Copyright (c) 2026 Higher Powers contributors. Code, rules, generated artwork,
layered sources, and printable components are distributed under **GPL-3.0-only**;
see [LICENSE](LICENSE). Bundled fonts retain their upstream licenses, reproduced
in `docs/licenses/`. Rummikub is a third-party game; this project supplies an
independent variant’s supplementary components and does not distribute its tiles.

## Digital playtest

[Play Higher Powers](https://anicolao.github.io/higherpowers/play/) at a shared
Firebase table or practice with two computers. Rearrange Heaven directly, drag
souls from your rack, or tap matching suggestions. Other players see live drafts
and drags before the completed action is committed.

See [digital game architecture and development](docs/digital-game.md) for the
Firestore event log, Realtime Database live stream, seeded replay, emulator setup,
access rules, and playtest checks.
