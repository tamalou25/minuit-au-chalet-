'use strict';
// Affaire multijoueur « Minuit au chalet » — contenu entièrement fictif.
// Ce module reste côté serveur : le client ne reçoit que ce que build*() lui donne.

const CULPRIT = 'hugo';

// Ordre d'entrée des personnages : les 3 premiers sont toujours présents.
// Un personnage ne cite jamais un personnage placé après lui dans cette liste,
// ce qui garantit la cohérence des fiches à chaque taille de groupe.
const CAST = [
  { id: 'nora', name: 'Nora Vasseur', desc: "Petite-fille d'Odette, hôtesse du week-end. Seule personne à avoir un badge au chalet." },
  { id: 'hugo', name: 'Hugo Marchetti', desc: "Moniteur de ski, ami d'enfance de Nora. Sifflote sans arrêt depuis ce matin." },
  { id: 'ines', name: 'Inès Fabre', desc: 'Photographe, chargée de l’album des 50 ans du chalet.' },
  { id: 'malik', name: 'Malik Benali', desc: 'Colocataire de Hugo, premier séjour au chalet.' },
  { id: 'sacha', name: 'Sacha Morel', desc: 'Cuisinier du week-end, maître de la fondue.' },
  { id: 'lea', name: 'Léa Garnier', desc: 'Cousine de Nora, agente immobilière.' },
  { id: 'basile', name: 'Basile Roche', desc: 'Voisin, guide de haute montagne. A fendu tout le bois du week-end.' },
  { id: 'jeanne', name: 'Jeanne Lemaire', desc: "Amie d'Inès, étudiante en histoire, invitée de dernière minute." },
];

const INTRO = {
  title: 'Minuit au chalet',
  text: [
    "Samedi soir, chalet Les Mélèzes, à Val-Brûlon. Pour les 50 ans du chalet, Nora a réuni ses proches.",
    "À minuit, tout le monde est descendu à la cave pour le grand moment : sortir de son coffret la médaille d'argent de slalom gagnée en 1968 par la grand-mère Odette, avant de la confier au musée du village.",
    "Le coffret était vide. La route est bloquée par la neige : personne n'a quitté le chalet. Le coupable est parmi vous.",
  ],
  facts: [
    'La cave et le local à bois s’ouvrent uniquement avec un badge. Le seul badge présent au chalet est celui de Nora (porte-clés en forme de sapin).',
    'À 19 h, la médaille était dans son coffret : Nora l’a vérifié.',
    'Rez-de-chaussée : entrée (manteaux, local à skis), salon avec poêle, cuisine (porte-fenêtre sur le balcon fumeur), escalier de la cave. Dehors : local à bois et terrasse avec jacuzzi.',
  ],
};

const has = (present, id) => present.has(id);

