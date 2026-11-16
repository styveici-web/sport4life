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
      materiel: ["corps", "halteres", "abwheel", "corde", "medball", "gilet"],
      valides: {}, poidsLog: []
    };
  }
  function normaliser(p) {
    if (!p.id) p.id = uid();
    if (!Array.isArray(p.materiel)) p.materiel = ["corps"];
    if (!p.valides || typeof p.valides !== "object") p.valides = {};
    if (!Array.isArray(p.poidsLog)) p.poidsLog = [];
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


  var V = "5";
  function vignette(e) {
    if (window.IMGS && window.IMGS[e.id]) return '<div class="vignette photo" aria-hidden="true"><img src="' + window.IMGS[e.id] + '" alt="" width="52" height="52"></div>';
    return '<div class="vignette" aria-hidden="true">' + ICONES[e.groupe] + "</div>";
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
    h += '<div class="carte verre"><p class="doux">Tu veux juste découvrir l\'app ? Essaie le profil exemple (capoeiriste, petit matériel).</p><button class="second" data-exemple="1">Utiliser le profil exemple</button></div>';
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
        h += '<div class="exo verre">' + vignette(e) + '<div class="corps"><a href="#/exercice/' + e.id + '"><strong>' + esc(e.nom) + '</strong></a><div class="doux">' + esc(e.series) + '</div></div><button class="' + (fait ? "second" : "") + '" data-valider="' + e.id + '" aria-pressed="' + fait + '">' + (fait ? "Validé ✓" : "Valider") + "</button></div>";
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
      h += '<div class="exo verre">' + vignette(e) + '<div class="corps"><a href="#/exercice/' + e.id + '"><strong>' + esc(e.nom) + "</strong></a><div class=\"doux\">" + esc(e.series) + "</div></div>" +
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

  function vueExercice(id) {
    var e = exoParId(id);
    if (!e) { location.hash = "#/exercices"; return; }
    var h = '<p><a href="#/exercices">← Exercices</a></p><h2>' + esc(e.nom) + "</h2>";
    var ph = window.PHOTOS && window.PHOTOS[e.id];
    if (ph && window.IMGS && window.IMGS[e.id]) h += '<figure class="photo-exo verre"><img src="' + window.IMGS[e.id] + '" alt="' + esc(e.nom) + '" width="520" height="390"><figcaption>Photo : ' + esc(ph.auteur) + ' / <a href="https://www.pexels.com/photo/' + ph.pexels + '/" target="_blank" rel="noopener">Pexels</a></figcaption></figure>';
    else h += '<div class="image-ph verre" role="img" aria-label="Pas de photo"><div>Photo<small>Pas de photo pour ce mouvement pour l\'instant.</small></div></div>';
    h += '<div class="carte verre"><p><span class="etiquette">' + esc(e.groupe) + "</span>" + etiquettesMat(e) + '</p><p class="doux">Muscles : ' + esc(e.muscles) + "<br>Volume conseillé : " + esc(e.series) + "</p>";
    h += "<h3>Le mouvement pas à pas</h3><ol class=\"etapes\">" + e.etapes.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ol>";
    h += "<h3>Erreurs fréquentes</h3><p>" + esc(e.erreurs) + "</p><h3>Conseil</h3><p>" + esc(e.conseil) + "</p></div>";
    h += '<div class="alerte">Conseils généraux. Si une douleur apparaît, arrête-toi et demande un avis à un professionnel.</div>';
    vue.innerHTML = h;
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
    var p = profil();
    if (!p) return;
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
    else if (nav === "profil") vueProfil();
    else vueAujourdhui();
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);
  route();
})();
