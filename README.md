# Pendeford Drift

A free-roam drifting game set in the real streets of Pendeford, Wolverhampton. Single HTML file, no build step. Runs on desktop (keyboard) and mobile (on-screen controls).

The starter car is a 2011 Citroen C1 modelled in Blender and embedded in the page as mesh data (the light 3.4k-triangle version).

## Pendeford Motors: car dealer and garage
On the park edge just up the street from the start (the £ on the minimap) there is a car dealer and a tuning garage.
- **Dealer**: stop on the green SALES bay in front of the showroom (in the car or on foot) and press **E** / tap the button.
  50 cars close to real models, from a Smart ForTwo to a Bugatti Chiron, in 8 categories. Each has its own size, wheels,
  colour and real-world 0-60 and top speed. Buy with the money you earn at the office; sell cars you own for 60% of
  their price plus half what you spent tuning them. Your cars are kept in this browser.
- **Garage**: drive into the TUNING BAY and press **E**. Six upgrades (engine, turbo, brakes, tyres, suspension,
  weight reduction), free resprays in 28 colours and 5 finishes, 8 wheel styles with colours and big-rim option,
  and ride height.
- **B** switches between the cars you own.

The dealer cars are built in code from a few side-profile numbers as one low-poly moulded shell (about 1.5k triangles
with wheels), so they are cheap to draw. Parked cars switch to the full model only within 55 m, and to an
~80-triangle low-poly car beyond that.

Open `index.html` in a browser (it loads three.js from a CDN, so it needs an internet connection).

## Controls
- W / S: gas and brake, A / D: steer
- Space: handbrake, to start a drift
- C: car colour, B: switch between your cars, E: dealer / garage, V: camera, R: reset
- Touch: on-screen buttons

## Map data
Roads, buildings and green areas come from OpenStreetMap, projected to metres around Pendeford and embedded in `index.html`. Building heights and roofs are approximated.

Map data (c) OpenStreetMap contributors, available under the Open Database Licence (ODbL): https://www.openstreetmap.org/copyright

## Multiplayer
Everyone who opens the link joins one shared session. `worker.js` serves the game and runs a Cloudflare
Durable Object room (`/ws` WebSocket) that relays each player's car / on-foot / ragdoll state about 10 times a second.
Config is in `wrangler.jsonc`; deploy with `npx wrangler deploy` (Workers Builds does this on push to `main`).
Press **N** (or tap the "online" pill) to change your name.