// Fiches personnages. alibi / secret : texte ou fonction(present).
const CARDS = {
  nora: {
    alibi: (p) =>
      `Vers 21 h 50, dans l'entrée, tu as prêté ton badge à Hugo : il voulait aller chercher du bois. Tu es ensuite allée au jacuzzi${has(p, 'malik') ? ' avec Malik' : ''}, de 21 h 55 à 22 h 35. Hugo n'est jamais venu t'y rendre le badge. Tu ne l'as retrouvé qu'à 23 h 50, dans la poche de ta doudoune rouge, en descendant pour minuit.`,
    secret:
      "Le mois dernier, tu as fait estimer la médaille en cachette : 12 000 €. Ta famille veut vendre le chalet et tu cherches désespérément de l'argent pour le garder. Si ça se sait, on te soupçonnera.",
  },
  hugo: {
    alibi:
      "« J'ai emprunté le badge de Nora vers 21 h 50 pour aller chercher du bois. Je le lui ai rendu en main propre vers 22 h 10, au bord du jacuzzi. Ensuite, je suis allé fumer sur le balcon jusqu'à 22 h 30. »",
    secret: 'Tu dois 18 000 € à des sites de paris en ligne. Personne ne doit l’apprendre.',
    truth:
      "C'est toi qui as volé la médaille. Un collectionneur t'en a promis 15 000 € en liquide. Vers 21 h 50, tu as emprunté le badge de Nora « pour le bois ». Tu as vraiment rapporté des bûches (local à bois, 21 h 57), puis à 22 h 13 tu as ouvert la cave et pris la médaille. Vers 22 h 20, tu l'as cachée dans ta chaussure de ski, au local à skis. À 22 h 30, tu as glissé le badge dans la doudoune rouge de Nora, puis tu lui as envoyé un SMS à 22 h 31.",
    tips: [
      'Défends la version ci-dessus : c’est ton alibi officiel.',
      'Reste calme et coopératif. Admets ce qu’on te prouve, mais trouve toujours une explication.',
      'Chacun cache un secret : sers-toi de tes indices pour détourner les soupçons.',
      'Tu gagnes si la moitié du groupe ou moins vote contre toi.',
    ],
  },
  ines: {
    alibi:
      'Tu photographiais la soirée dans tout le chalet : vers 22 h 05 dans l’entrée et l’escalier, vers 22 h 12 sur la terrasse, puis au salon.',
    secret:
      'À 19 h, quand Nora t’a emmenée dans la cave photographier la médaille, tu as glissé une bouteille de champagne millésimé dans ton sac photo. Personne n’a rien vu.',
  },
  malik: {
    alibi: 'De 21 h 55 à 22 h 35, tu étais dans le jacuzzi avec Nora.',
    secret:
      'Cet après-midi, tu as envoyé une photo de la médaille à un antiquaire de Genève que tu connais, avec ce message : « Combien ça vaut ? ». Il a répondu : « Intéressé. » Si ça se sait, tu es le suspect idéal.',
  },
  sacha: {
    alibi:
      'En cuisine de 21 h 45 à 22 h 30 (fondue, puis dessert), à part deux sauts : au salon vers 22 h 15, dans l’entrée vers 22 h 20.',
    secret:
      'Vers 22 h 20, tu as fouillé les poches de tous les manteaux de l’entrée : tu cherchais les clés de la voiture… celle de ton patron, empruntée sans sa permission.',
  },
  lea: {
    alibi: 'Dans ta chambre à l’étage, en visio avec un client, de 22 h 00 à 22 h 30.',
    secret:
      'Tu as déjà trouvé un acheteur pour le chalet, en cachette de Nora. Il le veut « avec tout ce qu’il contient, souvenirs compris » — médaille comprise — et ta commission en dépend.',
  },
  basile: {
    alibi: 'Au salon, près du poêle, de 21 h 30 à 23 h. Tu n’as pas bougé.',
    secret:
      'Cet après-midi, tu as proposé à Nora de lui racheter la médaille 8 000 € pour ta collection de souvenirs de ski. Elle a refusé sèchement et tu as claqué la porte, un peu trop fort.',
  },
  jeanne: {
    alibi: 'Dans la salle de bain du rez-de-chaussée vers 22 h 10, puis au salon avec Basile.',
    secret:
      'Ce soir vers 20 h, tu as fouillé la tablette du salon par curiosité et lu des messages privés qui ne te regardaient pas. Tu as honte de l’avouer.',
  },
};

