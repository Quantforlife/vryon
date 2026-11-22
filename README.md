# VYRON — official site (Vite + Three.js + GSAP)
## Run
`npm install && npm run dev` (or `./run.sh`) — Vite picks the next free port automatically. `npm run build` → `dist/` (deploy to any static host).
## Update content
Everything editable lives in `src/config/event.js`: date, venue, email, registration URL, socials, sessions, hackathon details, competitions (empty list = section hidden), college logo path.
## Files you must supply
`public/assets/videos/vyron-teaser.mp4` (30 s teaser) · official college logo (`public/assets/branding/`, then set `collegeLogo`) · confirmed event info, speakers, registration URL, contacts, socials.
## Architecture
`src/main.js` loader, teaser, nav, content, scroll · `src/scene/world.js` the 3D world (lazy-loaded chunk, so a 3D failure never blocks the site) · `src/styles/main.css` design tokens + layout.
## 3D scene
Procedural Three.js: twisting tapering glass shaft in 16 segments, 6 leaning ribs, red light rings, spire, instanced city, wet reflective ground, line-segment rain, fog. Camera rides a CatmullRom path driven by scroll progress (smoothed). To swap in a Blender GLB, load it with GLTFLoader inside `createWorld` in place of the `lm` group.
## Fallbacks
No WebGL / context lost / import error → CSS night + CSS rain. Missing video → straight to site. Loader always offers Continue by 6.5 s. Reduced motion → no reveals, no camera easing, static rain. Quality: High / Balanced / Performance (auto-chosen, user-adjustable in menu).
