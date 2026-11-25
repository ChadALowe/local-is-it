// Pendeford Drift: serves the game and runs one shared multiplayer room (a Durable Object) that everyone on the link joins.
export class Room {
  constructor(state) { this.state = state; }
  async fetch(req) {
    if (req.headers.get('Upgrade') !== 'websocket') return new Response('Expected a WebSocket', { status: 426 });
    const socks = this.state.getWebSockets();
    if (socks.length >= 40) return new Response('Room full', { status: 503 });
    const { 0: client, 1: server } = new WebSocketPair();
    const id = crypto.randomUUID().slice(0, 8);
    this.state.acceptWebSocket(server);
    server.serializeAttachment({ id, last: null });
    const players = socks.map(w => { try { return w.deserializeAttachment(); } catch (_) { return null; } }).filter(a => a && a.last).map(a => a.last);
    server.send(JSON.stringify({ t: 'hi', id, players }));
    return new Response(null, { status: 101, webSocket: client });
  }
  webSocketMessage(ws, msg) {
    if (typeof msg !== 'string' || msg.length > 4000) return;
    let d; try { d = JSON.parse(msg); } catch (_) { return; }
    const a = ws.deserializeAttachment() || {};
    if (d.t === 's') {                                  // state update: remember the latest and pass it on to everyone else
      d.id = a.id; if (typeof d.n === 'string') d.n = d.n.slice(0, 20);
      const out = JSON.stringify(d);
      if (out.length < 1900) { a.last = d; ws.serializeAttachment(a); }
      for (const w of this.state.getWebSockets()) if (w !== ws) { try { w.send(out); } catch (_) {} }
    } else if (d.t === 'chat' && typeof d.m === 'string') {
      const out = JSON.stringify({ t: 'chat', id: a.id, n: String(d.n || '').slice(0, 20), m: d.m.slice(0, 140) });
      for (const w of this.state.getWebSockets()) { try { w.send(out); } catch (_) {} }
    }
  }
  bye(ws) {
    const a = (() => { try { return ws.deserializeAttachment(); } catch (_) { return null; } })(); if (!a) return;
    const out = JSON.stringify({ t: 'bye', id: a.id });
    for (const w of this.state.getWebSockets()) if (w !== ws) { try { w.send(out); } catch (_) {} }
  }
  webSocketClose(ws, code) { this.bye(ws); try { ws.close(1000, 'bye'); } catch (_) {} }
  webSocketError(ws) { this.bye(ws); }
}
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === '/ws') return env.ROOM.get(env.ROOM.idFromName('pendeford')).fetch(req);
    return env.ASSETS.fetch(req);
  }
};
