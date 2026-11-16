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
  function exemple() {
    return {
      id: uid(), nom: "Exemple : capoeiriste", taille: "", poids: "", age: "", sexe: "", activite: "1.55",
      note: "Capoeira 2 fois par semaine depuis 10 ans, entraînement surtout au poids du corps.",
      materiel: ["corps", "halteres", "disques", "elastique", "abwheel", "corde", "medball", "gilet"], migre3: true,
      valides: {}, poidsLog: []
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
    return p;
  }
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
  function sauver() {
    etat.version = 3;
    try { localStorage.setItem(CLE, JSON.stringify(etat)); } catch (e) {}
  }
  function profil() {
    if (!etat.profils.length) return null;
    for (var i = 0; i < etat.profils.length; i++) if (etat.profils[i].id === etat.actif) return etat.profils[i];
    etat.actif = etat.profils[0].id;
    return etat.profils[0];
  }
  function faisable(exo, p) {
    var dispo = p.materiel.concat(["corps"]);
    return exo.requis.every(function (r) { return dispo.indexOf(r) !== -1; });
  }
  function nomMateriel(id) {
    for (var i = 0; i < MATERIEL.length; i++) if (MATERIEL[i].id === id) return MATERIEL[i].nom;
    return id;
  }
  function exoParId(id) {
    for (var i = 0; i < EXERCICES.length; i++) if (EXERCICES[i].id === id) return EXERCICES[i];
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
    if (principaux.length > 4) {
      var dec = jourAnnee() % principaux.length;
      for (var q = 0; q < 4; q++) liste.push(principaux[(dec + q) % principaux.length]);
    } else liste = principaux.slice(0, 4);
    for (var i = 0; liste.length < 4 && i < autres.length; i++) {
      var k = (jourAnnee() + i) % autres.length;
      if (liste.indexOf(autres[k]) === -1) liste.push(autres[k]);
    }
    var fin = ok.filter(function (e) { return e.groupe === "Cardio"; });
    if (fin.length) liste.push(fin[jourAnnee() % fin.length]);
    return { focus: foc, liste: liste };
  }

  // ---------- Nutrition ----------
  function besoins(p) {
    var t = parseFloat(p.taille), w = parseFloat(p.poids), a = parseFloat(p.age);
    if (!(t > 0 && w > 0 && a > 0) || (p.sexe !== "h" && p.sexe !== "f")) return null;
    var bmr = 10 * w + 6.25 * t - 5 * a + (p.sexe === "h" ? 5 : -161);
    var entretien = bmr * parseFloat(p.activite || "1.55");
    return { entretien: Math.round(entretien), cible: Math.round(entretien + 300), proteines: Math.round(1.6 * w) };
  }


  var V = "17";
  function vignette(e) {
    if (window.IMGS && window.IMGS[e.id]) return '<div class="vignette photo" aria-hidden="true"><img src="' + window.IMGS[e.id] + '" alt="" width="52" height="52"></div>';
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
      h += '<div class="serie"><span class="num">S' + (i + 1) + '</span><input type="number" class="in-r" inputmode="numeric" min="0" placeholder="reps" aria-label="Répétitions, série ' + (i + 1) + '" value="' + esc(s.r || "") + '"><input type="number" class="in-k" inputmode="decimal" min="0" step="0.5" placeholder="kg" aria-label="Charge en kg, série ' + (i + 1) + '" value="' + esc(s.k || "") + '"></div>';
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
  function champsProfil(p) {
    var h = '<label for="nom">Nom</label><input type="text" id="nom" value="' + esc(p.nom) + '">';
    h += '<div class="grille"><div><label for="taille">Taille (cm)</label><input type="number" id="taille" inputmode="decimal" value="' + esc(p.taille) + '"></div>';
    h += '<div><label for="poids">Poids (kg)</label><input type="number" id="poids" inputmode="decimal" step="0.1" value="' + esc(p.poids) + '"></div>';
    h += '<div><label for="age">Âge</label><input type="number" id="age" inputmode="numeric" value="' + esc(p.age) + '"></div>';
    h += '<div><label for="sexe">Sexe</label><select id="sexe"><option value="">Choisir</option><option value="h"' + (p.sexe === "h" ? " selected" : "") + '>Homme</option><option value="f"' + (p.sexe === "f" ? " selected" : "") + ">Femme</option></select></div></div>";
    h += '<label for="activite">Niveau d\'activité</label><select id="activite">' + ACTIVITES.map(function (x) {
      return '<option value="' + x[0] + '"' + (p.activite === x[0] ? " selected" : "") + ">" + x[1] + "</option>";
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
  function genererRepas(p) {
    var n = besoins(p), cible = n ? n.cible : 2800, prot = n ? n.proteines : 0;
    var pd = REPAS.filter(function (r) { return r.moment === "Petit-déjeuner"; });
    var pl = REPAS.filter(function (r) { return r.moment === "Repas"; });
    var co = REPAS.filter(function (r) { return r.moment === "Collation"; });
    var bons = [], meilleur = null, ecartMin = 1e9;
    for (var t = 0; t < 600; t++) {
      var mp = melange(pl).slice(0, Math.random() < 0.5 ? 2 : 3), mc = melange(co).slice(0, Math.random() < 0.5 ? 1 : 2);
      var liste = [alea(pd), mp[0], mc[0]].concat(mp.slice(1), mc.slice(1));
      var kcal = 0, pr = 0;
      liste.forEach(function (r) { kcal += r.kcal; pr += r.prot; });
      var ecart = Math.abs(kcal - cible) + (prot && pr < prot ? (prot - pr) * 10 : 0);
      if (ecart <= 100) bons.push(liste);
      if (ecart < ecartMin) { ecartMin = ecart; meilleur = liste; }
    }
    return (bons.length ? alea(bons) : meilleur).map(function (r) { return r.id; });
  }
  function genererAleatoire(p) {
    var ok = EXERCICES.filter(function (e) { return faisable(e, p); });
    var exos = [];
    melange(["Pousser", "Tirer", "Jambes", "Tronc"]).forEach(function (g) {
      var c = ok.filter(function (e) { return e.groupe === g; });
      if (c.length) exos.push(alea(c).id);
    });
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
    var h = '<div class="carte verre" id="alea"><h3>Séance aléatoire</h3>';
    h += '<p class="doux">Un exercice par groupe musculaire, tiré au hasard dans ta bibliothèque selon ton matériel, avec des repas pour la prise de masse.</p>';
    h += '<button data-alea="1">' + (a ? "Régénérer" : "Générer une séance aléatoire") + "</button>";
    if (a) {
      var exos = a.exos.map(exoParId).filter(Boolean);
      var repas = a.repas.map(repasParId).filter(Boolean);
      h += '<h3 style="margin-top:16px">Exercices (' + faits.filter(function (id) { return a.exos.indexOf(id) !== -1; }).length + "/" + exos.length + " validés)</h3>";
      exos.forEach(function (e) {
        var fait = faits.indexOf(e.id) !== -1;
        h += '<div class="exo verre">' + vignette(e) + '<div class="corps"><a href="#/exercice/' + e.id + '"><strong>' + esc(e.nom) + '</strong></a><div class="doux">' + esc(e.series) + "</div>" + infoSeries(p, e) + '</div><button class="' + (fait ? "second" : "") + '" data-valider="' + e.id + '" aria-pressed="' + fait + '">' + (fait ? "Validé ✓" : "Valider") + "</button></div>";
      });
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
      h += '<div class="alerte">Repas indicatifs, valeurs approximatives (ordre de grandeur, pas des mesures). Ajuste les quantités à ton appétit et à ton objectif. Pas un avis médical.</div>';
    }
    return h + "</div>";
  }

  // ---------- Vues ----------
  function vueAujourdhui() {
    var p = profil(), s = seance(p), jour = aujourdhui();
    var faits = p.valides[jour] || [];
    var nbFaits = s.liste.filter(function (e) { return faits.indexOf(e.id) !== -1; }).length;
    var h = alerteHtml() + "<h2>Séance du jour</h2>";
    h += '<div class="carte verre"><p class="doux">' + esc(new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })) + "</p>";
    h += "<h3>Focus : " + esc(s.focus) + "</h3>";
    h += '<p class="doux">Exercices choisis selon ton matériel (' + p.materiel.length + " sélectionné" + (p.materiel.length > 1 ? "s" : "") + "). " + nbFaits + "/" + s.liste.length + " validé" + (nbFaits > 1 ? "s" : "") + ".</p></div>";
    h += blocAleatoire(p, faits);
    h += '<h3 style="margin:6px 4px 10px">Séance proposée</h3>';
    s.liste.forEach(function (e) {
      var fait = faits.indexOf(e.id) !== -1;
      h += '<div class="exo verre">' + vignette(e) + '<div class="corps"><a href="#/exercice/' + e.id + '"><strong>' + esc(e.nom) + "</strong></a><div class=\"doux\">" + esc(e.series) + "</div>" + infoSeries(p, e) + "</div>" +
        '<button class="' + (fait ? "second" : "") + '" data-valider="' + e.id + '" aria-pressed="' + fait + '">' + (fait ? "Validé ✓" : "Valider") + "</button></div>";
    });
    var n = besoins(p);
    h += '<div class="carte verre"><h3>Nutrition pour la prise de masse</h3>';
    if (n) {
      h += '<p><span class="kcal">' + n.cible + ' kcal</span> par jour<br>Protéines : environ ' + n.proteines + " g par jour</p>" +
        '<p class="doux">Estimation : dépense d\'entretien d\'environ ' + n.entretien + " kcal (formule de Mifflin-St Jeor) + 300 kcal. Protéines : 1,6 g par kg de poids.</p>";
    } else {
      h += "<p>Renseigne ta taille, ton poids, ton âge et ton sexe dans le <a href=\"#/profil\">profil</a> pour estimer tes besoins.</p>";
    }
    h += '<div class="alerte">Estimation indicative, pas un avis médical. Valeurs nutritionnelles d\'aliments : à venir (Open Food Facts et CIQUAL/ANSES).</div></div>';
    vue.innerHTML = h;
  }

  // ---------- Onglet Repas ----------
  function repasDuJour(p) {
    var j = aujourdhui();
    if (p.aleatoire && p.aleatoire.date === j && p.aleatoire.repas) return p.aleatoire.repas;
    if (p.repasJour && p.repasJour.date === j && Array.isArray(p.repasJour.repas)) return p.repasJour.repas;
    p.repasJour = { date: j, repas: genererRepas(p) };
    sauver();
    return p.repasJour.repas;
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
    h += '</p><button data-repas-regen="1">Autres repas</button></div>';
    h += '<div class="carte verre"><h3>Tous les repas</h3><p class="doux">Pour varier ou remplacer un repas.</p>';
    ["Petit-déjeuner", "Repas", "Collation"].forEach(function (m) {
      h += '<h3 style="margin-top:12px">' + esc(m) + "</h3>";
      REPAS.filter(function (r) { return r.moment === m; }).forEach(function (r) {
        h += '<div class="repas"><strong>' + esc(r.nom) + '</strong><div class="doux">' + esc(r.detail) + '</div><div class="doux">≈ ' + r.kcal + " kcal, " + r.prot + " g de protéines</div></div>";
      });
    });
    h += '</div><div class="alerte">Repas indicatifs, valeurs approximatives (ordre de grandeur, pas des mesures). Ajuste les quantités à ton appétit et à ton objectif. Pas un avis médical.</div>';
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
      h += '<a class="exo verre" href="#/exercice/' + e.id + '">' + vignette(e) + '<div class="corps"><strong>' + esc(e.nom) + '</strong><div class="doux">' + esc(e.groupe) + " · " + esc(e.series) + "</div><div>" + etiquettesMat(e) + (ok ? "" : '<span class="etiquette">Matériel manquant</span>') + "</div></div></a>";
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
    if (ph && window.IMGS && window.IMGS[e.id]) h += '<figure class="photo-exo verre"><img src="' + window.IMGS[e.id] + '" alt="' + esc(e.nom) + '" width="520" height="390"><figcaption>Photo : ' + esc(ph.auteur) + ' / <a href="https://www.pexels.com/photo/' + ph.pexels + '/" target="_blank" rel="noopener">Pexels</a></figcaption></figure>';
    else h += '<div class="image-ph verre" role="img" aria-label="Pas de photo"><div>Photo<small>Pas de photo pour ce mouvement pour l\'instant.</small></div></div>';
    var pf = profil(), serie = seriesOverride;
    if (!serie) {
      var auj = pf.journal[aujourdhui()] && pf.journal[aujourdhui()][e.id], der = derniereSeance(pf, e.id);
      serie = auj && auj.length ? auj : der ? der.series : [{ r: "", k: "" }, { r: "", k: "" }, { r: "", k: "" }];
      serie = serie.map(function (x) { return { r: x.r, k: x.k }; });
    }
    h += blocSeries(pf, e, serie, note);
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
  // ---------- Ma montre (Garmin, lecture seule, appli Android) ----------
  // La clé API reste dans le stockage sécurisé Android (Keystore), jamais dans localStorage,
  // ni dans l'export du profil. Les mesures ne sont pas enregistrées : elles restent en mémoire le temps de l'affichage.
  var GARMIN = "https://personal.connectapi.garmin.com", CLE_SECURE = "s4_garmin_cle";
  var montreJeton = null, montreEtat = { msg: "", data: null, charge: false };
  function plug(nom) {
    try {
      var C = window.Capacitor; if (!C) return null;
      // Sans bundler, le pont natif expose les plugins dans Capacitor.Plugins (comme LocalNotifications).
      if (C.Plugins && C.Plugins[nom]) return C.Plugins[nom];
      return C.registerPlugin ? C.registerPlugin(nom) : null;
    } catch (e) { return null; }
  }
  function detailErr(e) {
    if (!e) return "inconnu";
    var c = e.code ? String(e.code) : "", m = e.errorMessage || e.message || (typeof e === "string" ? e : "");
    var d = (c + " " + String(m)).replace(/[^\w .:()\-]/g, "").replace(/\s+/g, " ").trim().slice(0, 140);
    return d || "inconnu";
  }
  // Clé gardée uniquement dans le Keystore Android. Option explicite : clé en mémoire pour la session, jamais écrite.
  var cleSession = null;
  function coffreLire() {
    if (cleSession) return Promise.resolve(cleSession);
    var s = plug("SecureStorage");
    if (!s) return Promise.reject(new Error("coffre"));
    return Promise.resolve().then(function () { return s.internalGetItem({ prefixedKey: CLE_SECURE, sync: false }); }).then(function (r) { return r && r.data ? String(r.data) : null; });
  }
  function coffreEcrire(v) {
    var s = plug("SecureStorage");
    if (!s) return Promise.reject(new Error("plugin absent"));
    return Promise.resolve().then(function () { return s.internalSetItem({ prefixedKey: CLE_SECURE, data: v, sync: false }); });
  }
  // Diagnostic sans secret : écrit, relit et supprime une valeur factice pour voir si le Keystore marche du tout.
  function sondeCoffre() {
    var s = plug("SecureStorage"), dispo = "?";
    try { dispo = window.Capacitor && window.Capacitor.isPluginAvailable ? String(window.Capacitor.isPluginAvailable("SecureStorage")) : "?"; } catch (e) {}
    if (!s) return Promise.resolve("plugin " + dispo + ", proxy absent (Plugins:" + (window.Capacitor && window.Capacitor.Plugins ? Object.keys(window.Capacitor.Plugins).join(",").slice(0, 120) : "aucun") + ")");
    var K = "s4_sonde", etape = "ecriture";
    return s.internalSetItem({ prefixedKey: K, data: "test", sync: false }).then(function () {
      etape = "lecture"; return s.internalGetItem({ prefixedKey: K, sync: false });
    }).then(function (r) {
      var ok = r && r.data === "test"; etape = "suppression";
      return s.internalRemoveItem({ prefixedKey: K, sync: false }).then(function () { return "plugin " + dispo + ", test factice " + (ok ? "OK" : "relecture differente"); });
    }).catch(function (e) { return "plugin " + dispo + ", test factice echec a " + etape + " : " + detailErr(e); });
  }
  function coffreEffacer() {
    cleSession = null;
    var s = plug("SecureStorage");
    if (!s) return Promise.resolve();
    return Promise.resolve().then(function () { return s.internalRemoveItem({ prefixedKey: CLE_SECURE, sync: false }); });
  }
  function httpGarmin(methode, chemin, auth) {
    var h = plug("CapacitorHttp"); if (!h) return Promise.reject(new Error("http"));
    return h.request({ url: GARMIN + chemin, method: methode, headers: { Authorization: auth, Accept: "application/json" }, responseType: "text" });
  }
  function obtenirJeton() {
    if (montreJeton && montreJeton.exp > Date.now()) return Promise.resolve(montreJeton.v);
    return coffreLire().then(function (cle) {
      if (!cle) throw new Error("pas-de-cle");
      return httpGarmin("POST", "/personalapitoken-service/personal-api/personal-api-key/token", "ApiKey " + cle);
    }).then(function (r) {
      if (r.status !== 200) throw new Error("jeton-" + r.status);
      var t = typeof r.data === "string" ? r.data.trim().replace(/^"|"$/g, "") : (r.data && (r.data.accessToken || r.data.access_token || r.data.token));
      if (!t) throw new Error("jeton-vide");
      montreJeton = { v: t, exp: Date.now() + 23 * 3600 * 1000 };
      return t;
    });
  }
  function lireGarmin(chemin, jeton) {
    return httpGarmin("GET", chemin, "Bearer " + jeton).then(function (r) {
      if (r.status !== 200) return null;
      try { return typeof r.data === "string" ? (r.data ? JSON.parse(r.data) : null) : r.data; } catch (e) { return null; }
    }).catch(function () { return null; });
  }
  function chargerMontre() {
    montreEtat.charge = true; montreEtat.msg = "Chargement…"; vueMontre();
    var j = aujourdhui(), d = new Date(); d.setDate(d.getDate() - 6);
    var j0 = d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
    return obtenirJeton().then(function (t) {
      return Promise.all([
        lireGarmin("/usersummary-service/usersummary/daily?calendarDate=" + j, t),
        lireGarmin("/sleep-service/sleep/dailySleep?date=" + j, t),
        lireGarmin("/wellness-service/wellness/dailyHeartRate?date=" + j, t),
        lireGarmin("/usersummary-service/stats/stress/daily/" + j0 + "/" + j, t),
        lireGarmin("/wellness-service/wellness/bodyBattery/reports/daily?startDate=" + j0 + "&endDate=" + j, t),
        lireGarmin("/activitylist-service/activities/search/activities?start=0&limit=5", t)
      ]);
    }).then(function (r) {
      montreEtat.data = { jour: r[0], sommeil: r[1], fc: r[2], stress: r[3], bb: r[4], act: r[5] };
      montreEtat.msg = r.every(function (x) { return x === null; }) ? "Garmin n'a renvoyé aucune donnée. Réessaie après une synchronisation de la montre." : "";
    }).catch(function (e) {
      var m = String(e && e.message || "");
      montreEtat.data = null;
      if (m === "pas-de-cle") montreEtat.msg = "Colle d'abord ta clé API Garmin ci-dessous.";
      else if (m === "coffre") montreEtat.msg = "Le stockage sécurisé Android n'est pas disponible : la clé n'est pas utilisée.";
      else if (m === "http") montreEtat.msg = "La connexion native n'est pas disponible dans cette version (plugin HTTP absent).";
      else if (/^jeton-(400|401|403)$/.test(m)) montreEtat.msg = "Garmin refuse la clé (invalide, supprimée ou expirée). Crée-en une nouvelle dans Garmin Connect puis remplace-la ici.";
      else montreEtat.msg = "Connexion à Garmin impossible pour le moment (réseau ou service). Détail technique : " + detailErr(e) + ".";
    }).then(function () { montreEtat.charge = false; if (/^#\/montre/.test(location.hash)) vueMontre(); });
  }
  function nb(v, suf) { return (typeof v === "number" && isFinite(v)) ? Math.round(v) + (suf || "") : "—"; }
  function hm(s) { if (typeof s !== "number" || !isFinite(s) || s <= 0) return "—"; var m = Math.round(s / 60); return Math.floor(m / 60) + " h " + ("0" + (m % 60)).slice(-2); }
  function ligneM(lib, val) { return '<div class="ligne"><span>' + esc(lib) + "</span><strong>" + esc(val) + "</strong></div>"; }
  function vueMontre() {
    var h = alerteHtml() + "<h2>Ma montre</h2>";
    h += '<p><a href="#/profil">← Retour au profil</a></p>';
    if (!natif()) {
      h += '<div class="carte verre"><p class="doux">Ma montre est disponible uniquement dans l\'appli Android Sport4Life. Sur le site, elle n\'est pas active.</p></div>';
      vue.innerHTML = h; return;
    }
    h += '<div class="carte verre"><h3>Garmin Connect (lecture seule)</h3>';
    h += '<p class="doux">Tes mesures viennent de Garmin Connect après la synchronisation de ta montre, pas en direct. Elles ne changent ni tes objectifs de calories ni tes charges, et ne sont pas enregistrées dans l\'appli.</p>';
    if (montreEtat.msg) h += '<p role="status">' + esc(montreEtat.msg) + "</p>";
    h += '<label for="garmin-cle">Clé API Garmin (Personal API Key)</label><input type="password" id="garmin-cle" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Colle la clé ici">';
    if (montreEtat.echec) h += '<p class="doux">Option de test : utiliser la clé pour cette session seulement. Elle reste en mémoire, n\'est écrite nulle part et disparaît quand tu fermes l\'appli.</p><p><button class="second" data-montre-session="1">Utiliser pour cette session seulement</button></p>';
    h += '<p style="margin-top:10px" class="ligne"><button data-montre-save="1">Enregistrer la clé</button><button class="second" data-montre-refresh="1">Actualiser</button></p>';
    h += '<p class="doux">La clé est gardée dans le stockage sécurisé du téléphone (Keystore Android). Jamais en clair, ni dans l\'export de tes données, ni dans le dépôt. <button class="second" data-montre-del="1">Supprimer la clé de l\'appli</button></p></div>';
    var D = montreEtat.data;
    if (D) {
      var js = D.jour || {}, sl = D.sommeil || {}, fc = D.fc || {};
      h += '<div class="carte verre"><h3>Aujourd\'hui</h3>';
      h += ligneM("Pas", nb(js.totalSteps) + (js.dailyStepGoal ? " / " + nb(js.dailyStepGoal) : ""));
      h += ligneM("Calories (total / actives)", nb(js.totalKilocalories) + " / " + nb(js.activeKilocalories) + " kcal");
      h += ligneM("Minutes d'intensité (modérée / vigoureuse)", nb(js.moderateIntensityMinutes) + " / " + nb(js.vigorousIntensityMinutes) + " min");
      h += ligneM("FC au repos (min / max du jour)", nb(fc.restingHeartRate, " bpm") + " (" + nb(fc.minHeartRate) + " / " + nb(fc.maxHeartRate) + ")");
      var st = Array.isArray(D.stress) && D.stress.length ? D.stress[D.stress.length - 1] : null;
      h += ligneM("Stress moyen", st && st.values ? nb(st.values.overallStressLevel) : "—");
      var bb = Array.isArray(D.bb) && D.bb.length ? D.bb[D.bb.length - 1] : null;
      h += ligneM("Body Battery (chargé / dépensé)", bb ? nb(bb.charged) + " / " + nb(bb.drained) : "—");
      h += "</div>";
      h += '<div class="carte verre"><h3>Sommeil de la nuit</h3>';
      h += ligneM("Durée", hm(sl.sleepTimeSeconds)) + ligneM("Profond", hm(sl.deepSleepSeconds)) + ligneM("Léger", hm(sl.lightSleepSeconds)) + ligneM("REM", hm(sl.remSleepSeconds)) + ligneM("Éveillé", hm(sl.awakeSleepSeconds));
      h += "</div>";
      h += '<div class="carte verre"><h3>Dernières activités</h3>';
      var acts = Array.isArray(D.act) ? D.act : [];
      if (!acts.length) h += '<p class="doux">Aucune activité renvoyée.</p>';
      acts.forEach(function (a) {
        h += '<div class="repas"><strong>' + esc(a.activityName || "Activité") + '</strong><div class="doux">' + esc(String(a.startTimeLocal || "").slice(0, 16)) + " · " + esc(a.activityType && a.activityType.typeKey || "") + "</div>";
        h += '<div class="doux">' + hm(a.duration) + " · " + nb(a.calories, " kcal") + " · FC moy. " + nb(a.averageHR) + " / max " + nb(a.maxHR) + "</div></div>";
      });
      h += "</div>";
    }
    h += '<div class="alerte">Mesures de la montre données à titre indicatif, pas un avis médical.</div>';
    vue.innerHTML = h;
  }
  function montreAction(t) {
    if (t.dataset.montreOpen) { location.hash = "#/montre"; if (natif() && !montreEtat.data && !montreEtat.charge) chargerMontre(); return true; }
    if (t.dataset.montreRefresh) { chargerMontre(); return true; }
    if (t.dataset.montreSave) {
      var z = document.getElementById("garmin-cle"), v = z ? z.value.trim() : "";
      if (v.length < 20) { montreEtat.msg = "La clé semble incomplète. Colle la clé entière affichée par Garmin Connect."; vueMontre(); return true; }
      z.value = "";
      montreEtat.cleEnAttente = v;
      coffreEcrire(v).then(function () { montreJeton = null; cleSession = null; montreEtat.cleEnAttente = null; montreEtat.echec = false; chargerMontre().then(function () { if (!montreEtat.msg) montreEtat.msg = "Clé enregistrée dans le Keystore Android."; vueMontre(); }); }).catch(function (e) {
        var d1 = detailErr(e);
        sondeCoffre().then(function (d2) { montreEtat.echec = true; montreEtat.msg = "Impossible d'enregistrer la clé dans le Keystore Android. La clé n'a pas été gardée. Détail technique : " + d1 + " | " + d2 + "."; vueMontre(); });
      });
      v = "";
      return true;
    }
    if (t.dataset.montreSession) {
      if (montreEtat.cleEnAttente) { cleSession = montreEtat.cleEnAttente; montreEtat.cleEnAttente = null; montreEtat.echec = false; montreJeton = null; montreEtat.msg = "Clé utilisée pour cette session seulement (non enregistrée)."; chargerMontre().then(function () { if (!montreEtat.msg) montreEtat.msg = "Clé utilisée pour cette session seulement (non enregistrée)."; vueMontre(); }); }
      else { montreEtat.msg = "Colle la clé puis appuie sur Enregistrer la clé."; vueMontre(); }
      return true;
    }
    if (t.dataset.montreDel) {
      coffreEffacer().then(function () { montreJeton = null; montreEtat = { msg: "Clé supprimée de l'appli.", data: null, charge: false, echec: false }; vueMontre(); }).catch(function () { montreEtat.msg = "Suppression impossible pour le moment."; vueMontre(); });
      return true;
    }
    return false;
  }

  // ---------- Export / import ----------
  function blocTransfert() {
    return '<div class="carte verre"><h3>Copier mes données</h3><p class="doux">Pour passer du site à l\'appli Android (ou l\'inverse) : exporte ici, copie le texte, puis colle-le dans l\'autre et importe. L\'import ajoute les profils absents, il ne remplace rien.</p><textarea id="zone-transfert" rows="4" style="width:100%" aria-label="Données exportées ou à importer"></textarea><p style="margin-top:10px"><button class="second" data-export="1">Exporter</button> <button class="second" data-import="1">Importer</button></p><p class="doux" id="transfert-msg" role="status"></p></div>';
  }
  function transfertMsg(t) { var e = document.getElementById("transfert-msg"); if (e) e.textContent = t; }

  function blocMontre() {
    var h = '<div class="carte verre"><h3>Ma montre Garmin</h3>';
    if (!natif()) return h + '<p class="doux">Disponible dans l\'appli Android Sport4Life uniquement.</p></div>';
    return h + '<p class="doux">Affiche en lecture seule tes pas, ton sommeil, ta FC au repos, ta Body Battery et tes dernières activités depuis Garmin Connect.</p><button class="second" data-montre-open="1">Ouvrir Ma montre</button></div>';
  }

  function vueProfil() {
    var p = profil();
    var h = alerteHtml() + "<h2>Profil</h2>";
    h += '<div class="carte verre"><label for="sel">Profil actif</label><select id="sel">' + etat.profils.map(function (q) {
      return '<option value="' + q.id + '"' + (q.id === p.id ? " selected" : "") + ">" + esc(q.nom) + "</option>";
    }).join("") + '</select><p style="margin-top:10px"><button class="second" data-nouveau="1">Nouveau profil</button></p></div>';
    h += '<form class="carte verre" id="form" autocomplete="off"><h3>Informations</h3>';
    h += '<label for="nom">Nom</label><input type="text" id="nom" value="' + esc(p.nom) + '">';
    h += '<div class="grille"><div><label for="taille">Taille (cm)</label><input type="number" id="taille" inputmode="decimal" value="' + esc(p.taille) + '"></div>';
    h += '<div><label for="poids">Poids (kg)</label><input type="number" id="poids" inputmode="decimal" step="0.1" value="' + esc(p.poids) + '"></div>';
    h += '<div><label for="age">Âge</label><input type="number" id="age" inputmode="numeric" value="' + esc(p.age) + '"></div>';
    h += '<div><label for="sexe">Sexe</label><select id="sexe"><option value="">Choisir</option><option value="h"' + (p.sexe === "h" ? " selected" : "") + '>Homme</option><option value="f"' + (p.sexe === "f" ? " selected" : "") + ">Femme</option></select></div></div>";
    h += '<label for="activite">Niveau d\'activité</label><select id="activite">' + ACTIVITES.map(function (a) {
      return '<option value="' + a[0] + '"' + (p.activite === a[0] ? " selected" : "") + ">" + a[1] + "</option>";
    }).join("") + "</select>";
    h += '<h3 style="margin-top:16px">Matériel disponible</h3><p class="doux">Les exercices s\'adaptent à ta sélection. Le poids du corps est toujours disponible.</p><div class="puces">';
    MATERIEL.forEach(function (m) {
      var coche = m.id === "corps" || p.materiel.indexOf(m.id) !== -1;
      h += '<label class="puce"><input type="checkbox" data-mat="' + m.id + '"' + (coche ? " checked" : "") + (m.id === "corps" ? " disabled" : "") + ">" + esc(m.nom) + "</label>";
    });
    h += "</div>";
    if (p.note) h += '<p class="doux">' + esc(p.note) + "</p>";
    h += '<button type="submit">Enregistrer</button></form>';
    // Suivi du poids
    h += '<div class="carte verre"><h3>Suivi du poids</h3>';
    var log = p.poidsLog.slice(-8).reverse();
    h += log.length ? "<p>" + log.map(function (l) { return esc(l.date) + " : " + esc(l.kg) + " kg"; }).join("<br>") + "</p>" : '<p class="doux">Aucune mesure pour l\'instant.</p>';
    h += '<label for="pesee">Poids du jour (kg)</label><div class="ligne"><input type="number" id="pesee" inputmode="decimal" step="0.1" placeholder="ex. 74.5"><button data-pesee="1">Ajouter</button></div><p class="doux" style="margin-top:8px">Le poids du profil est mis à jour avec cette valeur.</p></div>';
    var nbJours = Object.keys(p.valides).length, nbEx = 0;
    Object.keys(p.valides).forEach(function (k) { nbEx += p.valides[k].length; });
    h += '<div class="carte verre"><h3>Progression</h3><p>' + nbEx + " exercice" + (nbEx > 1 ? "s" : "") + " validé" + (nbEx > 1 ? "s" : "") + " sur " + nbJours + " jour" + (nbJours > 1 ? "s" : "") + '.</p></div>';
    h += '<div class="carte verre"><h3>Données</h3><p class="doux">Tes données restent dans ce navigateur, sur cet appareil. Elles ne sont envoyées nulle part. Vider le navigateur les efface.</p><button class="danger" data-supprimer="1">Supprimer ce profil</button></div>';
    h += blocMontre();
    h += blocRappel();
    h += blocTransfert();
    h += '<div class="alerte">Sport4Life donne des conseils généraux, pas un avis médical. Sources prévues : recommandations OMS 2020 sur l\'activité physique, littérature scientifique sur l\'hypertrophie, Open Food Facts et CIQUAL/ANSES.</div>';
    vue.innerHTML = h;
  }

  function lireForm(p) {
    p = p || profil();
    var g = function (i) { return document.getElementById(i).value; };
    p.nom = g("nom").trim() || "Sans nom";
    p.taille = g("taille"); p.poids = g("poids"); p.age = g("age"); p.sexe = g("sexe"); p.activite = g("activite");
    p.materiel = [].slice.call(document.querySelectorAll("[data-mat]")).filter(function (c) { return c.checked; }).map(function (c) { return c.getAttribute("data-mat"); });
    sauver();
    return p;
  }

  // ---------- Événements ----------
  vue.addEventListener("click", function (ev) {
    var t = ev.target.closest("button");
    if (!t) return;
    if (t.dataset.sauvegarde) { telechargerSauvegarde(); return; }
    if (t.dataset.exemple) {
      var ex = exemple(); etat.profils.push(ex); etat.actif = ex.id; sauver(); route(); return;
    }
    if (montreAction(t)) return;
    if (t.dataset.rappelPerm) { rappelPerm(); return; }
    if (t.dataset.rappelSave) { rappelSauver(); return; }
    if (t.dataset.export) {
      var z = document.getElementById("zone-transfert"); try { z.value = localStorage.getItem(CLE) || ""; z.select(); } catch (e) {}
      transfertMsg(z && z.value ? "Texte prêt à copier." : "Rien à exporter."); return;
    }
    if (t.dataset.import) {
      try {
        var imp = JSON.parse(document.getElementById("zone-transfert").value), ajoutes = 0;
        if (!imp || !Array.isArray(imp.profils)) throw new Error("format");
        var etaitVide = !profil();
        imp.profils.forEach(function (q) {
          if (!q || typeof q !== "object") return;
          q = normaliser(q);
          var existe = etat.profils.some(function (x) { return x.id === q.id; });
          if (!existe) { etat.profils.push(q); ajoutes++; }
        });
        if (ajoutes) {
          if (etaitVide) { etat.actif = (imp.actif && etat.profils.some(function (x) { return x.id === imp.actif; })) ? imp.actif : etat.profils[0].id; }
          sauver();
        }
        if (etaitVide && ajoutes) { location.hash = "#/profil"; route(); return; }
        transfertMsg(ajoutes + " profil" + (ajoutes > 1 ? "s" : "") + " ajouté" + (ajoutes > 1 ? "s" : "") + ".");
      } catch (e) { transfertMsg("Texte non reconnu. Rien n'a été modifié."); }
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
        } else delete p.journal[jr][sid];
        sauver();
        vueExercice(sid, null, ok.length ? "Enregistré : " + resumeSeries(ok) + ". Exercice validé pour aujourd'hui." : "Aucune série saisie : rien d'enregistré pour aujourd'hui.");
      }
      return;
    }
    if (t.dataset.repasRegen) {
      var nr = genererRepas(p); p.repasJour = { date: aujourdhui(), repas: nr };
      if (p.aleatoire && p.aleatoire.date === aujourdhui()) p.aleatoire.repas = nr;
      sauver(); vueRepas(); return;
    }
    if (t.dataset.alea) {
      p.aleatoire = genererAleatoire(p); sauver(); vueAujourdhui();
      var bloc = document.getElementById("alea"); if (bloc) bloc.scrollIntoView({ block: "start" });
    } else if (t.dataset.valider) {
      var j = aujourdhui(); p.valides[j] = p.valides[j] || [];
      var i = p.valides[j].indexOf(t.dataset.valider);
      if (i === -1) p.valides[j].push(t.dataset.valider); else p.valides[j].splice(i, 1);
      sauver(); vueAujourdhui();
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

  function route() {
    var h = location.hash.replace(/^#\/?/, "") || "aujourdhui";
    var parts = h.split("/"), nav = parts[0];
    if (!profil()) {
      document.getElementById("profil-actif").textContent = "Bienvenue";
      [].forEach.call(document.querySelectorAll("[data-nav]"), function (x) { x.removeAttribute("aria-current"); });
      vueBienvenue(); window.scrollTo(0, 0); return;
    }
    document.getElementById("profil-actif").textContent = profil().nom;
    [].forEach.call(document.querySelectorAll("[data-nav]"), function (a) {
      if (a.dataset.nav === (nav === "exercice" ? "exercices" : nav)) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    if (nav === "exercices") vueExercices();
    else if (nav === "exercice") vueExercice(parts[1]);
    else if (nav === "repas") vueRepas();
    else if (nav === "historique") vueHistorique();
    else if (nav === "montre") vueMontre();
    else if (nav === "profil") vueProfil();
    else vueAujourdhui();
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);
  route();
})();
