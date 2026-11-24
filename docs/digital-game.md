# Digital Higher Powers

Play at `/play/`. Create a table, invite 2–5 people (or add computers), deal two
Angels to each player, and choose one. The current decree and your Angel’s full
text are available at the table. Rounds, gifts, Favor, scoring and all five Final
Judgments run through the TypeScript engine. The Markdown rulebook remains the
rules authority.

## The table

Heaven occupies a fixed play area beside a left status rail in landscape or below
a top rail in portrait. It never scrolls; the tile plane scales only when needed.
In landscape, the round decree or Final Judgment fills the rail width, with larger
opponents stacked beneath it as illustrated cards, face-down souls, Favor
medallions and parchment score slips (∑). The rail can scroll on short screens.
Your Angel, Favor and score sit together at bottom left, alongside a bottom strip
containing your rack, bag and chronicle. Favor is the single gold medallion; scores
use paper. Opponent tile backs match their actual hand sizes, and the active rack
and Angel glow. Three seals show round progress. Touch the round card to inspect
it. There is no game header, footer, dashboard or dropdown.

Drag one rack soul into Heaven, or tap several and drag any selected soul to move the whole selection as one group. The floating preview shows every selected soul, and one Undo reverses the complete group drop. Selected souls also reorder together within the rack. A refused play explains a pending draw or another Angel’s turn. Reorder on the wooden rack, including between
turns. The two ivory tabs on the rack sort by number (1→13) or colour (four suit symbols). Jokers come last, and Scales commitments stay together in a separate section. Tap matching suggestions beside incomplete formations to fly that physical
soul from your rack into position. First meld a complete formation entirely from
your own hand; then extend or rearrange the table in the same action.

Click or drag a Heaven soul to split before it; double-tap selects its whole group.
Processions magnetize by rank and Choirs by suit. Select a stack and use the
transpose emblem (or T). The small curved-arrow token undoes a rearrangement;
the rewind token restores Heaven to the start of the attempted action.

Touch the **halo** to finish organizing. It glows when the action can be committed;
otherwise its tooltip or a brief cue explains what is still required. Horns show
an illegal Heaven. The **soul bag** begins a draw; touch one of the souls above it
to keep it. Choosing a draw abandons an uncommitted Organize attempt.

Touch your **Angel card** to invoke its gift. Choose targets directly on the table:
Heaven souls for retrieval, complete formations for Sanctuary, another Angel for
Communion, and rack souls followed by another Angel for Banishment. Calling offers
numbered soul tiles; Dance offers count tokens. Return Judgment souls to the bag.
Foretelling displays up to eight souls immediately. Zeal is invoked from its Angel
after a turn, or passed with the check seal. A sideways Angel has spent its gift.
Right-click your Angel to inspect its card; Escape dismisses an inspection or
unspent target selection.

Communion turns the chosen opponent’s entire rack face up for its user. Touch a
soul to bring it into Heaven; touch it again to return it. An unplayed opening does
not prevent returning that temporary choice. Sanctuary’s painted ground surrounds
its protected formations. Touch an active Sanctuary Angel to shelter or release a
formation. Occupied Purgatory appears as its painted mat; touch its soul to start
a rescue. Round-three choices use the same objects: another Angel for Shared Sins,
or up to five rack souls followed by the Judgment card for Scales.

The small compass at the lower left opens utility actions: invite, save replay,
rulebook and leave table. Round scores appear on a parchment ledger, with a card
pile to deal the next round. These changes are being iterated locally for approval.

## Two streams, one authority

`games/{id}` in **Firestore** contains only coordination metadata: owner, members,
bots, phase, revision and schema version. `games/{id}/events/{sequence}` is the
append-only durable transcript. A transaction reads the expected revision, appends
one command event, and updates metadata atomically. Concurrent independent choices
retry against a refreshed committed prefix. Commands retain their original turn
token, and event identifiers make retries idempotent. If several tabs finish the
same inspection, an exact matching actor/turn/tile keep already present in the
durable log settles the duplicate without another event. Other stale actions
remain rejected; the client never changes their turn token. Every client reconstructs
state with the same pure reducer and rejects invalid events, unknown versions,
gaps, duplicate IDs, or loss/duplication of any of the 106 souls.

`tables/{id}` in **Realtime Database** carries the live table draft, presence and
a host-maintained membership mirror. Drafts include the actor, committed revision,
turn token, session, sequence, timestamp, tile groups and positions. Pointer moves
publish at most about 15 times/second; a heartbeat refreshes an idle draft every ten
seconds. Rack order, unrevealed hands and private choice selections are absent from
this stream. Once a soul is dragged into Heaven it is visible to everyone, even
while Heaven is illegal. Observers receive its actual position while it is moving.

