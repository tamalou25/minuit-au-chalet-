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
    toastTimer = setTimeout(() => $toast.classList.remove('show'), 2400);
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

  // ---------- Icônes (traits simples, couleur du texte) ----------
  const ICONS = {
    talk: '<path d="M4 5h16v11H10l-6 4z"/><path d="M8 9.5h8M8 12.5h5"/>',
    search: '<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/>',
    folder: '<path d="M3 6.5h6l2 2h10V19H3z"/>',
    scale: '<path d="M12 4v16M7 20h10M5 7h14"/><path d="M5 7l-3 6a3 3 0 0 0 6 0zM19 7l-3 6a3 3 0 0 0 6 0z"/>',
    card: '<rect x="3" y="5" width="18" height="14" rx="1.5"/><circle cx="8.5" cy="11" r="2.2"/><path d="M5.5 16c.6-1.6 1.7-2.4 3-2.4s2.4.8 3 2.4M14 10h4.5M14 13.5h4.5"/>',
    doc: '<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9 12h7M9 16h5"/>',
    table: '<path d="M3 9h18l-2 4H5z"/><path d="M6 13v6M18 13v6"/>',
    people: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.4 2.7-6 6-6s6 2.6 6 6"/><circle cx="17" cy="9" r="2.4"/><path d="M15.8 14.2c2.9.3 5.2 2.5 5.2 5.8"/>',
    vote: '<path d="M4 12h16v8H4z"/><path d="M8 12V4h8v8"/><path d="M10 8l1.5 1.5L14.5 6.5"/>',
    show: '<path d="M6 3h9l4 4v14H6z"/><path d="M12 9.5v4.5M12 17v.4"/>',
  };
  const icon = (name) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

  // ---------- Pièces du dossier ----------
  const FORM_LABEL = {
    releve: 'Relevé', sms: 'SMS', photo: 'Photo', ecran: 'Capture d’écran', scelle: 'Scellé', note: 'Note manuscrite',
    affiche: 'Affichette', ticket: 'Ticket', inventaire: 'Inventaire', bon: 'Document', rapport: 'Rapport', constat: 'Constat',
    temoignage: 'Déposition', souvenir: 'Ton témoignage',
  };

  function photoScene(doc) {
    if (doc.scene === 'terrasse') {
      const heads = doc.people === 2
        ? '<circle cx="70" cy="74" r="7" fill="#101015"/><circle cx="92" cy="73" r="7" fill="#101015"/>'
        : '<circle cx="80" cy="73" r="7" fill="#101015"/>';
      return `<svg viewBox="0 0 160 120" preserveAspectRatio="xMidYMid slice">
        <rect width="160" height="120" fill="#232a33"/>
        <rect y="88" width="160" height="32" fill="#cfd4d8" opacity=".35"/>
        <path d="M0 26 L36 8 L72 26 V60 H0z" fill="#17191e"/>
        <rect x="14" y="34" width="14" height="12" fill="#d8a253" opacity=".7"/>
        <ellipse cx="81" cy="86" rx="42" ry="11" fill="#5c7f89"/>
        <ellipse cx="81" cy="84" rx="38" ry="8" fill="#7fa6ad"/>
        ${heads}
        <path d="M64 60c-4-6 4-8 0-14M82 58c-4-6 4-8 0-14M100 60c-4-6 4-8 0-14" stroke="#e8ecef" stroke-width="2" fill="none" opacity=".45"/>
        <g fill="#f4f4f4" opacity=".8"><circle cx="120" cy="20" r="1.4"/><circle cx="140" cy="44" r="1.2"/><circle cx="110" cy="52" r="1.3"/><circle cx="150" cy="16" r="1.1"/><circle cx="130" cy="70" r="1.3"/><circle cx="20" cy="70" r="1.2"/><circle cx="46" cy="66" r="1.3"/><circle cx="96" cy="14" r="1.2"/></g>
      </svg>`;
    }
    return `<svg viewBox="0 0 160 120" preserveAspectRatio="xMidYMid slice">
      <rect width="160" height="120" fill="#3a332b"/>
      <rect x="0" y="0" width="160" height="120" fill="#000" opacity=".25"/>
      <path d="M96 120V104h16V90h16V76h16V62h16v58z" fill="#24201b"/>
      <path d="M96 104h16M112 90h16M128 76h16M144 62h16" stroke="#5a5045" stroke-width="2"/>
      <rect x="118" y="10" width="34" height="46" fill="#171512" stroke="#6b5f50" stroke-width="2"/>
      <text x="135" y="36" text-anchor="middle" font-family="Courier Prime, monospace" font-size="9" fill="#a49680">CAVE</text>
      <circle cx="62" cy="40" r="10" fill="#121012"/>
      <path d="M44 120 L48 66 Q62 52 76 66 L82 120z" fill="#121012"/>
      <path d="M74 70 L92 58" stroke="#121012" stroke-width="8" stroke-linecap="round"/>
      <rect x="90" y="49" width="9" height="12" rx="1" fill="#efe8d6"/>
      <path d="M96 49 l4 -9 l4 9z" fill="#6f9e74"/>
    </svg>`;
  }

  function fieldsHtml(fields) {
    return `<dl class="fields">${fields.map(([k, v, hot]) => `<div class="${hot ? 'hot' : ''}"><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`;
  }

  // c : { title, text, doc?, kind?, who? } ; opts : { isNew, label, footer, stamp, extraClass }
  function piece(c, opts = {}) {
    const d = c.doc || { form: c.kind === 'temoignage' ? 'temoignage' : c.kind === 'indice' ? 'constat' : 'souvenir' };
    let label = opts.label || FORM_LABEL[d.form] || 'Pièce';
    if (d.form === 'souvenir' && d.mode) label = `Ton témoignage · ${d.mode}`;
    let body = '';
    switch (d.form) {
      case 'releve':
        body = `<table class="releve"><thead><tr>${d.cols.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>
          ${d.rows.map((r) => `<tr class="${r.hot ? 'hot' : ''}">${r.c.map((v, i) => `<td class="${i === 0 ? 't' : ''}">${esc(v)}${i === r.c.length - 1 && r.sub ? `<span class="sub">${esc(r.sub)}</span>` : ''}</td>`).join('')}</tr>`).join('')}
        </tbody></table>`;
        break;
      case 'sms':
        body = `<div class="phone"><div class="head"><strong>${esc(d.from)}</strong><span>SMS</span></div>
          <div class="bubble-in">${esc(d.body)}</div><div class="time hot">Reçu à ${esc(d.time)}</div></div>`;
        break;
      case 'ecran':
        body = `<div class="phone"><div class="head"><span>${esc(d.app)}</span><span>${esc(d.time || '')}</span></div>
          <div class="head" style="margin-top:-4px"><span>Compte connecté : <strong>${esc(d.account)}</strong></span></div>
          ${d.thread.map(([from, msg, mine]) => mine
            ? `<div class="bubble-out">${esc(msg)}</div>`
            : `<div class="notif"><div class="from">${esc(from)}</div><div>${esc(msg)}</div></div>`).join('')}</div>`;
        break;
      case 'photo':
        body = `<div class="polaroid"><div class="img">${photoScene(d)}<span class="ts">${esc(d.stamp)}</span></div><div class="cap">${esc(d.caption)}</div></div>`;
        break;
      case 'scelle':
        body = `<div class="tagline">SCELLÉ · ${esc(d.num)}</div><div class="inner">${fieldsHtml(d.fields)}</div>`;
        break;
      case 'note':
        body = `<div class="note-hand">« ${esc(d.body)} »<div class="sign">${esc(d.sign)}</div></div>`;
        break;
      case 'affiche':
        body = `<div class="affiche"><span class="big">${esc(d.big)}</span>${esc(d.body)}</div>`;
        break;
      case 'ticket':
        body = `<div class="ticket"><div class="th">${esc(d.head)}</div>${d.lines.map(([l, r, hot]) => `<div class="ln ${hot ? 'hot' : ''}"><span>${esc(l)}</span><span>${esc(r)}</span></div>`).join('')}</div>`;
        break;
      case 'inventaire':
        body = `<ul class="inv">${d.items.map(([k, v, hot]) => `<li class="${hot ? 'hot' : ''}"><span>${esc(k)}</span><span class="${hot ? '' : 'ok'}">${esc(v)}</span></li>`).join('')}</ul>`;
        break;
      case 'bon': case 'rapport': case 'constat':
        body = d.fields ? fieldsHtml(d.fields) : `<p class="txt doc">${esc(c.text)}</p>`;
        if (d.sign) body += `<p class="foot" style="text-align:right">${esc(d.sign)}</p>`;
        break;
      case 'temoignage':
        body = `<div class="transcript"><p class="r"><span class="who">${esc(opts.who || 'Témoin')} —</span> ${esc(c.text)}</p></div>`;
        break;
      default: // souvenir
        body = `${d.at ? `<div class="when">${esc(d.at)}</div>` : ''}<p class="txt">${esc(c.text)}</p>`;
    }
    const sub = d.head && d.head !== c.title ? `<span>${esc(d.head)}</span>` : '';
    return `<article class="piece ${d.form === 'scelle' ? 'scelle' : ''} ${d.form} ${opts.extraClass || ''}">
      <div class="ptype"><span>${esc(label)}</span>${opts.isNew ? '<span class="new">Nouveau</span>' : ''}</div>
      <h3>${esc(c.title)}</h3>
      ${sub ? `<div class="ptype" style="margin:-4px 0 8px">${sub}</div>` : ''}
      ${opts.stamp ? `<div class="stamp-row"><span class="stamp">${esc(opts.stamp)}</span></div>` : ''}
      ${body}
      ${d.foot ? `<p class="foot">${esc(d.foot)}</p>` : ''}
      ${opts.footer ? `<div class="pfoot">${opts.footer}</div>` : ''}
    </article>`;
  }

  const BADGE_SVG = `<svg width="46" height="46" viewBox="0 0 46 46" aria-hidden="true"><rect x="4" y="12" width="26" height="18" rx="3" fill="#2a2219"/><rect x="8" y="16" width="8" height="6" rx="1" fill="#cfb487"/><circle cx="33" cy="21" r="3" fill="none" stroke="#2a2219" stroke-width="2"/><path d="M36 21h2M38 12l5 11h-10z" fill="#5f8f67" stroke="#3d6b45" stroke-width="1"/><path d="M38 23v4" stroke="#6b4a2b" stroke-width="2"/></svg>`;

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
    bg.innerHTML = `<div class="modal" role="dialog"><div class="handle"></div>${html}</div>`;
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
    const C = window.SOLO_CASE;
    const soloRunning = solo && solo.started && !solo.verdict;
    $app.innerHTML = `
      <header class="brand">
        <div class="word">Dossier <em>Minuit</em></div>
        <div class="rule"></div>
        <div class="tag">Ouvrez l’affaire. Recoupez les pièces.</div>
      </header>

      <div class="join-lbl">Rejoindre avec un code</div>
      <form class="joinbar" data-submit="homeJoin" aria-label="Rejoindre avec un code">
        <input id="hcode" class="code" type="text" maxlength="4" autocomplete="off" autocapitalize="characters" placeholder="CODE" aria-label="Code de la salle">
        <button class="btn primary" type="submit">Rejoindre</button>
      </form>
      ${last ? `<div class="resume"><span class="grow" style="flex:1">Partie en cours : salle <strong>${esc(last.code)}</strong> · ${esc(last.name)}</span><button class="btn sm outline" data-act="resume">Reprendre</button></div>` : ''}

      <section class="folder">
        <div class="tab">Dossier n° 01 · Solo</div>
        <div class="body"><div class="sheet">
          <h2>${esc(C.title)}</h2>
          <p class="pitch">Pendant l’entracte, un violon de 1742 disparaît d’une loge fermée. Trois suspects, une seule porte.</p>
          <div class="facts"><span class="fact">1 joueur</span><span class="fact">10–15 min</span><span class="fact red">3 suspects</span></div>
          <div class="mini-releve" aria-label="Extrait : journal de la serrure">
            <div class="mh"><span>Serrure · loge d’Anton</span><span>Extrait</span></div>
            <div class="mr"><b>21 h 29</b><span>Carte A. Weiss · sortie</span></div>
            <div class="mr hot"><b>21 h 38</b><span>PASSE GÉNÉRAL</span></div>
            <div class="mr"><b>21 h 50</b><span>Carte A. Weiss · étui vide</span></div>
          </div>
          <button class="btn primary" data-act="nav" data-to="#/solo">${soloRunning ? 'Reprendre l’enquête' : 'Ouvrir le dossier'}</button>
        </div></div>
      </section>

      <section class="folder">
        <div class="tab">Dossier n° 02 · Entre amis</div>
        <div class="body"><div class="sheet">
          <h2>Minuit au chalet</h2>
          <p class="pitch">À minuit, le coffret de la médaille est vide. La route est bloquée par la neige : le coupable est assis à votre table.</p>
          <div class="facts"><span class="fact">3 à 8 joueurs</span><span class="fact">15–25 min</span><span class="fact red">1 coupable</span></div>
          <div class="badge-tag">${BADGE_SVG}<div><strong>Badge de Nora</strong><span>Porte-clés sapin. Le seul qui ouvre la cave.</span></div></div>
          <div class="actions">
            <button class="btn primary" data-act="nav" data-to="#/creer">Créer une partie</button>
          </div>
        </div></div>
      </section>

      <p class="foot-note">Prototype · contenu entièrement fictif · tout reste sur ce réseau.</p>`;
  }
  actions.nav = (d) => go(d.to);
  actions.home = () => go('#/');
  actions.homeJoin = (form) => {
    const code = form.querySelector('#hcode').value.trim().toUpperCase();
    go('#/rejoindre/' + code);
  };
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
      <button class="link" data-act="home">‹ Accueil</button>
      <div class="kicker">Dossier n° 02</div>
      <h1>Minuit au chalet</h1>
      <p class="muted">Tu ouvres la salle et tu joues comme les autres. Il faut 3 à 8 joueurs.</p>
      <form data-submit="create" class="stack">
        <div><label for="name">Ton pseudo</label><input id="name" type="text" maxlength="20" autocomplete="off" required placeholder="Ex. : Gary"></div>
        <div class="error" id="err"></div>
        <button class="btn primary" type="submit">Ouvrir la salle</button>
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
      <button class="link" data-act="home">‹ Accueil</button>
      <div class="kicker">Dossier n° 02 · Minuit au chalet</div>
      <h1>Rejoindre la partie</h1>
      <form data-submit="join" class="stack">
        <div><label for="code">Code de la salle</label><input id="code" class="code" type="text" maxlength="4" autocomplete="off" autocapitalize="characters" value="${esc(code)}" placeholder="ABCD" required></div>
        <div><label for="name">Ton pseudo</label><input id="name" type="text" maxlength="20" autocomplete="off" required placeholder="Ex. : Léna"></div>
        <div class="error" id="err"></div>
        <button class="btn primary" type="submit">Rejoindre</button>
      </form>`;
    document.getElementById(code.length === 4 ? 'name' : 'code').focus();
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
    const VERSION_CHANGES = ['T_VICTOR_AVEU', 'T_CAMILLE_COULOIR'];
    let S;
    let ui;

    const freshUi = () => ({ tab: 'suspects', suspect: null, exchange: null, vSuspect: null, vProof: null });
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
    const suspectName = (id) => (C.suspects.find((s) => s.id === id) || {}).name;
    const clue = (id) => ({ id, ...C.clues[id] });
    const soloPiece = (id, opts = {}) => {
      const c = clue(id);
      return piece(c, {
        who: c.who ? suspectName(c.who) : undefined,
        stamp: VERSION_CHANGES.includes(id) ? 'Nouvelle version' : undefined,
        ...opts,
      });
    };

    function mount() {
      S = store.get('localStorage', KEY) || fresh();
      ui = freshUi();
      render();
    }

    function render() {
      if (!S.started) return renderIntro();
      if (S.verdict) return renderResult();
      let body = '';
      let sticky = '';
      if (ui.tab === 'suspects' && ui.suspect) {
        body = renderSuspect(ui.suspect);
        sticky = `<button class="btn primary" data-act="soloConfrontOpen">${icon('show')}Confronter à une pièce</button>`;
      } else if (ui.tab === 'suspects') body = renderSuspects();
      else if (ui.tab === 'lieux') body = renderLieux();
      else if (ui.tab === 'carnet') body = renderCarnet();
      else if (ui.tab === 'verdict') {
        body = renderVerdict();
        sticky = `<button class="btn primary" data-act="soloVerdict" ${ui.vSuspect && ui.vProof ? '' : 'disabled'}>${icon('scale')}Prononcer le verdict</button>`;
      }
      const n = unseen();
      $app.className = 'app' + (sticky ? ' has-sticky' : '');
      $app.innerHTML = `
        <div class="topbar">
          <button class="link" data-act="home">‹ Dossiers</button>
          <span class="tag-soft">${S.clues.length} pièces</span>
        </div>
        ${body}
        ${sticky ? `<div class="sticky-action"><div class="inner">${sticky}</div></div>` : ''}
        <nav class="tabs"><div class="inner">
          ${tabBtn('suspects', 'talk', 'Interroger')}
          ${tabBtn('lieux', 'search', 'Fouiller')}
          ${tabBtn('carnet', 'folder', 'Dossier', n)}
          ${tabBtn('verdict', 'scale', 'Verdict')}
        </div></nav>`;
      if (ui.tab === 'carnet') { S.seen = S.clues.slice(); save(); }
    }
    function tabBtn(id, ico, label, badge) {
      return `<button class="${ui.tab === id ? 'on' : ''}" data-act="soloTab" data-tab="${id}">${icon(ico)}${label}${badge ? `<span class="badge">${badge}</span>` : ''}</button>`;
    }

    function renderIntro() {
      $app.className = 'app';
      $app.innerHTML = `
        <button class="link" data-act="home">‹ Dossiers</button>
        <div class="kicker">Dossier n° 01 · ${esc(C.place)}</div>
        <h1>${esc(C.title)}</h1>
        <p>${esc(C.intro[1])}</p>
        <p class="muted">${esc(C.intro[2])}</p>
        <div class="spacer"></div>
        ${soloPiece('F_RAPPORT', { label: 'Première pièce' })}
        <p>${esc(C.intro[3])}</p>
        <div class="section"><h3>Votre méthode</h3></div>
        <div class="card small">
          <p><strong>Interroger.</strong> Choisissez un suspect et une question. D’autres questions apparaissent avec les pièces.</p>
          <p><strong>Fouiller.</strong> Les témoignages ouvrent de nouveaux lieux.</p>
          <p><strong>Confronter.</strong> Montrez la bonne pièce : un suspect peut changer de version.</p>
          <p style="margin:0"><strong>Juger.</strong> Un coupable, une preuve. Un seul essai.</p>
        </div>
        <div class="spacer"></div>
        <button class="btn primary" data-act="soloStart">${icon('talk')}Commencer les interrogatoires</button>`;
    }

    function renderSuspects() {
      return `
        <div class="kicker">${esc(C.title)}</div>
        <h2>Qui interroger ?</h2>
        <p class="hint">Entracte : 21 h 30 – 21 h 50. Le violon a été caché pendant ces vingt minutes.</p>
        ${C.suspects.map((s) => {
          const fresh = C.questions[s.id].filter(reqOk).filter((q) => !S.asked[q.id]).length;
          return `
          <div class="suspect-card">
            <span class="mug">${esc(s.initial)}</span>
            <div class="grow"><h3>${esc(s.name)}</h3><div class="role">${esc(s.role)}</div>
              ${fresh ? `<div class="new-q">${fresh} question${fresh > 1 ? 's' : ''} à poser</div>` : ''}</div>
            <button class="btn sm primary" data-act="soloSuspect" data-id="${s.id}">Interroger</button>
          </div>`;
        }).join('')}`;
    }

    function renderSuspect(id) {
      const s = C.suspects.find((x) => x.id === id);
      const qs = C.questions[id].filter(reqOk);
      const ex = ui.exchange && ui.exchange.suspect === id ? ui.exchange : null;
      const short = s.name.split(' ').map((w, i) => (i === 0 ? w[0] + '.' : w)).join(' ').toUpperCase();
      const pv = ex ? `
        <article class="piece pv">
          <div class="ptype"><span>Procès-verbal d’audition</span></div>
          ${ex.change ? '<div class="stamp-row"><span class="stamp big">Nouvelle version</span></div>' : ''}
          <div class="transcript" style="margin-top:10px">
            <p class="q"><span class="who">Inspecteur —</span> ${esc(ex.q)}</p>
            <p class="r"><span class="who">${esc(short)} —</span> ${esc(ex.a)}</p>
          </div>
          ${ex.note ? `<p class="note-insp">Note : ${esc(ex.note)}</p>` : ''}
          ${ex.added && ex.added.length ? `<div class="added">Versé au dossier : ${ex.added.map((cid) => esc(C.clues[cid].title)).join(' · ')}</div>` : ''}
        </article>` : `
        <article class="piece pv">
          <div class="ptype"><span>Procès-verbal d’audition</span></div>
          <p class="txt doc" style="color:var(--paper-dim)">${esc(s.desc)}</p>
        </article>`;
      return `
        <button class="link" data-act="soloSuspect" data-id="">‹ Tous les suspects</button>
        <div class="suspect-head"><span class="mug">${esc(s.initial)}</span>
          <div><div class="kicker">Audition</div><h2>${esc(s.name)}</h2><div class="role">${esc(s.role)}</div></div></div>
        ${pv}
        <div class="section"><h3>Poser une question</h3></div>
        ${qs.map((q) => `<button class="qbtn ${S.asked[q.id] ? 'done' : 'fresh'}" data-act="soloAsk" data-id="${q.id}">
          <span style="flex:1">${esc(q.q)}</span><span class="mark">${S.asked[q.id] ? 'Posée' : 'Nouvelle'}</span></button>`).join('')}`;
    }

    function renderCarnet() {
      const list = S.clues.slice().reverse();
      const ind = list.filter((id) => C.clues[id].kind === 'indice');
      const tem = list.filter((id) => C.clues[id].kind === 'temoignage');
      return `
        <div class="kicker">${esc(C.title)}</div>
        <h2>Le dossier</h2>
        <p class="hint">Recoupez : qui ment, et quelle pièce le prouve ?</p>
        <div class="section"><h3>Pièces matérielles</h3><span class="count">${ind.length}</span></div>
        ${ind.map((id) => soloPiece(id, { isNew: !S.seen.includes(id) })).join('')}
        <div class="section"><h3>Dépositions</h3><span class="count">${tem.length}</span></div>
        ${tem.map((id) => soloPiece(id, { isNew: !S.seen.includes(id) })).join('') || '<p class="muted">Aucune pour l’instant. Interrogez les suspects.</p>'}`;
    }

    function renderLieux() {
      const locs = C.locations.filter(reqOk);
      const locked = C.locations.length - locs.length;
      return `
        <div class="kicker">${esc(C.title)}</div>
        <h2>Fouiller les lieux</h2>
        <p class="hint">Chaque fouille verse une pièce au dossier.</p>
        ${locs.map((l) => `
          <div class="card">
            <h3>${esc(l.name)}</h3>
            <p class="small muted">${esc(l.desc)}</p>
            ${l.items.map((it) => S.examined[it.id]
              ? soloPiece(it.gives)
              : `<button class="btn primary" data-act="soloExamine" data-id="${it.id}" style="margin-top:8px">${icon('search')}${esc(it.label)}</button>`).join('')}
          </div>`).join('')}
        ${locked ? `<p class="muted small center">${locked} lieu${locked > 1 ? 'x' : ''} encore fermé${locked > 1 ? 's' : ''} : les dépositions vous y mèneront.</p>` : ''}`;
    }

    function renderVerdict() {
      const proofs = S.clues.filter((id) => !C.start.includes(id)).slice().reverse();
      return `
        <div class="kicker">${esc(C.title)}</div>
        <h2>Le verdict</h2>
        <p class="hint">Un seul essai : le coupable, et la pièce la plus solide contre lui.</p>
        <div class="section"><h3>1. Le coupable</h3></div>
        ${C.suspects.map((s) => `
          <button class="choice ${ui.vSuspect === s.id ? 'sel' : ''}" data-act="soloPickSuspect" data-id="${s.id}">
            <span class="radio"></span><span class="mug" style="width:44px;height:50px;flex-basis:44px;font-size:20px">${esc(s.initial)}</span>
            <span class="grow"><strong>${esc(s.name)}</strong><span>${esc(s.role)}</span></span>
          </button>`).join('')}
        <div class="section"><h3>2. La preuve</h3></div>
        ${proofs.length ? proofs.map((id) => `
          <button class="choice paperish ${ui.vProof === id ? 'sel' : ''}" data-act="soloPickProof" data-id="${id}">
            <span class="radio"></span>
            <span class="grow"><strong>${esc(C.clues[id].title)}</strong><span>${C.clues[id].kind === 'indice' ? 'Pièce matérielle' : 'Déposition'}</span></span>
          </button>`).join('') : '<p class="muted">Le dossier est encore vide. Enquêtez d’abord.</p>'}`;
    }

    function renderResult() {
      const v = S.verdict;
      const sol = C.solution;
      const culprit = C.suspects.find((s) => s.id === sol.culprit);
      const accused = C.suspects.find((s) => s.id === v.suspect);
      let cls, stamp, title, msg;
      if (v.suspect !== sol.culprit) {
        cls = 'lose'; stamp = 'Erreur judiciaire'; title = `${accused.name} était innocent·e`;
        msg = 'La coupable a profité de votre erreur.';
      } else if (sol.strong.includes(v.proof)) {
        cls = 'win'; stamp = 'Affaire résolue'; title = 'Camille Roux est confondue';
        msg = 'Bonne coupable, preuve implacable.';
      } else if (sol.medium.includes(v.proof)) {
        cls = 'mid'; stamp = 'Dossier fragile'; title = 'Bonne coupable, preuve faible';
        msg = 'L’avocat de Camille Roux va s’en donner à cœur joie. Il fallait une preuve matérielle plus directe.';
      } else {
        cls = 'mid'; stamp = 'Dossier fragile'; title = 'Bonne intuition, mauvaise preuve';
        msg = 'Cette pièce n’accuse pas la coupable. Le juge hésite.';
      }
      const total = Object.keys(C.clues).length;
      $app.className = 'app';
      $app.innerHTML = `
        <div class="topbar"><button class="link" data-act="home">‹ Dossiers</button><span class="tag-soft">Dossier n° 01</span></div>
        <div class="verdict-banner ${cls}">
          <span class="stamp big" style="background:transparent;${cls === 'win' ? 'color:var(--green);border-color:var(--green)' : cls === 'lose' ? 'color:var(--brick-light);border-color:var(--brick-light)' : 'color:var(--kraft);border-color:var(--kraft)'}">${esc(stamp)}</span>
          <h2>${esc(title)}</h2><p>${esc(msg)}</p>
          <p class="small muted" style="margin:0">Votre verdict : ${esc(accused.name)} · « ${esc(C.clues[v.proof].title)} »</p>
        </div>
        <article class="piece">
          <div class="ptype"><span>La coupable</span></div>
          <span class="stamp abs">Coupable</span>
          <h3 style="font-size:24px">${esc(culprit.name)}</h3>
          <p class="txt">${esc(sol.motive)}</p>
        </article>
        <div class="section"><h3>Ce qui s’est passé</h3></div>
        <article class="piece"><ul class="timeline">${sol.timeline.map((e) => `<li><span class="t">${esc(e.t)}</span><span>${esc(e.text)}</span></li>`).join('')}</ul></article>
        <div class="section"><h3>Les recoupements</h3></div>
        ${sol.deductions.map((d, i) => `
          <article class="piece"><div class="ptype"><span>Déduction ${i + 1}</span></div>
            <p class="txt">${esc(d.text)}</p>
            <div style="margin-top:8px">${d.clues.map((id) => `<span class="chip ${hasClue(id) ? 'ok' : 'no'}">${esc(C.clues[id].title)}</span>`).join('')}</div>
          </article>`).join('')}
        <div class="card small">
          <p>${S.clues.length} / ${total} pièces trouvées · ${Object.keys(S.asked).length} questions · ${Object.keys(S.tried).length} confrontations.</p>
          <p style="margin:0">Changements de version obtenus : ${S.changes.length ? S.changes.map((id) => esc(C.clues[id].title)).join(', ') : 'aucun'}.</p>
        </div>
        <div class="stack">
          <button class="btn primary" data-act="soloRestart">Rejouer l’enquête</button>
          <button class="btn outline" data-act="home">Retour aux dossiers</button>
        </div>`;
      window.scrollTo(0, 0);
    }

    function setExchange(suspect, q, a, note, gives, change) {
      const added = addClues(gives);
      if (change && added.length) S.changes.push(added[0]);
      ui.exchange = { suspect, q, a, note, added, change: change && added.length > 0 };
      S.actions++;
      save();
      if (added.length) toast(ui.exchange.change ? `${suspectName(suspect).split(' ')[0]} change de version` : `Versé au dossier : ${C.clues[added[0]].title}`);
      render();
      const pv = document.querySelector('.pv');
      if (pv) pv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    actions.soloStart = () => { S.started = true; save(); render(); window.scrollTo(0, 0); };
    actions.soloTab = (d) => { ui.tab = d.tab; if (d.tab !== 'suspects') ui.suspect = null; render(); window.scrollTo(0, 0); };
    actions.soloSuspect = (d) => { ui.tab = 'suspects'; ui.suspect = d.id || null; ui.exchange = null; render(); window.scrollTo(0, 0); };
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
        <div class="kicker">Confrontation</div>
        <h2>Quelle pièce montrer à ${esc(s.name)} ?</h2>
        <p class="hint">Choisissez la pièce qui contredit sa version.</p>
        ${list.map((id) => {
          const tried = S.tried[`${s.id}:${id}`];
          return `<button class="choice paperish" data-act="soloConfront" data-id="${id}">
            <span class="grow"><strong>${esc(C.clues[id].title)}</strong>
            <span>${C.clues[id].kind === 'indice' ? 'Pièce matérielle' : 'Déposition'}${tried ? ' · déjà montrée' : ''}</span></span></button>`;
        }).join('')}
        <button class="btn outline" data-act="closeModal" style="margin-top:6px">Annuler</button>`);
    };
    actions.soloConfront = (d) => {
      closeModal();
      const sid = ui.suspect;
      const table = C.confront[sid];
      const variants = table[d.id] || [];
      const v = variants.find((x) => (x.ifHas || []).every(hasClue)) || { a: table.default };
      S.tried[`${sid}:${d.id}`] = true;
      setExchange(sid, `(Lui montre la pièce « ${C.clues[d.id].title} ».)`, v.a, v.note, v.gives, Boolean(v.change));
    };
    actions.soloExamine = (d) => {
      for (const l of C.locations) {
        const it = l.items.find((x) => x.id === d.id);
        if (!it) continue;
        S.examined[it.id] = true;
        S.actions++;
        const added = addClues([it.gives]);
        save();
        if (added.length) toast(`Versé au dossier : ${C.clues[it.gives].title}`);
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
      ui = freshUi();
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
    let seenClues = 0;
    let pickVote = null;
    let busy = false;

    const PHASE_LABEL = { lobby: 'Salle d’attente', round1: 'Manche 1 / 2', round2: 'Manche 2 / 2', vote: 'Vote', reveal: 'Révélation' };
    const ROUND_LABEL = { 0: 'Sur ta fiche', 1: 'Manche 1', 2: 'Manche 2' };

    function mount(c) {
      code = c;
      session = store.get('sessionStorage', 'dm_s_' + code);
      if (!session) return go('#/rejoindre/' + code);
      state = null; lastJson = ''; tab = 'fiche'; lastPhase = null; seenClues = 0; pickVote = null;
      $app.className = 'app';
      $app.innerHTML = '<p class="muted center" style="margin-top:40px">Ouverture du dossier…</p>';
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
          $app.className = 'app';
          $app.innerHTML = `<div class="card center stack" style="margin-top:40px"><h3>Salle introuvable</h3>
            <p class="muted">${esc(e.message)} Le serveur a peut-être redémarré.</p>
            <button class="btn primary" data-act="home">Retour aux dossiers</button></div>`;
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
        if (s.phase === 'round1') { tab = 'fiche'; toast('La partie commence : lis ta fiche'); }
        if (s.phase === 'round2') { tab = 'indices'; toast('Manche 2 : nouvelle pièce reçue'); }
        if (s.phase === 'vote') { tab = 'vote'; toast('Le vote est ouvert'); }
        window.scrollTo(0, 0);
      }
      lastPhase = s.phase;
      render();
    }

    async function act(type, extra = {}) {
      if (busy) return false;
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
      $app.className = 'app';
      if (s.me.left) {
        $app.innerHTML = `<div class="card center stack" style="margin-top:40px"><h3>Tu as quitté la partie</h3>
          <p class="muted">Ton personnage t’attend.</p>
          <button class="btn primary" data-act="roomRejoin">Revenir dans la partie</button>
          <button class="btn outline" data-act="home">Retour aux dossiers</button></div>`;
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
        <div class="topbar"><button class="link" data-act="home">‹ Dossiers</button><span class="tag-phase">${PHASE_LABEL.lobby}</span></div>
        <div class="kicker">Dossier n° 02</div>
        <h1>Minuit au chalet</h1>
        <div class="card center">
          <div class="kicker" style="color:var(--chalk-dim)">Code de la salle</div>
          <div class="code-big">${esc(s.code)}</div>
          <div class="link-box" id="link">${esc(link)}</div>
          <div class="row" style="margin-top:10px">
            <button class="btn sm outline grow" data-act="roomCopy">Copier le lien</button>
            ${navigator.share ? '<button class="btn sm outline grow" data-act="roomShare">Partager</button>' : ''}
          </div>
          <p class="muted small" style="margin:10px 0 0">Les autres ouvrent ce lien sur leur téléphone (même Wi-Fi) ou tapent le code à l’accueil.</p>
        </div>
        <div class="section"><h3>Autour de la table</h3><span class="count">${n} / ${s.max}</span></div>
        <div class="card"><ul class="plist">
          ${active.map((p) => `<li><span><span class="dot ${p.online ? 'on' : ''}"></span>${esc(p.name)}${p.id === s.me.id ? ' <span class="muted">(toi)</span>' : ''}</span>${p.isHost ? '<span class="tag-soft">Hôte</span>' : ''}</li>`).join('')}
        </ul></div>
        ${s.me.isHost ? `
          <button class="btn primary" data-act="roomStart" ${canStart ? '' : 'disabled'}>Distribuer les fiches</button>
          <p class="muted small center" style="margin-top:8px">${canStart ? `${n} joueurs : chacun reçoit un personnage différent, toi compris.` : `Encore ${Math.max(0, s.min - n)} joueur${s.min - n > 1 ? 's' : ''} pour commencer (minimum ${s.min}).`}</p>`
          : '<div class="now"><div class="what">En attente de l’hôte</div><div class="then">Les fiches seront distribuées dès que tout le monde est là.</div></div>'}
        <button class="btn ghost" data-act="roomLeave">Quitter la salle</button>`;
    }

    function nowStrip(s) {
      if (s.phase === 'round1') return { what: 'Présente ton personnage et ton alibi.', then: 'Puis lis tes pièces et pose les utiles sur la table.' };
      if (s.phase === 'round2') return { what: 'Nouvelle pièce reçue. Confrontez vos versions.', then: 'Les heures, le badge, les photos : qui ment ?' };
      if (s.phase === 'vote') return { what: s.vote.myVote ? 'Ton vote est enregistré.' : 'Vote en secret pour le coupable.', then: `${s.vote.count} / ${s.vote.total} ont voté.` };
      return null;
    }

    function hostBar(s) {
      if (!s.me.isHost) return '';
      const wrap = (txt, btn) => `<div class="hostbar"><div class="who">Tu mènes la partie</div><div class="small" style="margin-bottom:10px">${txt}</div>${btn}</div>`;
      if (s.phase === 'round1') return wrap('Quand chacun s’est présenté :', '<button class="btn primary" data-act="roomNext">Lancer la manche 2</button>');
      if (s.phase === 'round2') return wrap('Quand le groupe a fini de débattre :', '<button class="btn primary" data-act="roomOpenVote">Ouvrir le vote</button>');
      if (s.phase === 'vote') return wrap('Quelqu’un est parti ou bloqué ? Termine le vote : les absents s’abstiennent.', `<button class="btn outline" data-act="roomCloseVote" ${s.vote.count ? '' : 'disabled'}>Terminer le vote maintenant</button>`);
      return '';
    }

    function renderGame(s) {
      let body = '';
      let sticky = '';
      if (tab === 'vote' && s.phase !== 'vote') tab = 'fiche';
      if (tab === 'fiche') body = renderFiche(s);
      else if (tab === 'indices') { body = renderIndices(s); seenClues = (s.clues || []).length; }
      else if (tab === 'table') body = renderTable(s);
      else if (tab === 'joueurs') body = renderJoueurs(s);
      else if (tab === 'vote') {
        body = renderVote(s);
        const current = pickVote || s.vote.myVote;
        sticky = `<button class="btn primary" data-act="roomVote" ${current && current !== s.vote.myVote ? '' : 'disabled'}>${icon('vote')}${s.vote.myVote ? (current !== s.vote.myVote ? 'Changer mon vote' : 'Vote enregistré') : 'Voter'}</button>`;
      }
      const now = nowStrip(s);
      const unseen = Math.max(0, (s.clues || []).length - seenClues);
      $app.className = 'app' + (sticky ? ' has-sticky' : '');
      $app.innerHTML = `
        <div class="topbar"><span class="case">Minuit au chalet</span><span class="tag-phase">${PHASE_LABEL[s.phase]}</span></div>
        ${now ? `<div class="now"><div class="what">${esc(now.what)}</div><div class="then">${esc(now.then)}</div></div>` : ''}
        ${hostBar(s)}
        ${body}
        ${sticky ? `<div class="sticky-action"><div class="inner">${sticky}</div></div>` : ''}
        <nav class="tabs"><div class="inner">
          ${s.phase === 'vote' ? gTab('vote', 'vote', 'Voter', s.vote.myVote ? 0 : '!') : ''}
          ${gTab('fiche', 'card', 'Ma fiche')}
          ${gTab('indices', 'doc', 'Mes pièces', unseen)}
          ${gTab('table', 'table', 'Table', s.table.length)}
          ${gTab('joueurs', 'people', 'Joueurs')}
        </div></nav>`;
    }
    function gTab(id, ico, label, badge) {
      return `<button class="${tab === id ? 'on' : ''}" data-act="roomTab" data-tab="${id}">${icon(ico)}${esc(label)}${badge ? `<span class="badge">${esc(badge)}</span>` : ''}</button>`;
    }

    function renderFiche(s) {
      const c = s.card;
      const guilty = c.role === 'coupable';
      return `
        <section class="idcard">
          <div class="band"><span>Fiche personnage</span><span>Privée</span></div>
          <div class="main">
            <span class="stamp ${guilty ? '' : 'ink'}">${guilty ? 'Coupable' : 'Innocent·e'}</span>
            <h2>${esc(c.name)}</h2>
            <p class="desc">${esc(c.desc)}</p>
          </div>
        </section>
        ${guilty ? `
          <div class="block alibi">
            <div class="bt"><span>Ta version</span><span class="how">à défendre à voix haute</span></div>
            <p>${esc(c.alibi)}</p>
          </div>
          <div class="block truth">
            <div class="bt"><span>Ce qui s’est passé</span><span class="how">ne le montre à personne</span></div>
            <p class="small">${esc(c.truth)}</p>
            <ul>${c.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
          </div>` : `
          <div class="block alibi">
            <div class="bt"><span>Alibi</span><span class="how">à dire à voix haute</span></div>
            <p>${esc(c.alibi)}</p>
          </div>`}
        <div class="block secret">
          <div class="bt"><span>Secret</span><span class="how">à garder pour toi</span></div>
          <p>${esc(c.secret)}</p>
        </div>
        <button class="btn outline" data-act="roomTab" data-tab="indices">${icon('doc')}Voir mes pièces (${(s.clues || []).length})</button>
        <div class="spacer"></div>
        <details class="affaire" ${s.phase === 'round1' ? 'open' : ''}><summary>L’affaire</summary>
          <div class="content">
            ${s.intro.text.map((p) => `<p>${esc(p)}</p>`).join('')}
            <div class="badge-tag" style="margin:12px 0">${BADGE_SVG}<div><strong>Badge de Nora</strong><span>Le seul badge du chalet. Il ouvre la cave et le local à bois.</span></div></div>
            ${s.intro.facts.slice(1).map((f) => `<p class="small muted">${esc(f)}</p>`).join('')}
          </div>
        </details>`;
    }

    function renderIndices(s) {
      const current = s.phase === 'round1' ? 1 : 2;
      const list = (s.clues || []).slice().sort((a, b) => b.round - a.round);
      return `
        <h2>Mes pièces</h2>
        <p class="hint">Personne d’autre ne les voit. Lis-les à voix haute, ou pose-les sur la table pour les montrer.</p>
        ${list.map((c) => piece(c, {
          isNew: c.round === current && current > 0,
          label: undefined,
          footer: `<span class="meta">${ROUND_LABEL[c.round]}</span>${c.shared
            ? '<span class="on-table">Sur la table</span>'
            : `<button class="btn primary sm" data-act="roomShareClue" data-id="${esc(c.id)}">${icon('table')}Poser sur la table</button>`}`,
        })).join('')}
        ${s.phase === 'round1' ? '<p class="muted small center">Une nouvelle pièce arrive à la manche 2.</p>' : ''}`;
    }

    function renderTable(s) {
      return `
        <h2>La table</h2>
        <p class="hint">Les pièces que les joueurs ont choisi de montrer à tous.</p>
        ${s.table.length ? s.table.slice().reverse().map((t) => piece(t, {
          footer: `<span class="meta">Posée par <strong>${esc(t.byName)}</strong> · ${esc(t.byChar)}</span>`,
        })).join('') : '<div class="card muted center">Rien sur la table. Depuis « Mes pièces », pose une preuve pour la montrer à tous.</div>'}`;
    }

    function renderJoueurs(s) {
      return `
        <h2>Les personnages</h2>
        ${s.intro.cast.map((c) => {
          const p = s.players.find((pl) => pl.charName === c.name);
          return `<div class="card">
            <div class="row"><div class="grow"><h3 style="margin:0">${esc(c.name)}</h3><div class="muted small">Joué par ${esc(c.playedBy || '—')}${p && p.id === s.me.id ? ' (toi)' : ''}</div></div>
            <div style="text-align:right;font-size:14px">
              ${p ? (p.left ? '<span class="tag-soft">Parti</span>' : `<span class="dot ${p.online ? 'on' : ''}"></span><span class="muted">${p.online ? 'en ligne' : 'hors ligne'}</span>`) : ''}
              ${p && p.isHost ? '<div class="muted">hôte</div>' : ''}
              ${p && s.phase === 'vote' && !p.left ? `<div class="${p.voted ? '' : 'muted'}">${p.voted ? 'a voté' : 'vote…'}</div>` : ''}
            </div></div>
            <p class="small muted" style="margin:6px 0 0">${esc(c.desc)}</p>
            ${s.me.isHost && p && p.id !== s.me.id && !p.left ? `<button class="btn sm danger" style="margin-top:10px" data-act="roomMarkLeft" data-id="${esc(p.id)}" data-name="${esc(p.name)}">Marquer comme parti</button>` : ''}
          </div>`;
        }).join('')}
        <button class="btn ghost" data-act="roomLeave">Quitter la partie</button>`;
    }

    function renderVote(s) {
      const v = s.vote;
      const current = pickVote || v.myVote;
      return `
        <h2>Qui a volé la médaille ?</h2>
        <p class="hint">Vote secret. Le groupe gagne si plus de la moitié des votants désigne le coupable.</p>
        <div class="bar" style="margin-bottom:14px"><i style="width:${v.total ? (100 * v.count) / v.total : 0}%"></i></div>
        ${v.candidates.map((c) => `
          <button class="choice ${current === c.id ? 'sel' : ''}" data-act="roomPick" data-id="${esc(c.id)}">
            <span class="radio"></span>
            <span class="grow"><strong>${esc(c.name)}</strong><span>${esc(c.playedBy || '')}${v.myVote === c.id ? ' · ton vote' : ''}</span></span>
          </button>`).join('')}
        ${v.myVote ? '<p class="muted small center">Tu peux changer d’avis tant que le vote est ouvert.</p>' : ''}`;
    }

    function renderReveal(s) {
      const r = s.result;
      const max = Math.max(1, ...r.tally.map((t) => t.votes));
      $app.innerHTML = `
        <div class="topbar"><button class="link" data-act="home">‹ Dossiers</button><span class="tag-phase">${PHASE_LABEL.reveal}</span></div>
        <div class="verdict-banner ${r.groupWins ? 'win' : 'lose'}">
          <span class="stamp big" style="background:transparent;${r.groupWins ? 'color:var(--green);border-color:var(--green)' : 'color:var(--brick-light);border-color:var(--brick-light)'}">${r.groupWins ? 'Affaire résolue' : 'Affaire classée'}</span>
          <h2>${r.groupWins ? 'Le groupe gagne' : 'Le coupable gagne'}</h2>
          <p style="margin:0">${r.culpritVotes} vote${r.culpritVotes > 1 ? 's' : ''} sur ${r.cast} contre le coupable · il en fallait ${r.needed}.</p>
          ${r.forced ? '<p class="small muted" style="margin:6px 0 0">Vote terminé par l’hôte : les absents se sont abstenus.</p>' : ''}
        </div>
        <section class="idcard">
          <div class="band"><span>Le coupable</span><span>Joué par ${esc(r.culprit.playedBy)}</span></div>
          <div class="main">
            <span class="stamp">Coupable</span>
            <h2>${esc(r.culprit.name)}</h2>
            <p class="desc"><strong style="color:var(--paper-ink)">Mobile.</strong> ${esc(r.motive)}</p>
            <p class="desc" style="margin-top:6px">${esc(r.where)}</p>
          </div>
        </section>
        <div class="section"><h3>Les votes</h3></div>
        <article class="piece">
          ${r.tally.map((t) => `<div style="margin-bottom:10px"><div class="row"><span class="grow" style="${t.charId === r.culprit.charId ? 'color:var(--brick);font-weight:700' : ''}">${esc(t.name)}</span><span style="font-family:var(--f-doc);font-weight:700">${t.votes}</span></div><div class="bar paper"><i class="${t.charId === r.culprit.charId ? 'hot' : ''}" style="width:${(100 * t.votes) / max}%"></i></div></div>`).join('')}
          <p class="foot">${r.ballots.map((b) => `${esc(b.name)} → ${esc(b.voteFor)}`).join(' · ')}</p>
        </article>
        <div class="section"><h3>Chronologie</h3></div>
        <article class="piece"><ul class="timeline">${r.timeline.map((e) => `<li><span class="t">${esc(e.t)}</span><span>${esc(e.text)}</span></li>`).join('')}</ul></article>
        <div class="section"><h3>Les pièces qui le confondaient</h3></div>
        ${r.keys.map((k) => piece(k, { footer: `<span class="meta"><strong>${esc(k.why)}</strong><br>Détenue par ${esc(k.heldBy || 'personne à cette table')}</span>` })).join('')}
        <div class="section"><h3>Les secrets de chacun</h3></div>
        ${r.secrets.map((x) => `<div class="block secret"><div class="bt"><span>${esc(x.charName)}</span><span class="how">${esc(x.name)}</span></div><p class="small">${esc(x.secret)}</p></div>`).join('')}
        <button class="btn primary" data-act="roomNew">Nouvelle partie</button>`;
    }

    actions.roomTab = (d) => { tab = d.tab; render(); window.scrollTo(0, 0); };
    actions.roomStart = () => act('start');
    actions.roomNext = () => { if (confirm('Passer à la manche 2 pour tout le monde ?')) act('nextRound'); };
    actions.roomOpenVote = () => { if (confirm('Ouvrir le vote pour tout le monde ?')) act('openVote'); };
    actions.roomCloseVote = () => { if (confirm('Terminer le vote maintenant ? Ceux qui n’ont pas voté s’abstiendront.')) act('closeVote'); };
    actions.roomShareClue = (d) => act('share', { clueId: d.id }).then((ok) => ok && toast('Pièce posée sur la table'));
    actions.roomPick = (d) => { pickVote = d.id; render(); };
    actions.roomVote = () => {
      if (!pickVote) return;
      act('vote', { target: pickVote }).then((ok) => { if (ok) { pickVote = null; render(); toast('Vote enregistré'); } });
    };
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
