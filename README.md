# Pendeford Drift

A free-roam drifting game set in the real streets of Pendeford, Wolverhampton. Single HTML file, no build step. Runs on desktop (keyboard) and mobile (on-screen controls).

The car is a 2011 Citroen C1 modelled in Blender and embedded in the page as mesh data.

Open `index.html` in a browser (it loads three.js from a CDN, so it needs an internet connection).

## Controls
- W / S: gas and brake, A / D: steer
- Space: handbrake, to start a drift
- C: car colour, V: camera, R: reset
- Touch: on-screen buttons

## Map data
Roads, buildings and green areas come from OpenStreetMap, projected to metres around Pendeford and embedded in `index.html`. Building heights and roofs are approximated.

Map data (c) OpenStreetMap contributors, available under the Open Database Licence (ODbL): https://www.openstreetmap.org/copyright

## Multiplayer
Everyone who opens the link joins one shared session. `worker.js` serves the game and runs a Cloudflare
Durable Object room (`/ws` WebSocket) that relays each player's car / on-foot / ragdoll state about 10 times a second.
Config is in `wrangler.jsonc`; deploy with `npx wrangler deploy` (Workers Builds does this on push to `main`).
Press **N** (or tap the "online" pill) to change your name.
