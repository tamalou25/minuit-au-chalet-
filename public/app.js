/* Dossier Minuit — interface web (vanilla JS, aucune dépendance). */
(() => {
  'use strict';

  const $app = document.getElementById('app');
  const $toast = document.getElementById('toast');
  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

  let toastTimer;
  function toast(msg) {
    $toast.textContent = msg;
    $toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $toast.classList.remove('show'), 2600);
  }

  const store = {
    get(area, key) {
      try { return JSON.parse(window[area].getItem(key)); } catch { return null; }
    },
    set(area, key, val) {
      try { window[area].setItem(key, JSON.stringify(val)); } catch { /* stockage indisponible */ }
    },
    del(area, key) {
      try { window[area].removeItem(key); } catch { /* ignore */ }
    },
  };

  async function api(method, url, body) {
    const res = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    let data = {};
    try { data = await res.json(); } catch { /* vide */ }
    if (!res.ok) {
      const err = new Error(data.error || 'Erreur réseau');
      err.status = res.status;
      throw err;
    }
    return data;
  }

  // ---------- Routage ----------
  const actions = {};
  let cleanup = null;

  function go(hash) {
    if (location.hash === hash) route();
    else location.hash = hash;
  }

  function route() {
    if (cleanup) { cleanup(); cleanup = null; }
    closeModal();
    const parts = (location.hash.replace(/^#\/?/, '') || '').split('/').filter(Boolean);
    window.scrollTo(0, 0);
    switch (parts[0]) {
      case 'solo': return Solo.mount();
      case 'creer': return renderCreate();
      case 'rejoindre': return renderJoin((parts[1] || '').toUpperCase());
      case 'salle': return Room.mount((parts[1] || '').toUpperCase());
      default: return renderHome();
    }
  }
  window.addEventListener('hashchange', route);

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el || el.disabled) return;
    const fn = actions[el.dataset.act];
    if (fn) {
      e.preventDefault();
      fn(el.dataset, el);
    }
  });
  document.addEventListener('submit', (e) => {
    const form = e.target.closest('form[data-submit]');
    if (!form) return;
    e.preventDefault();
    const fn = actions[form.dataset.submit];
    if (fn) fn(form);
  });

  // ---------- Modale ----------
  function openModal(html) {
    closeModal();
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.id = 'modal';
    bg.innerHTML = `<div class="modal">${html}</div>`;
    bg.addEventListener('click', (e) => { if (e.target === bg) closeModal(); });
    document.body.appendChild(bg);
  }
  function closeModal() {
    const m = document.getElementById('modal');
    if (m) m.remove();
  }
  actions.closeModal = closeModal;

  // ---------- Accueil ----------
  function renderHome() {
    const last = store.get('localStorage', 'dm_last');
    const solo = store.get('localStorage', 'dm_solo');
    $app.innerHTML = `
      <div class="logo">
        <div class="moon"></div>
        <h1>Dossier Minuit</h1>
        <div class="tag">Enquêtes courtes sur téléphone</div>
      </div>
      <div class="stack">
        <button class="btn primary big" data-act="nav" data-to="#/solo">
          Jouer en solo<span class="sub">Contre des suspects écrits · 10 à 15 min</span>
        </button>
        <button class="btn big" data-act="nav" data-to="#/creer">
          Créer une partie entre amis<span class="sub">3 à 8 joueurs · 15 à 25 min</span>
        </button>
        <button class="btn big" data-act="nav" data-to="#/rejoindre">
          Rejoindre une partie<span class="sub">Avec un code ou un lien</span>
        </button>
      </div>
      ${last ? `
        <div class="section-title">Reprendre</div>
        <div class="card">
          <div class="row">
            <div><strong>Salle ${esc(last.code)}</strong><div class="muted small">en tant que ${esc(last.name)}</div></div>
            <button class="btn small" data-act="resume">Reprendre</button>
          </div>
        </div>` : ''}
      ${solo && solo.started && !solo.verdict ? `<p class="muted small center" style="margin-top:14px">Une enquête solo est en cours : « Jouer en solo » la reprend.</p>` : ''}
      <p class="muted small center" style="margin-top:28px">Prototype · contenu entièrement fictif · aucune donnée envoyée hors de ce réseau.</p>
    `;
  }
  actions.nav = (d) => go(d.to);
  actions.home = () => go('#/');
  actions.resume = () => {
    const last = store.get('localStorage', 'dm_last');
    if (!last) return;
    store.set('sessionStorage', 'dm_s_' + last.code, { token: last.token, name: last.name });
    go('#/salle/' + last.code);
  };

  function saveSession(code, token, name) {
    store.set('sessionStorage', 'dm_s_' + code, { token, name });
    store.set('localStorage', 'dm_last', { code, token, name });
  }

  // ---------- Créer / rejoindre ----------
  function renderCreate() {
    $app.innerHTML = `
      <button class="back" data-act="home">← Accueil</button>
      <h2>Créer une partie</h2>
      <p class="muted">Affaire « Minuit au chalet ». Tu seras l’hôte et tu joueras comme les autres.</p>
      <form data-submit="create" class="stack">
        <div><label for="name">Ton pseudo</label><input id="name" type="text" maxlength="20" autocomplete="off" required placeholder="Ex. : Gary"></div>
        <div class="error" id="err"></div>
        <button class="btn primary" type="submit">Créer la salle</button>
      </form>`;
    document.getElementById('name').focus();
  }
  actions.create = async (form) => {
    const name = form.querySelector('#name').value.trim();
    const err = form.querySelector('#err');
    if (!name) { err.textContent = 'Choisis un pseudo.'; return; }
    try {
      const r = await api('POST', '/api/rooms', { name });
      saveSession(r.code, r.token, name);
      go('#/salle/' + r.code);
    } catch (e) { err.textContent = e.message; }
  };

  function renderJoin(code) {
    $app.innerHTML = `
      <button class="back" data-act="home">← Accueil</button>
      <h2>Rejoindre une partie</h2>
      <form data-submit="join" class="stack">
        <div><label for="code">Code de la salle</label><input id="code" class="code" type="text" maxlength="4" autocomplete="off" autocapitalize="characters" value="${esc(code)}" placeholder="ABCD" required></div>
        <div><label for="name">Ton pseudo</label><input id="name" type="text" maxlength="20" autocomplete="off" required placeholder="Ex. : Léna"></div>
        <div class="error" id="err"></div>
        <button class="btn primary" type="submit">Rejoindre</button>
      </form>`;
    document.getElementById(code ? 'name' : 'code').focus();
  }
  actions.join = async (form) => {
    const code = form.querySelector('#code').value.trim().toUpperCase();
    const name = form.querySelector('#name').value.trim();
    const err = form.querySelector('#err');
    if (code.length !== 4) { err.textContent = 'Le code fait 4 caractères.'; return; }
    if (!name) { err.textContent = 'Choisis un pseudo.'; return; }
    try {
      const r = await api('POST', `/api/rooms/${code}/join`, { name });
      saveSession(r.code, r.token, name);
      go('#/salle/' + r.code);
    } catch (e) { err.textContent = e.message; }
  };

  // =====================================================================
  // SOLO
  // =====================================================================
  const Solo = (() => {
    const C = window.SOLO_CASE;
    const KEY = 'dm_solo';
    let S; // état sauvegardé
    let ui = { tab: 'suspects', suspect: null, exchange: null, location: null, vSuspect: null, vProof: null };

    function fresh() {
      return { started: false, clues: C.start.slice(), seen: C.start.slice(), asked: {}, tried: {}, examined: {}, verdict: null, actions: 0, changes: [] };
    }
    function save() { store.set('localStorage', KEY, S); }
    const hasClue = (id) => S.clues.includes(id);
    function addClues(ids) {
      const added = [];
      for (const id of ids || []) if (!hasClue(id)) { S.clues.push(id); added.push(id); }
      return added;
    }
    const reqOk = (o) => (o.requires || []).every(hasClue) && (!o.requiresAny || o.requiresAny.some(hasClue));
    const unseen = () => S.clues.filter((id) => !S.seen.includes(id)).length;

    function mount() {
      S = store.get('localStorage', KEY) || fresh();
      ui = { tab: 'suspects', suspect: null, exchange: null, location: null, vSuspect: null, vProof: null };
      render();
    }

    function render() {
      if (!S.started) return renderIntro();
      if (S.verdict) return renderResult();
      const tab = ui.tab;
      let body = '';
      if (tab === 'suspects') body = ui.suspect ? renderSuspect(ui.suspect) : renderSuspects();
      else if (tab === 'lieux') body = renderLieux();
      else if (tab === 'carnet') body = renderCarnet();
      else if (tab === 'verdict') body = renderVerdict();
      const n = unseen();
      $app.innerHTML = `
        <div class="topbar">
          <button class="back" data-act="home">← Accueil</button>
          <span class="pill">${S.clues.length} élément${S.clues.length > 1 ? 's' : ''} au carnet</span>
        </div>
        ${body}
        <nav class="tabs"><div class="inner">
          ${tabBtn('suspects', '🗣', 'Interroger')}
          ${tabBtn('lieux', '🔍', 'Lieux')}
          ${tabBtn('carnet', '📓', 'Carnet', n > 0)}
          ${tabBtn('verdict', '⚖', 'Verdict')}
        </div></nav>`;
      if (tab === 'carnet') {
        // Les nouveautés sont marquées comme vues après affichage.
        S.seen = S.clues.slice();
        save();
      }
    }
    function tabBtn(id, ico, label, dot) {
      return `<button class="${ui.tab === id ? 'on' : ''}" data-act="soloTab" data-tab="${id}"><span class="ico">${ico}</span>${label}${dot ? '<span class="dot"></span>' : ''}</button>`;
    }

    function renderIntro() {
      $app.innerHTML = `
        <button class="back" data-act="home">← Accueil</button>
        <div class="phase">Affaire solo</div>
        <h1>${esc(C.title)}</h1>
        <p class="muted">${esc(C.place)}</p>
        <div class="card stack">${C.intro.map((p) => `<p>${esc(p)}</p>`).join('')}</div>
        <div class="section-title">Comment jouer</div>
        <div class="card small">
          <p>🗣 <strong>Interrogez</strong> un suspect en choisissant une question. Certaines n’apparaissent qu’après un indice.</p>
          <p>🔍 <strong>Fouillez</strong> les lieux : de nouveaux s’ouvrent au fil des témoignages.</p>
          <p>⚡ <strong>Confrontez</strong> un suspect à une preuve du carnet. La bonne preuve peut le faire changer de version.</p>
          <p>⚖ <strong>Rendez votre verdict</strong> : un coupable et la preuve qui le confond.</p>
        </div>
        <div class="spacer"></div>
        <button class="btn primary" data-act="soloStart">Ouvrir le dossier</button>`;
    }

    function renderSuspects() {
      return `
        <h2>Les suspects</h2>
        <p class="muted small">Choisissez qui interroger.</p>
        ${C.suspects.map((s) => {
          const qs = C.questions[s.id].filter(reqOk);
          const fresh = qs.filter((q) => !S.asked[q.id]).length;
          return `
          <button class="card suspect" data-act="soloSuspect" data-id="${s.id}">
            <span class="avatar">${esc(s.initial)}</span>
            <span class="meta"><strong>${esc(s.name)}</strong><br><span class="muted small">${esc(s.role)}</span>
            ${fresh ? `<br><span class="pill warn">${fresh} question${fresh > 1 ? 's' : ''} à poser</span>` : ''}</span>
            <span class="chev">›</span>
          </button>`;
        }).join('')}
        <div class="section-title">Rappel</div>
        <div class="card small muted">${esc(C.clues.F_PROGRAMME.text)}</div>`;
    }

    function renderSuspect(id) {
      const s = C.suspects.find((x) => x.id === id);
      const qs = C.questions[id].filter(reqOk);
      const ex = ui.exchange && ui.exchange.suspect === id ? ui.exchange : null;
      return `
        <button class="back" data-act="soloSuspect" data-id="">← Tous les suspects</button>
        <div class="card">
          <div class="suspect"><span class="avatar">${esc(s.initial)}</span>
          <span class="meta"><h3>${esc(s.name)}</h3><div class="muted small">${esc(s.role)}</div></span></div>
          <p class="small" style="margin-top:10px">${esc(s.desc)}</p>
        </div>
        ${ex ? renderExchange(ex) : ''}
        <div class="section-title">Questions</div>
        <div class="stack qlist">
          ${qs.map((q) => `<button class="btn ${S.asked[q.id] ? 'done' : 'fresh'}" data-act="soloAsk" data-id="${q.id}">${S.asked[q.id] ? '✓ ' : ''}${esc(q.q)}</button>`).join('')}
        </div>
        <div class="spacer"></div>
        <button class="btn primary" data-act="soloConfrontOpen">⚡ Confronter à une preuve</button>`;
    }

    function renderExchange(ex) {
      return `
        <div class="spacer"></div>
        <div class="bubble me">${esc(ex.q)}</div>
        <div class="spacer"></div>
        ${ex.change ? `<div class="change">⚡ ${esc(ex.name)} change de version !</div>` : ''}
        <div class="bubble">${esc(ex.a)}${ex.note ? `<div class="note">🕵 ${esc(ex.note)}</div>` : ''}</div>
        ${ex.added && ex.added.length ? `<div class="spacer"></div><div class="card accent small">📓 Ajouté au carnet : <strong>${ex.added.map((id) => esc(C.clues[id].title)).join(' · ')}</strong></div>` : ''}`;
    }

    function clueCard(id, extra = '') {
      const c = C.clues[id];
      const isNew = !S.seen.includes(id);
      return `<div class="card ${isNew ? 'new' : ''}">
        <div class="label">${c.kind === 'indice' ? 'Indice' : 'Témoignage'}${isNew ? ' · nouveau' : ''}</div>
        <h3>${esc(c.title)}</h3><p class="small">${esc(c.text)}</p>${extra}</div>`;
    }

    function renderCarnet() {
      const list = S.clues.slice().reverse();
      const ind = list.filter((id) => C.clues[id].kind === 'indice');
      const tem = list.filter((id) => C.clues[id].kind === 'temoignage');
      return `
        <h2>Carnet</h2>
        <p class="muted small">Recoupez : qui ment, et quelle preuve le montre ?</p>
        <div class="section-title">Indices (${ind.length})</div>
        ${ind.map((id) => clueCard(id)).join('') || '<p class="muted">Aucun.</p>'}
        <div class="section-title">Témoignages (${tem.length})</div>
        ${tem.map((id) => clueCard(id)).join('') || '<p class="muted">Aucun pour l’instant. Interrogez les suspects.</p>'}`;
    }

    function renderLieux() {
      const locs = C.locations.filter(reqOk);
      const locked = C.locations.length - locs.length;
      return `
        <h2>Lieux</h2>
        <p class="muted small">Fouillez pour trouver des preuves matérielles.</p>
        ${locs.map((l) => `
          <div class="card">
            <h3>${esc(l.name)}</h3>
            <p class="muted small">${esc(l.desc)}</p>
            <div class="stack">
              ${l.items.map((it) => S.examined[it.id]
                ? `<div class="card small" style="background:var(--bg2)"><strong>✓ ${esc(C.clues[it.gives].title)}</strong><br>${esc(C.clues[it.gives].text)}</div>`
                : `<button class="btn" data-act="soloExamine" data-id="${it.id}">${esc(it.label)}</button>`).join('')}
            </div>
          </div>`).join('')}
        ${locked ? `<p class="muted small center" style="margin-top:14px">🔒 ${locked} lieu${locked > 1 ? 'x' : ''} encore inconnu${locked > 1 ? 's' : ''} : les témoignages vous y mèneront.</p>` : ''}`;
    }

    function renderVerdict() {
      const proofs = S.clues.filter((id) => !C.start.includes(id));
      return `
        <h2>Verdict</h2>
        <p class="muted small">Un seul essai. Désignez le coupable et la preuve la plus solide contre lui.</p>
        <div class="section-title">1 · Le coupable</div>
        ${C.suspects.map((s) => `
          <button class="card choice suspect ${ui.vSuspect === s.id ? 'sel' : ''}" data-act="soloPickSuspect" data-id="${s.id}">
            <span class="avatar">${esc(s.initial)}</span><span class="meta"><strong>${esc(s.name)}</strong><br><span class="muted small">${esc(s.role)}</span></span>
          </button>`).join('')}
        <div class="section-title">2 · La preuve décisive</div>
        ${proofs.length ? proofs.map((id) => `
          <button class="card choice ${ui.vProof === id ? 'sel' : ''}" data-act="soloPickProof" data-id="${id}">
            <div class="label">${C.clues[id].kind === 'indice' ? 'Indice' : 'Témoignage'}</div>
            <strong>${esc(C.clues[id].title)}</strong><div class="small muted">${esc(C.clues[id].text)}</div>
          </button>`).join('') : '<p class="muted">Votre carnet est encore vide. Enquêtez d’abord !</p>'}
        <div class="spacer"></div>
        <button class="btn primary" data-act="soloVerdict" ${ui.vSuspect && ui.vProof ? '' : 'disabled'}>Prononcer le verdict</button>`;
    }

    function renderResult() {
      const v = S.verdict;
      const sol = C.solution;
      const culprit = C.suspects.find((s) => s.id === sol.culprit);
      const accused = C.suspects.find((s) => s.id === v.suspect);
      let cls, title, msg;
      if (v.suspect !== sol.culprit) {
        cls = 'lose'; title = 'Erreur judiciaire';
        msg = `${accused.name} est innocent·e. La coupable a profité de votre erreur.`;
      } else if (sol.strong.includes(v.proof)) {
        cls = 'win'; title = 'Affaire résolue !';
        msg = 'Bonne coupable, preuve implacable. Camille Roux est confondue.';
      } else if (sol.medium.includes(v.proof)) {
        cls = 'mid'; title = 'Bonne coupable, preuve fragile';
        msg = 'Vous avez vu juste, mais l’avocat de Camille Roux va s’en donner à cœur joie. Il fallait une preuve matérielle plus directe.';
      } else {
        cls = 'mid'; title = 'Bonne intuition, mauvaise preuve';
        msg = 'Vous avez désigné la bonne personne, mais cette preuve ne l’accuse pas. Le juge hésite.';
      }
      const total = Object.keys(C.clues).length;
      $app.innerHTML = `
        <div class="banner ${cls}"><h2>${title}</h2><p>${esc(msg)}</p>
          <p class="small muted">Votre verdict : ${esc(accused.name)} · « ${esc(C.clues[v.proof].title)} »</p></div>
        <div class="card accent"><div class="label">La coupable</div><h3>${esc(culprit.name)}</h3><p>${esc(sol.motive)}</p></div>
        <div class="section-title">Ce qui s’est passé</div>
        <div class="card"><ul class="timeline">${sol.timeline.map((e) => `<li><span class="t">${esc(e.t)}</span><span>${esc(e.text)}</span></li>`).join('')}</ul></div>
        <div class="section-title">Les indices qui permettaient de conclure</div>
        ${sol.deductions.map((d) => `
          <div class="card"><p>${esc(d.text)}</p>
            <div>${d.clues.map((id) => `<span class="pill ${hasClue(id) ? 'ok' : 'bad'}" style="margin:2px">${hasClue(id) ? '✓' : '✗'} ${esc(C.clues[id].title)}</span>`).join(' ')}</div>
          </div>`).join('')}
        <div class="section-title">Votre enquête</div>
        <div class="card small">
          <p>📓 ${S.clues.length} / ${total} éléments trouvés · ${Object.keys(S.asked).length} questions posées · ${Object.keys(S.tried).length} confrontations.</p>
          <p>⚡ Changements de version obtenus : ${S.changes.length ? S.changes.map((id) => esc(C.clues[id].title)).join(', ') : 'aucun'}.</p>
        </div>
        <div class="spacer"></div>
        <div class="stack">
          <button class="btn primary" data-act="soloRestart">Rejouer l’enquête</button>
          <button class="btn ghost" data-act="home">Accueil</button>
        </div>`;
      window.scrollTo(0, 0);
    }

    function setExchange(suspect, q, a, note, gives, change) {
      const added = addClues(gives);
      const s = C.suspects.find((x) => x.id === suspect);
      if (change && added.length) S.changes.push(added[0]);
      ui.exchange = { suspect, q, a, note, added, change: change && added.length > 0, name: s.name.split(' ')[0] };
      S.actions++;
      save();
      if (added.length) toast(change ? `⚡ ${ui.exchange.name} change de version` : `📓 Nouveau : ${C.clues[added[0]].title}`);
      render();
      const bubbles = document.querySelectorAll('.bubble');
      if (bubbles.length) bubbles[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    actions.soloStart = () => { S.started = true; save(); render(); };
    actions.soloTab = (d) => { ui.tab = d.tab; if (d.tab !== 'suspects') ui.suspect = null; render(); window.scrollTo(0, 0); };
    actions.soloSuspect = (d) => { ui.suspect = d.id || null; ui.exchange = null; render(); window.scrollTo(0, 0); };
    actions.soloAsk = (d) => {
      const q = C.questions[ui.suspect].find((x) => x.id === d.id);
      if (!q) return;
      S.asked[q.id] = true;
      setExchange(ui.suspect, q.q, q.a, q.note, q.gives, false);
    };
    actions.soloConfrontOpen = () => {
      const s = C.suspects.find((x) => x.id === ui.suspect);
      const list = S.clues.slice().reverse();
      openModal(`
        <h3>Confronter ${esc(s.name)}</h3>
        <p class="muted small">Quelle preuve lui montrez-vous ?</p>
        <div class="stack">
          ${list.map((id) => {
            const tried = S.tried[`${s.id}:${id}`];
            return `<button class="card choice" data-act="soloConfront" data-id="${id}">
              <div class="label">${C.clues[id].kind === 'indice' ? 'Indice' : 'Témoignage'}${tried ? ' · déjà montré' : ''}</div>
              <strong>${esc(C.clues[id].title)}</strong><div class="small muted">${esc(C.clues[id].text)}</div></button>`;
          }).join('')}
        </div>
        <div class="spacer"></div><button class="btn ghost" data-act="closeModal">Annuler</button>`);
    };
    actions.soloConfront = (d) => {
      closeModal();
      const sid = ui.suspect;
      const table = C.confront[sid];
      const variants = table[d.id] || [];
      const v = variants.find((x) => (x.ifHas || []).every(hasClue)) || { a: table.default };
      S.tried[`${sid}:${d.id}`] = true;
      setExchange(sid, `Vous lui montrez : « ${C.clues[d.id].title} »`, v.a, v.note, v.gives, Boolean(v.change));
    };
    actions.soloExamine = (d) => {
      for (const l of C.locations) {
        const it = l.items.find((x) => x.id === d.id);
        if (!it) continue;
        S.examined[it.id] = true;
        S.actions++;
        const added = addClues([it.gives]);
        save();
        if (added.length) toast(`📓 Nouveau : ${C.clues[it.gives].title}`);
        render();
      }
    };
    actions.soloPickSuspect = (d) => { ui.vSuspect = d.id; render(); };
    actions.soloPickProof = (d) => { ui.vProof = d.id; render(); };
    actions.soloVerdict = () => {
      if (!ui.vSuspect || !ui.vProof) return;
      const s = C.suspects.find((x) => x.id === ui.vSuspect);
      if (!window.confirm(`Accuser ${s.name} avec « ${C.clues[ui.vProof].title} » ? C’est définitif.`)) return;
      S.verdict = { suspect: ui.vSuspect, proof: ui.vProof };
      save();
      render();
    };
    actions.soloRestart = () => {
      S = fresh();
      save();
      ui = { tab: 'suspects', suspect: null, exchange: null, location: null, vSuspect: null, vProof: null };
      render();
    };

    return { mount };
  })();

  // =====================================================================
  // MULTIJOUEUR
  // =====================================================================
  const Room = (() => {
    let code = null;
    let session = null;
    let state = null;
    let lastJson = '';
    let timer = null;
    let info = null;
    let tab = 'fiche';
    let lastPhase = null;
    let lastClueCount = 0;
    let pickVote = null;
    let busy = false;

    const PHASE_LABEL = { lobby: 'Salle d’attente', round1: 'Manche 1 / 2', round2: 'Manche 2 / 2', vote: 'Vote', reveal: 'Révélation' };

    function mount(c) {
      code = c;
      session = store.get('sessionStorage', 'dm_s_' + code);
      if (!session) return go('#/rejoindre/' + code);
      state = null; lastJson = ''; tab = 'fiche'; lastPhase = null; lastClueCount = 0; pickVote = null;
      $app.innerHTML = '<p class="muted center" style="margin-top:40px">Connexion à la salle…</p>';
      if (!info) api('GET', '/api/info').then((i) => { info = i; if (state) render(); }).catch(() => {});
      poll();
      timer = setInterval(poll, 1500);
      cleanup = () => { clearInterval(timer); timer = null; };
    }

    async function poll() {
      try {
        const s = await api('GET', `/api/rooms/${code}/state?token=${encodeURIComponent(session.token)}`);
        apply(s);
      } catch (e) {
        if (e.status === 404 || e.status === 403) {
          clearInterval(timer);
          store.del('sessionStorage', 'dm_s_' + code);
          const last = store.get('localStorage', 'dm_last');
          if (last && last.code === code) store.del('localStorage', 'dm_last');
          $app.innerHTML = `<div class="card center stack" style="margin-top:40px"><h3>Salle introuvable</h3>
            <p class="muted">${esc(e.message)} Le serveur a peut-être redémarré.</p>
            <button class="btn primary" data-act="home">Accueil</button></div>`;
        }
      }
    }

    function apply(s) {
      const json = JSON.stringify(s);
      if (json === lastJson) return;
      lastJson = json;
      const prevPhase = lastPhase;
      state = s;
      if (prevPhase && prevPhase !== s.phase) {
        if (s.phase === 'round1') { tab = 'fiche'; toast('La partie commence : lis ta fiche !'); }
        if (s.phase === 'round2') { tab = 'indices'; toast('Manche 2 : nouvel indice reçu !'); }
        if (s.phase === 'vote') { tab = 'vote'; toast('Le vote est ouvert'); }
        window.scrollTo(0, 0);
      }
      lastPhase = s.phase;
      render();
    }

    async function act(type, extra = {}) {
      if (busy) return;
      busy = true;
      try {
        const s = await api('POST', `/api/rooms/${code}/action`, { token: session.token, type, ...extra });
        apply(s);
        return true;
      } catch (e) {
        toast(e.message);
        return false;
      } finally { busy = false; }
    }

    function shareLink() {
      const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
      if (local && info && info.lan && info.lan.length) return `http://${info.lan[0]}:${info.port}/#/rejoindre/${code}`;
      return `${location.origin}/#/rejoindre/${code}`;
    }

    function render() {
      const s = state;
      if (!s) return;
      if (s.me.left) {
        $app.innerHTML = `<div class="card center stack" style="margin-top:40px"><h3>Tu as quitté la partie</h3>
          <p class="muted">Ton rôle est conservé.</p>
          <button class="btn primary" data-act="roomRejoin">Revenir dans la partie</button>
          <button class="btn ghost" data-act="home">Accueil</button></div>`;
        return;
      }
      if (s.phase === 'lobby') return renderLobby(s);
      if (s.phase === 'reveal') return renderReveal(s);
      renderGame(s);
    }

    function renderLobby(s) {
      const active = s.players.filter((p) => !p.left);
      const n = active.length;
      const canStart = n >= s.min && n <= s.max;
      const link = shareLink();
      $app.innerHTML = `
        <div class="topbar"><button class="back" data-act="home">← Accueil</button><span class="phase">${PHASE_LABEL.lobby}</span></div>
        <h2>Minuit au chalet</h2>
        <div class="card center">
          <div class="label">Code de la salle</div>
          <div class="code-big">${esc(s.code)}</div>
          <div class="link-box" id="link">${esc(link)}</div>
          <div class="spacer"></div>
          <div class="row">
            <button class="btn small" data-act="roomCopy">Copier le lien</button>
            ${navigator.share ? '<button class="btn small" data-act="roomShare">Partager</button>' : ''}
          </div>
          ${['localhost', '127.0.0.1'].includes(location.hostname) && !(info && info.lan && info.lan.length) ? '<p class="muted small">Ouvre ce lien depuis un téléphone sur le même Wi-Fi que ce PC.</p>' : ''}
        </div>
        <div class="section-title">Joueurs (${n} / ${s.max})</div>
        <div class="card"><ul class="plist">
          ${active.map((p) => `<li><span><span class="status ${p.online ? 'on' : ''}"></span>${esc(p.name)}${p.id === s.me.id ? ' <span class="muted">(toi)</span>' : ''}</span>${p.isHost ? '<span class="pill warn">hôte</span>' : ''}</li>`).join('')}
        </ul></div>
        <div class="spacer"></div>
        ${s.me.isHost ? `
          <button class="btn primary" data-act="roomStart" ${canStart ? '' : 'disabled'}>Démarrer la partie</button>
          <p class="muted small center">${canStart ? `${n} joueurs : chacun recevra un personnage différent.` : `Il faut au moins ${s.min} joueurs (encore ${Math.max(0, s.min - n)}).`}</p>`
          : `<div class="card center muted">En attente de l’hôte pour démarrer…</div>`}
        <div class="spacer"></div>
        <button class="btn ghost" data-act="roomLeave">Quitter la salle</button>`;
    }

    function hostBar(s) {
      if (!s.me.isHost) return '';
      if (s.phase === 'round1') return `<div class="hostbar"><div class="small"><strong>Tu es l’hôte.</strong> Manche 1 : chacun lit sa fiche, se présente et donne son alibi à voix haute. Quand le groupe est prêt :</div><div class="spacer"></div><button class="btn primary" data-act="roomNext">Lancer la manche 2</button></div>`;
      if (s.phase === 'round2') return `<div class="hostbar"><div class="small"><strong>Tu es l’hôte.</strong> Manche 2 : un nouvel indice est arrivé sur chaque téléphone. Confrontez-vous. Quand le groupe est prêt :</div><div class="spacer"></div><button class="btn primary" data-act="roomOpenVote">Ouvrir le vote</button></div>`;
      if (s.phase === 'vote') return `<div class="hostbar"><div class="small"><strong>Tu es l’hôte.</strong> ${s.vote.count} / ${s.vote.total} votes. Si quelqu’un est parti ou bloqué, termine le vote : les absents s’abstiennent.</div><div class="spacer"></div><button class="btn" data-act="roomCloseVote" ${s.vote.count ? '' : 'disabled'}>Terminer le vote maintenant</button></div>`;
      return '';
    }

    function renderGame(s) {
      let body = '';
      if (tab === 'fiche') body = renderFiche(s);
      else if (tab === 'indices') { body = renderIndices(s); lastClueCount = (s.clues || []).length; }
      else if (tab === 'table') body = renderTable(s);
      else if (tab === 'joueurs') body = renderJoueurs(s);
      else if (tab === 'vote' && s.phase === 'vote') body = renderVote(s);
      else { tab = 'fiche'; body = renderFiche(s); }
      $app.innerHTML = `
        <div class="topbar"><span class="title">${esc(s.card.name)}</span><span class="phase">${PHASE_LABEL[s.phase]}</span></div>
        ${hostBar(s)}
        ${body}
        <nav class="tabs"><div class="inner">
          ${s.phase === 'vote' ? gTab('vote', '🗳', 'Vote', !s.vote.myVote) : ''}
          ${gTab('fiche', '🪪', 'Ma fiche')}
          ${gTab('indices', '🔎', 'Indices', (s.clues || []).length > lastClueCount)}
          ${gTab('table', '🃏', `Table${s.table.length ? ` (${s.table.length})` : ''}`)}
          ${gTab('joueurs', '👥', 'Joueurs')}
        </div></nav>`;
    }
    function gTab(id, ico, label, dot) {
      return `<button class="${tab === id ? 'on' : ''}" data-act="roomTab" data-tab="${id}"><span class="ico">${ico}</span>${esc(label)}${dot ? '<span class="dot"></span>' : ''}</button>`;
    }

    function renderFiche(s) {
      const c = s.card;
      return `
        <details class="card" ${s.phase === 'round1' ? 'open' : ''}><summary><strong>L’affaire</strong></summary>
          <div class="spacer"></div>${s.intro.text.map((p) => `<p class="small">${esc(p)}</p>`).join('')}
          <div class="label">Ce que tout le monde sait</div>
          ${s.intro.facts.map((f) => `<p class="small">• ${esc(f)}</p>`).join('')}
        </details>
        <div class="card ${c.role === 'coupable' ? 'culprit' : 'accent'}">
          <div class="label">Ton personnage · fiche privée</div>
          <h2>${esc(c.name)}</h2>
          <p class="muted small">${esc(c.desc)}</p>
          ${c.role === 'coupable'
            ? '<p><span class="pill bad">Tu es le coupable</span></p>'
            : '<p><span class="pill ok">Tu es innocent·e</span> Trouve le coupable avec les autres.</p>'}
        </div>
        ${c.role === 'coupable' ? `
          <div class="card culprit">
            <div class="label">Ce qui s’est vraiment passé · ne le dis à personne</div>
            <p class="small">${esc(c.truth)}</p>
          </div>
          <div class="card culprit">
            <div class="label">Ta version à défendre</div>
            <p>${esc(c.alibi)}</p>
            ${c.tips.map((t) => `<p class="small">• ${esc(t)}</p>`).join('')}
          </div>` : `
          <div class="card">
            <div class="label">Ton alibi</div>
            <p>${esc(c.alibi)}</p>
          </div>`}
        <div class="card secret">
          <div class="label">Ton secret · à protéger</div>
          <p>${esc(c.secret)}</p>
          <p class="small muted">${c.role === 'coupable' ? 'Si on le découvre, tu as un mobile tout trouvé.' : 'Tu peux le garder pour toi… ou l’avouer si ça aide à confondre le coupable.'}</p>
        </div>
        <p class="muted small center">Tes indices sont dans l’onglet 🔎 Indices.</p>`;
    }

    function renderIndices(s) {
      const byRound = { 0: 'Sur ta fiche', 1: 'Reçu en manche 1', 2: 'Reçu en manche 2' };
      const list = (s.clues || []).slice().sort((a, b) => b.round - a.round);
      return `
        <h2>Mes indices</h2>
        <p class="muted small">Privés : personne d’autre ne les voit. Lis-les à voix haute ou pose-les sur la table pour les montrer à tous.</p>
        ${list.map((c) => `
          <div class="card ${c.round === (s.phase === 'round1' ? 1 : 2) ? 'new' : ''}">
            <div class="label">${byRound[c.round]}</div>
            <h3>${esc(c.title)}</h3>
            <p class="small">${esc(c.text)}</p>
            ${c.shared ? '<span class="pill ok">Sur la table</span>' : `<button class="btn small" data-act="roomShareClue" data-id="${esc(c.id)}">Poser sur la table</button>`}
          </div>`).join('')}
        ${s.phase === 'round1' ? '<p class="muted small center">Un nouvel indice arrivera à la manche 2.</p>' : ''}`;
    }

    function renderTable(s) {
      return `
        <h2>La table</h2>
        <p class="muted small">Les preuves que les joueurs ont choisi de montrer à tout le monde.</p>
        ${s.table.length ? s.table.slice().reverse().map((t) => `
          <div class="card">
            <div class="label">Posé par ${esc(t.byName)} · ${esc(t.byChar)}</div>
            <h3>${esc(t.title)}</h3><p class="small">${esc(t.text)}</p>
          </div>`).join('') : '<div class="card muted center">Rien sur la table pour l’instant.</div>'}`;
    }

    function renderJoueurs(s) {
      return `
        <h2>Les personnages</h2>
        ${s.intro.cast.map((c) => {
          const p = s.players.find((pl) => pl.charName === c.name);
          return `<div class="card">
            <div class="row"><div><h3>${esc(c.name)}</h3><div class="muted small">Joué par ${esc(c.playedBy || '—')}${p && p.id === s.me.id ? ' (toi)' : ''}</div></div>
            <div style="flex:0 0 auto;text-align:right">
              ${p ? (p.left ? '<span class="pill bad">parti</span>' : `<span class="status ${p.online ? 'on' : ''}"></span><span class="small muted">${p.online ? 'en ligne' : 'hors ligne'}</span>`) : ''}
              ${p && p.isHost ? '<br><span class="pill warn">hôte</span>' : ''}
              ${p && s.phase === 'vote' && !p.left ? `<br><span class="small ${p.voted ? '' : 'muted'}">${p.voted ? '✓ a voté' : 'vote…'}</span>` : ''}
            </div></div>
            <p class="small muted" style="margin-top:6px">${esc(c.desc)}</p>
            ${s.me.isHost && p && p.id !== s.me.id && !p.left ? `<button class="btn small danger" data-act="roomMarkLeft" data-id="${esc(p.id)}" data-name="${esc(p.name)}">Marquer comme parti</button>` : ''}
          </div>`;
        }).join('')}
        <div class="spacer"></div>
        <button class="btn ghost" data-act="roomLeave">Quitter la partie</button>`;
    }

    function renderVote(s) {
      const v = s.vote;
      const current = pickVote || v.myVote;
      return `
        <h2>Qui a volé la médaille ?</h2>
        <p class="muted small">Vote secret. Le groupe gagne si plus de la moitié des votants désigne le coupable.</p>
        <div class="card"><div class="small">${v.count} / ${v.total} ont voté</div><div class="bar"><i style="width:${v.total ? (100 * v.count) / v.total : 0}%"></i></div></div>
        ${v.myVote ? `<div class="card accent small">✓ Ton vote est enregistré. Tu peux le changer tant que le vote est ouvert.</div>` : ''}
        <div class="spacer"></div>
        ${v.candidates.map((c) => `
          <button class="card choice ${current === c.id ? 'sel' : ''}" data-act="roomPick" data-id="${esc(c.id)}">
            <strong>${esc(c.name)}</strong> <span class="muted small">· ${esc(c.playedBy || '')}</span>
            ${v.myVote === c.id ? ' <span class="pill ok">ton vote</span>' : ''}
          </button>`).join('')}
        <div class="spacer"></div>
        <button class="btn primary" data-act="roomVote" ${current && current !== v.myVote ? '' : 'disabled'}>${v.myVote ? 'Changer mon vote' : 'Voter'}</button>`;
    }

    function renderReveal(s) {
      const r = s.result;
      const max = Math.max(1, ...r.tally.map((t) => t.votes));
      $app.innerHTML = `
        <div class="topbar"><button class="back" data-act="home">← Accueil</button><span class="phase">${PHASE_LABEL.reveal}</span></div>
        <div class="banner ${r.groupWins ? 'win' : 'lose'}">
          <h2>${r.groupWins ? 'Le groupe gagne !' : 'Le coupable gagne !'}</h2>
          <p>${r.culpritVotes} vote${r.culpritVotes > 1 ? 's' : ''} sur ${r.cast} contre le coupable (il en fallait ${r.needed}).</p>
          ${r.forced ? '<p class="small muted">Vote terminé par l’hôte : les absents se sont abstenus.</p>' : ''}
        </div>
        <div class="card culprit">
          <div class="label">Le coupable</div>
          <h2>${esc(r.culprit.name)}</h2>
          <p class="muted">Joué par ${esc(r.culprit.playedBy)}</p>
          <div class="label">Mobile</div><p>${esc(r.motive)}</p>
          <p class="small">${esc(r.where)}</p>
        </div>
        <div class="section-title">Les votes</div>
        <div class="card">
          ${r.tally.map((t) => `<div style="margin-bottom:10px"><div class="row"><span>${esc(t.name)}${t.charId === r.culprit.charId ? ' 🔪' : ''}</span><span style="flex:0 0 auto">${t.votes}</span></div><div class="bar"><i style="width:${(100 * t.votes) / max}%;${t.charId === r.culprit.charId ? '' : 'background:var(--muted)'}"></i></div></div>`).join('')}
          <p class="small muted">${r.ballots.map((b) => `${esc(b.name)} → ${esc(b.voteFor)}`).join(' · ')}</p>
        </div>
        <div class="section-title">Chronologie</div>
        <div class="card"><ul class="timeline">${r.timeline.map((e) => `<li><span class="t">${esc(e.t)}</span><span>${esc(e.text)}</span></li>`).join('')}</ul></div>
        <div class="section-title">Les preuves qui le confondaient</div>
        ${r.keys.map((k) => `<div class="card"><h3>${esc(k.title)}</h3><p class="small">${esc(k.why)}</p><p class="small muted">Détenu par ${esc(k.heldBy || '—')}</p></div>`).join('')}
        <div class="section-title">Les secrets de chacun</div>
        ${r.secrets.map((x) => `<div class="card secret"><div class="label">${esc(x.charName)} · ${esc(x.name)}</div><p class="small">${esc(x.secret)}</p></div>`).join('')}
        <div class="spacer"></div>
        <button class="btn primary" data-act="roomNew">Nouvelle partie</button>`;
    }

    actions.roomTab = (d) => { tab = d.tab; render(); window.scrollTo(0, 0); };
    actions.roomStart = () => act('start');
    actions.roomNext = () => { if (confirm('Passer à la manche 2 pour tout le monde ?')) act('nextRound'); };
    actions.roomOpenVote = () => { if (confirm('Ouvrir le vote pour tout le monde ?')) act('openVote'); };
    actions.roomCloseVote = () => { if (confirm('Terminer le vote maintenant ? Ceux qui n’ont pas voté s’abstiendront.')) act('closeVote'); };
    actions.roomShareClue = (d) => act('share', { clueId: d.id }).then((ok) => ok && toast('Indice posé sur la table'));
    actions.roomPick = (d) => { pickVote = d.id; render(); };
    actions.roomVote = () => { if (pickVote) act('vote', { target: pickVote }).then((ok) => { if (ok) { pickVote = null; toast('Vote enregistré'); } }); };
    actions.roomMarkLeft = (d) => { if (confirm(`Marquer ${d.name} comme parti ? Son vote ne sera plus attendu.`)) act('markLeft', { playerId: d.id }); };
    actions.roomRejoin = () => act('rejoin');
    actions.roomLeave = async () => {
      if (!confirm('Quitter la partie ?')) return;
      await act('leave');
      store.del('sessionStorage', 'dm_s_' + code);
      store.del('localStorage', 'dm_last');
      go('#/');
    };
    actions.roomNew = () => {
      store.del('sessionStorage', 'dm_s_' + code);
      store.del('localStorage', 'dm_last');
      go('#/creer');
    };
    actions.roomCopy = async () => {
      const link = shareLink();
      try {
        await navigator.clipboard.writeText(link);
        toast('Lien copié');
      } catch {
        const el = document.getElementById('link');
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        toast('Lien sélectionné : copie-le');
      }
    };
    actions.roomShare = () => {
      navigator.share({ title: 'Dossier Minuit', text: `Rejoins ma partie « Minuit au chalet » (code ${code})`, url: shareLink() }).catch(() => {});
    };

    return { mount };
  })();

  route();
})();