// Indices. round 0 = sur la fiche, 1 = manche 1, 2 = manche 2.
// essential : indispensable pour résoudre l'affaire (toujours tenu par un innocent).
const CLUES = {
  // — Nora
  N_SMS: { holder: 'nora', round: 0, essential: true, title: 'SMS de Hugo (22 h 31)',
    text: '« Merci pour le badge ! Je te l’ai remis dans la poche de ta doudoune 😉 » — reçu à 22 h 31. Ton téléphone était dans ta chambre : tu ne l’as lu qu’à 23 h 50.' },
  N_RELEVE: { holder: 'nora', round: 1, essential: true, title: 'Journal des badges du chalet',
    text: 'Appli du chalet : 19 h 02 cave (badge Nora) · 21 h 57 local à bois (badge Nora) · 22 h 13 cave (badge Nora) · 23 h 58 cave (badge Nora, descente de groupe).' },
  N_ECORCE: { holder: 'nora', round: 2, essential: true, title: 'Le fond du coffret',
    text: 'Au fond du coffret vide, tu trouves quelques fragments d’écorce blanche, comme celle des bûches de bouleau. À 19 h, le coffret était impeccable.' },
  // — Inès
  I_PHOTO1: { holder: 'ines', round: 0, essential: true, title: 'Photo de 22 h 05',
    text: 'Sur ta photo de 22 h 05 : Hugo au pied de l’escalier de la cave, le badge de Nora (porte-clés sapin) à la main. Il n’a pas de bois dans les bras.' },
  I_PHOTO2: { holder: 'ines', round: 1, essential: true, title: 'Photo de 22 h 12',
    text: (p) => `Sur ta photo de 22 h 12 : la terrasse sous la neige, Nora dans le jacuzzi${has(p, 'malik') ? ' avec Malik' : ', seule'}. Personne d’autre autour.` },
  I_TABLETTE: { holder: 'ines', round: 2, essential: true, title: 'Notification sur la tablette',
    text: 'Sur la tablette du salon, la messagerie connectée au compte « hugo.marchetti » affiche : « Toujours OK pour la médaille de 68 ? 15 000 € en liquide lundi, comme convenu. »' },
  // — Hugo (coupable) : des faits vrais qui détournent les soupçons
  H_ESTIMATION: { holder: 'hugo', round: 0, title: 'Le mail de l’expert',
    text: 'Tu as vu sur la tablette de Nora un mail daté du mois dernier : « Estimation de la médaille Odette Vasseur : 12 000 €. » Nora n’en a parlé à personne.' },
  H_SACHA: { holder: 'hugo', round: 1, requires: ['sacha'], title: 'Sacha et les manteaux',
    text: 'Vers 22 h 20, tu as vu Sacha fouiller les poches des manteaux de l’entrée, dont la doudoune rouge de Nora.' },
  H_MALIK: { holder: 'hugo', round: 1, requires: ['malik'], title: 'Malik et l’antiquaire',
    text: 'Cet après-midi, tu as vu Malik envoyer une photo de la médaille à un contact nommé « Antiquités Genève ».' },
  H_INES: { holder: 'hugo', round: 1, title: 'Le sac d’Inès',
    text: 'Vers 19 h 10, tu as vu Inès remonter de la cave avec Nora. Son sac photo semblait bien plus lourd qu’à l’aller.' },
  H_BASILE: { holder: 'hugo', round: 2, requires: ['basile'], title: 'L’offre de Basile',
    text: 'Cet après-midi, tu as entendu Basile proposer à Nora de lui racheter la médaille. Elle a refusé, il est parti en claquant la porte.' },
  H_LEA: { holder: 'hugo', round: 2, requires: ['lea'], title: 'Léa au téléphone',
    text: 'Tu as entendu Léa au téléphone : « Le chalet se vend avec tout ce qu’il contient, souvenirs compris. Ma commission sera confortable. »' },
  H_NORA_TEL: { holder: 'hugo', round: 2, title: 'Nora au téléphone',
    text: 'Cet après-midi, tu as entendu Nora au téléphone : « Si je ne trouve pas 12 000 € avant mars, on perd le chalet. »' },
  // — Malik
  M_JACUZZI: { holder: 'malik', round: 0, title: 'Le jacuzzi',
    text: 'De 21 h 55 à 22 h 35, tu étais dans le jacuzzi avec Nora. Personne n’est venu lui rendre quoi que ce soit, et elle n’avait rien sur elle à part son maillot.' },
  M_DETTES: { holder: 'malik', round: 1, title: 'La confidence de Hugo',
    text: 'Hugo, ton colocataire, t’a confié cette semaine : « Je suis dans le rouge, il me faut 15 000 avant la fin du mois. » Il reçoit des lettres de relance d’un site de paris.' },
  M_LUMIERE: { holder: 'malik', round: 2, title: 'La lumière du local à skis',
    text: 'Vers 22 h 20, depuis le jacuzzi, tu as vu la lumière du local à skis s’allumer puis s’éteindre. Personne n’est allé skier ce soir.' },
  // — Sacha
  S_GRINCEMENT: { holder: 'sacha', round: 0, title: 'La porte de la cave',
    text: 'Vers 22 h 13, depuis la cuisine, collée à l’escalier, tu as entendu le grincement de la porte de la cave. Puis quelqu’un remonter en sifflotant.' },
  S_BALCON: { holder: 'sacha', round: 1, title: 'Le balcon fumeur',
    text: 'La porte-fenêtre de la cuisine donne sur le balcon fumeur. De 21 h 45 à 22 h 30, personne n’y est sorti : tu l’aurais vu, et le cendrier est resté vide.' },
  S_POCHE: { holder: 'sacha', round: 2, title: 'La doudoune rouge',
    text: 'À 22 h 20, en fouillant les manteaux, tu as mis la main dans la doudoune rouge de Nora : la poche était vide. Au même moment, Hugo est sorti du local à skis et t’a fixé sans un mot.' },
  // — Léa
  L_FENETRE: { holder: 'lea', round: 0, title: 'Vue sur la terrasse',
    text: 'Pendant ta visio, ta fenêtre donnait sur la terrasse : de 22 h 00 à 22 h 30, Nora et Malik sont restés dans le jacuzzi, sans interruption.' },
  L_CAVE: { holder: 'lea', round: 1, title: 'Une seule entrée',
    text: 'Tu connais le chalet par cœur : la cave n’a qu’une porte et le soupirail est grillagé. Impossible d’y entrer sans le badge.' },
  L_ENTREE: { holder: 'lea', round: 2, title: 'Hugo dans l’entrée',
    text: 'À 22 h 31, en descendant chercher un verre d’eau, tu as surpris Hugo dans l’entrée, près des manteaux. Il a sursauté : « Je cherche mon briquet. »' },
  // — Basile
  B_BOULEAU: { holder: 'basile', round: 0, title: 'L’écorce de bouleau',
    text: 'Le bois que tu as fendu cet après-midi est du bouleau : l’écorce blanche s’effrite et colle partout. Vers 22 h 00, Hugo est revenu du local à bois avec une brassée de bûches, le pull couvert d’écorce.' },
  B_BRIQUET: { holder: 'basile', round: 1, title: 'Le briquet oublié',
    text: 'Vers 22 h 02, Hugo a posé les bûches près du poêle et est reparti « fumer ». Mais son paquet de cigarettes et son briquet sont restés sur la table basse jusqu’à 22 h 40.' },
  B_FONDUE: { holder: 'basile', round: 2, title: 'Le bol de fondue',
    text: 'Vers 22 h 15, Sacha t’a apporté un bol de fondue au salon, puis est reparti en cuisine. Il avait les mains vides et l’air pressé.' },
  // — Jeanne
  J_SOUPIRAIL: { holder: 'jeanne', round: 0, title: 'La lumière de la cave',
    text: 'À 22 h 13, depuis la fenêtre de la salle de bain du rez-de-chaussée, juste au-dessus du soupirail, tu as vu la lumière de la cave s’allumer. Trois minutes plus tard, elle s’est éteinte.' },
  J_TABLETTE: { holder: 'jeanne', round: 1, title: 'Une conversation privée',
    text: 'Vers 20 h, sur la tablette du salon, tu as lu une conversation du compte « hugo.marchetti » avec « Collectionneur_74 » : « Une médaille de 68, authentique ? — Oui. Ce week-end. »' },
  J_QUESTION: { holder: 'jeanne', round: 2, title: 'Une drôle de question',
    text: 'Vers 20 h 30, Hugo t’a demandé, l’air de rien : « Elle vaut combien, une médaille comme ça ? Et la cave, Nora la ferme toujours ? »' },
};

