# Digital components and freeform Heaven

Open `http://127.0.0.1:5198/gallery?collection=digital` with `bun run dev`.
The default view is an unlabelled play surface with live Favor medallions and
available special areas. The gear opens review controls and the layer inspector;
the back arrow returns to the 27-card gallery. Assistive labels remain available.

The renderer follows Pantheon’s independent art/resource overlays and Hell’s
Bells’ reusable painted markers. Rules and manipulation helpers live separately
in `src/lib/tabletop/rearrangement.ts`.

## Moving and rearranging

- Click or drag a soul to split immediately before it. It becomes the leftmost
  soul of the new group. Split again to isolate an individual soul. A click waits
  briefly for a possible second tap; dragging splits immediately.
- Double-click or double-tap to select the whole group. Drag any of its souls to
  move it together, retaining the original grab position. A second press can also
  be held and dragged directly. Click blank Heaven or Escape to clear selection.
- Drop a group beside or between another group’s souls to join them. A live
  insertion caret previews the position. Temporary illegal groups are permitted.
- Command/Control Z undoes a rearrangement. Escape cancels a drag.
- Keyboard users can Shift Enter to split, use arrows to move (Shift for finer
  movement), and Enter to join a nearby group.

An initial pool contains 96 numbered souls and both jokers in legal groups.
The other eight numbered souls are reserved for the separate Sanctuary/Purgatory
fixtures. Initial placement uses the available surface and a readable tile size;
long Processions are divided into legal shorter groups on narrow screens, and
only whole groups that comfortably fit are included. User placements remain
unchanged when the viewport shrinks. The gear’s Refill action resets the study
for the current viewport. No fixed formation rows or rank columns remain.

## North/south magnets and transpose

Bring one Procession just above or below another with matching ranks. A ghost row
previews the snap; matching numbers align vertically when released. Choirs work
the same way by suit. A missing internal suit leaves a real space in an aligned
Choir rather than shifting the other suits into the wrong columns. Existing
formation boundaries remain separate; magnets do not merge rows.

Select an aligned row to highlight its connected stack. The transpose icon below
the halo/horns activates for a stack of two or more rows; `T` does the same thing.
Procession rank columns become Choirs. Choir suit columns become sorted,
consecutive Processions. Duplicate suits are partitioned into complete Choirs
where possible; gaps, duplicate ranks and short remnants remain separate groups
for the existing legality checker and completion hints. No tile is invented,
discarded or duplicated. Inferred joker faces are preserved during the transform.

Output stays clear of unrelated groups, using extra scrollable space if needed.
One undo restores the complete transformation, including the previous viewport.
These interaction helpers live in `src/lib/tabletop/magnetism.ts`; tile offsets
and formation orientation describe the physical arrangement, not a fixed grid.

## Legality and completion hints

This study validates ordinary formations: 3–4 same-rank souls in different suits,
or 3–13 same-suit consecutive ascending souls, without wrapping. Jokers infer a
legal represented position from their current group. Full turn rules, declared
joker identities and active Decree overrides belong to the later game engine.

A painted halo appears in the upper-right corner when every group is legal;
painted horns replace it when any group needs rearrangement. In nearby blank
space, invalid groups show minimal missing ranks or alternative missing suits.
Suggestions are checked completions, preserve the existing tile order, and never
create or claim ownership of tiles. The slash separates alternatives. A split
symbol appears when additions alone cannot repair a group. Suggestions avoid
real tiles, other suggestions and the corner indicator.

## Sources and composition

Six active painted assets were generated with built-in `image_gen`. Original
PNGs are in `static/art/source/digital/`; runtime WebPs and exact prompts are in
`static/art/digital/`. The original tile body is retained alongside its edited
larger-well version. The tile edit prompt is in `tile-well-edit.json`; the halo
and horns prompts are in `legality-prompts.json`. All generated art is GPL-3.0-only.

`bun run art:digital` converts workspace sources. Transparent assets use lossless
WebP with genuine alpha; opaque regions use quality 92 WebP. Original PNGs are
omitted from production builds. Runtime assets do not depend on a generator’s
private output directory or remote images.

| Component | Back to front |
| --- | --- |
| `SoulTile.svelte` | Painted ivory body; live rank/suit or joker/back; selection state |
| `DivineFavor.svelte` | Painted medallion; live value; optional allowance caption |
| `SacredRegion.svelte` | Painted region; live souls; no markup when unavailable |
| `SharedHeaven.svelte` | Table surface; movable groups; join caret and repair hints; halo/horns |

Tiles retain independent `data-layer` elements. The 1:1.43 body uses black spades,
red hearts, blue diamonds and green clubs. The suit well registers near 49.1% of
width and 73.5% of height. Tile numeral ink is centered at (360, 330) in a
720 × 1030 viewBox, slightly below the midpoint between the tile’s top and well.
Favor numeral ink centers at the painted ivory face’s measured (353, 385) in a
720-square viewBox. Shared `InkNumeral.svelte` measures actual ink bounds rather
than font advance widths. The inspector can separate or hide tile layers.

## Verification

`bun test` covers ordinary formations, joker bounds, valid completion
suggestions, splits/joins, inventory identity, comfortable layouts, semantic
magnets, transpose round trips, partial columns and collision-free placement. `bun run review:digital` performs real mouse and touch gestures through
the browser, checks the status emblems and hints, undo, special-area fixtures,
Favor ranking, layer controls, mobile overflow and the original card gallery.
Reports and screenshots go to `tmp/qa/digital/`.

`bun run review:magnetism` exercises actual pointer drags for rank and suit
snaps, transposes four Processions into thirteen Choirs and back, checks keyboard
transpose and atomic undo, and verifies all 98 physical tile IDs survive.
