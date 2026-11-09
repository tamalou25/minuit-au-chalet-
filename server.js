'use strict';
// Dossier Minuit — serveur local sans dépendance (Node.js >= 18).
// Les parties sont gardées en mémoire : un redémarrage du serveur les efface.

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const chalet = require('./game/chalet');

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const PUBLIC_DIR = path.join(__dirname, 'public');
const MIN_PLAYERS = 3;
const MAX_PLAYERS = 8;
const ONLINE_MS = 8000;
const ROOM_TTL_MS = 12 * 60 * 60 * 1000;

const rooms = new Map();

// ---------- Utilitaires ----------
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function newCode() {
  let code;
  do {
    code = Array.from({ length: 4 }, () => CODE_CHARS[crypto.randomInt(CODE_CHARS.length)]).join('');
  } while (rooms.has(code));
  return code;
}
const newId = () => crypto.randomBytes(6).toString('hex');
const newToken = () => crypto.randomBytes(18).toString('base64url');

function cleanName(name) {
  return String(name || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 20);
}

function lanAddresses() {
  const out = [];
  for (const list of Object.values(os.networkInterfaces())) {
    for (const a of list || []) {
      if (a.family === 'IPv4' && !a.internal) out.push(a.address);
    }
  }
  return out;
}

function send(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > 10_000) {
        reject(new Error('too_large'));
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {});
      } catch {
        reject(new Error('bad_json'));
      }
    });
    req.on('error', reject);
  });
}

// ---------- Logique de salle ----------
function activePlayers(room) {
  return room.players.filter((p) => !p.left);
}

function ensureHost(room) {
  if (room.players.some((p) => p.isHost && !p.left)) return;
  room.players.forEach((p) => (p.isHost = false));
  const next = activePlayers(room)[0];
  if (next) next.isHost = true;
}

function touch(room) {
  room.version++;
  room.updatedAt = Date.now();
}

function createRoom(hostName) {
  const code = newCode();
  const host = { id: newId(), token: newToken(), name: hostName, isHost: true, left: false, lastSeen: Date.now(), charId: null, clues: [] };
  const room = {
    code, version: 1, createdAt: Date.now(), updatedAt: Date.now(),
    phase: 'lobby', // lobby | round1 | round2 | vote | reveal
    players: [host], n: 0, table: [], votes: {}, result: null,
  };
  rooms.set(code, room);
  return { room, player: host };
}

function startGame(room) {
  const players = activePlayers(room);
  // Les joueurs partis avant le début ne reçoivent pas de rôle.
  room.players = players;
  room.n = players.length;
  const assignment = chalet.assign(players.map((p) => p.id));
  for (const p of players) {
    p.charId = assignment[p.id].charId;
    p.clues = assignment[p.id].clues;
  }
  room.phase = 'round1';
}

function visibleRound(phase) {
  return { round1: 1, round2: 2, vote: 2, reveal: 2 }[phase] ?? -1;
}

function maybeCloseVote(room) {
  const voters = activePlayers(room);
  if (voters.length && voters.every((p) => room.votes[p.id])) closeVote(room, false);
}

function closeVote(room, forced) {
  const present = chalet.presentSet(room.n);
  const tally = {};
  for (const c of chalet.castView(room.n)) tally[c.id] = 0;
  const ballots = [];
  for (const p of room.players) {
    const v = room.votes[p.id];
    if (!v) continue;
    tally[v] = (tally[v] || 0) + 1;
    ballots.push({ name: p.name, charName: chalet.charName(p.charId), voteFor: chalet.charName(v) });
  }
  const cast = ballots.length;
  const culpritVotes = tally[chalet.CULPRIT] || 0;
  const groupWins = culpritVotes > cast / 2;
  const culpritPlayer = room.players.find((p) => p.charId === chalet.CULPRIT);
  const holderOf = (clueId) => {
    const p = room.players.find((pl) => pl.clues.some((c) => c.id === clueId));
    return p ? `${p.name} (${chalet.charName(p.charId)})` : null;
  };
  room.result = {
    forced,
    groupWins,
    cast,
    needed: Math.floor(cast / 2) + 1,
    culpritVotes,
    culprit: { charId: chalet.CULPRIT, name: chalet.charName(chalet.CULPRIT), playedBy: culpritPlayer ? culpritPlayer.name : '—' },
    tally: chalet.castView(room.n).map((c) => ({ charId: c.id, name: c.name, votes: tally[c.id] || 0 })),
    ballots,
    motive: chalet.REVEAL.motive,
    where: chalet.REVEAL.where,
    timeline: chalet.REVEAL.timeline,
    keys: chalet.REVEAL.keys.map((k) => ({ ...chalet.clueView(k.clue, present), why: k.why, heldBy: holderOf(k.clue) })),
    secrets: room.players.map((p) => ({
      name: p.name, charName: chalet.charName(p.charId),
      secret: chalet.resolve(chalet.CARDS[p.charId].secret, present),
    })),
  };
  room.phase = 'reveal';
}