const REVEAL = {
  motive:
    "Hugo doit 18 000 € à des sites de paris en ligne. Un collectionneur lui avait promis 15 000 € en liquide pour la médaille d'Odette, livrable lundi.",
  where: 'La médaille était cachée dans la chaussure de ski gauche de Hugo, au local à skis.',
  timeline: [
    { t: '19 h 02', text: 'Nora descend à la cave avec Inès pour photographier la médaille. Elle est bien dans son coffret.' },
    { t: '20 h 00', text: 'Hugo confirme la vente à « Collectionneur_74 » sur la tablette du salon.' },
    { t: '21 h 50', text: 'Hugo emprunte le badge de Nora « pour aller chercher du bois ».' },
    { t: '21 h 55', text: 'Nora part au jacuzzi, sans badge.' },
    { t: '21 h 57', text: 'Le badge ouvre le local à bois : Hugo rapporte vraiment des bûches de bouleau.' },
    { t: '22 h 05', text: 'Inès photographie Hugo au pied de l’escalier de la cave, badge en main.' },
    { t: '22 h 13', text: 'Le badge de Nora ouvre la cave. Hugo prend la médaille et laisse tomber de l’écorce dans le coffret.' },
    { t: '22 h 20', text: 'Hugo cache la médaille dans sa chaussure de ski, au local à skis.' },
    { t: '22 h 30', text: 'Hugo glisse le badge dans la doudoune rouge de Nora…' },
    { t: '22 h 31', text: '… puis lui envoie un SMS pour faire croire qu’il l’avait rendu.' },
    { t: '23 h 58', text: 'Tout le monde descend à la cave. À minuit, le coffret est vide.' },
  ],
  keys: [
    { clue: 'N_RELEVE', why: 'Le badge de Nora a ouvert la cave à 22 h 13 : le voleur avait ce badge à ce moment-là.' },
    { clue: 'I_PHOTO1', why: 'À 22 h 05, Hugo a le badge en main, au pied de l’escalier de la cave.' },
    { clue: 'N_SMS', why: 'Le SMS de 22 h 31 contredit sa version : il n’a pas rendu le badge en main propre à 22 h 10, il l’a glissé dans la doudoune après le vol.' },
    { clue: 'I_PHOTO2', why: 'À 22 h 12, Nora est au jacuzzi, sans badge : elle ne pouvait pas ouvrir la cave une minute plus tard.' },
    { clue: 'N_ECORCE', why: 'L’écorce de bouleau dans le coffret vient de celui qui venait de porter le bois : Hugo (local à bois, 21 h 57).' },
    { clue: 'I_TABLETTE', why: 'Le mobile : 15 000 € promis par un collectionneur.' },
  ],
};

