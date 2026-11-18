(function () {
  "use strict";
  var CLE = "sport4life.v1";
  var ICONES = { Pousser: "Po", Tirer: "Ti", Jambes: "Ja", Tronc: "Tr", Cardio: "Ca" };
  var ACTIVITES = [
    ["1.375", "Légère (1 à 3 séances par semaine)"],
    ["1.55", "Modérée (3 à 5 séances par semaine)"],
    ["1.725", "Élevée (6 à 7 séances par semaine)"]
  ];
  var vue = document.getElementById("vue");

  function esc(t) {
    return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function uid() { return "p" + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36); }
  function aujourdhui() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function jourAnnee() {
    var d = new Date(), debut = new Date(d.getFullYear(), 0, 0);
    return Math.floor((d - debut) / 86400000);
  }

  // ---------- Stockage local ----------
  // ---------- Intensité (v34) ----------
  // Trois niveaux par profil. « Équilibrée » reproduit exactement la séance d'avant (4 exercices + 1 de cardio, séries du catalogue).
  // Léger : 1 exercice et 1 série de moins ; Soutenu : 1 exercice et 1 série de plus (2 à 5 séries au total par exercice).
  // L'échauffement, les étirements, les répétitions cibles et les repos ne changent pas.
  var INTENSITES = [
    { id: "leger", nom: "Léger", exos: 3, delta: -1, desc: "3 exercices plus 1 de cardio, une série de moins par exercice (2 minimum). Pour les jours de fatigue, de reprise ou quand tu es court en temps." },
    { id: "equilibre", nom: "Équilibré", exos: 4, delta: 0, desc: "4 exercices plus 1 de cardio, séries du catalogue. C'est la séance habituelle." },
    { id: "soutenu", nom: "Soutenu", exos: 5, delta: 1, desc: "5 exercices plus 1 de cardio, une série de plus par exercice (5 au maximum). Pour les jours où tu as du temps et de l'énergie." }
  ];
  function exemple() {
    return {
      id: uid(), nom: "Exemple : capoeiriste", taille: "", poids: "", age: "", sexe: "", activite: "1.55",
      note: "Capoeira 2 fois par semaine depuis 10 ans, entraînement surtout au poids du corps.",
      materiel: ["corps", "halteres", "disques", "elastique", "abwheel", "corde", "medball", "gilet"], migre3: true, lieu: "lesdeux",
      valides: {}, poidsLog: [], journal: {}
    };
  }
  function normaliser(p) {
    if (!p.id) p.id = uid();
    if (!Array.isArray(p.materiel)) p.materiel = ["corps"];
    if (!p.valides || typeof p.valides !== "object") p.valides = {};
    if (!Array.isArray(p.poidsLog)) p.poidsLog = [];
    if (!p.journal || typeof p.journal !== "object") p.journal = {};
    // v3 : matériel réel du profil exemple (disques 5 kg, haltères 3 kg, élastique). Ajout seulement.
    if (!p.migre3) {
      p.migre3 = true;
      if (p.nom && p.nom.indexOf("Exemple : capoeiriste") === 0) {
        ["disques", "elastique"].forEach(function (m) { if (p.materiel.indexOf(m) === -1) p.materiel.push(m); });
      }
    }
    ["nom", "taille", "poids", "age", "sexe", "note"].forEach(function (k) { if (p[k] == null) p[k] = ""; });
    if (!p.activite) p.activite = "1.55";
    if (!p.lieu) p.lieu = "lesdeux";
    // v34 : intensité de l'entraînement. Valeur par défaut = « équilibrée » = comportement d'avant (rien ne change tant qu'on ne la modifie pas).
    if (INTENSITES.map(function (x) { return x.id; }).indexOf(p.intensite) === -1) p.intensite = "equilibre";
    // v32 : "autre" éclate en chaise/banc et barre de traction. Ajout seulement, rien n'est retiré.
    if (p.materiel.indexOf("autre") !== -1) {
      ["banc", "barre"].forEach(function (m) { if (p.materiel.indexOf(m) === -1) p.materiel.push(m); });
    }
    // v33 : préférences alimentaires. Valeur neutre par défaut (aucune exclusion, aucun goût) = comportement d'avant.
    if (!p.migre33) p.migre33 = true;
    p.alimentation = alimValide(p.alimentation) || alimVide();
    return p;
  }

  // ---------- Préférences alimentaires (v33) ----------
  // p.alimentation = { regime: "" | id de raccourci, exclus: [codes], aimes: [ids d'ingrédients], pasAimes: [ids] }.
  // Les exclusions retirent toujours les repas concernés ; les goûts ne font que changer la probabilité de tirage.
  function alimCodes() { return (window.ALIM_EXCLUSIONS || []).map(function (x) { return x.code; }); }
  function alimIds() { return (window.ALIMENTS || []).map(function (x) { return x.id; }); }
  function alimRegime(id) { return (window.ALIM_REGIMES || []).filter(function (r) { return r.id === id; })[0] || null; }
  function alimVide() { return { regime: "", exclus: [], aimes: [], pasAimes: [] }; }
  function listePropre(l, ok) {
    var out = [];
    (Array.isArray(l) ? l : []).forEach(function (x) { if (typeof x === "string" && ok.indexOf(x) !== -1 && out.indexOf(x) === -1) out.push(x); });
    return out;
  }
  // Validation (chargement, import) : codes et ingrédients inconnus écartés, doublons retirés.
  function alimValide(o) {
    if (!o || typeof o !== "object" || Array.isArray(o)) return null;
    var n = { regime: typeof o.regime === "string" && alimRegime(o.regime) ? o.regime : "", exclus: listePropre(o.exclus, alimCodes()), aimes: listePropre(o.aimes, alimIds()), pasAimes: listePropre(o.pasAimes, alimIds()) };
    n.pasAimes = n.pasAimes.filter(function (x) { return n.aimes.indexOf(x) === -1; });
    return n;
  }
  function alimNeutre(o) { return !o || !(o.regime || o.exclus.length || o.aimes.length || o.pasAimes.length); }
  function alim(p) { return p && p.alimentation ? p.alimentation : alimVide(); }
  var alerteDonnees = false;
  function sauvegarderBrut(brut) {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf(CLE + ".sauvegarde") === 0 && localStorage.getItem(k) === brut) return;
      }
      localStorage.setItem(CLE + ".sauvegarde." + Date.now(), brut);
    } catch (e) {}
  }
  function charger() {
    var brut = null;
    try { brut = localStorage.getItem(CLE); } catch (e) {}
    if (brut) {
      try {
        var s = JSON.parse(brut);
        if (s && Array.isArray(s.profils) && s.profils.length) {
          s.profils.forEach(normaliser);
          if (!s.actif) s.actif = s.profils[0].id;
          return s;
        }
      } catch (e) {}
      sauvegarderBrut(brut);
      alerteDonnees = true;
    }
    return { profils: [], actif: null };
  }
  var etat = charger();
  function signalerEchec(on) {
    var b = document.getElementById("echec-ecriture");
    if (!on) { if (b) b.remove(); return; }
    if (b) return;
    b = document.createElement("div"); b.id = "echec-ecriture"; b.setAttribute("role", "alert");
    b.style.cssText = "position:fixed;left:12px;right:12px;top:12px;z-index:99;padding:12px 14px;border-radius:14px;background:#7f1d1d;color:#fff;font-weight:600";
    b.textContent = "Enregistrement impossible : l'espace de stockage est plein ou refusé. Exporte tes données (Profil) avant de continuer.";
    document.body.appendChild(b);
  }
  function sauver() {
    etat.version = 3;
    try { localStorage.setItem(CLE, JSON.stringify(etat)); signalerEchec(false); return true; } catch (e) { signalerEchec(true); return false; }
  }
  // Fusion additive d'un profil importé dans un profil existant (même id) : rien n'est écrasé.
  var RE_DATE = /^\d{4}-\d{2}-\d{2}$/;
  function aP(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function objet(o) { return !!o && typeof o === "object" && !Array.isArray(o); }
  function cleOk(k) { return k !== "__proto__" && k !== "constructor" && k !== "prototype"; }
  function seriesOk(s) {
    return Array.isArray(s) && s.length > 0 && s.every(function (x) {
      return objet(x) && typeof x.r === "number" && isFinite(x.r) && x.r > 0 && typeof x.k === "number" && isFinite(x.k) && x.k >= 0;
    });
  }
  // Fusion additive : n'écrase jamais, ignore tout ce qui est mal formé (compté dans "ignores").
  function fusionnerProfil(loc, imp, appliquer) {
    var r = { ajouts: 0, conflits: 0, ignores: 0 };
    var j = objet(imp.journal) ? imp.journal : {};
    Object.keys(j).forEach(function (d) {
      if (!RE_DATE.test(d) || !objet(j[d])) { r.ignores++; return; }
      var jl = aP(loc.journal, d) ? loc.journal[d] : null, cree = false;
      Object.keys(j[d]).forEach(function (id) {
        if (!cleOk(id) || !seriesOk(j[d][id])) { r.ignores++; return; }
        if (!jl) { jl = {}; cree = true; }
        if (!aP(jl, id)) { r.ajouts++; if (appliquer) jl[id] = j[d][id]; }
        else if (JSON.stringify(jl[id]) !== JSON.stringify(j[d][id])) r.conflits++;
      });
      if (cree && appliquer && jl) loc.journal[d] = jl;
    });
    var v = objet(imp.valides) ? imp.valides : {};
    Object.keys(v).forEach(function (d) {
      if (!RE_DATE.test(d) || !Array.isArray(v[d])) { r.ignores++; return; }
      var vl = aP(loc.valides, d) && Array.isArray(loc.valides[d]) ? loc.valides[d] : null, cree = false, vus = {};
      v[d].forEach(function (id) {
        if (typeof id !== "string" || !id || !cleOk(id) || aP(vus, id)) { if (typeof id !== "string" || !id) r.ignores++; return; }
        vus[id] = 1;
        if (!vl) { vl = []; cree = true; }
        if (vl.indexOf(id) === -1) { r.ajouts++; if (appliquer) vl.push(id); }
      });
      if (cree && appliquer && vl) loc.valides[d] = vl;
    });
    var dates = {};
    (Array.isArray(imp.poidsLog) ? imp.poidsLog : []).forEach(function (l) {
      if (!objet(l) || typeof l.date !== "string" || !RE_DATE.test(l.date) || typeof l.kg !== "number" || !(l.kg > 20 && l.kg < 400)) { r.ignores++; return; }
      if (aP(dates, l.date)) return;
      dates[l.date] = 1;
      var ex = loc.poidsLog.filter(function (x) { return x.date === l.date; })[0];
      if (!ex) { r.ajouts++; if (appliquer) loc.poidsLog.push({ date: l.date, kg: l.kg }); }
      else if (ex.kg !== l.kg) r.conflits++;
    });
    // v33 : préférences alimentaires reprises seulement si celles d'ici sont vides (jamais remplacées).
    if (aP(imp, "alimentation")) {
      var ai = alimValide(imp.alimentation), al = alimValide(loc.alimentation);
      if (!ai) r.ignores++;
      else if (!alimNeutre(ai)) {
        if (alimNeutre(al)) { r.ajouts++; if (appliquer) loc.alimentation = ai; }
        else if (JSON.stringify(al) !== JSON.stringify(ai)) r.conflits++;
      }
    }
    return r;
  }
  // Profil importé nouveau : copie propre (champs simples + contenu validé par la même fusion).
  function profilPropre(q) {
    var n = {};
    Object.keys(q).forEach(function (k) {
      if (!cleOk(k) || k === "journal" || k === "valides" || k === "poidsLog") return;
      n[k] = q[k];
    });
    n.journal = {}; n.valides = {}; n.poidsLog = [];
    var r = fusionnerProfil(n, q, true);
    return { p: normaliser(n), ajouts: r.ajouts, ignores: r.ignores };
  }
  // ---------- Réglages dans l'export (préférences seulement) ----------
  var CLE_GUIDE = "sport4life.guide";
  // état d'un réglage local : absent, lisible (val) ou cassé (illisible ou valeurs fausses)
  function lireJson(cle) {
    var b; try { b = localStorage.getItem(cle); } catch (e) { return { etat: "casse" }; }
    if (b == null) return { etat: "absent" };
    try { return { etat: "ok", val: JSON.parse(b) }; } catch (e) { return { etat: "casse" }; }
  }
  function heureOk(r) { return objet(r) && typeof r.heure === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(r.heure) && typeof r.actif === "boolean"; }
  function guideForme(g) { return window.S4Guide && window.S4Guide.formeComparable ? window.S4Guide.formeComparable(g) : null; }
  function texteExport() {
    var o = JSON.parse(JSON.stringify(etat)); o.reglages = {};
    var g = lireJson(CLE_GUIDE);
    if (g.etat === "ok" && window.S4Guide && window.S4Guide.reglagesValides) { var ge = window.S4Guide.reglagesValides(g.val); if (ge) { var copie = {}; Object.keys(ge).forEach(function (k) { copie[k] = ge[k]; }); delete copie.auto; o.reglages.guide = copie; } }
    var r = lireJson(CLE_RAPPEL); if (r.etat === "ok" && heureOk(r.val)) o.reglages.rappel = { actif: r.val.actif, heure: r.val.heure };
    return JSON.stringify(o);
  }
  // Pour chaque réglage : importer (absent ou cassé en local), garder le local (différent), rien (identique), ou ignorer (mal formé).
  // Le rappel n'est importé que comme heure, désactivé : jamais de programmation sans choix.
  function planReglages(imp) {
    var p = { guide: "rien", rappel: "rien", ignores: 0, g: null, r: null, cassG: false, cassR: false };
    var R = objet(imp.reglages) ? imp.reglages : {};
    if ("guide" in R) {
      var g = window.S4Guide && window.S4Guide.reglagesValides ? window.S4Guide.reglagesValides(R.guide) : null;
      if (!g) p.ignores++;
      else {
        p.ignores += g._ecartes || 0;
        var lg = lireJson(CLE_GUIDE), loc = lg.etat === "ok" ? guideForme(lg.val) : null;
        if (lg.etat === "absent" || (lg.etat !== "absent" && !loc)) { p.guide = "importer"; p.g = g; p.cassG = lg.etat !== "absent"; }
        else if (loc !== guideForme(R.guide)) p.guide = "garde";
      }
    }
    if ("rappel" in R) {
      if (!heureOk(R.rappel)) p.ignores++;
      else {
        var r = { actif: false, heure: R.rappel.heure }, lr = lireJson(CLE_RAPPEL);
        if (lr.etat === "absent" || !(lr.etat === "ok" && heureOk(lr.val))) { p.rappel = "importer"; p.r = r; p.cassR = lr.etat !== "absent"; }
        else if (lr.val.heure !== r.heure) p.rappel = "garde";
      }
    }
    return p;
  }
  function textesReglages(pr) {
    var t = [];
    if (pr.guide === "importer") t.push("réglages du guidage importés" + (pr.cassG ? " (les tiens étaient illisibles)" : "")); else if (pr.guide === "garde") t.push("réglages du guidage différents : tes réglages actuels sont gardés");
    if (pr.rappel === "importer") t.push("heure du rappel importée, rappel laissé désactivé (aucune notification programmée : choisis-le toi-même avec Enregistrer le rappel)" + (pr.cassR ? " (le tien était illisible)" : "")); else if (pr.rappel === "garde") t.push("heure du rappel différente : ton rappel actuel est gardé");
    return t;
  }
  // Applique les réglages à importer ; renvoie une fonction d'annulation (retire les clés ajoutées, remet la mémoire du guidage).
  function appliquerReglages(p) {
    var G = window.S4Guide, snap = G && G.instantane ? G.instantane() : null, ancienG = lireJson(CLE_GUIDE), ancienR = lireJson(CLE_RAPPEL), ok = true;
    var brutG = null, brutR = null; try { brutG = localStorage.getItem(CLE_GUIDE); brutR = localStorage.getItem(CLE_RAPPEL); } catch (e) {}
    if (p.guide === "importer") ok = !!(G && G.appliquerReglages && G.appliquerReglages(p.g)) && ok;
    // Le rappel est enregistré comme préférence seulement : aucune notification n'est programmée ici.
    if (ok && p.rappel === "importer") { try { localStorage.setItem(CLE_RAPPEL, JSON.stringify(p.r)); } catch (e) { ok = false; } }
    function annuler() {
      try {
        if (brutG == null) localStorage.removeItem(CLE_GUIDE); else localStorage.setItem(CLE_GUIDE, brutG);
        if (brutR == null) localStorage.removeItem(CLE_RAPPEL); else localStorage.setItem(CLE_RAPPEL, brutR);
      } catch (e) {}
      if (snap && G && G.restaurer) G.restaurer(snap);
    }
    return { ok: ok, annuler: annuler };
  }
  window.S4Test = { fusionnerProfil: fusionnerProfil, profilPropre: profilPropre };
  function profil() {
    if (!etat.profils.length) return null;
    for (var i = 0; i < etat.profils.length; i++) if (etat.profils[i].id === etat.actif) return etat.profils[i];
    etat.actif = etat.profils[0].id;
    return etat.profils[0];
  }
  function faisable(exo, p) {
    var dispo = p.materiel.concat(["corps"]);
    if (dispo.indexOf("halteres-reglables") !== -1) dispo.push("halteres");
    if (exo.lieux && p.lieu && p.lieu !== "lesdeux" && exo.lieux.indexOf(p.lieu) === -1) return false;
    return exo.requis.every(function (r) { return dispo.indexOf(r) !== -1; });
  }
  function nomMateriel(id) {
    for (var i = 0; i < MATERIEL.length; i++) if (MATERIEL[i].id === id) return MATERIEL[i].nom;
    return id;
  }
  function intensiteDe(p) {
    for (var i = 0; i < INTENSITES.length; i++) if (p && INTENSITES[i].id === p.intensite) return INTENSITES[i];
    return INTENSITES[1];
  }
  // Copie de l'exercice avec le nombre de séries ajusté (« 3 x 12 à 20 » -> « 2 x 12 à 20 »). Le cardio et les formats à 1 ou 2 séries restent tels quels.
  function adapter(e, p) {
    if (!e) return e;
    var d = intensiteDe(p).delta, m = (e.series || "").match(/^(\s*)(\d+)(\s*x\b)/i);
    if (!d || !m || e.groupe === "Cardio") return e;
    var n = parseInt(m[2], 10);
    if (n < 3) return e;
    var n2 = Math.max(2, Math.min(5, n + d));
    if (n2 === n) return e;
    var c = {}; Object.keys(e).forEach(function (k) { c[k] = e[k]; });
    c.series = m[1] + n2 + (e.series || "").slice(m[0].length - m[3].length);
    return c;
  }
  function exoParId(id) {
    for (var i = 0; i < EXERCICES.length; i++) if (EXERCICES[i].id === id) return adapter(EXERCICES[i], profil());
  }
  function etiquettesMat(exo) {
    return (exo.requis.length ? exo.requis : ["corps"]).map(function (r) {
      return '<span class="etiquette">' + esc(nomMateriel(r)) + "</span>";
    }).join("");
  }

  // ---------- Séance du jour ----------
  var ROTATION = ["Pousser", "Jambes", "Tirer", "Tronc"];
  function seance(p) {
    var ok = EXERCICES.filter(function (e) { return faisable(e, p); });
    var foc = ROTATION[jourAnnee() % ROTATION.length];
    var principaux = ok.filter(function (e) { return e.groupe === foc; });
    var autres = ok.filter(function (e) { return e.groupe !== foc && e.groupe !== "Cardio"; });
    var liste = [];
    var nb = intensiteDe(p).exos;
    if (principaux.length > nb) {
      var dec = jourAnnee() % principaux.length;
      for (var q = 0; q < nb; q++) liste.push(principaux[(dec + q) % principaux.length]);
    } else liste = principaux.slice(0, nb);
    for (var i = 0; liste.length < nb && i < autres.length; i++) {
      var k = (jourAnnee() + i) % autres.length;
      if (liste.indexOf(autres[k]) === -1) liste.push(autres[k]);
    }
    var fin = ok.filter(function (e) { return e.groupe === "Cardio"; });
    if (fin.length) liste.push(fin[jourAnnee() % fin.length]);
    return { focus: foc, liste: liste.map(function (e) { return adapter(e, p); }) };
  }

  // ---------- Nutrition ----------
  function besoins(p) {
    var t = parseFloat(String(p.taille).replace(",", ".")), w = parseFloat(String(p.poids).replace(",", ".")), a = parseFloat(p.age);
    if (!(t > 0 && w > 0 && a > 0) || (p.sexe !== "h" && p.sexe !== "f")) return null;
    var bmr = 10 * w + 6.25 * t - 5 * a + (p.sexe === "h" ? 5 : -161);
    var entretien = bmr * parseFloat(p.activite || "1.55");
    return { entretien: Math.round(entretien), cible: Math.round(entretien + 300), proteines: Math.round(1.6 * w) };
  }


  var V = "34";
  function vignette(e) {
    // v31 : miniature claire et lisible (dessin du mouvement, sinon planche musculaire face ou dos), fournie par guide.js.
    if (window.S4L && S4L.vig) return S4L.vig(e);
    if (false && window.IMGS && window.IMGS[e.id]) return '<div class="vignette photo" aria-hidden="true"><img src="' + window.IMGS[e.id] + '" alt="" width="52" height="52"></div>';
    return '<div class="vignette" aria-hidden="true">' + ICONES[e.groupe] + "</div>";
  }
  // ---------- Séries, historique ----------
  function dateCourte(d) {
    return new Date(d + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  }
  function nombre(v) {
    var n = parseFloat(String(v).replace(",", "."));
    return isFinite(n) ? n : 0;
  }
  function uniques(tab) {
    return tab.filter(function (x, i) { return tab.indexOf(x) === i; });
  }
  function resumeSeries(s) {
    var kgs = uniques(s.filter(function (x) { return x.k > 0; }).map(function (x) { return x.k; }));
    return s.length + " série" + (s.length > 1 ? "s" : "") + " : " + s.map(function (x) { return x.r; }).join(" / ") + " reps" + (kgs.length ? " avec " + kgs.join(" / ") + " kg" : "");
  }
  function derniereSeance(p, id) {
    var jour = aujourdhui();
    var ds = Object.keys(p.journal).sort().reverse();
    for (var i = 0; i < ds.length; i++) {
      var s = p.journal[ds[i]][id];
      if (ds[i] !== jour && s && s.length) return { date: ds[i], series: s };
    }
    return null;
  }
  function infoSeries(p, e) {
    var auj = p.journal[aujourdhui()];
    if (auj && auj[e.id] && auj[e.id].length) return '<div class="doux fait">Saisi : ' + esc(resumeSeries(auj[e.id])) + "</div>";
    var d = derniereSeance(p, e.id);
    return d ? '<div class="doux">Dernière fois (' + esc(dateCourte(d.date)) + ") : " + esc(d.series.map(function (x) { return x.r; }).join(" / ")) + (d.series.some(function (x) { return x.k > 0; }) ? " reps avec charge" : " reps") + "</div>" : "";
  }
  function blocSeries(p, e, series, note) {
    var h = '<div class="carte verre" id="series"><h3>Mes séries d\'aujourd\'hui</h3>';
    var der = derniereSeance(p, e.id);
    if (der) h += '<p class="doux">Dernière fois (' + esc(dateCourte(der.date)) + ") : " + esc(resumeSeries(der.series)) + "</p>";
    if (note) h += '<p class="doux fait">' + esc(note) + "</p>";
    series.forEach(function (s, i) {
      h += '<div class="serie"><span class="num">S' + (i + 1) + '</span><input type="number" class="in-r" inputmode="numeric" min="0" placeholder="reps" aria-label="Répétitions, série ' + (i + 1) + '" value="' + esc(s.r || "") + '"><input type="text" class="in-k" inputmode="decimal" autocomplete="off" placeholder="kg" aria-label="Charge en kg, série ' + (i + 1) + '" value="' + esc(s.k || "") + '"></div>';
    });
    h += '<p class="doux">Charge (kg) : laisse vide pour le poids du corps. Les champs sont préremplis avec ta dernière séance.</p>';
    h += '<div class="rang"><button class="second" data-serie-plus="' + e.id + '">+ série</button><button class="second" data-serie-moins="' + e.id + '">- série</button></div>';
    return h + '<button data-serie-enreg="' + e.id + '">Enregistrer ces séries</button></div>';
  }
  function lireSeriesDom() {
    var r = [].slice.call(document.querySelectorAll("#series .in-r")), k = [].slice.call(document.querySelectorAll("#series .in-k"));
    return r.map(function (x, i) { return { r: x.value, k: k[i].value }; });
  }
  function chartLigne(pts, moy, unite) {
    if (!pts.length) return "";
    var W = 320, H = 160, gl = 38, gr = 10, gh = 12, gb = 24;
    var ys = pts.map(function (q) { return q.y; }).concat((moy || []).map(function (q) { return q.y; }));
    var mn = Math.min.apply(null, ys), mx = Math.max.apply(null, ys), dmin = mn, dmax = mx;
    if (mx - mn < 1e-9) { mn -= 1; mx += 1; } else { var m = (mx - mn) * 0.15; mn -= m; mx += m; }
    var t0 = pts[0].t, t1 = pts[pts.length - 1].t;
    function X(t) { return t1 === t0 ? (gl + W - gr) / 2 : gl + (t - t0) / (t1 - t0) * (W - gl - gr); }
    function Y(y) { return gh + (mx - y) / (mx - mn) * (H - gh - gb); }
    function fmt(v) { return (unite.indexOf("rép") === 0 ? Math.round(v) : Math.round(v * 10) / 10).toString().replace(".", ","); }
    var s = '<svg class="graphe" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Courbe (' + esc(unite) + ')">';
    uniques([dmin, dmax]).forEach(function (v) {
      s += '<line class="grille-h" x1="' + gl + '" x2="' + (W - gr) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '"/><text class="axe" x="' + (gl - 4) + '" y="' + (Y(v) + 4).toFixed(1) + '" text-anchor="end">' + fmt(v) + "</text>";
    });
    s += '<text class="axe" x="' + gl + '" y="' + (H - 6) + '">' + esc(dateCourte(pts[0].d)) + '</text><text class="axe" x="' + (W - gr) + '" y="' + (H - 6) + '" text-anchor="end">' + (pts.length > 1 ? esc(dateCourte(pts[pts.length - 1].d)) : "") + "</text>";
    if (moy && moy.length > 1) s += '<polyline class="moy" points="' + moy.map(function (q) { return X(q.t).toFixed(1) + "," + Y(q.y).toFixed(1); }).join(" ") + '"/>';
    if (pts.length > 1) s += '<polyline class="ligne" points="' + pts.map(function (q) { return X(q.t).toFixed(1) + "," + Y(q.y).toFixed(1); }).join(" ") + '"/>';
    pts.forEach(function (q) { s += '<circle class="pt" cx="' + X(q.t).toFixed(1) + '" cy="' + Y(q.y).toFixed(1) + '" r="3.5"/>'; });
    return s + "</svg>";
  }
  function moyenne7(log) {
    return log.map(function (l) {
      var f = log.filter(function (m) { return m.t <= l.t && l.t - m.t < 7 * 86400000; });
      return { t: l.t, d: l.d, y: f.reduce(function (s, m) { return s + m.y; }, 0) / f.length };
    });
  }
  function joursActifs(p) {
    var set = {};
    Object.keys(p.valides).forEach(function (d) { if (p.valides[d].length) set[d] = 1; });
    Object.keys(p.journal).forEach(function (d) { if (Object.keys(p.journal[d]).length) set[d] = 1; });
    return Object.keys(set).sort();
  }
  function vueHistorique() {
    var p = profil(), h = alerteHtml() + "<h2>Historique</h2>";
    var jours = joursActifs(p), now = new Date(aujourdhui() + "T12:00:00").getTime();
    var n7 = jours.filter(function (d) { return now - new Date(d + "T12:00:00").getTime() < 7 * 86400000; }).length;
    var n30 = jours.filter(function (d) { return now - new Date(d + "T12:00:00").getTime() < 30 * 86400000; }).length;
    h += '<div class="carte verre"><h3>Régularité</h3><p><span class="kcal">' + n7 + "</span> jour" + (n7 > 1 ? "s" : "") + " d'entraînement sur les 7 derniers jours<br>" + n30 + " sur les 30 derniers jours</p></div>";
    // poids
    var log = p.poidsLog.slice().sort(function (x, y) { return x.date < y.date ? -1 : 1; }).map(function (l) { return { t: new Date(l.date + "T12:00:00").getTime(), d: l.date, y: nombre(l.kg) }; }).filter(function (l) { return l.y > 0; });
    h += '<div class="carte verre"><h3>Poids</h3>';
    if (log.length < 2) {
      h += '<p class="doux">Ajoute au moins 2 pesées (onglet Profil, "Poids du jour") pour voir la courbe.' + (log.length ? " Dernière : " + esc(log[0].y) + " kg." : "") + "</p>";
    } else {
      var mo = moyenne7(log), der = log[log.length - 1], dm = mo[mo.length - 1];
      h += chartLigne(log, mo, "kg");
      h += '<p class="legende"><span class="l1"></span> pesées <span class="l2"></span> moyenne sur 7 jours</p>';
      var ecart = Math.round((der.y - log[0].y) * 10) / 10;
      h += "<p>Dernier : <strong>" + esc(der.y) + " kg</strong> (" + esc(dateCourte(der.d)) + "). Moyenne 7 jours : " + (Math.round(dm.y * 10) / 10) + " kg.<br>Depuis le " + esc(dateCourte(log[0].d)) + " : " + (ecart > 0 ? "+" : "") + ecart + " kg.</p>";
      h += '<p class="doux">Pour une prise de masse progressive, regarde plutôt la tendance sur plusieurs semaines que la valeur d\'un jour.</p>';
    }
    h += "</div>";
    // progression par exercice
    var ids = [];
    Object.keys(p.journal).forEach(function (d) { Object.keys(p.journal[d]).forEach(function (id) { if (ids.indexOf(id) === -1 && exoParId(id)) ids.push(id); }); });
    h += '<div class="carte verre"><h3>Progression par exercice</h3>';
    if (!ids.length) {
      h += '<p class="doux">Pas encore de séries enregistrées. Ouvre un exercice et saisis tes répétitions et ta charge : la courbe apparaît ici.</p>';
    } else {
      var cur = vueHistorique.exo && ids.indexOf(vueHistorique.exo) !== -1 ? vueHistorique.exo : ids[0];
      h += '<label for="sel-exo">Exercice</label><select id="sel-exo">' + ids.map(function (id) { return '<option value="' + id + '"' + (id === cur ? " selected" : "") + ">" + esc(exoParId(id).nom) + "</option>"; }).join("") + "</select>";
      var ds = Object.keys(p.journal).filter(function (d) { return p.journal[d][cur] && p.journal[d][cur].length; }).sort();
      var pts = ds.map(function (d) { return { t: new Date(d + "T12:00:00").getTime(), d: d, y: p.journal[d][cur].reduce(function (s, x) { return s + x.r; }, 0) }; });
      h += chartLigne(pts, null, "répétitions totales");
      h += '<p class="doux">Courbe : répétitions totales par séance.</p>';
      var kmax = 0; ds.forEach(function (d) { p.journal[d][cur].forEach(function (x) { if (x.k > kmax) kmax = x.k; }); });
      if (kmax) h += "<p>Charge maximale : <strong>" + kmax + " kg</strong></p>";
      h += "<p>" + ds.slice(-5).reverse().map(function (d) { return "<strong>" + esc(dateCourte(d)) + "</strong> : " + esc(resumeSeries(p.journal[d][cur])); }).join("<br>") + "</p>";
    }
    h += "</div>";
    // séances récentes
    h += '<div class="carte verre"><h3>Séances récentes</h3>';
    if (!jours.length) h += '<p class="doux">Aucune séance pour l\'instant.</p>';
    jours.slice(-8).reverse().forEach(function (d) {
      var noms = uniques((p.valides[d] || []).concat(Object.keys(p.journal[d] || {}))).map(function (id) { var e = exoParId(id); return e ? esc(e.nom) : ""; }).filter(Boolean);
      h += "<p><strong>" + esc(dateCourte(d)) + "</strong> : " + noms.join(", ") + "</p>";
    });
    vue.innerHTML = h + "</div>";
  }

  function alerteHtml() {
    if (!alerteDonnees) return "";
    return '<div class="alerte"><strong>Données illisibles.</strong> Tes données enregistrées dans ce navigateur n\'ont pas pu être lues. Je n\'ai rien effacé : une copie brute est gardée. <button class="second" data-sauvegarde="1">Télécharger la copie</button></div>';
  }
  function champIntensite(p) {
    return '<label for="intensite" class="titre-champ" style="margin-top:16px;font-size:1.05rem;font-weight:700">Intensité de l\'entraînement</label><select id="intensite" aria-describedby="intensite-desc">' + INTENSITES.map(function (x) { return '<option value="' + x.id + '"' + (intensiteDe(p).id === x.id ? " selected" : "") + ">" + x.nom + "</option>"; }).join("") + '</select><p class="doux petit" id="intensite-desc">' + INTENSITES.map(function (x) { return "<strong>" + x.nom + "</strong> : " + esc(x.desc); }).join("<br>") + "<br>L'échauffement et les étirements restent toujours proposés. Tu peux changer ce réglage à tout moment. Les lignes de séries déjà saisies pour un exercice ne changent pas.</p>";
  }
  function champsProfil(p) {
    var h = '<label for="nom">Nom</label><input type="text" id="nom" value="' + esc(p.nom) + '">';
    h += '<div class="grille"><div><label for="taille">Taille (cm)</label><input type="text" id="taille" inputmode="decimal" autocomplete="off" value="' + esc(p.taille) + '"></div>';
    h += '<div><label for="poids">Poids (kg)</label><input type="text" id="poids" inputmode="decimal" autocomplete="off" value="' + esc(p.poids) + '"></div>';
    h += '<div><label for="age">Âge</label><input type="number" id="age" inputmode="numeric" value="' + esc(p.age) + '"></div>';
    h += '<div><label for="sexe">Sexe</label><select id="sexe"><option value="">Choisir</option><option value="h"' + (p.sexe === "h" ? " selected" : "") + '>Homme</option><option value="f"' + (p.sexe === "f" ? " selected" : "") + ">Femme</option></select></div></div>";
    h += '<label for="activite">Niveau d\'activité</label><select id="activite">' + ACTIVITES.map(function (x) {
      return '<option value="' + x[0] + '"' + (p.activite === x[0] ? " selected" : "") + ">" + x[1] + "</option>";
    }).join("") + "</select>";
    h += champIntensite(p);
    h += '<h3 style="margin-top:16px">Où t\'entraînes-tu ?</h3><select id="lieu">' +
      [["lesdeux", "Aux deux endroits"], ["maison", "À la maison"], ["exterieur", "En extérieur"]].map(function (x) {
        return '<option value="' + x[0] + '"' + ((p.lieu || "lesdeux") === x[0] ? " selected" : "") + ">" + x[1] + "</option>";
      }).join("") + "</select>";
    h += '<h3 style="margin-top:16px">Matériel disponible</h3><div class="puces">';
    MATERIEL.forEach(function (m) {
      var coche = m.id === "corps" || p.materiel.indexOf(m.id) !== -1;
      h += '<label class="puce"><input type="checkbox" data-mat="' + m.id + '"' + (coche ? " checked" : "") + (m.id === "corps" ? " disabled" : "") + ">" + esc(m.nom) + "</label>";
    });
    return h + "</div>";
  }
  function vueBienvenue() {
    var vide = { nom: "", taille: "", poids: "", age: "", sexe: "", activite: "1.55", materiel: ["corps"] };
    var h = alerteHtml() + "<h2>Bienvenue sur Sport4Life</h2>";
    h += '<div class="carte verre"><p>Ton coach perso pour la prise de muscle : séances adaptées à ton matériel, repas suggérés et suivi. Crée ton profil pour commencer. Tout reste enregistré dans ce navigateur, sur cet appareil.</p></div>';
    h += '<form class="carte verre" id="bienvenue" autocomplete="off"><h3>Ton profil</h3>' + champsProfil(vide);
    h += '<p class="doux" style="margin-top:10px">Taille, poids, âge et sexe servent à estimer tes besoins en calories et protéines. Tu peux les ajouter plus tard.</p>';
    h += '<button type="submit">Créer mon profil</button></form>';
    h += '<div class="carte verre"><p class="doux">Tu veux juste découvrir l\'app ? Essaie le profil exemple (capoeiriste : disques 5 kg, haltères 3 kg, élastique).</p><button class="second" data-exemple="1">Utiliser le profil exemple</button></div>';
    h += blocTransfert();
    vue.innerHTML = h;
  }

  // ---------- Séance aléatoire + repas ----------
  function alea(tab) { return tab[Math.floor(Math.random() * tab.length)]; }
  function melange(tab) {
    var a = tab.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function repasOk(r, p) { var ex = alim(p).exclus; return !r.tags.some(function (t) { return ex.indexOf(t) !== -1; }); }
  function repasCompatibles(p) { return REPAS.filter(function (r) { return repasOk(r, p); }); }
  function parMoment(l) {
    return { pd: l.filter(function (r) { return r.moment === "Petit-déjeuner"; }), pl: l.filter(function (r) { return r.moment === "Repas"; }), co: l.filter(function (r) { return r.moment === "Collation"; }) };
  }
  // Goûts : chaque ingrédient aimé double le poids du repas, chaque ingrédient pas aimé le divise par 4 (jamais zéro).
  function poidsRepas(r, p) {
    var g = alim(p), w = 1;
    r.ingr.forEach(function (x) { if (g.aimes.indexOf(x.id) !== -1) w *= 2; else if (g.pasAimes.indexOf(x.id) !== -1) w *= 0.25; });
    return w;
  }
  function melangePondere(tab, p) {
    return tab.map(function (r) { return { r: r, k: Math.pow(Math.random(), 1 / poidsRepas(r, p)) }; })
      .sort(function (x, y) { return y.k - x.k; }).map(function (x) { return x.r; });
  }
  function tiragePondere(tab, poids) {
    var tot = 0; tab.forEach(function (x, i) { tot += poids[i]; });
    var u = Math.random() * tot;
    for (var i = 0; i < tab.length; i++) { u -= poids[i]; if (u <= 0) return tab[i]; }
    return tab[tab.length - 1];
  }
  // N'utilise QUE des repas compatibles : un repas exclu n'est jamais réintroduit, même si la cible n'est pas atteinte.
  function genererRepas(p) {
    var n = besoins(p), cible = n ? n.cible : 2800, prot = n ? n.proteines : 0;
    var c = parMoment(repasCompatibles(p));
    if (!c.pd.length && !c.pl.length && !c.co.length) return [];
    var bons = [], meilleur = null, ecartMin = 1e9;
    for (var t = 0; t < 600; t++) {
      var mp = melangePondere(c.pl, p).slice(0, Math.random() < 0.5 ? 2 : 3), mc = melangePondere(c.co, p).slice(0, Math.random() < 0.5 ? 1 : 2);
      var liste = (c.pd.length ? [tiragePondere(c.pd, c.pd.map(function (r) { return poidsRepas(r, p); }))] : []).concat(mp.slice(0, 1), mc.slice(0, 1), mp.slice(1), mc.slice(1));
      var kcal = 0, pr = 0;
      liste.forEach(function (r) { kcal += r.kcal; pr += r.prot; });
      var ecart = Math.abs(kcal - cible) + (prot && pr < prot ? (prot - pr) * 10 : 0);
      if (ecart <= 100) bons.push(liste);
      if (ecart < ecartMin) { ecartMin = ecart; meilleur = liste; }
    }
    var choix = bons.length ? tiragePondere(bons, bons.map(function (l) { return l.reduce(function (w, r) { return w * poidsRepas(r, p); }, 1); })) : meilleur;
    return choix.map(function (r) { return r.id; });
  }
  // Ids de repas encore valables (connus et compatibles avec les exclusions actuelles) ?
  function idsValides(ids, p) { return Array.isArray(ids) && ids.every(function (id) { var r = repasParId(id); return !!r && repasOk(r, p); }); }
  var LIMITES_ALIM = "Les exclusions filtrent des suggestions indicatives d'après les ingrédients listés. Ce n'est pas une garantie contre les allergies : traces, produits transformés et sauces non listés ne sont pas couverts. Vérifie toujours les étiquettes. Valeurs d'après la table ANSES-CIQUAL 2025 (aliments génériques, pour 100 g), calculées sur les grammes indiqués ; les poids d'unité sont des repères ; les recettes ne sont pas validées par un professionnel de santé. Pas un avis médical ni diététique.";
  function nomsExclus(p) { return alim(p).exclus.map(function (c) { var x = (window.ALIM_EXCLUSIONS || []).filter(function (e) { return e.code === c; })[0]; return x ? x.nom.split(" (")[0].split(" :")[0] : c; }); }
  function pluriel(n, s, pl) { return n + " " + (n > 1 ? pl : s); }
  function texteCompte(p) {
    var l = repasCompatibles(p), c = parMoment(l);
    var t = pluriel(l.length, "repas compatible", "repas compatibles") + " sur " + REPAS.length + " : " + pluriel(c.pd.length, "petit-déjeuner", "petits-déjeuners") + ", " + c.pl.length + " repas, " + pluriel(c.co.length, "collation", "collations") + ".";
    if (c.pd.length < 1 || c.pl.length < 2 || c.co.length < 1) t += " Pas assez pour composer une journée complète.";
    return t;
  }
  // Message honnête si les repas compatibles ne suffisent pas ou si la cible n'est pas atteinte (rien d'exclu n'est ajouté).
  function messageRepas(p, repas) {
    var l = repasCompatibles(p), c = parMoment(l), n = besoins(p), cible = n ? n.cible : 2800, prot = n ? n.proteines : 0, kcal = 0, pr = 0;
    repas.forEach(function (r) { kcal += r.kcal; pr += r.prot; });
    var manque = c.pd.length < 1 || c.pl.length < 2 || c.co.length < 1, loinK = kcal < cible * 0.9, loinP = prot > 0 && pr < prot * 0.9;
    if (!manque && !loinK && !loinP) return "";
    var t;
    if (alim(p).exclus.length) {
      t = (manque || loinK ? "Pas assez de repas compatibles avec tes exclusions : " + pluriel(l.length, "repas disponible", "repas disponibles") + " (" + pluriel(c.pd.length, "petit-déjeuner", "petits-déjeuners") + ", " + c.pl.length + " repas, " + pluriel(c.co.length, "collation", "collations") + ")." : "Avec tes exclusions, " + pluriel(l.length, "repas compatible", "repas compatibles") + ".");
      if (loinK) t += " Cible d'environ " + cible + " kcal non atteinte (≈ " + kcal + " kcal proposées).";
      if (loinP) t += " Protéines : ≈ " + pr + " g sur " + prot + " g visés.";
      t += " Aucun repas exclu n'est ajouté pour compléter : augmente les portions ou assouplis tes exclusions dans le profil.";
    } else {
      t = (loinK ? "Cible d'environ " + cible + " kcal non atteinte avec les repas proposés (≈ " + kcal + " kcal)." : "") + (loinP ? " Protéines : ≈ " + pr + " g sur " + prot + " g visés." : "") + " Augmente un peu les portions.";
    }
    return '<div class="alerte" role="status">' + esc(t.trim()) + "</div>";
  }
  function rappelFiltre(p) {
    var g = alim(p), ex = nomsExclus(p), t;
    if (!ex.length && !g.aimes.length && !g.pasAimes.length) t = "Aucune préférence alimentaire : tous les repas sont proposés.";
    else t = (ex.length ? "Filtre actif, sans : " + ex.join(", ") + "." : "Aucune exclusion.") + (g.aimes.length || g.pasAimes.length ? " Goûts pris en compte : " + pluriel(g.aimes.length, "aimé", "aimés") + ", " + pluriel(g.pasAimes.length, "pas aimé", "pas aimés") + "." : "");
    return '<p class="doux filtre-alim">' + esc(t) + ' <a href="#/profil">Modifier dans le profil</a></p>';
  }
  function genererAleatoire(p) {
    var ok = EXERCICES.filter(function (e) { return faisable(e, p); });
    var exos = [];
    // Léger : 3 groupes tirés ; Équilibré : 4 groupes (comme en v33) ; Soutenu : 4 groupes + 1 exercice de plus.
    var gs = melange(["Pousser", "Tirer", "Jambes", "Tronc"]).slice(0, Math.min(4, intensiteDe(p).exos));
    gs.forEach(function (g) {
      var c = ok.filter(function (e) { return e.groupe === g; });
      if (c.length) exos.push(alea(c).id);
    });
    if (intensiteDe(p).exos > 4) {
      var reste = ok.filter(function (e) { return e.groupe !== "Cardio" && exos.indexOf(e.id) === -1; });
      if (reste.length) exos.push(alea(reste).id);
    }
    var cardio = ok.filter(function (e) { return e.groupe === "Cardio"; });
    if (cardio.length) exos.push(alea(cardio).id);
    var repas = genererRepas(p);
    return { date: aujourdhui(), exos: exos, repas: repas };
  }
  function repasParId(id) {
    for (var i = 0; i < REPAS.length; i++) if (REPAS[i].id === id) return REPAS[i];
  }
  function blocAleatoire(p, faits) {
    var a = p.aleatoire && p.aleatoire.date === aujourdhui() ? p.aleatoire : null;
    var h = '<div class="carte verre" id="alea">';
    h += '<p class="doux">Un exercice par groupe musculaire, tiré au hasard dans ta bibliothèque selon ton matériel, avec des repas pour la prise de masse.</p>';
    h += '<button data-alea="1">' + (a ? "Régénérer" : "Générer une séance aléatoire") + "</button>";
    if (a) {
      var exos = a.exos.map(exoParId).filter(Boolean);
      // Repas tirés avant un changement de préférences : remplacés s'ils ne sont plus compatibles.
      if (!idsValides(a.repas, p)) { a.repas = genererRepas(p); sauver(); }
      var repas = a.repas.map(repasParId).filter(Boolean);
      var gA = groupesSeance(exos, exos.length ? exos[0].groupe : "");
      h += blocEchauffement(p, gA);
      if (window.S4Guide && exos.length) h += '<button class="cta-seance" style="margin-top:16px" data-guide="seance-alea"><span class="cta-play" aria-hidden="true"></span><span class="cta-txt"><strong>Lancer en séance guidée</strong><small>' + exos.length + " exercices" + (window.S4Guide.estimer ? " · ≈ " + Math.max(1, Math.round(window.S4Guide.estimer(exos) / 60)) + " min" : "") + "</small></span></button>";
      h += '<h3 style="margin-top:16px">Exercices (' + faits.filter(function (id) { return a.exos.indexOf(id) !== -1; }).length + "/" + exos.length + " validés)</h3>";
      exos.forEach(function (e) {
        var fait = faits.indexOf(e.id) !== -1;
        h += '<div class="exo verre">' + vignette(e) + '<div class="corps"><a href="#/exercice/' + e.id + '"><strong>' + esc(e.nom) + '</strong></a><div class="doux">' + esc(e.series) + "</div>" + infoSeries(p, e) + '</div><button class="' + (fait ? "second" : "") + '" data-valider="' + e.id + '" aria-pressed="' + fait + '">' + (fait ? "Validé ✓" : "Valider") + "</button></div>";
      });
      h += blocRetourCalme(gA);
      var kcal = 0, prot = 0;
      h += '<h3 style="margin-top:16px">Repas de la journée</h3>';
      repas.forEach(function (r) {
        kcal += r.kcal; prot += r.prot;
        h += '<div class="repas"><div class="ligne"><strong>' + esc(r.nom) + '</strong><span class="etiquette">' + esc(r.moment) + '</span></div><div class="doux">' + esc(r.detail) + '</div><div class="doux">≈ ' + r.kcal + " kcal · " + r.prot + " g de protéines</div></div>";
      });
      h += "<p><strong>Total : ≈ " + kcal + " kcal, " + prot + " g de protéines</strong>";
      var n = besoins(p);
      if (n) h += '<br><span class="doux">Objectif estimé : ' + n.cible + " kcal et " + n.proteines + " g de protéines.</span>";
      else h += '<br><span class="doux">Profil incomplet : repas choisis pour environ 2 800 kcal (valeur type). Renseigne ta taille, ton poids, ton âge et ton sexe dans le profil pour viser ton objectif.</span>';
      h += "</p>";
      h += messageRepas(p, repas) + rappelFiltre(p);
      h += '<div class="alerte">' + esc(LIMITES_ALIM) + " Ajuste les quantités à ton appétit et à ton objectif.</div>";
    }
    return h + "</div>";
  }

  // ---------- Vues ----------
  // ---------- Échauffement et retour au calme ----------
  // Repères : NHS (échauffement d'au moins 6 min, étirements d'environ 5 min, 15 à 20 s par étirement),
  // CSEP / Behm 2016 (échauffement dynamique avant, étirements maintenus plutôt après),
  // Cochrane / Herbert 2011 (étirer ne garantit ni moins de courbatures ni moins de blessures).
  var ECH_MOUV = {
    Pousser: ["Cercles d'épaules : 10 vers l'avant, 10 vers l'arrière.", "Cercles de bras : 10 petits puis 10 grands, dans chaque sens.", "Ouvertures de poitrine : bras écartés puis ramenés devant toi, 10 fois, sans forcer.", "Pompes lentes mains surélevées (sur une chaise) ou sur les genoux : 1 série de 6 à 8, facile."],
    Tirer: ["Cercles d'épaules : 10 vers l'avant, 10 vers l'arrière.", "Serrer les omoplates : bras le long du corps, rapproche les omoplates 2 secondes, 10 fois.", "Rotations du buste, bras croisés sur la poitrine : 8 de chaque côté.", "Chat-vache à quatre pattes : 8 allers-retours lents."],
    Jambes: ["Flexions de jambes au poids du corps, amplitude confortable : 10.", "Fentes marchées courtes : 6 par jambe.", "Balancements de jambe d'avant en arrière, une main sur un mur : 10 par jambe.", "Rotations de chevilles : 10 par pied, dans chaque sens."],
    Tronc: ["Rotations du buste debout, bras en croix : 10 par côté.", "Chat-vache à quatre pattes : 8 allers-retours lents.", "Bras et jambe opposés tendus à quatre pattes : 6 par côté, sans cambrer.", "Montées de genoux lentes : 20."],
    Cardio: ["Cercles de hanches, mains sur les hanches : 10 dans chaque sens.", "Flexions de jambes au poids du corps, amplitude confortable : 10.", "Montées sur la pointe des pieds : 15.", "Cercles d'épaules : 10 vers l'avant, 10 vers l'arrière."]
  };
  var CALME_ETIR = {
    Pousser: ["Pectoraux : pose la main et l'avant-bras sur un mur, coude à hauteur d'épaule, tourne doucement le buste de l'autre côté.", "Triceps : une main derrière la nuque, l'autre main guide le coude vers le haut.", "Épaule : bras tendu devant toi, ramène-le vers la poitrine avec l'autre bras."],
    Tirer: ["Dos : à genoux, bras tendus devant sur le sol ou une chaise, recule les hanches (posture de l'enfant), dos détendu.", "Avant-bras et biceps : bras tendu devant, paume vers l'avant, tire doucement les doigts vers toi avec l'autre main.", "Côté du buste : debout, un bras levé, incline-toi doucement de l'autre côté."],
    Jambes: ["Fessiers : allongé sur le dos, croise une jambe sur la cuisse opposée et tire la cuisse vers la poitrine.", "Arrière de cuisse : assis, une jambe tendue devant toi, l'autre pliée, penche-toi doucement vers le pied, dos long.", "Mollet : un pas en avant, jambe arrière tendue, talon arrière au sol, main au mur si besoin.", "Avant de cuisse : debout, une main au mur, attrape le pied et rapproche le talon de la fesse, genoux l'un contre l'autre.", "Intérieur de cuisse : assis, plantes des pieds l'une contre l'autre, laisse les genoux descendre."],
    Tronc: ["Torsion allongée : sur le dos, genoux pliés, laisse tomber les genoux d'un côté, épaules au sol.", "Posture de l'enfant : à genoux, fesses vers les talons, bras tendus devant.", "Avant du tronc : sur le ventre, appuyé sur les avant-bras, soulève doucement la poitrine, sans douleur dans le bas du dos."],
    Cardio: ["Mollet : un pas en avant, jambe arrière tendue, talon arrière au sol, main au mur si besoin.", "Avant de cuisse : debout ou sur le côté, attrape le pied et rapproche le talon de la fesse.", "Arrière de cuisse : assis, une jambe tendue devant toi, l'autre pliée, penche-toi doucement vers le pied, dos long."]
  };
  function groupesSeance(liste, focus) {
    var g = [focus];
    liste.forEach(function (e) { if (g.indexOf(e.groupe) === -1) g.push(e.groupe); });
    return g.filter(function (x) { return ECH_MOUV[x]; });
  }
  function choisir(table, groupes, max, exclure) {
    var out = [], i = 0, ajoute = true;
    var deja = function (x) { return out.indexOf(x) !== -1 || (exclure && exclure.test(x)); };
    while (out.length < max && ajoute) {
      ajoute = false;
      groupes.forEach(function (g) { var t = table[g]; if (t && i < t.length && out.length < max) { if (!deja(t[i])) out.push(t[i]); ajoute = true; } });
      i++;
    }
    return out;
  }
  var ILLU = [
    ["Pompes lentes", "pompes", "Ketut Subiyanto", 4720291],
    ["Flexions de jambes", "squat", null, 4384679],
    ["Option avec ta corde", "corde", null, 0],
    ["Triceps", "m-triceps", "Tima Miroshnichenko", 6388359],
    ["Épaule", "m-epaule", "RDNE Stock project", 8401123],
    ["Côté du buste", "m-cote", "Monstera Production", 6998459],
    ["Intérieur de cuisse", "m-interieur", "Monstera Production", 6311694],
    ["Posture de l'enfant", "m-enfant", "Klaus Nielsen", 6303722],
    ["Avant du tronc", "m-sphinx", "Monstera Production", 5384552],
    ["Chat-vache", "m-chatvache", "Vi Nguyen", 17572172],
    ["Arrière de cuisse", "m-arriere", "RF._.studio", 3886098],
    ["Avant de cuisse", "m-avant", "Ketut Subiyanto", 5038830]
  ];
  function illuDe(t) {
    for (var i = 0; i < ILLU.length; i++) {
      if (t.indexOf(ILLU[i][0]) === 0 && window.IMGS && window.IMGS[ILLU[i][1]]) {
        var ph = window.PHOTOS && window.PHOTOS[ILLU[i][1]];
        return { cle: ILLU[i][1], auteur: ILLU[i][2] || (ph && ph.auteur) || "", id: ILLU[i][3] || (ph && ph.pexels) || 0, nom: ILLU[i][0] };
      }
    }
    return null;
  }
  function liHtml(tab, credits) {
    return '<ul class="liste-illu">' + tab.map(function (t) {
      var il = illuDe(t);
      if (!il) return '<li class="sans-img"><span>' + esc(t) + "</span></li>";
      if (credits && il.auteur && credits.indexOf(il.auteur) === -1) credits.push(il.auteur);
      return '<li class="avec-img"><img src="' + window.IMGS[il.cle] + '" alt="' + esc(il.nom) + '" width="400" height="300" loading="lazy"><span>' + esc(t) + "</span></li>";
    }).join("") + "</ul>";
  }
  function creditsHtml(c) {
    return c.length ? '<p class="doux petit">Photos : ' + c.map(esc).join(", ") + ' / <a href="https://www.pexels.com/license/" target="_blank" rel="noopener">Pexels</a>. Les photos illustrent le mouvement ; suis le texte.</p>' : "";
  }
  function blocEchauffement(p, groupes) {
    var mats = p.materiel || [];
    var charge = ["gilet", "disques", "halteres", "elastique"].some(function (m) { return mats.indexOf(m) !== -1; });
    var h = '<details class="carte verre" id="echauffement"><summary><strong>Échauffement</strong> <span class="doux">(environ ' + (charge ? "8 à 10 minutes, séries légères comprises" : "6 à 7 minutes") + ", avant la séance)</span></summary>";
    h += '<p class="doux">Objectif : monter doucement le rythme cardiaque et préparer les articulations utilisées. Mouvements dynamiques, sans rester en étirement long.</p>';
    h += "<h4>1. Monter en température (3 minutes)</h4>";
    var gen = ["Marche sur place puis en avant et en arrière, bras actifs : 1 minute.", "Montées de genoux légères : 1 minute.", "Talons-fesses légers : 1 minute."];
    if (mats.indexOf("corde") !== -1) gen.push("Option avec ta corde à sauter : sauts très tranquilles pendant 2 à 3 minutes à la place des trois points ci-dessus.");
    var cr = []; h += liHtml(gen, cr);
    h += "<h4>2. Mobilité pour les muscles du jour (3 à 4 minutes)</h4>" + liHtml(choisir(ECH_MOUV, groupes, 5, /^(Talons-fesses|Montées de genoux|Marche)/), cr) + creditsHtml(cr);
    if (charge) {
      h += "<h4>3. Séries de montée en charge</h4><p>Avant le premier exercice avec charge, fais 1 à 2 séries légères du même mouvement : 8 à 10 répétitions faciles, loin de l'échec.</p>";
    }
    return h + "</details>";
  }
  function blocRetourCalme(groupes) {
    var h = '<details class="carte verre" id="retour-calme"><summary><strong>Retour au calme et étirements</strong> <span class="doux">(environ 6 à 8 minutes, après la séance)</span></summary>';
    h += "<h4>1. Redescendre (2 à 3 minutes)</h4><p>Marche lente et respiration calme, jusqu'à ce que le souffle et le cœur redescendent.</p>";
    h += "<h4>2. Étirements maintenus : 15 à 20 secondes par côté</h4>" + (function () { var cr = []; var l = liHtml(choisir(CALME_ETIR, groupes, 6), cr); return l + creditsHtml(cr); })();
    h += '<p class="doux">Va jusqu\'à une tension légère, jamais jusqu\'à la douleur. Respire normalement, ne rebondis pas, et fais les deux côtés.</p>';
    h += '<div class="alerte">Les étirements servent à se détendre et à garder de l\'amplitude. Les études ne montrent pas qu\'ils réduisent à coup sûr les courbatures ou les blessures. Arrête en cas de douleur ; si tu as une blessure ou un doute, demande l\'avis d\'un professionnel de santé. Repères : NHS, position du CSEP (Behm 2016), revue Cochrane (Herbert 2011).</div>';
    return h + "</details>";
  }

  // ---------- Pour la séance guidée (guide.js) : mêmes listes que l'accueil, découpées en étapes chronométrées ----------
  // Zone étirée (schéma indicatif sur la planche) et étirement d'un côté puis de l'autre.
  var ETIR_INFO = {
    "Pectoraux": [["pec"], true], "Triceps": [["triceps"], true], "Épaule": [["deltpost"], true], "Dos": [["lats"], false],
    "Avant-bras et biceps": [["biceps"], true], "Côté du buste": [["obliques", "lats"], true], "Fessiers": [["glute"], true],
    "Arrière de cuisse": [["ischio"], true], "Mollet": [["mollet"], true], "Avant de cuisse": [["quad"], true],
    "Intérieur de cuisse": [[], false], "Torsion allongée": [["obliques"], true], "Posture de l'enfant": [["lats"], false], "Avant du tronc": [["abs"], false]
  };
  function decoupe(t) {
    var i = t.indexOf(" : "), nom = i > 0 ? t.slice(0, i) : t.replace(/\.$/, ""), det = i > 0 ? t.slice(i + 3) : "";
    if (det) det = det.charAt(0).toUpperCase() + det.slice(1);
    var il = illuDe(t);
    return { t: t, nom: nom, detail: det, img: il ? window.IMGS[il.cle] : null, credit: il ? il.auteur : "" };
  }
  function groupesDe(liste) { return groupesSeance(liste, liste.length ? liste[0].groupe : "Pousser"); }
  window.S4App = {
    echauffement: function (liste) {
      if (!liste || !liste.length) return [];
      var gen = ["Marche sur place puis en avant et en arrière, bras actifs : 1 minute.", "Montées de genoux légères : 1 minute.", "Talons-fesses légers : 1 minute."];
      var out = gen.map(function (t) { var o = decoupe(t); o.d = 60; o.cat = "Échauffement · monter en température"; return o; });
      choisir(ECH_MOUV, groupesDe(liste), 5, /^(Talons-fesses|Montées de genoux|Marche)/).forEach(function (t) { var o = decoupe(t); o.d = 45; o.cat = "Échauffement · mobilité"; out.push(o); });
      return out;
    },
    etirements: function (liste) {
      if (!liste || !liste.length) return [];
      var out = [{ t: "Redescendre : marche lente et respiration calme.", nom: "Redescendre", detail: "Marche lente et respiration calme, jusqu'à ce que le souffle et le cœur redescendent.", d: 90, cotes: false, mus: [], img: null, credit: "" }];
      choisir(CALME_ETIR, groupesDe(liste), 6).forEach(function (t) { var o = decoupe(t), inf = ETIR_INFO[o.nom] || [[], false]; o.d = 20; o.mus = inf[0]; o.cotes = inf[1]; out.push(o); });
      return out;
    },
    // Appelé seulement par un appui sur « Valider » dans le bilan : même format que le bouton Valider de l'accueil.
    valider: function (ids) {
      var p = profil(); if (!p) return false;
      var j = aujourdhui(); p.valides[j] = p.valides[j] || [];
      (ids || []).forEach(function (id) { if (exoParId(id) && p.valides[j].indexOf(id) === -1) p.valides[j].push(id); });
      var ok = sauver(); route(); return ok;
    }
  };

  // ---------- Composer ma séance ----------
  function persoDuJour(p) {
    return p.perso && p.perso.date === aujourdhui() ? p.perso : null;
  }
  function persoListe(p) {
    var x = persoDuJour(p);
    return x ? x.exos.map(exoParId).filter(Boolean) : [];
  }
  function estMin(liste) {
    return window.S4Guide && window.S4Guide.estimer ? Math.max(1, Math.round(window.S4Guide.estimer(liste) / 60)) : 0;
  }
  function vueComposer() {
    var p = profil(), x = persoDuJour(p), choisis = x ? x.exos : [];
    var h = '<p><a href="#/aujourdhui">← Aujourd\'hui</a></p><h2>Composer ma séance</h2>';
    h += '<p class="doux">Voici les exercices faisables avec ton matériel' + (p.lieu === "maison" ? ", à la maison" : p.lieu === "exterieur" ? ", en extérieur" : "") + '. Touche un exercice pour l\'ajouter ou le retirer. Ta sélection est gardée pour aujourd\'hui seulement.</p>';
    var liste = persoListe(p);
    if (liste.length) {
      var est = estMin(liste);
      h += '<div class="carte verre"><button class="cta-seance" data-guide="seance-perso"><span class="cta-play" aria-hidden="true"></span><span class="cta-txt"><strong>Lancer ma séance composée</strong><small>' + liste.length + " exercice" + (liste.length > 1 ? "s" : "") + (est ? " · ≈ " + est + " min" : "") + " · échauffement et étirements guidés</small></span></button></div>";
    }
    GROUPES.forEach(function (g) {
      var exos = EXERCICES.filter(function (e) { return e.groupe === g && faisable(e, p); });
      if (!exos.length) return;
      h += "<h3>" + g + "</h3>";
      exos.forEach(function (e) {
        var on = choisis.indexOf(e.id) !== -1;
        h += '<div class="exo verre">' + vignette(e) + '<div class="corps"><a href="#/exercice/' + e.id + '"><strong>' + esc(e.nom) + "</strong></a><div class=\"doux\">" + esc(adapter(e, p).series) + "</div></div>" +
          '<button class="' + (on ? "" : "second") + '" data-perso="' + e.id + '" aria-pressed="' + on + '">' + (on ? "Choisi ✓" : "Ajouter") + "</button></div>";
      });
    });
    vue.innerHTML = h;
  }

  // ---------- Accueil (v33, allégé) ----------
  // Ordre : séance du jour, échauffement (replié), séance proposée, retour au calme (replié), changer de séance, nutrition (repliée).
  function blocChanger(p) {
    var j = aujourdhui(), al = p.aleatoire && p.aleatoire.date === j ? p.aleatoire : null, perso = persoListe(p), n = perso.length;
    var h = '<div class="carte verre" id="changer"><h3>Changer de séance</h3><p class="doux">Envie d\'autre chose que la séance proposée ?</p>';
    h += '<div class="duo"><a class="bouton second" href="#/aleatoire" aria-label="Séance aléatoire : tirer une séance au hasard">Aléatoire</a><a class="bouton second" href="#/composer" aria-label="Composer ma séance : choisir mes exercices">Composer</a></div>';
    if (al) h += '<p class="doux petit" style="margin-top:10px">Séance aléatoire du jour prête (' + al.exos.length + " exercice" + (al.exos.length > 1 ? "s" : "") + '). <a href="#/aleatoire">L\'ouvrir</a></p>';
    if (n) {
      var est = estMin(perso);
      h += '<button class="cta-seance" style="margin-top:10px" data-guide="seance-perso"><span class="cta-play" aria-hidden="true"></span><span class="cta-txt"><strong>Lancer ma séance composée</strong><small>' + n + " exercice" + (n > 1 ? "s" : "") + (est ? " · ≈ " + est + " min" : "") + " · guidage voix</small></span></button>";
    }
    return h + "</div>";
  }
  function vueAleatoire() {
    var p = profil(), faits = p.valides[aujourdhui()] || [];
    vue.innerHTML = '<p><a href="#/aujourdhui">← Aujourd\'hui</a></p><h2>Séance aléatoire</h2>' + blocAleatoire(p, faits);
  }
  function vueAujourdhui() {
    var p = profil(), s = seance(p), jour = aujourdhui();
    var faits = p.valides[jour] || [];
    var nbFaits = s.liste.filter(function (e) { return faits.indexOf(e.id) !== -1; }).length;
    var h = alerteHtml() + "<h2>Séance du jour</h2>";
    h += '<div class="carte verre" id="seance-jour"><p class="doux">' + esc(new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })) + "</p>";
    h += "<h3>Focus : " + esc(s.focus) + "</h3>";
    h += '<div class="seg" role="group" aria-label="Intensité de la séance">' + INTENSITES.map(function (x) { var on = intensiteDe(p).id === x.id; return '<button class="' + (on ? "" : "second") + '" data-intensite="' + x.id + '" aria-pressed="' + on + '">' + x.nom + "</button>"; }).join("") + "</div>";
    h += '<p class="doux">' + s.liste.length + " exercice" + (s.liste.length > 1 ? "s" : "") + " choisis selon ton matériel · " + nbFaits + "/" + s.liste.length + " validé" + (nbFaits > 1 ? "s" : "") + ".</p>";
    if (window.S4Guide && s.liste.length) {
      var est = estMin(s.liste);
      h += '<button class="cta-seance" data-guide="seance-jour"><span class="cta-play" aria-hidden="true"></span><span class="cta-txt"><strong>Lancer la séance guidée</strong><small>' + s.liste.length + " exercices" + (est ? " · ≈ " + est + " min" : "") + " · guidage voix</small></span></button>";
    }
    h += "</div>";
    var grp = groupesSeance(s.liste, s.focus);
    h += blocEchauffement(p, grp);
    h += '<h3 id="seance-proposee" style="margin:6px 4px 10px">Séance proposée</h3>';
    s.liste.forEach(function (e) {
      var fait = faits.indexOf(e.id) !== -1;
      h += '<div class="exo verre">' + vignette(e) + '<div class="corps"><a href="#/exercice/' + e.id + '"><strong>' + esc(e.nom) + "</strong></a><div class=\"doux\">" + esc(e.series) + "</div>" + infoSeries(p, e) + "</div>" +
        '<button class="' + (fait ? "second" : "") + '" data-valider="' + e.id + '" aria-pressed="' + fait + '" aria-label="' + (fait ? "Validé : " : "Valider : ") + esc(e.nom) + '">' + (fait ? "Validé ✓" : "Valider") + "</button></div>";
    });
    h += blocRetourCalme(grp);
    h += blocChanger(p);
    var n = besoins(p);
    h += '<details class="carte verre" id="nutrition"><summary><strong>Nutrition</strong> <span class="doux">' + (n ? "≈ " + n.cible + " kcal · " + n.proteines + " g de protéines par jour" : "besoins à estimer (profil incomplet)") + "</span></summary>";
    if (n) {
      h += '<p style="margin-top:10px"><span class="kcal">' + n.cible + ' kcal</span> par jour<br>Protéines : environ ' + n.proteines + " g par jour</p>" +
        '<p class="doux">Estimation : dépense d\'entretien d\'environ ' + n.entretien + " kcal (formule de Mifflin-St Jeor) + 300 kcal. Protéines : 1,6 g par kg de poids.</p>";
    } else {
      h += "<p style=\"margin-top:10px\">Renseigne ta taille, ton poids, ton âge et ton sexe dans le <a href=\"#/profil\">profil</a> pour estimer tes besoins.</p>";
    }
    h += '<p><a class="bouton second" href="#/repas">Voir les repas du jour</a></p>' + rappelFiltre(p);
    h += '<div class="alerte">Estimation indicative, pas un avis médical. Valeurs d\'après la table ANSES-CIQUAL 2025 (aliments génériques, pour 100 g), calculées sur les grammes indiqués ; les poids d\'unité sont des repères ; les recettes ne sont pas validées par un professionnel de santé.</div></details>';
    vue.innerHTML = h;
  }

  // ---------- Onglet Repas ----------
  function repasDuJour(p) {
    var j = aujourdhui();
    var al = p.aleatoire && p.aleatoire.date === j && p.aleatoire.repas ? p.aleatoire : null;
    var cur = al ? al.repas : p.repasJour && p.repasJour.date === j && Array.isArray(p.repasJour.repas) ? p.repasJour.repas : null;
    // v33 : des repas tirés avant un changement de préférences (ou venus d'un import) sont remplacés s'ils sont exclus.
    if (cur && idsValides(cur, p)) return cur;
    var nr = genererRepas(p);
    p.repasJour = { date: j, repas: nr };
    if (al) al.repas = nr;
    sauver();
    return nr;
  }
  function vueRepas() {
    var p = profil(), j = aujourdhui();
    var ids = repasDuJour(p), repas = ids.map(repasParId).filter(Boolean);
    var h = alerteHtml() + "<h2>Repas du jour</h2>";
    h += '<div class="carte verre"><p class="doux">' + esc(new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })) + '</p>';
    var kcal = 0, prot = 0;
    repas.forEach(function (r) {
      kcal += r.kcal; prot += r.prot;
      h += '<div class="repas"><div class="ligne"><strong>' + esc(r.nom) + '</strong><span class="etiquette">' + esc(r.moment) + '</span></div><div class="doux">' + esc(r.detail) + '</div><div class="doux">≈ ' + r.kcal + " kcal, " + r.prot + " g de protéines</div></div>";
    });
    h += "<p><strong>Total : ≈ " + kcal + " kcal, " + prot + " g de protéines</strong>";
    var n = besoins(p);
    if (n) h += '<br><span class="doux">Objectif estimé : ' + n.cible + " kcal et " + n.proteines + " g de protéines.</span>";
    else h += '<br><span class="doux">Profil incomplet : repas choisis pour environ 2 800 kcal (valeur type). Renseigne ta taille, ton poids, ton âge et ton sexe dans le <a href="#/profil">profil</a> pour viser ton objectif.</span>';
    h += "</p>" + messageRepas(p, repas) + rappelFiltre(p) + '<button data-repas-regen="1">Autres repas</button></div>';
    var compat = repasCompatibles(p), masques = REPAS.length - compat.length;
    h += '<div class="carte verre"><h3>Tous les repas</h3><p class="doux">Pour varier ou remplacer un repas.' + (masques ? " " + pluriel(masques, "repas est masqué", "repas sont masqués") + " par tes exclusions." : "") + "</p>";
    ["Petit-déjeuner", "Repas", "Collation"].forEach(function (m) {
      var lm = compat.filter(function (r) { return r.moment === m; });
      h += '<h3 style="margin-top:12px">' + esc(m) + "</h3>";
      if (!lm.length) h += '<p class="doux">Aucun repas compatible avec tes exclusions.</p>';
      lm.forEach(function (r) {
        h += '<div class="repas"><strong>' + esc(r.nom) + '</strong><div class="doux">' + esc(r.detail) + '</div><div class="doux">≈ ' + r.kcal + " kcal, " + r.prot + " g de protéines</div></div>";
      });
    });
    h += '</div><div class="alerte">' + esc(LIMITES_ALIM) + " Ajuste les quantités à ton appétit et à ton objectif.</div>";
    vue.innerHTML = h;
  }

  function vueExercices() {
    var p = profil();
    var filtre = vueExercices.filtre || "Tous";
    var tout = !!vueExercices.tout;
    var h = "<h2>Exercices</h2>";
    h += '<div class="carte verre"><div class="ligne"><div><strong>Filtre matériel</strong><div class="doux">' + (tout ? "Tous les exercices" : "Faisables avec ton matériel") + '</div></div><button class="second" data-bascule="1">' + (tout ? "Filtrer" : "Tout voir") + "</button></div></div>";
    h += '<div class="puces" role="group" aria-label="Groupe musculaire">';
    ["Tous"].concat(GROUPES).forEach(function (g) {
      h += '<button class="' + (g === filtre ? "" : "second") + '" data-groupe="' + g + '">' + g + "</button>";
    });
    h += "</div>";
    var liste = EXERCICES.filter(function (e) {
      return (filtre === "Tous" || e.groupe === filtre) && (tout || faisable(e, p));
    });
    if (!liste.length) h += '<div class="carte verre"><p>Aucun exercice avec ce matériel dans ce groupe. Ajoute du matériel dans le <a href="#/profil">profil</a>.</p></div>';
    liste.forEach(function (e) {
      var ok = faisable(e, p);
      h += '<a class="exo verre" href="#/exercice/' + e.id + '">' + vignette(e) + '<div class="corps"><strong>' + esc(e.nom) + '</strong><div class="doux">' + esc(e.groupe) + " · " + esc(adapter(e, p).series) + "</div><div>" + etiquettesMat(e) + (ok ? "" : '<span class="etiquette">Matériel manquant</span>') + "</div></div></a>";
    });
    h += '<p class="doux">' + liste.length + " exercice" + (liste.length > 1 ? "s" : "") + " affiché" + (liste.length > 1 ? "s" : "") + " sur " + EXERCICES.length + ".</p>";
    vue.innerHTML = h;
  }

  function progression(e) {
    var t = [];
    if (e.requis.indexOf("disques") !== -1) t.push("Disques de 5 kg : les paliers sont grands. Avant de changer de charge, monte d'abord les reps (ex. 12 puis 15 puis 20), ralentis la descente (3 s) et raccourcis les pauses (60 s).");
    if (e.requis.indexOf("halteres") !== -1) t.push("Haltères de 3 kg : charge légère. Progresse par les reps, le tempo lent, les pauses courtes et les séries unilatérales. Les disques de 5 kg peuvent prendre le relais.");
    if (e.requis.indexOf("elastique") !== -1) t.push("Élastique : surcharge en raccourcissant l'élastique, en ralentissant ou en marquant une pause de 2 s à la contraction. La tension monte avec l'étirement, note-le dans les kg (0 si aucune charge).");
    if (e.requis.indexOf("gilet") !== -1) t.push("Gilet lesté 20 kg : progresse par les reps avant d'ajouter de la charge.");
    return t.length ? '<h3>Progression avec ton matériel</h3><p class="doux">' + t.map(esc).join("<br>") + "</p>" : "";
  }

  function vueExercice(id, seriesOverride, note) {
    var e = exoParId(id);
    if (!e) { location.hash = "#/exercices"; return; }
    var h = '<p><a href="#/exercices">← Exercices</a></p><h2>' + esc(e.nom) + "</h2>";
    var ph = window.PHOTOS && window.PHOTOS[e.id];
    if (window.S4L && S4L.has(e)) h += '<div class="illu-exo verre">' + S4L.mouv(e) + '</div>';
    else if (false && ph && window.IMGS && window.IMGS[e.id]) h += '<figure class="photo-exo verre"><img src="' + window.IMGS[e.id] + '" alt="' + esc(e.nom) + '" width="520" height="390"><figcaption>Photo : ' + esc(ph.auteur) + ' / <a href="https://www.pexels.com/photo/' + ph.pexels + '/" target="_blank" rel="noopener">Pexels</a></figcaption></figure>';
    else h += '<div class="illu-exo verre"><p class="doux">Pas de dessin de mouvement exact pour cet exercice : suis les étapes écrites ci-dessous.</p></div>';
    if (window.S4L) h += '<div class="illu-exo verre">' + S4L.mus(e) + '</div>';
    var pf = profil(), serie = seriesOverride;
    if (!serie) {
      var auj = pf.journal[aujourdhui()] && pf.journal[aujourdhui()][e.id], der = derniereSeance(pf, e.id);
      serie = auj && auj.length ? auj : der ? der.series : (function () { var m = (e.series || "").match(/^\s*(\d+)\s*x/i), n = Math.max(2, Math.min(5, 3 + intensiteDe(pf).delta)), t = []; for (var i = 0; i < n; i++) t.push({ r: "", k: "" }); return t; })();
      serie = serie.map(function (x) { return { r: x.r, k: x.k }; });
    }
    h += blocSeries(pf, e, serie, note);
    if (window.S4Guide) h += window.S4Guide.panel(e);
    h += '<div class="carte verre"><p><span class="etiquette">' + esc(e.groupe) + "</span>" + etiquettesMat(e) + '</p><p class="doux">Muscles : ' + esc(e.muscles) + "<br>Volume conseillé : " + esc(e.series) + "</p>";
    h += "<h3>Le mouvement pas à pas</h3><ol class=\"etapes\">" + e.etapes.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ol>";
    h += "<h3>Erreurs fréquentes</h3><p>" + esc(e.erreurs) + "</p><h3>Conseil</h3><p>" + esc(e.conseil) + "</p>" + progression(e) + "</div>";
    h += '<div class="alerte">Conseils généraux. Si une douleur apparaît, arrête-toi et demande un avis à un professionnel.</div>';
    vue.innerHTML = h;
  }

  // ---------- Rappel quotidien (appli Android) ----------
  var CLE_RAPPEL = "sport4life.rappel";
  function natif() { return !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()); }
  function notifs() { return window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications; }
  function lireRappel() {
    try { var r = JSON.parse(localStorage.getItem(CLE_RAPPEL)); if (r && /^\d\d:\d\d$/.test(r.heure)) return { actif: !!r.actif, heure: r.heure }; } catch (e) {}
    return { actif: true, heure: "06:00" };
  }
  function blocRappel() {
    var r = lireRappel();
    var h = '<div class="carte verre"><h3>Rappel quotidien</h3>';
    if (!natif()) return h + '<p class="doux">Le rappel de séance est disponible dans l\'appli Android Sport4Life. Sur le site, il n\'est pas actif.</p></div>';
    h += '<p class="doux">Une notification chaque jour à l\'heure choisie pour te rappeler ta séance. Elle est programmée sur ton téléphone, sans serveur.</p>';
    h += '<button class="second" data-rappel-perm="1">Autoriser les notifications</button>';
    h += '<label for="rappel-heure">Heure du rappel</label><input type="time" id="rappel-heure" value="' + esc(r.heure) + '">';
    h += '<label class="puce" style="margin-top:10px"><input type="checkbox" id="rappel-actif"' + (r.actif ? " checked" : "") + '>Rappel actif</label>';
    h += '<p style="margin-top:10px"><button data-rappel-save="1">Enregistrer le rappel</button></p><p class="doux" id="rappel-msg" role="status"></p></div>';
    return h;
  }
  function msgRappel(t) { var e = document.getElementById("rappel-msg"); if (e) e.textContent = t; }
  function rappelPerm() {
    var n = notifs(); if (!n) { msgRappel("Notifications indisponibles sur cet appareil."); return Promise.resolve(false); }
    return n.checkPermissions().then(function (c) {
      if (c.display === "granted") return true;
      return n.requestPermissions().then(function (r) { return r.display === "granted"; });
    }).then(function (ok) { msgRappel(ok ? "Notifications autorisées." : "Notifications refusées. Active-les dans les réglages Android de l\'appli."); return ok; })
      .catch(function () { msgRappel("Impossible de demander l\'autorisation."); return false; });
  }
  function rappelSauver() {
    var n = notifs(), hh = document.getElementById("rappel-heure").value || "06:00", actif = document.getElementById("rappel-actif").checked;
    var r = { actif: actif, heure: hh };
    try { localStorage.setItem(CLE_RAPPEL, JSON.stringify(r)); } catch (e) {}
    if (!n) { msgRappel("Notifications indisponibles sur cet appareil."); return; }
    var hm = hh.split(":");
    n.cancel({ notifications: [{ id: 1 }] }).catch(function () {}).then(function () {
      if (!actif) { msgRappel("Rappel désactivé."); return; }
      return rappelPerm().then(function (ok) {
        if (!ok) return;
        return n.schedule({ notifications: [{ id: 1, title: "Sport4Life", body: "C\'est l\'heure de ta séance. Ouvre l\'appli pour voir ton programme du jour.", schedule: { on: { hour: parseInt(hm[0], 10), minute: parseInt(hm[1], 10) }, allowWhileIdle: true } }] })
          .then(function () { msgRappel("Rappel programmé chaque jour à " + hh + "."); });
      });
    }).catch(function () { msgRappel("Le rappel n\'a pas pu être programmé."); });
  }
  // ---------- Export / import ----------
  function blocTransfert() {
    return '<div class="carte verre"><h3>Copier mes données</h3><p class="doux">Pour passer du site à l\'appli Android (ou l\'inverse) : exporte ici, copie le texte, puis colle-le dans l\'autre et importe. L\'import ajoute les profils absents et fusionne les séances manquantes des profils déjà présents, sans rien remplacer. Les réglages du guidage et du rappel sont inclus : ils ne sont importés que s\'ils n\'existent pas déjà ici, et le rappel n\'est jamais programmé automatiquement.</p><textarea id="zone-transfert" rows="4" style="width:100%" aria-label="Données exportées ou à importer"></textarea><p style="margin-top:10px"><button class="second" data-export="1">Exporter</button> <button class="second" data-import="1">Importer</button></p><p class="doux" id="transfert-msg" role="status"></p><p class="doux">Version de l\'appli : ' + V + '</p></div>';
  }
  function transfertMsg(t) { var e = document.getElementById("transfert-msg"); if (e) e.textContent = t; }

  function vueProfil() {
    var p = profil();
    var h = alerteHtml() + "<h2>Profil</h2>";
    h += '<div class="carte verre"><label for="sel">Profil actif</label><select id="sel">' + etat.profils.map(function (q) {
      return '<option value="' + q.id + '"' + (q.id === p.id ? " selected" : "") + ">" + esc(q.nom) + "</option>";
    }).join("") + '</select><p style="margin-top:10px"><button class="second" data-nouveau="1">Nouveau profil</button></p></div>';
    h += '<form class="carte verre" id="form" autocomplete="off"><h3>Informations</h3>';
    h += '<label for="nom">Nom</label><input type="text" id="nom" value="' + esc(p.nom) + '">';
    h += '<div class="grille"><div><label for="taille">Taille (cm)</label><input type="text" id="taille" inputmode="decimal" autocomplete="off" value="' + esc(p.taille) + '"></div>';
    h += '<div><label for="poids">Poids (kg)</label><input type="text" id="poids" inputmode="decimal" autocomplete="off" value="' + esc(p.poids) + '"></div>';
    h += '<div><label for="age">Âge</label><input type="number" id="age" inputmode="numeric" value="' + esc(p.age) + '"></div>';
    h += '<div><label for="sexe">Sexe</label><select id="sexe"><option value="">Choisir</option><option value="h"' + (p.sexe === "h" ? " selected" : "") + '>Homme</option><option value="f"' + (p.sexe === "f" ? " selected" : "") + ">Femme</option></select></div></div>";
    h += '<label for="activite">Niveau d\'activité</label><select id="activite">' + ACTIVITES.map(function (a) {
      return '<option value="' + a[0] + '"' + (p.activite === a[0] ? " selected" : "") + ">" + a[1] + "</option>";
    }).join("") + "</select>";
    h += champIntensite(p);
    h += '<h3 style="margin-top:16px">Où t\'entraînes-tu ?</h3><select id="lieu">' +
      [["lesdeux", "Aux deux endroits"], ["maison", "À la maison"], ["exterieur", "En extérieur"]].map(function (x) {
        return '<option value="' + x[0] + '"' + ((p.lieu || "lesdeux") === x[0] ? " selected" : "") + ">" + x[1] + "</option>";
      }).join("") + "</select>";
    h += '<h3 style="margin-top:16px">Matériel disponible</h3><p class="doux">Les exercices s\'adaptent à ta sélection. Le poids du corps est toujours disponible.</p><div class="puces">';
    MATERIEL.forEach(function (m) {
      var coche = m.id === "corps" || p.materiel.indexOf(m.id) !== -1;
      h += '<label class="puce"><input type="checkbox" data-mat="' + m.id + '"' + (coche ? " checked" : "") + (m.id === "corps" ? " disabled" : "") + ">" + esc(m.nom) + "</label>";
    });
    h += "</div>";
    if (p.note) h += '<p class="doux">' + esc(p.note) + "</p>";
    h += '<button type="submit">Enregistrer</button></form>';
    h += blocAlimentation(p);
    // Suivi du poids
    h += '<div class="carte verre"><h3>Suivi du poids</h3>';
    var log = p.poidsLog.slice(-8).reverse();
    h += log.length ? "<p>" + log.map(function (l) { return esc(l.date) + " : " + esc(l.kg) + " kg"; }).join("<br>") + "</p>" : '<p class="doux">Aucune mesure pour l\'instant.</p>';
    h += '<label for="pesee">Poids du jour (kg)</label><div class="ligne"><input type="text" id="pesee" inputmode="decimal" autocomplete="off" placeholder="ex. 74,5 ou 74.5"><button data-pesee="1">Ajouter</button></div><p class="doux" style="margin-top:8px">Le poids du profil est mis à jour avec cette valeur.</p></div>';
    var nbJours = Object.keys(p.valides).length, nbEx = 0;
    Object.keys(p.valides).forEach(function (k) { nbEx += p.valides[k].length; });
    h += '<div class="carte verre"><h3>Progression</h3><p>' + nbEx + " exercice" + (nbEx > 1 ? "s" : "") + " validé" + (nbEx > 1 ? "s" : "") + " sur " + nbJours + " jour" + (nbJours > 1 ? "s" : "") + '.</p></div>';
    h += '<div class="carte verre"><h3>Données</h3><p class="doux">Tes données restent dans ce navigateur, sur cet appareil. Elles ne sont envoyées nulle part. Vider le navigateur les efface.</p><button class="danger" data-supprimer="1">Supprimer ce profil</button></div>';
    h += blocRappel();
    h += blocTransfert();
    h += '<div class="alerte">Sport4Life donne des conseils généraux, pas un avis médical. Sources : recommandations OMS 2020 sur l\'activité physique, littérature scientifique sur l\'hypertrophie, table ANSES-CIQUAL 2025 pour les repas.</div>';
    vue.innerHTML = h;
  }

  // Section Alimentation : enregistrée à chaque changement, sans toucher au formulaire Informations.
  function blocAlimentation(p) {
    var g = alim(p), h = '<div class="carte verre" id="alimentation"><h3>Alimentation</h3>';
    h += '<p class="doux">Ces choix filtrent les repas proposés (onglet Repas, « Autres repas », séance aléatoire), pour ce profil seulement. Ils sont enregistrés dès que tu les modifies.</p>';
    h += '<label for="alim-regime">Raccourci de régime</label><select id="alim-regime" aria-describedby="alim-regime-aide"><option value="">Aucun (je choisis moi-même)</option>' + (window.ALIM_REGIMES || []).map(function (r) {
      return '<option value="' + r.id + '"' + (g.regime === r.id ? " selected" : "") + ">" + esc(r.nom) + "</option>";
    }).join("") + '</select><p class="doux petit" id="alim-regime-aide">Un raccourci coche les exclusions correspondantes (végétarien : viande, poisson, crustacés, mollusques ; végétalien : en plus œufs, lait, miel ; pescétarien : viande). Tu peux ensuite cocher ou décocher chaque case.</p>';
    h += '<p class="alim-intro">Coche ce que tu ne veux jamais voir dans les repas proposés :</p>';
    var groupes = [];
    (window.ALIM_EXCLUSIONS || []).forEach(function (x) { if (groupes.indexOf(x.groupe) === -1) groupes.push(x.groupe); });
    groupes.forEach(function (gr) {
      h += '<fieldset class="alim-groupe"><legend>' + esc(gr) + "</legend>";
      (window.ALIM_EXCLUSIONS || []).filter(function (x) { return x.groupe === gr; }).forEach(function (x) {
        var on = g.exclus.indexOf(x.code) !== -1, aide = x.aide ? ' aria-describedby="aide-' + x.code + '"' : "";
        h += '<label class="alim-case"><input type="checkbox" data-alim-ex="' + x.code + '"' + (on ? " checked" : "") + aide + "><span>" + esc(x.nom) + "</span></label>";
        if (x.aide) h += '<p class="doux petit alim-aide" id="aide-' + x.code + '">' + esc(x.aide) + "</p>";
      });
      h += "</fieldset>";
    });
    h += '<p class="alim-compte" id="alim-compte" role="status" aria-live="polite">' + esc(texteCompte(p)) + "</p>";
    h += "<h4>Goûts</h4><p class=\"doux\">Les goûts orientent le tirage (plus ou moins souvent) sans jamais bloquer un repas. Seules les exclusions retirent des repas.</p>";
    [["aime", "aimes", "Ingrédients que j'aime"], ["pas", "pasAimes", "Ingrédients que je n'aime pas"]].forEach(function (k) {
      h += '<details class="alim-gouts"><summary>' + esc(k[2]) + ' <span id="nb-' + k[0] + '">(' + g[k[1]].length + ")</span></summary><div class=\"puces\">";
      (window.ALIMENTS || []).forEach(function (f) {
        h += '<label class="puce"><input type="checkbox" data-alim-' + k[0] + '="' + f.id + '"' + (g[k[1]].indexOf(f.id) !== -1 ? " checked" : "") + ">" + esc(f.nom) + "</label>";
      });
      h += "</div></details>";
    });
    h += '<div class="alerte">' + esc(LIMITES_ALIM) + "</div></div>";
    return h;
  }
  function changerAlim(t) {
    var p = profil(), g = JSON.parse(JSON.stringify(alim(p)));
    var ajoute = function (l, x) { if (l.indexOf(x) === -1) l.push(x); }, retire = function (l, x) { var i = l.indexOf(x); if (i !== -1) l.splice(i, 1); };
    if (t.id === "alim-regime") { g.regime = t.value; var r = alimRegime(t.value); if (r) r.exclus.forEach(function (c) { ajoute(g.exclus, c); }); }
    else if (t.hasAttribute("data-alim-ex")) { (t.checked ? ajoute : retire)(g.exclus, t.getAttribute("data-alim-ex")); }
    else if (t.hasAttribute("data-alim-aime")) { var a1 = t.getAttribute("data-alim-aime"); (t.checked ? ajoute : retire)(g.aimes, a1); if (t.checked) retire(g.pasAimes, a1); }
    else if (t.hasAttribute("data-alim-pas")) { var a2 = t.getAttribute("data-alim-pas"); (t.checked ? ajoute : retire)(g.pasAimes, a2); if (t.checked) retire(g.aimes, a2); }
    // Raccourci décoché dès qu'une de ses exclusions est retirée.
    var rg = alimRegime(g.regime);
    if (rg && rg.exclus.some(function (c) { return g.exclus.indexOf(c) === -1; })) g.regime = "";
    p.alimentation = alimValide(g) || alimVide();
    // Les repas déjà tirés ne sont plus forcément conformes : on les invalide (repas du jour) ou on les retire (séance aléatoire).
    p.repasJour = null;
    if (p.aleatoire && Array.isArray(p.aleatoire.repas)) p.aleatoire.repas = genererRepas(p);
    sauver();
    // Mise à jour sur place (le formulaire Informations, peut-être en cours de saisie, n'est pas redessiné).
    var a = p.alimentation, z = document.getElementById("alim-regime");
    if (z) z.value = a.regime;
    [].forEach.call(document.querySelectorAll("[data-alim-ex]"), function (c) { c.checked = a.exclus.indexOf(c.getAttribute("data-alim-ex")) !== -1; });
    [].forEach.call(document.querySelectorAll("[data-alim-aime]"), function (c) { c.checked = a.aimes.indexOf(c.getAttribute("data-alim-aime")) !== -1; });
    [].forEach.call(document.querySelectorAll("[data-alim-pas]"), function (c) { c.checked = a.pasAimes.indexOf(c.getAttribute("data-alim-pas")) !== -1; });
    var n1 = document.getElementById("nb-aime"), n2 = document.getElementById("nb-pas"), cp = document.getElementById("alim-compte");
    if (n1) n1.textContent = "(" + a.aimes.length + ")";
    if (n2) n2.textContent = "(" + a.pasAimes.length + ")";
    if (cp) cp.textContent = texteCompte(p);
  }
  function lireForm(p) {
    p = p || profil();
    var g = function (i) { return document.getElementById(i).value; };
    p.nom = g("nom").trim() || "Sans nom";
    p.taille = g("taille").trim().replace(",", "."); p.poids = g("poids").trim().replace(",", "."); p.age = g("age"); p.sexe = g("sexe"); p.activite = g("activite"); p.lieu = g("lieu"); if (document.getElementById("intensite")) p.intensite = g("intensite");
    p.materiel = [].slice.call(document.querySelectorAll("[data-mat]")).filter(function (c) { return c.checked; }).map(function (c) { return c.getAttribute("data-mat"); });
    sauver();
    return p;
  }

  // ---------- Événements ----------
  vue.addEventListener("click", function (ev) {
    var t = ev.target.closest("button");
    if (!t) return;
    if (t.dataset.intensite) { var pi = profil(); if (pi && INTENSITES.some(function (x) { return x.id === t.dataset.intensite; })) { pi.intensite = t.dataset.intensite; sauver(); route(true); var bf = vue.querySelector('[data-intensite="' + pi.intensite + '"]'); if (bf) bf.focus(); } return; }
    if (t.dataset.sauvegarde) { telechargerSauvegarde(); return; }
    if (t.dataset.exemple) {
      var ex = exemple(); etat.profils.push(ex); etat.actif = ex.id; sauver(); route(); return;
    }
    if (t.dataset.composer) { location.hash = "#/composer"; return; }
    if (t.dataset.perso) {
      var pr = profil(), jr = aujourdhui();
      if (!pr.perso || pr.perso.date !== jr) pr.perso = { date: jr, exos: [] };
      var ip = pr.perso.exos.indexOf(t.dataset.perso);
      if (ip === -1) pr.perso.exos.push(t.dataset.perso); else pr.perso.exos.splice(ip, 1);
      sauver(); vueComposer(); return;
    }
    if (t.dataset.rappelPerm) { rappelPerm(); return; }
    if (t.dataset.rappelSave) { rappelSauver(); return; }
    if (t.dataset.export) {
      var z = document.getElementById("zone-transfert"); try { z.value = etat.profils.length ? texteExport() : ""; z.select(); } catch (e) {}
      transfertMsg(z && z.value ? "Texte prêt à copier." : "Rien à exporter."); return;
    }
    if (t.dataset.import) {
      var avant = JSON.stringify(etat), reg = null;
      try {
        var imp = JSON.parse(document.getElementById("zone-transfert").value);
        if (!imp || !Array.isArray(imp.profils)) throw new Error("format");
        var etaitVide = !profil(), nouveaux = [], fusions = [], ajouts = 0, conflits = 0, ignores = 0, concernes = [];
        imp.profils.forEach(function (q) {
          if (!objet(q) || typeof q.id !== "string" || !q.id || !cleOk(q.id)) { ignores++; return; }
          var loc = etat.profils.filter(function (x) { return x.id === q.id; })[0];
          var deja = nouveaux.filter(function (x) { return x.id === q.id; })[0];
          if (deja) { var rd = fusionnerProfil(deja, q, false); ajouts += rd.ajouts; conflits += rd.conflits; ignores += rd.ignores; if (rd.conflits) concernes.push(deja.nom || deja.id); if (rd.ajouts) fusions.push([deja, q]); return; }
          if (!loc) { var pp = profilPropre(q); ignores += pp.ignores; nouveaux.push(pp.p); }
          else { var r = fusionnerProfil(loc, q, false); ajouts += r.ajouts; conflits += r.conflits; ignores += r.ignores; if (r.conflits) concernes.push(loc.nom || loc.id); if (r.ajouts) fusions.push([loc, q]); }
        });
        var pr = planReglages(imp); ignores += pr.ignores;
        var regTxt = textesReglages(pr);
        if (!nouveaux.length && !ajouts && pr.guide !== "importer" && pr.rappel !== "importer") {
          transfertMsg(conflits ? "Rien à ajouter. " + conflits + " saisie" + (conflits > 1 ? "s" : "") + " différente" + (conflits > 1 ? "s" : "") + " : tes données actuelles sont gardées." : (ignores ? ignores + " élément(s) mal formé(s) ignoré(s). " : "") + "Rien de nouveau à importer.");
          return;
        }
        var resume = nouveaux.length + " profil(s) nouveau(x), " + ajouts + " saisie(s) ajoutée(s) à des profils existants" + (conflits ? ", " + conflits + " saisie(s) différente(s) NON écrasée(s) (profil(s) concerné(s) : " + concernes.join(", ") + " ; tes données actuelles sont gardées)" : "") + (ignores ? ", " + ignores + " élément(s) mal formé(s) ignoré(s)" : "") + (regTxt.length ? ". Réglages : " + regTxt.join(" ; ") : "") + ". Rien n'est supprimé ni remplacé. Continuer ?";
        if (!confirm(resume)) { transfertMsg("Import annulé. Rien n'a été modifié."); return; }
        reg = appliquerReglages(pr);
        if (!reg.ok) {
          reg.annuler(); etat = JSON.parse(avant); signalerEchec(true);
          transfertMsg("Import impossible : l'enregistrement des réglages a échoué. Tes données et réglages d'avant sont intacts.");
          return;
        }
        nouveaux.forEach(function (q) { etat.profils.push(q); });
        fusions.forEach(function (c) { fusionnerProfil(c[0], c[1], true); });
        if (etaitVide) { etat.actif = (imp.actif && etat.profils.some(function (x) { return x.id === imp.actif; })) ? imp.actif : etat.profils[0].id; }
        if (!sauver()) {
          reg.annuler(); etat = JSON.parse(avant); signalerEchec(true);
          transfertMsg("Import impossible : l'enregistrement a échoué. Tes données et réglages d'avant sont intacts.");
          return;
        }
        if (etaitVide) { location.hash = "#/profil"; route(); transfertMsg("Import terminé." + (regTxt.length ? " Réglages : " + regTxt.join(" ; ") + "." : "")); return; }
        route();
        transfertMsg((regTxt.length ? "Réglages : " + regTxt.join(" ; ") + ". " : "") + nouveaux.length + " profil(s) ajouté(s), " + ajouts + " saisie(s) fusionnée(s)" + (conflits ? ", " + conflits + " conflit(s) ignoré(s) (données actuelles gardées)" : "") + (ignores ? ", " + ignores + " élément(s) mal formé(s) ignoré(s)" : "") + ".");
      } catch (e) { if (reg) reg.annuler(); etat = JSON.parse(avant); transfertMsg("Texte non reconnu. Rien n'a été modifié."); }
      return;
    }
    var p = profil();
    if (!p) return;
    if (t.dataset.seriePlus || t.dataset.serieMoins || t.dataset.serieEnreg) {
      var sid = t.dataset.seriePlus || t.dataset.serieMoins || t.dataset.serieEnreg, brut = lireSeriesDom();
      if (t.dataset.seriePlus) { brut.push({ r: brut.length ? brut[brut.length - 1].r : "", k: brut.length ? brut[brut.length - 1].k : "" }); vueExercice(sid, brut); }
      else if (t.dataset.serieMoins) { if (brut.length > 1) brut.pop(); vueExercice(sid, brut); }
      else {
        var ok = brut.map(function (x) { return { r: Math.round(nombre(x.r)), k: nombre(x.k) }; }).filter(function (x) { return x.r > 0; });
        var jr = aujourdhui();
        p.journal[jr] = p.journal[jr] || {};
        p.valides[jr] = p.valides[jr] || [];
        if (ok.length) {
          p.journal[jr][sid] = ok;
          if (p.valides[jr].indexOf(sid) === -1) p.valides[jr].push(sid);
        } else { if (p.journal[jr][sid]) { delete p.journal[jr][sid]; var iv = p.valides[jr].indexOf(sid); if (iv !== -1) p.valides[jr].splice(iv, 1); } }
        sauver();
        vueExercice(sid, null, ok.length ? "Enregistré : " + resumeSeries(ok) + ". Exercice validé pour aujourd'hui." : "Aucune série saisie : séries effacées et validation retirée pour aujourd'hui (si elle venait de ces séries).");
      }
      return;
    }
    if (t.dataset.repasRegen) {
      var nr = genererRepas(p); p.repasJour = { date: aujourdhui(), repas: nr };
      if (p.aleatoire && p.aleatoire.date === aujourdhui()) p.aleatoire.repas = nr;
      sauver(); vueRepas(); return;
    }
    if (t.dataset.alea) {
      // La séance aléatoire a son propre écran (même état quotidien qu'avant).
      p.aleatoire = genererAleatoire(p); sauver();
      if (location.hash !== "#/aleatoire") location.hash = "#/aleatoire"; else { vueAleatoire(); window.scrollTo(0, 0); }
    } else if (t.dataset.valider) {
      var j = aujourdhui(); p.valides[j] = p.valides[j] || [];
      var i = p.valides[j].indexOf(t.dataset.valider);
      if (i === -1) p.valides[j].push(t.dataset.valider); else p.valides[j].splice(i, 1);
      sauver(); var y = window.scrollY; route(true); window.scrollTo(0, y);
    } else if (t.dataset.groupe) { vueExercices.filtre = t.dataset.groupe; vueExercices();
    } else if (t.dataset.bascule) { vueExercices.tout = !vueExercices.tout; vueExercices();
    } else if (t.dataset.nouveau) {
      var n = exemple(); n.nom = "Nouveau profil"; n.note = ""; n.materiel = ["corps"]; n.activite = "1.55";
      etat.profils.push(n); etat.actif = n.id; sauver(); route();
    } else if (t.dataset.pesee) {
      var kg = parseFloat(String(document.getElementById("pesee").value).replace(",", "."));
      if (!(kg > 20 && kg < 400)) { alert("Entre ton poids du jour en kg (par exemple 74.5)."); return; }
      p.poids = String(kg);
      var d = aujourdhui();
      p.poidsLog = p.poidsLog.filter(function (l) { return l.date !== d; });
      p.poidsLog.push({ date: d, kg: kg }); sauver(); vueProfil();
    } else if (t.dataset.supprimer) {
      if (etat.profils.length < 2) { alert("Garde au moins un profil."); return; }
      if (!confirm("Supprimer ce profil et ses données ?")) return;
      etat.profils = etat.profils.filter(function (q) { return q.id !== p.id; });
      etat.actif = etat.profils[0].id; sauver(); route();
    }
  });
  vue.addEventListener("change", function (ev) {
    var tg = ev.target;
    if (tg.id === "alim-regime" || (tg.hasAttribute && (tg.hasAttribute("data-alim-ex") || tg.hasAttribute("data-alim-aime") || tg.hasAttribute("data-alim-pas")))) { changerAlim(tg); return; }
    if (ev.target.id === "sel-exo") { vueHistorique.exo = ev.target.value; vueHistorique(); return; }
    if (ev.target.id === "sel") { etat.actif = ev.target.value; sauver(); route(); }
  });
  function telechargerSauvegarde() {
    var brut = "";
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf(CLE + ".sauvegarde") === 0) { brut = localStorage.getItem(k); break; }
      }
    } catch (e) {}
    var lien = document.createElement("a");
    lien.href = URL.createObjectURL(new Blob([brut], { type: "application/json" }));
    lien.download = "sport4life-sauvegarde.json";
    document.body.appendChild(lien); lien.click(); lien.remove();
  }
  vue.addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (ev.target.id === "bienvenue") {
      var np = normaliser({ id: uid(), nom: "", materiel: [] });
      lireForm(np);
      if (np.nom === "Sans nom") np.nom = "Mon profil";
      etat.profils.push(np); etat.actif = np.id; sauver(); route(); return;
    }
    lireForm(); route();
    var ok = document.createElement("p"); ok.className = "doux"; ok.textContent = "Profil enregistré.";
    vue.insertBefore(ok, vue.firstChild);
  });

  if (window.S4Guide) {
    window.S4Guide.sources.jour = function () { return seance(profil()).liste; };
    window.S4Guide.sources.jourTitre = function () { return "Focus " + seance(profil()).focus; };
    window.S4Guide.sources.alea = function () { var p = profil(), x = p.aleatoire && p.aleatoire.date === aujourdhui() ? p.aleatoire : null; return x ? x.exos.map(exoParId).filter(Boolean) : []; };
    window.S4Guide.sources.perso = function () { return persoListe(profil()); };
    window.S4Guide.sources.persoTitre = function () { return "Ma séance composée"; };
  }
  // Accès en lecture pour les tests automatisés (dev/v33-tests.txt).
  window.S4Repas = { generer: function (p) { return genererRepas(p || profil()); }, compatibles: function (p) { return repasCompatibles(p || profil()).map(function (r) { return r.id; }); }, alimValide: alimValide };
  function route(garderPosition) {
    var h = location.hash.replace(/^#\/?/, "") || "aujourdhui";
    var parts = h.split("/"), nav = parts[0];
    if (!profil()) {
      document.getElementById("profil-actif").textContent = "Bienvenue";
      [].forEach.call(document.querySelectorAll("[data-nav]"), function (x) { x.removeAttribute("aria-current"); });
      vueBienvenue(); window.scrollTo(0, 0); return;
    }
    document.getElementById("profil-actif").textContent = profil().nom;
    [].forEach.call(document.querySelectorAll("[data-nav]"), function (a) {
      if (a.dataset.nav === (nav === "exercice" ? "exercices" : nav === "composer" || nav === "aleatoire" ? "aujourdhui" : nav)) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    if (nav === "exercices") vueExercices();
    else if (nav === "exercice") vueExercice(parts[1]);
    else if (nav === "repas") vueRepas();
    else if (nav === "historique") vueHistorique();
    else if (nav === "profil") vueProfil();
    else if (nav === "composer") vueComposer();
    else if (nav === "aleatoire") vueAleatoire();
    else vueAujourdhui();
    if (!garderPosition) window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", function () { route(); });
  route();
})();
