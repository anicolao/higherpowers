# Digital Higher Powers

Play at `/play/`. Create a table, invite 3–5 people (or add computers), deal two
Angels to each player, and choose one. The current decree and your Angel’s full
text are available at the table. Rounds, gifts, Favor, scoring and all five Final
Judgments run through the TypeScript engine. The Markdown rulebook remains the
rules authority.

## Moving souls

Drag a rack tile into Heaven, or tap rack tiles and use **Play selected**. Drag
within your rack to reorder it; keyboard arrows also reorder a focused rack tile.
This remains available between turns. First meld a complete formation entirely
from your own hand; after that, the same action can extend and rearrange Heaven.

Click or drag a Heaven tile to split immediately before it. Double-tap selects its
whole group for movement. Matching Processions snap north/south by rank; Choirs
snap by suit. Select a stack and use the transpose control or T. Undo operates on
the uncommitted arrangement. **Restore Heaven** cancels the draft. **Draw** also
abandons it and begins the ordinary draw inspection.

Suggestions beside incomplete formations glow when a matching soul (or joker) is
on your rack. Tapping one moves that physical tile into position and animates it
from the rack. It never creates a tile. Multi-tile repairs can be completed one
suggestion at a time. Suggestions use the active decree; the engine independently
validates the final arrangement.

**Finish organizing** commits the complete action only when its formations,
opening, ownership, gift and delivery requirements are satisfied. Sanctuary
formations carry their owner’s name; only that owner can rearrange them. Purgatory
appears only when occupied. Gifts use a panel to choose their targets. Communion
reveals the entire chosen hand privately to its user; choosing a soul is deliberate.

## Two streams, one authority

`games/{id}` in **Firestore** contains only coordination metadata: owner, members,
bots, phase, revision and schema version. `games/{id}/events/{sequence}` is the
append-only durable transcript. A transaction reads the expected revision, appends
one command event, and updates metadata atomically. Concurrent independent choices
retry against a refreshed committed prefix. Commands retain their original turn
token, and event identifiers make retries idempotent. Every client reconstructs
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
