# Launcher cover

The shared `Applications/higherpowers` catalogue Icon uses a dedicated portrait
cover rather than the pale Heaven scenery. Its deep green background and gold
title remain legible on Game Room's 3D box and at tabletop launcher sizes. The
lower edge is dark enough for a white title overlay.

- Full-resolution source: `static/art/source/integrations/higher-powers-cover-v1.png`
- Browser asset: `static/art/integrations/higher-powers-cover-v1.webp` (900 × 1200)
- Local comparison: `/gallery/launchers`
- Generation: built-in image generation, opaque painterly cover, November 2026.

The source is a single raster painting. Existing card artwork, typography layers,
print files, and Heaven backgrounds are independent of this catalogue cover.

To publish only the image reference after deployment, preserve the current game
launch destinations with:

```sh
node scripts/register-catalogue.cjs --artwork-only
node scripts/register-catalogue.cjs --artwork-only --apply
```

Use `--site=https://anicolao.github.io/higherpowers/prN/` to select a deployed
preview's image. The update changes only `Icon`, uses the existing backup and
update-time guard, and verifies the result by reading it back.

## Generation prompt

Use case: ads-marketing. Asset type: finished board-game cover illustration for Higher Powers, shared by a virtual 3D game-box cabinet and a tabletop launcher. Generate a portrait 3:4 cover, flat artwork only, full bleed, no mockup or perspective box. Painterly classical fantasy oils, visible elegant brushwork, luxurious cream and antique gold against rich very dark forest green and muted emerald shadows. The image must read strongly at thumbnail size, never look white or washed out. Main scene: a magnificent androgynous angel in warm ivory robes, sweeping golden feathered wings forming an arch, a luminous small gold halo, hovering protectively above a few tactile ivory Rummikub-style numbered game tiles on a dark green velvet playing surface; subtle heavenly architecture receding into green-black shadow. Strong restrained central warm gold light, deep chromatic shadows, rich textured edges. The angel's beautiful face and wings are a single clear central focal point; keep the angel fully clothed, welcoming and powerful. Foreground game tiles may show just a few crisp standard suit symbols: black spade, red heart, blue diamond, green club, with simple numbered faces. Composition: large central angel occupying middle half, relatively quiet deep green top quarter for highly legible title, dark green lower edge suitable for white launcher UI overlays; preserve central subjects under square thumbnail cropping. Integrated polished book-cover typography at upper center: exactly 'HIGHER' over 'POWERS', large antique-gold classical serif letters, perfectly readable against the very dark green, subtle dimensional gold-leaf finish. No other words, no slogans, no watermark. An understated narrow antique-gold frame safely inset from all edges. Avoid white sky, pastel mist, blank ivory background, excessive pale marble, flat vector art, excessive ornament competing with title. This is premium painterly game cover artwork, not a screenshot, UI, or product photo.
