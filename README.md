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
- **B** switches between the cars you own. Paint can only be changed at the garage.

The dealer cars are built in code from a few side-profile numbers as one low-poly moulded shell (about 1.5k triangles
with wheels), so they are cheap to draw. Parked cars switch to the full model only within 55 m, and to an
~80-triangle low-poly car beyond that.

## Street trade
The trade is shared by everyone online: the room on Cloudflare runs the dealer's prices and the customers, so all
players see the same green houses and race each other to them, and a police raid is announced to everyone.
A dealer in a grey hoodie hangs about in the footpath underpass under the Droveway (black dot on the minimap).
Walk up to him and press **E** to buy weed, speed, ecstasy, ketamine or cocaine (prices change every couple of minutes,
you can carry 30 bags). Houses with a spinning green diamond over the roof (green dots on the minimap) want a set
amount of one thing and pay well over the odds: stop outside and press **E** to sell. Each sale has a small chance a
neighbour calls the police, who take your whole stash and fine you up to £150. Your stash is kept in this browser.

Open `index.html` in a browser (it loads three.js from a CDN, so it needs an internet connection).

## Controls
- W / S: gas and brake, A / D: steer
- Space: handbrake, to start a drift
- B: switch between your cars, H: horn, E: dealer / garage, V: camera, R: reset
- Touch: on-screen buttons

## Map data
Roads, buildings and green areas come from OpenStreetMap, projected to metres around Pendeford and embedded in `index.html`. Building heights and roofs are approximated.

Map data (c) OpenStreetMap contributors, available under the Open Database Licence (ODbL): https://www.openstreetmap.org/copyright

## Streets
Road pieces join with curved corners, footways run round corners and into junctions, dead-end closes finish in turning
heads, and footpaths are Pendeford's red-brown tarmac. Every building has concrete round it; houses have a driveway
(grey concrete or red block paving) and a fenced back garden with a patio, panel fences between neighbours and some sheds.

## Saved progress
Each browser gets a secret 16-character save code. Money, owned cars and upgrades, the stash, best drift, best lap
and name are saved to the multiplayer room's storage on Cloudflare (`p:<code>`) about every 8 seconds and when the
tab is hidden, and loaded again on connect. **💾 Save** shows the code and lets you enter it on another device to
carry on there. The room only clears its world keys (parked cars, toilets, fridge, pool, darts) when it empties;
saves and the leaderboard are never cleared.

## Multiplayer fun
- **Tag** (🏷️ Tag button): everyone online plays. One car is IT and passes it on by bumping another car (no tag-backs
  for 2.5 s). The IT car has a red name tag and a red dot on the minimap. After 3 minutes, least time as IT wins.
  The room runs the game, so it can't get out of sync.
- **Horn**: H (or 📯 on phones). Players nearby hear it, louder the closer they are.
- **Name tags** show what each player is driving, and a 🔥 score floats over anyone who's mid-drift.

## Multiplayer
Everyone who opens the link joins one shared session. `worker.js` serves the game and runs a Cloudflare
Durable Object room (`/ws` WebSocket) that relays each player's car / on-foot / ragdoll state about 10 times a second.
Config is in `wrangler.jsonc`; deploy with `npx wrangler deploy` (Workers Builds does this on push to `main`).
Press **N** (or tap the "online" pill) to change your name.
