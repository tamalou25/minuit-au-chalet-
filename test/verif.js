'use strict';
// Vérification automatique : `npm test`
// 1. Affaire solo : cohérence des données et parcours complet jusqu'au verdict.
// 2. Multijoueur de 3 à 8 joueurs simulés via l'API : rôles, confidentialité,
//    cohérence des fiches, manches, rechargement, départ d'un joueur, vote, révélation.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { server } = require('../server');
const chalet = require('../game/chalet');

let base;
let passed = 0;
function ok(cond, msg) {
  assert.ok(cond, msg);
  passed++;
}

async function call(method, url, body) {
  const res = await fetch(base + url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  return { status: res.status, data };
}

// ---------------------------------------------------------------- SOLO
function testSolo() {
  const ctx = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../public/solo-data.js'), 'utf8'), ctx);
  const C = ctx.window.SOLO_CASE;
  const ids = new Set(Object.keys(C.clues));
  const check = (id, where) => ok(ids.has(id), `Indice inconnu ${id} (${where})`);

  ok(C.suspects.length === 3, 'Le solo doit avoir 3 suspects');
  for (const [sid, qs] of Object.entries(C.questions)) {
    for (const q of qs) {
      [...(q.gives || []), ...(q.requires || []), ...(q.requiresAny || [])].forEach((id) => check(id, q.id));
    }
    for (const [cid, variants] of Object.entries(C.confront[sid])) {
      if (cid === 'default') continue;
      check(cid, `confrontation ${sid}`);
      for (const v of variants) [...(v.gives || []), ...(v.ifHas || [])].forEach((id) => check(id, `confrontation ${sid}/${cid}`));
    }
  }
  for (const l of C.locations) {
    (l.requires || []).forEach((id) => check(id, l.id));
    l.items.forEach((it) => check(it.gives, it.id));
  }

  // Simulation du moteur (mêmes règles que public/app.js).
  const S = { clues: C.start.slice() };
  const has = (id) => S.clues.includes(id);
  const add = (list) => list.filter((id) => !has(id) && S.clues.push(id));
  const reqOk = (o) => (o.requires || []).every(has) && (!o.requiresAny || o.requiresAny.some(has));
  const ask = (sid, qid) => {
    const q = C.questions[sid].find((x) => x.id === qid);
    ok(q && reqOk(q), `Question ${qid} indisponible`);
    return add(q.gives || []);
  };
  const examine = (itemId) => {
    const loc = C.locations.find((l) => l.items.some((i) => i.id === itemId));
    ok(loc && reqOk(loc), `Lieu de ${itemId} verrouillé`);
    return add([loc.items.find((i) => i.id === itemId).gives]);
  };
  const confront = (sid, cid) => {
    ok(has(cid), `Preuve ${cid} absente du carnet`);
    const v = (C.confront[sid][cid] || []).find((x) => (x.ifHas || []).every(has)) || { a: C.confront[sid].default };
    return { v, added: add(v.gives || []) };
  };

  // Avant les preuves, Victor maintient sa version.
  ask('victor', 'v_alibi');
  ask('victor', 'v_loge');
  examine('i_serrure');
  let r = confront('victor', 'C_SERRURE');
  ok(r.added.length === 0 && !r.v.change, 'Victor ne doit pas céder face au seul journal de la serrure');
  ok(!C.locations.find((l) => l.id === 'bar').requires.every(has), 'Le bar doit être verrouillé au départ');
  ask('elise', 'e_vu');
  examine('i_ticket');
  r = confront('victor', 'C_TICKET');
  ok(r.v.change && r.added.includes('T_VICTOR_AVEU'), 'Confronté au ticket, Victor doit changer de version');
  ok(C.questions.victor.find((q) => q.id === 'v_couloir') && reqOk(C.questions.victor.find((q) => q.id === 'v_couloir')), 'La nouvelle question à Victor doit se débloquer');
  ask('victor', 'v_couloir');
  ok(has('T_PIANO') && has('T_VICTOR_SILHOUETTE'), 'Nouvelle réponse de Victor après confrontation');
  examine('i_veste');
  ask('camille', 'c_alibi');
  examine('i_porte');
  r = confront('camille', 'C_NOTE_TERRASSE');
  ok(r.v.change && has('T_CAMILLE_COULOIR'), 'Camille doit changer de version face à la note de la terrasse');
  ask('elise', 'e_avant');
  ask('camille', 'c_gants');
  examine('i_chariot');
  r = confront('victor', 'C_GANT');
  ok(has('T_GANTS_HV'), 'Victor décrit les gants du personnel');
  ask('victor', 'v_etrange');
  examine('i_camion');
  ok(has('C_MALLETTE') && has('C_CAMION'), 'Les preuves décisives sont accessibles');
  ok(C.solution.culprit === 'camille' && C.solution.strong.every(has), 'Verdict solide possible');
  // Tous les éléments du carnet sont atteignables.
  examine('i_coiffeuse');
  confront('elise', 'C_DETTE');
  ask('camille', 'c_role');
  ask('elise', 'e_alibi');
  const missing = [...ids].filter((id) => !has(id));
  ok(missing.length === 0, `Éléments jamais atteignables : ${missing.join(', ')}`);
  console.log(`✓ Solo : ${S.clues.length} éléments atteignables, 2 changements de version, verdict « Camille + mallette » possible`);
}

// ---------------------------------------------------------------- MULTI
const PSEUDOS = ['Gary', 'Léna', 'Yanis', 'Chloé', 'Mehdi', 'Zoé', 'Tom', 'Inaya'];

async function setupRoom(n) {
  const host = await call('POST', '/api/rooms', { name: PSEUDOS[0] });
  ok(host.status === 200, 'Création de salle');
  const code = host.data.code;
  const players = [{ name: PSEUDOS[0], token: host.data.token, id: host.data.playerId }];
  for (let i = 1; i < n; i++) {
    const j = await call('POST', `/api/rooms/${code}/join`, { name: PSEUDOS[i] });
    ok(j.status === 200, `Arrivée du joueur ${i + 1}`);
    players.push({ name: PSEUDOS[i], token: j.data.token, id: j.data.playerId });
  }
  return { code, players };
}
const state = (code, p) => call('GET', `/api/rooms/${code}/state?token=${encodeURIComponent(p.token)}`);
const action = (code, p, type, extra = {}) => call('POST', `/api/rooms/${code}/action`, { token: p.token, type, ...extra });

async function testMulti(n, scenario) {
  const { code, players } = await setupRoom(n);
  const [host, guest] = players;

  if (n === 3) {
    // L'hôte ne peut pas démarrer à 2.
    const solo = await call('POST', '/api/rooms', { name: 'Seul' });
    await call('POST', `/api/rooms/${solo.data.code}/join`, { name: 'Ami' });
    const r = await call('POST', `/api/rooms/${solo.data.code}/action`, { token: solo.data.token, type: 'start' });
    ok(r.status === 400, 'Démarrage refusé à 2 joueurs');
  }
  ok((await action(code, guest, 'start')).status === 400, 'Un invité ne peut pas démarrer');
  ok((await action(code, host, 'start')).status === 200, `Démarrage à ${n}`);
  ok((await call('POST', `/api/rooms/${code}/join`, { name: 'Retard' })).status === 409, 'Impossible de rejoindre après le début');

  // --- Rôles distincts, hôte joueur, un seul coupable.
  const views = [];
  for (const p of players) views.push((await state(code, p)).data);
  const chars = views.map((v) => v.card.charId);
  ok(new Set(chars).size === n, 'Chaque joueur a un rôle distinct');
  ok(views[0].card && views[0].me.isHost, "L'hôte reçoit une fiche comme les autres");
  ok(views.filter((v) => v.card.role === 'coupable').length === 1, 'Un seul coupable');
  const present = chalet.presentSet(n);
  ok(chars.every((c) => present.has(c)) && present.has(chalet.CULPRIT), 'Les personnages en jeu sont les n premiers, coupable inclus');

  // --- Confidentialité et cohérence.
  const absentNames = chalet.CAST.filter((c) => !present.has(c.id)).map((c) => c.name.split(' ')[0]);
  for (let i = 0; i < n; i++) {
    const v = views[i];
    const json = JSON.stringify(v);
    ok(v.card && v.card.alibi && v.card.secret && v.clues.length >= 2, `Fiche complète pour ${players[i].name}`);
    ok(!json.includes('"token"') && !players.some((p) => json.includes(p.token)), 'Aucun jeton dans la vue');
    if (v.card.role !== 'coupable') {
      ok(!json.includes('"truth"') && !json.includes('Tu dois 18 000'), 'Un innocent ne voit pas la vérité du coupable');
      ok(!json.includes('"coupable"'), 'Le rôle de coupable ne fuit pas');
    }
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      for (const c of views[j].clues) {
        ok(!json.includes(c.text), `Indice de ${players[j].name} visible par ${players[i].name}`);
        ok(!json.includes(`"${c.id}"`), `Identifiant d'indice privé visible`);
      }
      ok(!json.includes(views[j].card.secret), 'Secret d’un autre joueur visible');
    }
    for (const name of absentNames) ok(!json.includes(name), `Personnage absent « ${name} » cité à ${n} joueurs`);
    ok(v.clues.every((c) => c.round <= 1), 'Pas d’indice de manche 2 en manche 1');
  }
  // Indices indispensables tenus par des innocents, sur l'ensemble des manches.
  const essentials = Object.entries(chalet.CLUES).filter(([, c]) => c.essential).map(([id]) => id);
  const holders = {};
  for (let i = 0; i < n; i++) for (const c of chalet.cluesFor(views[i].card.charId, present)) holders[c.id] = views[i].card.role;
  ok(essentials.every((id) => holders[id] === 'innocent'), 'Tous les indices indispensables sont distribués à des innocents');

  // Chaque personnage ajouté (4 à 8) a secret + témoignage.
  for (const c of chalet.CAST.slice(3, n)) {
    ok(chalet.CARDS[c.id].secret && chalet.cluesFor(c.id, present).length === 3, `${c.name} a un secret et 3 témoignages`);
  }

  // --- Partage sur la table.
  const noraIdx = chars.indexOf('nora');
  const nora = players[noraIdx];
  const otherIdx = (noraIdx + 1) % n;
  const before = (await state(code, players[otherIdx])).data;
  ok(!JSON.stringify(before).includes('N_SMS'), 'Le SMS de Nora est privé avant partage');
  ok((await action(code, nora, 'share', { clueId: 'N_SMS' })).status === 200, 'Nora pose le SMS sur la table');
  const after = (await state(code, players[otherIdx])).data;
  ok(after.table.some((t) => t.id === 'N_SMS'), 'Le SMS partagé est visible par les autres');
  ok((await action(code, nora, 'share', { clueId: 'N_ECORCE' })).status === 400, 'Impossible de partager un indice de manche 2 en manche 1');

  // --- Manches.
  ok((await action(code, guest, 'nextRound')).status === 400 || guest === host, 'Un invité ne fait pas avancer la partie');
  ok((await action(code, host, 'nextRound')).status === 200, 'Passage en manche 2');
  const r2 = (await state(code, nora)).data;
  ok(r2.phase === 'round2' && r2.clues.length === 3 && r2.clues.some((c) => c.id === 'N_ECORCE'), 'Nouvel indice distribué en manche 2');

  // --- Rechargement : même jeton = même rôle, même manche.
  const reload = (await state(code, players[n - 1])).data;
  ok(reload.card.charId === chars[n - 1] && reload.phase === 'round2', 'Après rechargement, le joueur retrouve son rôle et la manche');

  // --- Vote.
  ok((await action(code, host, 'openVote')).status === 200, 'Ouverture du vote');
  const culpritIdx = chars.indexOf(chalet.CULPRIT);
  ok((await action(code, players[culpritIdx], 'vote', { target: chalet.CULPRIT })).status === 400, 'On ne peut pas voter pour soi');

  let leaver = null;
  if (scenario === 'leave') {
    // Un joueur innocent (pas l'hôte) quitte la partie : l'hôte le marque parti puis termine le vote.
    const idx = players.findIndex((p, i) => i !== 0 && i !== culpritIdx);
    leaver = players[idx];
    ok((await action(code, host, 'markLeft', { playerId: leaver.id })).status === 200, 'L’hôte marque un joueur comme parti');
  }
  const voters = players.filter((p) => p !== leaver);
  // Scénario « win » : tous les innocents votent Hugo. « lose » : ils se dispersent.
  for (let i = 0; i < voters.length; i++) {
    const p = voters[i];
    const me = chars[players.indexOf(p)];
    let target;
    if (me === chalet.CULPRIT) target = 'nora';
    else if (scenario === 'lose') target = me === 'nora' ? 'ines' : 'nora';
    else target = chalet.CULPRIT;
    if (scenario === 'leave' && i === voters.length - 1) break; // le dernier ne vote pas : l'hôte clôt.
    const v = await action(code, p, 'vote', { target });
    ok(v.status === 200, 'Vote enregistré');
  }
  let final = (await state(code, host)).data;
  if (scenario === 'leave') {
    ok(final.phase === 'vote', 'Vote toujours ouvert tant qu’un joueur n’a pas voté');
    const nonHost = players.find((p, i) => i !== 0 && p !== leaver);
    ok((await action(code, nonHost, 'closeVote')).status === 400, 'Seul l’hôte termine le vote');
    ok((await action(code, host, 'closeVote')).status === 200, 'L’hôte termine le vote');
    final = (await state(code, host)).data;
  }
  ok(final.phase === 'reveal' && final.result, 'Révélation affichée');
  const res = final.result;
  ok(res.culprit.charId === chalet.CULPRIT && res.timeline.length > 5 && res.motive, 'Coupable, mobile et chronologie révélés');
  const expectedWin = res.culpritVotes > res.cast / 2;
  ok(res.groupWins === expectedWin, 'Règle de majorité appliquée');
  if (scenario === 'win') ok(res.groupWins, 'Le groupe gagne quand tous les innocents désignent le coupable');
  if (scenario === 'lose') ok(!res.groupWins, 'Le coupable gagne si la majorité se trompe');
  // Tous les joueurs voient la révélation.
  for (const p of players) ok((await state(code, p)).data.phase === 'reveal', 'Chaque téléphone reçoit la révélation');

  console.log(`✓ Multi ${n} joueurs (${scenario}) : rôles ${chars.join(', ')} · coupable joué par ${res.culprit.playedBy} · ${res.culpritVotes}/${res.cast} votes → ${res.groupWins ? 'groupe gagne' : 'coupable gagne'}`);
}

(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
  try {
    testSolo();
    await testMulti(3, 'win');
    await testMulti(3, 'leave');
    for (const n of [4, 5, 6, 7]) await testMulti(n, n % 2 ? 'lose' : 'win');
    await testMulti(8, 'win');
    await testMulti(8, 'leave');
    console.log(`\nTout est vert : ${passed} vérifications.`);
  } catch (e) {
    console.error('\n✗ ÉCHEC :', e.message);
    process.exitCode = 1;
  } finally {
    server.close();
  }
})();
