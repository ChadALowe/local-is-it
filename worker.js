// Pendeford Drift: serves the game and runs one shared multiplayer room (a Durable Object) that everyone on the link joins.
// The room also remembers the shared world (parked cars that were pushed or dented) until the last player leaves.
export class Room {
  constructor(state) { this.state = state; }
  async fetch(req) {
    if (req.headers.get('Upgrade') !== 'websocket') return new Response('Expected a WebSocket', { status: 426 });
    const socks = this.state.getWebSockets();
    if (socks.length >= 40) return new Response('Room full', { status: 503 });
    if (!socks.length) {                                               // first one in: fresh world (the leaderboard is kept forever)
      const keys = [...(await this.state.storage.list()).keys()].filter(k => k !== 'lb'); for (let i = 0; i < keys.length; i += 100) await this.state.storage.delete(keys.slice(i, i + 100));
    }
    const { 0: client, 1: server } = new WebSocketPair();
    const id = crypto.randomUUID().slice(0, 8);
    this.state.acceptWebSocket(server);
    server.serializeAttachment({ id, last: null });
    const players = socks.map(w => { try { return w.deserializeAttachment(); } catch (_) { return null; } }).filter(a => a && a.last).map(a => a.last);
    const world = [...(await this.state.storage.list({ prefix: 'w:' })).values()], npc = await this.state.storage.get('npc'), wc = [...(await this.state.storage.list({ prefix: 'wc:' })).values()], kit = (await this.state.storage.get('kit')) || [], pool = await this.state.storage.get('pool');
    server.send(JSON.stringify({ t: 'hi', id, players, world, npc, wc, kit, pool }));
    server.send(JSON.stringify(Object.assign({ t: 'lb' }, (await this.state.storage.get('lb')) || { money: [], drift: [] })));
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
      if (d.e === 'pool' && d.a === 'state' && d.s && JSON.stringify(d.s).length < 4000) await st.put('pool', d.s);       // the pool game: seats, balls, turn
      else if (d.e === 'kit' && typeof d.id === 'string') {                  // lunches in the office fridge
        let kit = (await st.get('kit')) || []; if (d.a === 'put' && kit.length < 30) kit.push({ id: d.id.slice(0, 12), owner: String(d.owner || '').slice(0, 20) }); else if (d.a === 'take') kit = kit.filter(l => l.id !== d.id); await st.put('kit', kit);
      } else if (d.e === 'wc' && Number.isInteger(d.i) && d.i >= 0 && d.i < 8) {          // toilets: yellow water / poos stay until someone flushes
        const key = 'wc:' + d.i, s = (await st.get(key)) || { i: d.i, y: 0, p: 0 };
        if (d.a === 'wee') s.y = 1; else if (d.a === 'poo') s.p = Math.min(6, s.p + 1); else if (d.a === 'flush') { s.y = 0; s.p = 0; }
        if (s.y || s.p) await st.put(key, s); else await st.delete(key);
      } else if (d.e === 'npc') {                              // the office colleague's shoes: who has them / where they are
        if (d.a === 'take') await st.put('npc', { s: 'carried', by: a.id });
        else if (d.a === 'put') await st.put('npc', { s: 'down', x: d.x, z: d.z, h: d.h });
        else if (d.a === 'on') await st.delete('npc');
      } else if (d.e === 'dent' && typeof d.k === 'string') {
        const key = 'w:' + d.k, w = (await st.get(key)) || { k: d.k, x: d.x, z: d.z, y: d.y, col: d.col, d: [] };
        w.d.push(d.d); if (w.d.length > 12) w.d.shift(); await st.put(key, w);
      } else if (d.e === 'pk' && Array.isArray(d.l)) {
        for (const q of d.l) { if (!q[4] || typeof q[0] !== 'string') continue;   // only settled positions are kept
          const key = 'w:' + q[0], w = (await st.get(key)) || { k: q[0], x: q[1], z: q[2], y: q[3], col: q[5], d: [] }; w.p = [q[1], q[2], q[3]]; await st.put(key, w); }
      }
    } else if (d.t === 'score' && typeof d.n === 'string') {          // leaderboard: top 10 for money and for best drift
      const n = d.n.slice(0, 20), lb = (await this.state.storage.get('lb')) || { money: [], drift: [] }; let changed = false;
      for (const [key, v] of [['money', +d.money], ['drift', +d.drift]]) { if (!isFinite(v) || v <= 0 || v > 1e9) continue; const list = lb[key], e = list.find(r => r.n === n);
        if (e) { if (v > e[key]) { e[key] = v; changed = true; } } else { list.push({ n, [key]: v }); changed = true; }
        list.sort((a, b) => b[key] - a[key]); if (list.length > 10) list.length = 10; }
      if (changed) { await this.state.storage.put('lb', lb); const out = JSON.stringify(Object.assign({ t: 'lb' }, lb)); for (const s of this.state.getWebSockets()) { try { s.send(out); } catch (_) {} } }
    } else if (d.t === 'chat' && typeof d.m === 'string') {
      const out = JSON.stringify({ t: 'chat', id: a.id, n: String(d.n || '').slice(0, 20), m: d.m.slice(0, 140) });
      for (const w of this.state.getWebSockets()) { try { w.send(out); } catch (_) {} }
    }
  }
  async bye(ws) {
    const a = (() => { try { return ws.deserializeAttachment(); } catch (_) { return null; } })(); if (!a) return;
    const n = await this.state.storage.get('npc');                  // left while carrying the shoes: they drop them where they were
    const pool = await this.state.storage.get('pool');                // left the pool table: free the seat
    if (pool && pool.seats && pool.seats.some(s => s && s.id === a.id)) { pool.seats = pool.seats.map(s => s && s.id === a.id ? null : s); await this.state.storage.put('pool', pool); this.others(ws, JSON.stringify({ t: 'ev', e: 'pool', a: 'free', id: a.id })); }
    if (n && n.s === 'carried' && n.by === a.id) { const f = a.last && a.last.f; if (f) await this.state.storage.put('npc', { s: 'down', x: f[0], z: f[2], h: 0 }); else await this.state.storage.delete('npc'); }
    this.others(ws, JSON.stringify({ t: 'bye', id: a.id }));
  }
  async webSocketClose(ws) { await this.bye(ws); try { ws.close(1000, 'bye'); } catch (_) {} }
  async webSocketError(ws) { await this.bye(ws); }
}
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === '/ws') return env.ROOM.get(env.ROOM.idFromName('pendeford')).fetch(req);
    return env.ASSETS.fetch(req);
  }
};
