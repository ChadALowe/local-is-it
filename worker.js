// Pendeford Drift: serves the game and runs one shared multiplayer room (a Durable Object) that everyone on the link joins.
// The room also remembers the shared world (parked cars that were pushed or dented) until the last player leaves.
export class Room {
  constructor(state) { this.state = state; }
  async fetch(req) {
    if (req.headers.get('Upgrade') !== 'websocket') return new Response('Expected a WebSocket', { status: 426 });
    const socks = this.state.getWebSockets();
    if (socks.length >= 40) return new Response('Room full', { status: 503 });
    if (!socks.length) await this.state.storage.deleteAll();            // first one in: fresh world
    const { 0: client, 1: server } = new WebSocketPair();
    const id = crypto.randomUUID().slice(0, 8);
    this.state.acceptWebSocket(server);
    server.serializeAttachment({ id, last: null });
    const players = socks.map(w => { try { return w.deserializeAttachment(); } catch (_) { return null; } }).filter(a => a && a.last).map(a => a.last);
    const world = [...(await this.state.storage.list({ prefix: 'w:' })).values()];
    server.send(JSON.stringify({ t: 'hi', id, players, world }));
    return new Response(null, { status: 101, webSocket: client });
  }
  others(ws, out) { for (const w of this.state.getWebSockets()) if (w !== ws) { try { w.send(out); } catch (_) {} } }
  async webSocketMessage(ws, msg) {
    if (typeof msg !== 'string' || msg.length > 6000) return;
    let d; try { d = JSON.parse(msg); } catch (_) { return; }
    const a = ws.deserializeAttachment() || {};
    if (d.t === 's') {                                  // player state: remember the latest and pass it on
      d.id = a.id; if (typeof d.n === 'string') d.n = d.n.slice(0, 20);
      const out = JSON.stringify(d);
      if (out.length < 1900) { a.last = d; ws.serializeAttachment(a); }
      this.others(ws, out);
    } else if (d.t === 'ev') {                          // world events: parked-car dents/poses, hits on other players
      d.id = a.id; this.others(ws, JSON.stringify(d));
      const st = this.state.storage;
      if (d.e === 'dent' && typeof d.k === 'string') {
        const key = 'w:' + d.k, w = (await st.get(key)) || { k: d.k, x: d.x, z: d.z, y: d.y, col: d.col, d: [] };
        w.d.push(d.d); if (w.d.length > 12) w.d.shift(); await st.put(key, w);
      } else if (d.e === 'pk' && Array.isArray(d.l)) {
        for (const q of d.l) { if (!q[4] || typeof q[0] !== 'string') continue;   // only settled positions are kept
          const key = 'w:' + q[0], w = (await st.get(key)) || { k: q[0], x: q[1], z: q[2], y: q[3], col: q[5], d: [] }; w.p = [q[1], q[2], q[3]]; await st.put(key, w); }
      }
    } else if (d.t === 'chat' && typeof d.m === 'string') {
      const out = JSON.stringify({ t: 'chat', id: a.id, n: String(d.n || '').slice(0, 20), m: d.m.slice(0, 140) });
      for (const w of this.state.getWebSockets()) { try { w.send(out); } catch (_) {} }
    }
  }
  bye(ws) {
    const a = (() => { try { return ws.deserializeAttachment(); } catch (_) { return null; } })(); if (!a) return;
    this.others(ws, JSON.stringify({ t: 'bye', id: a.id }));
  }
  webSocketClose(ws) { this.bye(ws); try { ws.close(1000, 'bye'); } catch (_) {} }
  webSocketError(ws) { this.bye(ws); }
}
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === '/ws') return env.ROOM.get(env.ROOM.idFromName('pendeford')).fetch(req);
    return env.ASSETS.fetch(req);
  }
};