Clients accept a draft only for the current committed revision and active actor,
with known physical souls and valid coordinates. They ignore expired drafts after
45 seconds. Advancing the durable revision invalidates old drafts; the active
client republishes its arrangement after unrelated rack-order events. Cancel
publishes the committed layout. Reconnect restores the committed state; uncommitted
work can be abandoned safely. An old disconnect cannot erase the next actor’s
work: disconnect cleanup removes only the connection’s presence record, while
drafts expire by timestamp. The latest draft value is overwritten rather than
appended to a second history.

Temporary illegality is permitted **only** in the live stream. It cannot earn
Favor, spend an organizing gift, move the turn, change inventory or score a round.
Communion inspection is a durable separate event because looking spends the gift
even if its selected soul is returned. A pre-gift arrangement records delivery
before Forgiveness or Penance when needed (it may still be temporarily illegal); this also settles Scales credits at the
moment of delivery, permanently.

## Trust and replay

The `/tabletop` route shares one browser among up to five players at eight
physical positions: three per long edge and one per short edge. `create.seat`
marks a shared table, and host-authored `seat` commands add local human actors.
Seat positions persist in the event log; `start` orders occupied positions
clockwise before dealing. New shared tables opt into `create.chooseOnJoin`: each
arrival reserves two distinct seeded Angel options, chooses one in the lobby,
and is identified by that Angel. Starting requires everyone to have chosen and
deals the souls directly. Closing or reloading the chooser preserves the options.
Ordinary tables and earlier shared-table logs retain their original setup.
The room's optional `locals` list grants only the host browser control over those
actors. Other members cannot impersonate them or expand that list. Player order
may change without changing membership or controller sets.

Each local rack and private choice is rendered in its seat's orientation after
an explicit reveal behind a physical screen. Cover state exists only in the
shared browser's UI; reload, window blur, tab hiding, and new rounds cover all
seats. Private bag and Communion choices remain in the screened rack area, and
flights into racks show tile backs. Rack destinations remain hidden until the
flight lands; only then does Heaven rotate to hand over the next turn. Bag inspection choices sit below the
still-visible hand. Tabletop racks shrink their tiles to fit the screened area
instead of scrolling; sorting and hand reflow stay animated in each seat’s local coordinates,
including the north and short-edge racks. Covered
racks retain a destination for every soul, including hands larger than fourteen. A remote personal-screen member's hand stays
covered on the shared table. `/tabletop?local=1` keeps a separate event log in
local storage for offline play; it can be exported and replayed in `/play`.

This is a trusted-client game, following the neighboring projects. Members can
read the full durable transcript, including the seed, hands and private choices;
the normal UI shows only the appropriate player’s private information. There is
no server-side anti-cheat or cryptographic hidden information. Firestore rules
still enforce membership, actor control, host-controlled bots, append-only events
and atomic sequential revisions. Realtime Database enforces the roster mirror and
writer identity; clients additionally check turn/revision against Firestore. The
host needs to be connected when admitting new players to the live channel and to
operate computers. Once admitted, human participants can continue without the
host. Phase and membership authority remain in Firestore.

Schema version 1 fixes FNV-1a/Mulberry32 and Fisher–Yates shuffle order. Random
choices derive from the initial seed, event revision, and named purpose. Reducers
use no wall-clock time or ambient randomness. Table positions and explicit player
choices are recorded commands. Joker identities are resolved deterministically
and shown on the table; explicit faces remain binding when valid.

New events use version 2, which corrects Sanctuary: create it with one formation,
then grow protected formations through extensions and splits. Independent
formations cannot be imported. Organize commands may carry turn-local Sanctuary
arrangements to witness an extension followed by a split. There are no permanent
original-tile tags. Version-1 events retain their previous validation during
replay, so a historical mass-protection move does not break an existing game.

Use **Save replay** to download the versioned transcript. **Open a saved replay**
on the welcome page validates it, reconstructs it, and lets you step through events
from any player’s viewpoint. Production and retained PR previews use the same
schema and Firebase project; deployment paths never enter database keys. Practice
runs the identical reducer locally with two simple computer players.

## Develop and verify

