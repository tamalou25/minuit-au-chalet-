// Affaire solo « Le violon de l'entracte » — contenu entièrement fictif.
window.SOLO_CASE = {
  title: "Le violon de l'entracte",
  place: 'Hôtel Valmont · samedi, 22 h 15',
  intro: [
    'Le violoniste Anton Weiss donnait ce soir un concert privé dans le grand salon de l’Hôtel Valmont.',
    'À l’entracte, à 21 h 30, il a enfermé son violon — « la Comtesse », un instrument de 1742 — dans sa loge, une pièce qui ne s’ouvre qu’avec une carte magnétique.',
    'À 21 h 50, l’étui était vide. À 22 h 05, une femme de chambre a retrouvé le violon, intact, caché dans un chariot à linge du couloir de service. Quelqu’un comptait revenir le chercher.',
    'Les portes de l’hôtel sont fermées. Trois personnes ont pu approcher la loge pendant l’entracte. À vous de trouver laquelle — et de le prouver.',
  ],
  start: ['F_RAPPORT', 'F_PROGRAMME'],

  suspects: [
    { id: 'victor', name: 'Victor Lenoir', role: 'Régisseur de l’hôtel, 52 ans', desc: 'Vingt ans de maison. Détient le passe général qui ouvre toutes les portes.', initial: 'V' },
    { id: 'elise', name: 'Élise Marchal', role: 'Pianiste accompagnatrice, 34 ans', desc: 'Accompagne Anton depuis six ans. Robe de concert noire.', initial: 'É' },
    { id: 'camille', name: 'Camille Roux', role: 'Experte en instruments anciens, 41 ans', desc: 'Mandatée par l’assureur pour vérifier la Comtesse avant le concert. Robe bleu nuit.', initial: 'C' },
  ],

  clues: {
    F_RAPPORT: { kind: 'indice', title: 'Rapport de la femme de chambre', text: '22 h 05 : la Comtesse est retrouvée sous des draps propres, dans le chariot à linge n° 3, au milieu du couloir de service. Le chariot n’avait pas bougé depuis 21 h.' },
    F_PROGRAMME: { kind: 'indice', title: 'Programme de la soirée', text: '20 h 30 : première partie. 21 h 30 – 21 h 50 : entracte. 21 h 50 : seconde partie (annulée).' },
    C_SERRURE: { kind: 'indice', title: 'Journal de la serrure de la loge', text: '21 h 29 : carte d’Anton Weiss (sortie). 21 h 38 : ouverture par le PASSE GÉNÉRAL. 21 h 50 : carte d’Anton Weiss.' },
    C_DETTE: { kind: 'indice', title: 'Mot sur la coiffeuse de la loge', text: '« Élise, je te réglerai tes six mois de cachets après la tournée, promis. — A. »' },
    C_GANT: { kind: 'indice', title: 'Gant blanc près du chariot', text: 'Au pied du chariot n° 3 : un gant de coton blanc, très fin, taille S, sans aucune broderie.' },
    C_TICKET: { kind: 'indice', title: 'Ticket du bar', text: 'Bar du Valmont — 21 h 34 — 1 cognac — « compte personnel : V. Lenoir ».' },
    C_NOTE_TERRASSE: { kind: 'indice', title: 'Note sur la porte de la terrasse', text: '« Orage : terrasse fermée et verrouillée à 21 h 15. Clé à la réception. » La réception confirme que personne n’a demandé la clé.' },
    C_PARFUM: { kind: 'indice', title: 'Le vestiaire du personnel', text: 'La veste de Victor pend à son crochet, le passe dans la poche gauche. Dans la petite pièce flotte encore un parfum poudré d’iris.' },
    C_MALLETTE: { kind: 'indice', title: 'Mallette d’expertise de Camille Roux', text: 'Inventaire collé dans le couvercle : loupe, lampe UV, mètre, « 1 paire de gants coton, taille S ». Dans la mallette : un seul gant.' },
    C_CAMION: { kind: 'indice', title: 'Bon de transport au quai de livraison', text: 'Une camionnette attend depuis 21 h. Bon du chauffeur : « Enlèvement : 1 caisse pour instrument. Départ : minuit. Donneuse d’ordre : C. Roux. »' },

    T_VICTOR_ALIBI: { kind: 'temoignage', who: 'victor', title: 'Victor : son alibi', text: 'Victor affirme être resté à son poste, dans le hall, pendant tout l’entracte.' },
    T_VICTOR_PASSE: { kind: 'temoignage', who: 'victor', title: 'Victor : le passe', text: 'Seuls Anton (sa carte) et Victor (le passe général) peuvent ouvrir la loge. Victor jure que son passe ne l’a pas quitté de la soirée.' },
    T_VICTOR_ROUX: { kind: 'temoignage', who: 'victor', title: 'Victor : les questions de Mme Roux', text: 'Cet après-midi, Camille Roux a demandé à Victor où étaient les sorties de service et à quelle heure passaient les livraisons.' },
    T_GANTS_HV: { kind: 'temoignage', who: 'victor', title: 'Victor : les gants du personnel', text: 'Les gants du personnel du Valmont sont en nylon, taille L, brodés « HV » au poignet.' },
    T_VICTOR_AVEU: { kind: 'temoignage', who: 'victor', title: 'Victor change de version', text: 'Victor était au bar de 21 h 32 à 21 h 48, en bras de chemise. Sa veste, passe dans la poche, était au vestiaire du personnel, au fond du couloir de service. En la reprenant, il a trouvé le passe dans la poche gauche ; il le range toujours à droite.' },
    T_VICTOR_SILHOUETTE: { kind: 'temoignage', who: 'victor', title: 'Victor : une silhouette', text: 'Du bar, Victor a vu vers 21 h 36 une silhouette en robe sombre s’engager dans le couloir de service. Il n’a pas vu son visage.' },
    T_PIANO: { kind: 'temoignage', who: 'victor', title: 'Victor : le piano', text: 'Pendant tout son temps au bar (21 h 32 – 21 h 48), Victor a entendu le piano du petit salon jouer sans s’interrompre.' },
    T_ELISE_ALIBI: { kind: 'temoignage', who: 'elise', title: 'Élise : son alibi', text: 'Élise dit avoir répété au piano du petit salon pendant tout l’entracte.' },
    T_ELISE_BAR: { kind: 'temoignage', who: 'elise', title: 'Élise : Victor au bar', text: 'Par la vitre du petit salon, Élise a vu Victor accoudé au bar pendant l’entracte, sans sa veste.' },
    T_ELISE_EXPERTISE: { kind: 'temoignage', who: 'elise', title: 'Élise : l’expertise de 19 h', text: 'Vers 19 h, Camille Roux a examiné la Comtesse avec des gants blancs d’experte et a longuement observé la serrure de la loge. Son parfum d’iris a embaumé la loge toute la soirée.' },
    T_ELISE_DETTE: { kind: 'temoignage', who: 'elise', title: 'Élise : la dette d’Anton', text: 'Anton doit six mois de cachets à Élise, qui le quittera après la tournée. Elle affirme qu’un violon aussi célèbre serait impossible à revendre.' },
    T_CAMILLE_ALIBI: { kind: 'temoignage', who: 'camille', title: 'Camille : son alibi', text: 'Camille dit être restée sur la terrasse, au téléphone avec son bureau, pendant tout l’entracte.' },
    T_CAMILLE_ROLE: { kind: 'temoignage', who: 'camille', title: 'Camille : sa mission', text: 'Camille a examiné la Comtesse vers 19 h pour l’assureur. Tout était en ordre selon elle.' },
    T_CAMILLE_COULOIR: { kind: 'temoignage', who: 'camille', title: 'Camille change de version', text: 'Camille admet ne pas avoir été sur la terrasse : elle a téléphoné « dans un couloir, au calme », après s’être « trompée de porte » en cherchant les toilettes.' },
  },

  // Questions : requires = tous ces indices ; requiresAny = au moins un.
  questions: {
    victor: [
      { id: 'v_alibi', q: 'Où étiez-vous pendant l’entracte ?', a: 'À mon poste, dans le hall. J’ai l’œil sur toutes les allées et venues, c’est mon métier. Rien d’anormal.', gives: ['T_VICTOR_ALIBI'] },
      { id: 'v_loge', q: 'Qui peut ouvrir la loge ?', a: 'Monsieur Weiss, avec sa carte. Et moi, avec le passe général. Mais mon passe ne m’a pas quitté de la soirée : il est toujours sur moi.', gives: ['T_VICTOR_PASSE'] },
      { id: 'v_etrange', q: 'Avez-vous remarqué un comportement étrange aujourd’hui ?', a: 'Mme Roux, l’experte. Elle m’a demandé où étaient les sorties de service et à quelle heure passaient les livraisons. Pour quelqu’un venu examiner un violon… c’est curieux. Le quai de livraison est au bout du couloir de service.', gives: ['T_VICTOR_ROUX'] },
      { id: 'v_serrure', requires: ['C_SERRURE'], q: 'La serrure indique une ouverture au passe général à 21 h 38.', a: 'C’est… impossible. Le système a dû se tromper. Je vous le répète : j’étais dans le hall.', note: 'Il ne cédera pas tant que vous ne lui prouverez pas qu’il n’était pas dans le hall.' },
      { id: 'v_couloir', requires: ['T_VICTOR_AVEU'], q: 'Avez-vous vu quelqu’un entrer dans le couloir de service ?', a: 'Du bar, on voit l’entrée du couloir. Vers 21 h 36, une silhouette en robe sombre s’y est engagée. Je n’ai pas vu le visage, désolé. Par contre, le piano du petit salon n’a pas cessé une seconde : je l’entendais du bar.', gives: ['T_VICTOR_SILHOUETTE', 'T_PIANO'] },
    ],
    elise: [
      { id: 'e_alibi', q: 'Où étiez-vous pendant l’entracte ?', a: 'Au petit salon, au piano. Je repassais la sonate de la seconde partie, du début à la fin. Je n’ai pas bougé.', gives: ['T_ELISE_ALIBI'] },
      { id: 'e_vu', q: 'Avez-vous remarqué quelque chose pendant l’entracte ?', a: 'Le petit salon a une vitre qui donne sur le bar. Victor y était accoudé, sans sa veste. Ça m’a étonnée : il est toujours tiré à quatre épingles.', gives: ['T_ELISE_BAR'] },
      { id: 'e_avant', q: 'Que s’est-il passé avant le concert ?', a: 'Vers 19 h, Mme Roux est venue examiner la Comtesse dans la loge, avec ses gants blancs d’experte. Elle a passé un temps fou à regarder la serrure. Et son parfum d’iris… toute la loge en a gardé l’odeur.', gives: ['T_ELISE_EXPERTISE'] },
      { id: 'e_anton', q: 'Comment sont vos relations avec Anton ?', a: '(Elle hésite.) Professionnelles. Très professionnelles.', note: 'Elle vous cache quelque chose. Une preuve l’aiderait peut-être à parler.' },
    ],
    camille: [
      { id: 'c_alibi', q: 'Où étiez-vous pendant l’entracte ?', a: 'Sur la terrasse, au téléphone avec mon bureau. Je suis restée dehors tout l’entracte, je n’ai rien vu.', gives: ['T_CAMILLE_ALIBI'] },
      { id: 'c_role', q: 'Pourquoi êtes-vous ici ce soir ?', a: 'L’assureur m’a mandatée pour vérifier l’état de la Comtesse avant le concert. Je l’ai examinée vers 19 h : parfait état.', gives: ['T_CAMILLE_ROLE'] },
      { id: 'c_gants', requiresAny: ['T_ELISE_EXPERTISE', 'C_GANT'], q: 'Portiez-vous des gants pour l’expertise ?', a: 'Évidemment, c’est la règle. Ils sont dans ma mallette, tenez… (Elle fouille.) Tiens. Je n’en trouve qu’un. J’ai dû égarer l’autre.', gives: ['C_MALLETTE'] },
      { id: 'c_sorties', requires: ['T_VICTOR_ROUX'], q: 'Pourquoi vous intéresser aux sorties de service ?', a: 'Déformation professionnelle. J’évalue les risques de vol, c’est mon métier.' },
    ],
  },

  // Confrontations : pour chaque suspect, la réaction à une preuve.
  // Plusieurs variantes possibles : la première dont les conditions sont remplies s’applique.
  confront: {
    victor: {
      default: 'Je ne vois pas le rapport avec moi.',
      T_ELISE_BAR: [
        { ifHas: ['T_VICTOR_AVEU'], a: 'Je vous ai tout dit, cette fois. Le bar, la veste, le passe.' },
        { a: '(Il baisse les yeux.) Bon. Je n’étais pas dans le hall. Je suis allé boire un cognac au bar — c’est interdit en service, j’aurais perdu ma place. J’avais laissé ma veste au vestiaire du personnel, au fond du couloir de service. Le passe était dans la poche. Quand je l’ai remise, vers 21 h 48, il était dans la poche gauche. Je le range toujours à droite. Quelqu’un l’a pris… puis remis.', gives: ['T_VICTOR_AVEU'], change: true },
      ],
      C_TICKET: [
        { ifHas: ['T_VICTOR_AVEU'], a: 'Oui, c’est mon cognac. Je vous ai tout dit.' },
        { a: '(Il fixe le ticket.) … D’accord. Je n’étais pas dans le hall. Un cognac au bar, en service : j’aurais perdu ma place. Ma veste était au vestiaire du personnel, au fond du couloir de service, avec le passe dans la poche. Quand je l’ai remise vers 21 h 48, le passe était dans la poche gauche. Je le range toujours à droite. Quelqu’un s’en est servi.', gives: ['T_VICTOR_AVEU'], change: true },
      ],
      C_SERRURE: [
        { ifHas: ['T_VICTOR_AVEU'], a: 'Ce n’était pas moi. Quelqu’un s’est servi de mon passe pendant que j’étais au bar.' },
        { a: 'Je vous répète que j’étais dans le hall ! Le système a dû se tromper.', note: 'Il faut une preuve qu’il n’était pas dans le hall.' },
      ],
      T_VICTOR_PASSE: [
        { ifHas: ['T_VICTOR_AVEU'], a: 'J’ai menti sur ce point, je le reconnais. Le passe est resté dans ma veste.' },
        { a: 'Je maintiens : il ne m’a pas quitté.' },
      ],
      C_GANT: [{ a: 'Ce n’est pas l’un des nôtres. Nos gants sont en nylon, taille L, brodés « HV » au poignet. Regardez les miens.', gives: ['T_GANTS_HV'] }],
      C_CAMION: [{ a: 'Une camionnette à minuit ? Ce n’est pas au planning, je n’ai rien autorisé.' }],
      C_PARFUM: [{ a: 'De l’iris ? Ce n’est pas un parfum du personnel : nos employés n’ont pas le droit d’en porter en service.' }],
    },
    elise: {
      default: 'Je ne vois pas où vous voulez en venir.',
      C_DETTE: [{ a: '(Elle soupire.) Oui, il me doit six mois de cachets. Je le quitte après la tournée. Mais voler la Comtesse ? Tout le monde la connaît : je l’aurais revendue à qui ? Et je n’ai pas quitté le piano, tout l’étage a pu m’entendre.', gives: ['T_ELISE_DETTE'] }],
      C_GANT: [{ a: 'Je ne porte jamais de gants, je suis pianiste. Mme Roux en avait de pareils, en revanche.' }],
      T_VICTOR_SILHOUETTE: [{ a: 'Une robe sombre ? J’étais au piano ! Demandez à quiconque était au bar.' }],
      C_PARFUM: [{ a: 'L’iris ? C’est le parfum de Mme Roux. Moi, je n’en porte pas : Anton déteste ça.' }],
      C_SERRURE: [{ a: 'Je n’ai ni carte ni passe. Je ne pourrais même pas entrer dans ma propre loge sans Anton.' }],
    },
    camille: {
      default: 'Vous perdez votre temps, inspecteur.',
      C_NOTE_TERRASSE: [
        { ifHas: ['T_CAMILLE_COULOIR'], a: 'Je vous l’ai dit : le couloir, pas la terrasse.' },
        { a: '(Elle pâlit.) … Bon. Je n’étais pas sur la terrasse. J’ai téléphoné dans un couloir, au calme. Je cherchais les toilettes et je me suis trompée de porte. Ça ne fait pas de moi une voleuse.', gives: ['T_CAMILLE_COULOIR'], change: true },
      ],
      C_GANT: [
        { ifHas: ['C_MALLETTE'], a: '(Elle fixe le gant, puis sa mallette ouverte.) … Je n’ai plus rien à vous dire sans mon avocat.' },
        { a: 'Un gant blanc ? Il doit y en avoir des dizaines dans un hôtel.' },
      ],
      C_MALLETTE: [
        { ifHas: ['C_GANT'], a: '(Elle referme sèchement la mallette.) Je n’ai plus rien à vous dire sans mon avocat.' },
        { a: 'J’ai perdu un gant. Ce n’est pas un crime.' },
      ],
      C_CAMION: [{ a: '(Elle se raidit.) Un transport pour un client. Rien à voir avec ce soir.' }],
      C_PARFUM: [
        { ifHas: ['T_CAMILLE_COULOIR'], a: 'J’étais dans ce couloir, je vous l’ai dit. Pas dans ce vestiaire.' },
        { a: 'Beaucoup de femmes portent de l’iris.' },
      ],
      T_VICTOR_SILHOUETTE: [{ a: 'Une robe sombre ? Élise en porte une aussi, que je sache.' }],
      C_SERRURE: [{ a: 'Le passe général ? Voyez donc ça avec le régisseur.' }],
      T_VICTOR_ROUX: [{ a: 'Évaluer les risques fait partie de mon travail. C’est même pour ça qu’on me paie.' }],
    },
  },

  locations: [
    { id: 'loge', name: 'Loge d’Anton', desc: 'Petite pièce à serrure magnétique, derrière le grand salon.', items: [
      { id: 'i_serrure', label: 'Consulter le boîtier de la serrure', gives: 'C_SERRURE' },
      { id: 'i_coiffeuse', label: 'Fouiller la coiffeuse', gives: 'C_DETTE' },
    ] },
    { id: 'couloir', name: 'Couloir de service', desc: 'Relie les cuisines, le vestiaire du personnel et le quai de livraison.', items: [
      { id: 'i_chariot', label: 'Examiner les abords du chariot n° 3', gives: 'C_GANT' },
    ] },
    { id: 'bar', name: 'Bar du Valmont', requires: ['T_ELISE_BAR'], desc: 'Comptoir en zinc, vitre sur le petit salon.', items: [
      { id: 'i_ticket', label: 'Demander les tickets de l’entracte', gives: 'C_TICKET' },
    ] },
    { id: 'terrasse', name: 'Terrasse', requires: ['T_CAMILLE_ALIBI'], desc: 'Donne sur le parc. Il a plu à verse ce soir.', items: [
      { id: 'i_porte', label: 'Examiner la porte de la terrasse', gives: 'C_NOTE_TERRASSE' },
    ] },
    { id: 'vestiaire', name: 'Vestiaire du personnel', requires: ['T_VICTOR_AVEU'], desc: 'Au fond du couloir de service. Des crochets, un banc.', items: [
      { id: 'i_veste', label: 'Examiner la veste de Victor', gives: 'C_PARFUM' },
    ] },
    { id: 'quai', name: 'Quai de livraison', requires: ['T_VICTOR_ROUX'], desc: 'Au bout du couloir de service, une porte sur la ruelle.', items: [
      { id: 'i_camion', label: 'Parler au chauffeur de la camionnette', gives: 'C_CAMION' },
    ] },
  ],

  solution: {
    culprit: 'camille',
    strong: ['C_MALLETTE', 'C_CAMION'],
    medium: ['C_GANT', 'T_CAMILLE_COULOIR', 'C_NOTE_TERRASSE', 'C_PARFUM', 'T_VICTOR_SILHOUETTE', 'T_VICTOR_ROUX'],
    motive: 'Un collectionneur étranger avait promis une fortune à Camille Roux pour la Comtesse. Experte reconnue, elle comptait faire sortir le violon par le quai de livraison, dans une « caisse pour instrument », à minuit.',
    timeline: [
      { t: '14 h', text: 'Camille repère les sorties de service et l’heure des livraisons.' },
      { t: '19 h', text: 'Expertise de la Comtesse : Camille étudie la serrure de la loge.' },
      { t: '21 h', text: 'La camionnette qu’elle a commandée se gare au quai.' },
      { t: '21 h 32', text: 'Victor laisse sa veste au vestiaire et file boire un cognac au bar.' },
      { t: '21 h 36', text: 'Camille entre dans le couloir de service et prend le passe dans la veste.' },
      { t: '21 h 38', text: 'Gantée, elle ouvre la loge avec le passe et sort la Comtesse.' },
      { t: '21 h 41', text: 'Elle cache le violon dans le chariot n° 3, perd un gant, puis remet le passe — dans la mauvaise poche.' },
      { t: '21 h 50', text: 'Anton découvre l’étui vide. Les portes ferment : impossible de récupérer le violon.' },
      { t: '22 h 05', text: 'La femme de chambre retrouve la Comtesse.' },
    ],
    deductions: [
      { text: 'Le passe général a ouvert la loge à 21 h 38, mais Victor était au bar (ticket de 21 h 34, témoignage d’Élise). Son passe, resté dans sa veste au vestiaire, a été emprunté puis remis dans la mauvaise poche.', clues: ['C_SERRURE', 'C_TICKET', 'T_ELISE_BAR', 'T_VICTOR_AVEU'] },
      { text: 'Le piano n’a pas cessé de jouer pendant l’entracte : Élise n’a pas quitté le petit salon. Sa dette est un mobile, pas une preuve.', clues: ['T_PIANO', 'C_DETTE'] },
      { text: 'Camille prétendait être sur la terrasse, fermée à clé depuis 21 h 15. Elle a menti, puis reconnu avoir été dans le couloir de service, celui du vestiaire. Le parfum d’iris y flottait encore.', clues: ['C_NOTE_TERRASSE', 'T_CAMILLE_COULOIR', 'C_PARFUM'] },
      { text: 'Le gant trouvé près du chariot (coton, taille S, sans broderie) n’est pas un gant du personnel (nylon, taille L, « HV »). C’est celui qui manque dans la mallette de Camille.', clues: ['C_GANT', 'T_GANTS_HV', 'C_MALLETTE'] },
      { text: 'La camionnette commandée par « C. Roux » pour minuit et ses questions sur les sorties de service prouvent la préméditation.', clues: ['C_CAMION', 'T_VICTOR_ROUX'] },
    ],
  },
};