// Vue personnalisée : uniquement ce que ce joueur a le droit de voir.
function viewFor(room, me) {
  const now = Date.now();
  const started = room.phase !== 'lobby';
  const present = chalet.presentSet(room.n);
  const vr = visibleRound(room.phase);
  const view = {
    code: room.code,
    version: room.version,
    phase: room.phase,
    min: MIN_PLAYERS,
    max: MAX_PLAYERS,
    me: { id: me.id, name: me.name, isHost: me.isHost, left: me.left },
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      isHost: p.isHost,
      left: p.left,
      online: !p.left && now - p.lastSeen < ONLINE_MS,
      charName: started ? chalet.charName(p.charId) : null,
      voted: room.phase === 'vote' ? Boolean(room.votes[p.id]) : undefined,
    })),
  };
  if (!started) return view;

  const cast = chalet.castView(room.n).map((c) => {
    const p = room.players.find((pl) => pl.charId === c.id);
    return { ...c, playedBy: p ? p.name : null };
  });
  view.intro = { title: chalet.INTRO.title, text: chalet.INTRO.text, facts: chalet.INTRO.facts, cast };
  view.card = chalet.cardView(me.charId, room.n);
  const sharedIds = new Set(room.table.filter((t) => t.by === me.id).map((t) => t.clueId));
  view.clues = me.clues
    .filter((c) => c.round <= vr)
    .map((c) => ({ ...chalet.clueView(c.id, present), shared: sharedIds.has(c.id) }));
  view.table = room.table.map((t) => {
    const p = room.players.find((pl) => pl.id === t.by);
    return { ...chalet.clueView(t.clueId, present), byName: p ? p.name : '?', byChar: p ? chalet.charName(p.charId) : '?' };
  });
  if (room.phase === 'vote') {
    view.vote = {
      myVote: room.votes[me.id] || null,
      count: activePlayers(room).filter((p) => room.votes[p.id]).length,
      total: activePlayers(room).length,
      candidates: cast.filter((c) => c.id !== me.charId).map((c) => ({ id: c.id, name: c.name, playedBy: c.playedBy })),
    };
  }
  if (room.phase === 'reveal') view.result = room.result;
  return view;
}

function handleAction(room, me, body) {
  const type = body.type;
  const hostOnly = ['start', 'nextRound', 'openVote', 'closeVote', 'markLeft'];
  if (hostOnly.includes(type) && !me.isHost) return { error: "Seul l'hôte peut faire ça." };
  if (me.left && type !== 'rejoin') return { error: 'Tu as quitté la partie.' };

  switch (type) {
    case 'start': {
      if (room.phase !== 'lobby') return { error: 'La partie a déjà commencé.' };
      const n = activePlayers(room).length;
      if (n < MIN_PLAYERS || n > MAX_PLAYERS) return { error: `Il faut entre ${MIN_PLAYERS} et ${MAX_PLAYERS} joueurs (actuellement ${n}).` };
      startGame(room);
      break;
    }
    case 'nextRound':
      if (room.phase !== 'round1') return { error: 'Pas en manche 1.' };
      room.phase = 'round2';
      break;
    case 'openVote':
      if (room.phase !== 'round2') return { error: 'Le vote s’ouvre après la manche 2.' };
      room.phase = 'vote';
      room.votes = {};
      break;
    case 'vote': {
      if (room.phase !== 'vote') return { error: 'Le vote n’est pas ouvert.' };
      const target = String(body.target || '');
      const valid = room.players.some((p) => p.charId === target);
      if (!valid || target === me.charId) return { error: 'Vote invalide.' };
      room.votes[me.id] = target;
      maybeCloseVote(room);
      break;
    }
    case 'closeVote':
      if (room.phase !== 'vote') return { error: 'Le vote n’est pas ouvert.' };
      if (!Object.keys(room.votes).length) return { error: 'Aucun vote pour l’instant.' };
      closeVote(room, true);
      break;
    case 'share': {
      if (!['round1', 'round2', 'vote'].includes(room.phase)) return { error: 'Impossible maintenant.' };
      const clue = me.clues.find((c) => c.id === body.clueId && c.round <= visibleRound(room.phase));
      if (!clue) return { error: 'Indice inconnu.' };
      if (!room.table.some((t) => t.clueId === clue.id)) room.table.push({ clueId: clue.id, by: me.id, at: Date.now() });
      break;
    }
    case 'leave':
      me.left = true;
      if (room.phase === 'lobby') room.players = room.players.filter((p) => p.id !== me.id);
      delete room.votes[me.id];
      ensureHost(room);
      if (room.phase === 'vote') maybeCloseVote(room);
      break;
    case 'markLeft': {
      const p = room.players.find((pl) => pl.id === body.playerId);
      if (!p || p.id === me.id) return { error: 'Joueur introuvable.' };
      p.left = true;
      delete room.votes[p.id];
      if (room.phase === 'lobby') room.players = room.players.filter((pl) => pl.id !== p.id);
      if (room.phase === 'vote') maybeCloseVote(room);
      break;
    }
    case 'rejoin': {
      // Un joueur marqué « parti » qui revient avec son jeton retrouve sa place.
      if (room.phase === 'reveal') return { error: 'La partie est terminée.' };
      me.left = false;
      ensureHost(room);
      break;
    }
    default:
      return { error: 'Action inconnue.' };
  }
  touch(room);
  return { ok: true };
}