function presentSet(n) {
  return new Set(CAST.slice(0, n).map((c) => c.id));
}

function resolve(v, present) {
  return typeof v === 'function' ? v(present) : v;
}

// Indices d'un personnage, selon les personnages présents.
function cluesFor(charId, present) {
  const list = [];
  for (const round of [0, 1, 2]) {
    const candidates = Object.entries(CLUES).filter(
      ([, c]) => c.holder === charId && c.round === round && (c.requires || []).every((r) => present.has(r)),
    );
    // Pour le coupable, plusieurs variantes par manche : on garde la première (la plus spécifique).
    if (candidates.length) list.push({ id: candidates[0][0], round });
  }
  return list;
}

function clueView(id, present) {
  const c = CLUES[id];
  return { id, title: c.title, text: resolve(c.text, present), round: c.round };
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Attribue un personnage distinct à chaque joueur (ordre aléatoire).
function assign(playerIds) {
  const n = playerIds.length;
  const present = presentSet(n);
  const chars = shuffle(CAST.slice(0, n).map((c) => c.id));
  const out = {};
  playerIds.forEach((pid, i) => {
    out[pid] = { charId: chars[i], clues: cluesFor(chars[i], present) };
  });
  return out;
}

function castView(n) {
  return CAST.slice(0, n).map((c) => ({ id: c.id, name: c.name, desc: c.desc }));
}

function cardView(charId, n) {
  const present = presentSet(n);
  const c = CAST.find((x) => x.id === charId);
  const card = CARDS[charId];
  const view = {
    charId,
    name: c.name,
    desc: c.desc,
    role: charId === CULPRIT ? 'coupable' : 'innocent',
    alibi: resolve(card.alibi, present),
    secret: resolve(card.secret, present),
  };
  if (charId === CULPRIT) {
    view.truth = card.truth;
    view.tips = card.tips;
  }
  return view;
}

function charName(id) {
  const c = CAST.find((x) => x.id === id);
  return c ? c.name : id;
}

module.exports = {
  CULPRIT, CAST, INTRO, CARDS, CLUES, REVEAL,
  presentSet, cluesFor, clueView, assign, castView, cardView, charName, resolve,
};