```sh
bun install --frozen-lockfile
bun run emulators          # requires Java 21+, ports below
bun run dev:emulators      # separate terminal; http://127.0.0.1:5198/play
bun run check
bun test                  # engine/component tests; backend tests skip without emulators
bun run test:backend       # starts isolated emulator processes and runs access-rule tests
bun run review:play        # against an already-running emulator-backed dev server
bun run review:digital
bun run review:magnetism
bun run review:fullscreen    # full-screen object interactions, 3/5 seats and responsive sizes
bun run build
```

Auth uses port **19301**, Firestore **18301**, and Realtime Database **19001**.
`VITE_FIREBASE_EMULATORS=true` selects project `demo-higher-powers`; it cannot
accidentally write to production. `REVIEW_URL` selects a different Vite dev-server URL
for the browser checks (these checks use Vite source imports). Stop dev servers before building into `.svelte-kit`.

The committed public SDK configuration points at dedicated Firebase project
`higherpowers-anicolao`. It is used on GitHub Pages including retained `/prN/`
previews. Anonymous sign-in and both database rule sets are deployed there.
No service-account key or administrative credential ships in the client.

Engine tests cover all decree variants, every Angel, opening, turn tokens,
rollback purity, Favor ties, Purgatory, protected Sanctuary, all five Judgments,
empty-bag stalemate, conservation and complete seeded three-round 3–5 player
replays. Emulator tests cover atomic events, competing joins, impersonation,
outsider access, immutable history and the separate live channel. Browser checks
exercise three independent identities, live illegal layouts/restoration, rack
movement/order, matching suggestions, opening commitment, draw choices, reconnect
and mobile layout. Computers use only their own rack and public table; they are
intentionally simple and do not yet choose most Angel gifts.

Joker declarations follow the physical joker when groups split or souls are removed.
Drafts automatically discard orphan declarations and resolve a new legal identity
when a changed formation requires one, preserving existing valid identities. This
also repairs old damaged drafts in place; the reducer still rejects malformed
commands and illegal formations. `bun run review:jokers` checks splitting, moving a
joker out and back, and recovering a damaged draft with the production component.

## Following play

Rack drops use the same row-joining and north/south magnetic placement as souls
already in Heaven. While dragging, a caret previews a join and a translucent
outline previews rank/suit alignment. A complete opening from your rack may align
or join after establishing that opening. The active decree is used for geometry,
including mixed-colour and wrapping Processions and repeated-colour or Mirror
Choirs; poker formations are not treated as Choirs. Protected Sanctuaries remain
untouched, and one Undo reverses the complete rack drop and snap.

Computer deliveries fly from their face-down racks into Heaven. Draws fly from
the bag to their rack without showing the private face; moved public tiles also
animate into their new positions. Further computer actions wait for the landing.
Deals animate from the bag, and reduced-motion preferences skip the flights.
Reloading restores the current table without animating historical moves.

A small parchment chronicle shows completed public actions, powers, Favor gains
and round results. It follows new entries while you are at its bottom, preserves
your place when reading older moves, and rebuilds from the durable transcript on
reload. Private draws and Judgment choices are described without revealing their
contents. Rack sorting is excluded from the log. It is a view of the game events,
not a second mutable history.

`bun run review:snapping` checks actual rack drops against existing Processions,
Choirs, joins and protected regions. `bun run review:computers` checks public and
private tile flights, landing, reload, and chronicle behaviour on desktop/mobile.

Heaven is a fixed, non-scrolling tile plane. It keeps normal tile size while the
layout fits, then scales the entire arrangement to keep every soul visible above
the rack. Pointer coordinates account for the scale; dragging does not change
scale until release. Computer plays choose nearby clear space instead of assigning
each new group another row. Extending an existing group also checks its neighbours.

The Tidy Heaven control slides editable groups upward, then Processions left and
Choirs right, stopping at other groups. Protected Sanctuaries remain stationary
obstacles. Tidy preserves memberships, joker declarations and tile order, and is
one undoable rearrangement. Transpose chooses the closest clear space to its
original stack. Tidy, Transpose, Undo and automatic snap/scale adjustments animate
the physical tiles between their previous and final positions. Reduced-motion
preferences skip these animations. `bun run review:layout` checks animated tidy
and transpose, mobile fitting, scaled dragging and the absence of scrolling.

The game table reserves a status rail on the left in landscape and across the top
in portrait (square screens use the portrait arrangement). It contains the legality
halo, rearrangement tools, table menu, round card, opponents and occupied Purgatories. Heaven has its own remaining rectangle, so the rail does
not obscure tiles. A separate bottom strip groups your Angel, Favor and score at bottom left,
with the bag, chronicle and rack alongside; portrait screens put the rack beneath the other bottom-strip objects. The
rail and compact opponent artifacts adapt to short landscape and narrow portrait
screens. Orientation changes preserve the current arrangement and rack order.