// ---------- API HTTP ----------
async function api(req, res, url) {
  const parts = url.pathname.split('/').filter(Boolean); // ['api', ...]
  try {
    if (req.method === 'GET' && parts[1] === 'info') {
      return send(res, 200, { lan: lanAddresses(), port: PORT });
    }
    if (req.method === 'POST' && parts[1] === 'rooms' && parts.length === 2) {
      const body = await readBody(req);
      const name = cleanName(body.name);
      if (!name) return send(res, 400, { error: 'Choisis un pseudo.' });
      const { room, player } = createRoom(name);
      return send(res, 200, { code: room.code, token: player.token, playerId: player.id });
    }
    if (parts[1] === 'rooms' && parts[2]) {
      const room = rooms.get(String(parts[2]).toUpperCase());
      if (!room) return send(res, 404, { error: 'Salle introuvable. Vérifie le code.' });

      if (req.method === 'GET' && parts.length === 3) {
        return send(res, 200, { code: room.code, phase: room.phase, count: activePlayers(room).length, max: MAX_PLAYERS });
      }
      if (req.method === 'POST' && parts[3] === 'join') {
        const body = await readBody(req);
        const name = cleanName(body.name);
        if (!name) return send(res, 400, { error: 'Choisis un pseudo.' });
        if (room.phase !== 'lobby') return send(res, 409, { error: 'La partie a déjà commencé.' });
        if (activePlayers(room).length >= MAX_PLAYERS) return send(res, 409, { error: 'Salle complète (8 joueurs).' });
        if (activePlayers(room).some((p) => p.name.toLowerCase() === name.toLowerCase())) {
          return send(res, 409, { error: 'Ce pseudo est déjà pris dans la salle.' });
        }
        const player = { id: newId(), token: newToken(), name, isHost: false, left: false, lastSeen: Date.now(), charId: null, clues: [] };
        room.players.push(player);
        touch(room);
        return send(res, 200, { code: room.code, token: player.token, playerId: player.id });
      }
      const token = req.method === 'GET' ? url.searchParams.get('token') : null;
      if (req.method === 'GET' && parts[3] === 'state') {
        const me = room.players.find((p) => p.token === token);
        if (!me) return send(res, 403, { error: 'Joueur inconnu dans cette salle.' });
        me.lastSeen = Date.now();
        return send(res, 200, viewFor(room, me));
      }
      if (req.method === 'POST' && parts[3] === 'action') {
        const body = await readBody(req);
        const me = room.players.find((p) => p.token === body.token);
        if (!me) return send(res, 403, { error: 'Joueur inconnu dans cette salle.' });
        me.lastSeen = Date.now();
        const r = handleAction(room, me, body);
        if (r.error) return send(res, 400, r);
        return send(res, 200, viewFor(room, me));
      }
    }
    return send(res, 404, { error: 'Route inconnue.' });
  } catch (e) {
    return send(res, 400, { error: 'Requête invalide.' });
  }
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

function serveStatic(req, res, url) {
  let p = decodeURIComponent(url.pathname);
  if (p === '/') p = '/index.html';
  const file = path.normalize(path.join(PUBLIC_DIR, p));
  if (!file.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end();
  }
  fs.readFile(file, (err, data) => {
    if (err) {
      // Application monopage : on renvoie index.html.
      return fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (e2, html) => {
        res.writeHead(e2 ? 404 : 200, { 'Content-Type': MIME['.html'] });
        res.end(e2 ? 'Not found' : html);
      });
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname.startsWith('/api/')) return api(req, res, url);
  return serveStatic(req, res, url);
});

// Nettoyage des vieilles salles.
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms) if (now - room.updatedAt > ROOM_TTL_MS) rooms.delete(code);
}, 10 * 60 * 1000).unref();

if (require.main === module) {
  server.listen(PORT, HOST, () => {
    const lan = lanAddresses();
    console.log('\n  Dossier Minuit est lancé !\n');
    console.log(`  Sur ce PC        : http://localhost:${PORT}`);
    for (const ip of lan) console.log(`  Sur le Wi-Fi     : http://${ip}:${PORT}`);
    console.log('\n  Ctrl + C pour arrêter.\n');
  });
}

module.exports = { server, rooms };