// Mise en forme des pièces (présentation uniquement : le texte des indices ne change pas).
(function (C) {
  const DOCS = {
    F_RAPPORT: { form: 'rapport', head: 'Rapport de service · Hôtel Valmont', fields: [
      ['Heure', '22 h 05', true], ['Lieu', 'Couloir de service, chariot à linge n° 3'], ['Objet', 'La Comtesse, sous des draps propres'], ['Remarque', 'Chariot immobile depuis 21 h'],
    ], sign: 'La femme de chambre' },
    F_PROGRAMME: { form: 'releve', cols: ['Heure', 'Au programme'], rows: [
      { c: ['20 h 30', 'Première partie'] }, { c: ['21 h 30', 'Entracte — jusqu’à 21 h 50'], hot: true }, { c: ['21 h 50', 'Seconde partie'], sub: 'annulée' },
    ] },
    C_SERRURE: { form: 'releve', head: 'Lecteur de carte · relevé automatique', cols: ['Heure', 'Accès', 'Action'], rows: [
      { c: ['21 h 29', 'Carte Anton Weiss', 'Sortie'] }, { c: ['21 h 38', 'PASSE GÉNÉRAL', 'Ouverture'], hot: true }, { c: ['21 h 50', 'Carte Anton Weiss', 'Ouverture'] },
    ] },
    C_DETTE: { form: 'note', body: 'Élise, je te réglerai tes six mois de cachets après la tournée, promis.', sign: '— A.', foot: 'Trouvé sur la coiffeuse de la loge.' },
    C_GANT: { form: 'scelle', num: 'Pièce n° 1', fields: [['Objet', 'Gant de coton blanc, très fin'], ['Taille', 'S', true], ['Broderie', 'Aucune', true], ['Trouvé', 'Au pied du chariot n° 3']] },
    C_TICKET: { form: 'ticket', head: 'BAR DU VALMONT', lines: [['Heure', '21 h 34', true], ['1 cognac', ''], ['Compte', 'personnel'], ['Signé', 'V. Lenoir', true]] },
    C_NOTE_TERRASSE: { form: 'affiche', big: 'Orage', body: 'Terrasse fermée et verrouillée à 21 h 15. Clé à la réception.', foot: 'La réception confirme : personne n’a demandé la clé.' },
    C_PARFUM: { form: 'constat', head: 'Constat · Vestiaire du personnel', fields: [['Veste de Victor', 'Sur son crochet'], ['Passe', 'Poche gauche', true], ['Odeur', 'Parfum poudré d’iris', true]] },
    C_MALLETTE: { form: 'inventaire', head: 'Mallette d’expertise · C. Roux', items: [['Loupe', 'présente'], ['Lampe UV', 'présente'], ['Mètre', 'présent'], ['Gants coton, taille S', '1 sur 2', true]] },
    C_CAMION: { form: 'bon', head: 'Bon de transport', fields: [['Enlèvement', '1 caisse pour instrument'], ['Départ', 'Minuit', true], ['Donneuse d’ordre', 'C. Roux', true], ['Sur place depuis', '21 h']] },
  };
  for (const [id, doc] of Object.entries(DOCS)) C.clues[id].doc = doc;
})(window.SOLO_CASE);