In landscape the round card fills the rail width, with larger opponents stacked
vertically beneath it. The status rail can scroll on shorter screens or with more
opponents; Heaven remains fixed. Portrait keeps the compact top-rail arrangement.
Rack sorts and reorders use keyed tile animations, preserving physical identities
and smoothly carrying each tile from its prior position to its new slot (including
across rows). Reduced-motion preferences skip these transitions.

## Inviting and joining

New online tables have five-letter codes using uppercase letters, excluding I and O. Codes are reserved transactionally and collisions retry.
The lobby displays a large copyable code, a selectable invite URL and Copy invite
link. The code remains visible at the table and opens the invitation dialog.
Guests can type the code (case, spaces and hyphens are tolerated), paste a full
invite link, or follow the link to a name-and-join screen. Existing six- and twelve-character codes and links continue to work. Old tables
receive a stable five-letter alias when a member opens them; the original game
and event stream remain in place. Alias pairs are reserved atomically and cannot
be changed or registered by nonmembers. Members reopen their existing seat on reload.
The native modal table menu stays outside rail clipping; Leave table closes live
subscriptions, clears local table state and returns to the join/create screen.
Leaving the screen does not remove an existing seat from the event transcript.

`bun run review:invites` tests three independent browser identities against the
configured backend: real creation, code/link clipboard contents, manual and pasted
invites, unknown-code recovery, reload, modal bounds in both orientations, Leave,
resume through an existing invite and rejection of a late join after dealing.

The host can deal with 2–5 players, including two humans or one human and one
computer. Add computer remains visible in a human lobby until all five seats are
filled; only the host can use it, and additions stop when Angels are dealt.
`bun run review:lobby` checks two-human and human/computer games, mixed-lobby
additions, host permissions, synchronized rosters, Angel choices and the seat cap.

## Live movement

Rack drag previews are broadcast while the pointer is held, without removing
souls from the acting rack or committing an action. Releasing or cancelling replaces
the preview with the actual draft. Observers also see temporarily illegal Heaven,
ongoing table drags and restores. Sorting an observer's rack does not erase the
acting player's held preview when the committed revision changes.

The live publisher coalesces frames and serializes writes. The newest queued frame
flushes on initial readiness and on reconnection, without requiring another gesture
or waiting for the heartbeat. Failed subscriptions retry. Live timestamps use server
time and are converted to the observer's local clock for expiry checks.
`bun run review:live` exercises both human turns against Firebase, including held
rack/table drags, observer rack reorder/reload, a two-minute clock difference and
an RTDB reconnect with a drag queued while offline (the latter uses the dev SDK).

## Resilient direct play

Rack gestures capture on the stable rack container and listen for release at window
level. Losing tile capture during a render no longer loses the drop; cancelled,
blurred, escaped or missing-release gestures clear their previews and capture state.
A new gesture works without reloading. Human input is not disabled by decorative
landing animations; computer pacing still waits for animations. Tile flights can
overlap and retarget when the rack layout changes instead of cutting each other off.

An inspection containing exactly one soul is kept automatically, including the
last soul in the bag. This records the usual draw and keep events, preserving old
replays. Multiple-soul inspections still allow a deliberate choice. After a turn,
Jegudiel can begin Zeal directly by dragging from the rack into Heaven or drawing
again. End turn saves the unused gift; tapping the Angel is still available.

Completed Processions automatically reorder when their physical souls can form a
legal sequence under the active decree. Already legal groups retain their order;
joker identities are preserved when possible, and invalid memberships remain
invalid. Sorting happens on placement/join, with physical tile animations and one
Undo. Low-end repair suggestions count only tiles already present, so a missing
earlier addition cannot push a later suggestion past the existing tiles.

`bun run review:drag-recovery` forces lost capture, missing releases and blur for
mouse/touch, and verifies a subsequent animated drop. `bun run review:smooth-play`
checks low-end suggestions, automatic single/last-soul draws, direct Zeal plays and
draws, animated out-of-order openings and overlapping draw flights. Its practice
portion also accepts REVIEW_URL for a hosted preview.

Mac pointer movement can carry a zero button mask while a captured drag is still
active. Rack movement does not treat that mask as a release. The explicit pointer
up completes the drop; cancellation, blur, Escape or re-entry after a missing
outside-window release clear an abandoned gesture. The drag recovery review
includes the zero-button ordering observed in native Chrome input.
