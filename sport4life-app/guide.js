// Guidage audio Sport4Life : voix française au début de chaque exercice, bips de rythme facultatifs.
// Les bips donnent un rythme, ils ne détectent pas les répétitions.
(function () {
  "use strict";
  var CLE = "sport4life.guide";
  var cur = null;                 // exercice affiché
  var etat = "repos";             // repos | marche | pause
  var jeton = 0;                  // change à chaque arrêt, coupe la séquence en cours
  var enPause = false, reprise = null, coupe = null;
  var ctx = null, verrou = null, progres = "";
  var ses = null, sautVal = null, attenteTap = null, ajout = 0;
  var cfg = { voix: true, bip: true, tempo: 3, p: {}, repos: 0, trans: 30, auto: false };
  try { var s = JSON.parse(localStorage.getItem(CLE) || "{}"); Object.keys(s).forEach(function (k) { if (k in cfg) cfg[k] = s[k]; }); } catch (e) {}
  function sauver() { try { localStorage.setItem(CLE, JSON.stringify(cfg)); } catch (e) {} }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function el(i) { return document.getElementById(i); }

  // ---------- Type d'exercice et valeurs par défaut ----------
  function tenu(e) { return /\d\s*s\b|minute/i.test(e.series || ""); }
  function parDefaut(e) {
    var m = (e.series || "").match(/x\s*(\d+)/i);
    var n = m ? parseInt(m[1], 10) : 10;
    if (tenu(e)) { return /minute/i.test(e.series) ? 60 : n; }
    return n;
  }
  function cote(e) { return /par (c[ôo]t[ée]|bras|jambe)/i.test(e.series || "") || /\(\d+ par c/i.test(e.series || ""); }
  function valeur(e) { var q = (cfg.p && cfg.p[e.id]) || {}; var v = tenu(e) ? q.duree : q.reps; return v > 0 ? v : parDefaut(e); }

  // ---------- Voix : plugin natif Android, sinon Web Speech ----------
  function plugin() { return window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.TextToSpeech; }
  function propre(t) { return String(t).replace(/°/g, " degrés").replace(/\bx\b/g, " fois ").replace(/\s+/g, " "); }
  function course(p, ms) { return Promise.race([p, new Promise(function (r) { setTimeout(function () { r("delai"); }, ms); })]); }
  function voixDispo() {
    var p = plugin();
    if (p) return p.isLanguageSupported({ lang: "fr-FR" }).then(function (r) { return r && r.supported ? "ok" : "pas-fr"; }).catch(function () { return "ok"; });
    if (window.speechSynthesis && window.SpeechSynthesisUtterance) return Promise.resolve("ok");
    return Promise.resolve("aucune");
  }
  // Suivi de la lecture : le plugin natif envoie "onRangeStart" à chaque mot lu (Android 8+).
  // Pas de démarrage = voix absente. Démarrée = on attend tant que la lecture progresse.
  var suivi = { essaye: false, derniere: 0, vu: false };
  function ecoute(p) {
    if (suivi.essaye) return; suivi.essaye = true;
    try {
      var h = p.addListener && p.addListener("onRangeStart", function () { suivi.vu = true; suivi.derniere = Date.now(); });
      if (h && h.catch) h.catch(function () {});
    } catch (e) {}
  }
  function evenementsAttendus() {
    var m = /Android (\d+)/.exec(navigator.userAgent || "");
    return suivi.vu || (!!m && parseInt(m[1], 10) >= 8);
  }
  var DEMARRAGE_MS = 6000, BLOCAGE_MS = 10000, PLAFOND_MS = 180000;
  function surveille(texte, lancer, aProgresse) {
    return new Promise(function (res) {
      var fini = false, t0 = Date.now(), iv;
      function fin(r) { if (fini) return; fini = true; clearInterval(iv); res(r); }
      lancer().then(function () { fin("ok"); }, function () { fin("erreur"); });
      iv = setInterval(function () {
        var now = Date.now(), p = aProgresse(t0);
        if (now - t0 > PLAFOND_MS) return fin("delai");
        if (p) { if (now - p > BLOCAGE_MS) fin("delai"); return; }
        var garde = evenementsAttendus() ? DEMARRAGE_MS : 6000 + texte.length * 110;
        if (now - t0 > garde) fin("delai");
      }, 200);
    });
  }
  function parle(texte) {
    texte = propre(texte);
    var p = plugin();
    if (p) {
      ecoute(p);
      return surveille(texte, function () {
        return p.speak({ text: texte, lang: "fr-FR", rate: 1.0, pitch: 1.0, volume: 1.0, category: "ambient", queueStrategy: 0 });
      }, function (t0) { return suivi.derniere >= t0 ? suivi.derniere : 0; });
    }
    if (window.speechSynthesis && window.SpeechSynthesisUtterance) {
      var dem = 0;
      return surveille(texte, function () {
        return new Promise(function (res, rej) {
          var u = new SpeechSynthesisUtterance(texte); u.lang = "fr-FR"; u.rate = 1;
          u.onstart = function () { dem = Date.now() + texte.length * 110; };
          u.onboundary = function () { dem = Date.now(); };
          u.onend = function () { res("ok"); }; u.onerror = function () { rej(); };
          window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
        });
      }, function () { return dem; });
    }
    return Promise.resolve("aucune");
  }
  function tais() {
    var p = plugin();
    try { if (p) p.stop(); } catch (e) {}
    try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) {}
  }

  // ---------- Bips (Web Audio) ----------
  function audio() {
    if (!ctx) { var C = window.AudioContext || window.webkitAudioContext; if (C) ctx = new C(); }
    if (ctx && ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  function bip(freq, ms) {
    var c = audio(); if (!c) return;
    var o = c.createOscillator(), g = c.createGain(), t = c.currentTime;
    o.type = "sine"; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + ms / 1000 + 0.02);
  }

  // ---------- Séquenceur : une seule chose à la fois, avec pause et arrêt ----------
  function stopTout() { jeton++; enPause = false; sautVal = null; if (attenteTap) { attenteTap(); attenteTap = null; } if (reprise) { reprise(); reprise = null; } if (coupe) { coupe(); coupe = null; } tais(); liberer(); }
  function attendreReprise(j) { return new Promise(function (r) { reprise = r; }).then(function () { return j === jeton; }); }
  // Attente en tranches de 100 ms ; le temps ne compte pas pendant la pause.
  function attendre(ms, j) {
    return new Promise(function (resolve) {
      var reste = ms;
      (function tic() {
        if (j !== jeton) return resolve(false);
        if (enPause) { attendreReprise(j).then(function (ok) { if (ok) tic(); else resolve(false); }); return; }
        if (reste <= 0) return resolve(true);
        var pas = Math.min(100, reste); reste -= pas; setTimeout(tic, pas);
      })();
    });
  }
  var voixMuette = false;
  function dire(texte, j) {
    if (!cfg.voix || voixMuette) return Promise.resolve(true);
    return new Promise(function (resolve) {
      (function essai() {
        if (j !== jeton) return resolve(false);
        if (enPause) { attendreReprise(j).then(function (ok) { if (ok) essai(); else resolve(false); }); return; }
        var fini = false;
        parle(texte).then(function (r) { fini = true; if (j === jeton && !enPause && (r === "delai" || r === "erreur" || r === "aucune")) { voixMuette = true; tais(); msg("Voix sans réponse : bips seulement pour cette séance."); } if (j !== jeton) return resolve(false); if (enPause) { essai(); return; } resolve(true); });
        coupe = function () { if (!fini) resolve(false); };
      })();
    });
  }
  function demander() {
    try { if (navigator.wakeLock && navigator.wakeLock.request) navigator.wakeLock.request("screen").then(function (l) { verrou = l; }).catch(function () {}); } catch (e) {}
  }
  function liberer() { try { if (verrou) { verrou.release(); verrou = null; } } catch (e) {} }

  function majEcran() {
    renderSes();
    var m = el("guide-msg"), b = el("guide-btns");
    if (m) m.textContent = progres;
    if (b) b.innerHTML = boutons();
  }
  function msg(t) { progres = t; var m = el("guide-msg"); if (m) m.textContent = t; }

  function annonce(e, nb) {
    var n = e.nom + ". " + (e.etapes && e.etapes[0] ? e.etapes[0] : "");
    if (tenu(e)) n += " Tenue de " + nb + " secondes" + (cote(e) ? " de chaque côté" : "") + ".";
    else n += " Série de " + nb + " répétitions" + (cote(e) ? ", de chaque côté" : "") + (cfg.bip ? ", un bip par répétition" : "") + ".";
    return n;
  }

  async function lancer() {
    if (!cur || etat !== "repos") return;
    var e = cur, nb = valeur(e), j = ++jeton;
    audio(); demander(); enPause = false;
    etat = "marche"; msg("Démarrage…"); majEcran();
    var voixVoulue = cfg.voix;
    try {
      if (cfg.voix) {
        var d = await voixDispo();
        if (j !== jeton) return;
        if (d !== "ok") { cfg.voix = false; msg(d === "pas-fr" ? "Voix française non installée : bips seulement." : "Voix indisponible : bips seulement."); }
      }
      if (!(await dire(annonce(e, nb) + " Prêt ? 3, 2, 1, c'est parti.", j))) return;
      if (!cfg.voix) { for (var k = 3; k >= 1; k--) { msg("Départ dans " + k); bip(660, 120); if (!(await attendre(1000, j))) return; } }
      if (tenu(e)) {
        if (cfg.bip) bip(1320, 300);
        for (var s = nb; s >= 1; s--) {
          msg("Tenue : encore " + s + " s");
          if (cfg.bip && s <= 3 && s !== nb) bip(880, 100);
          if (!(await attendre(1000, j))) return;
        }
        if (cfg.bip) { bip(1320, 200); await attendre(350, j); bip(1320, 200); await attendre(350, j); }
        msg("Tenue terminée.");
        await dire("Terminé. Relâche et récupère.", j);
      } else if (cfg.bip) {
        var ms = Math.max(1, cfg.tempo) * 1000;
        for (var r = 1; r <= nb; r++) {
          msg("Répétition " + r + " sur " + nb);
          bip(r === nb ? 1320 : 880, r === nb ? 300 : 120);
          if (!(await attendre(ms, j))) return;
        }
        msg("Série terminée.");
        await dire("Série terminée. Récupère.", j);
      } else {
        msg("Série à ton rythme : " + nb + " répétitions.");
        await dire("À toi. Dis-toi bien le mouvement, et fais ta série à ton rythme.", j);
        etat = "repos"; liberer(); majEcran(); return;
      }
      if (j === jeton) { etat = "repos"; liberer(); majEcran(); }
    } catch (x) { if (j === jeton) { etat = "repos"; msg("Le guidage s'est arrêté."); majEcran(); liberer(); } }
    finally { cfg.voix = voixVoulue; }
  }
  async function ecouter() {
    if (!cur || etat !== "repos") return;
    var e = cur, j = ++jeton; enPause = false; etat = "marche"; msg("Lecture de la consigne…"); majEcran();
    var dispo = await voixDispo();
    if (dispo !== "ok") { etat = "repos"; msg(dispo === "pas-fr" ? "Voix française non installée sur ce téléphone (Paramètres, synthèse vocale)." : "La voix n'est pas disponible sur cet appareil."); majEcran(); return; }
    var txt = e.nom + ". " + (e.etapes || []).join(" ") + (e.erreurs ? " Erreurs fréquentes : " + e.erreurs : "");
    var vieux = cfg.voix; cfg.voix = true;
    await dire(txt, j);
    cfg.voix = vieux;
    if (j === jeton) { etat = "repos"; msg(""); majEcran(); }
  }
  function pause() {
    if (etat === "marche") { etat = "pause"; enPause = true; tais(); msg("En pause."); majEcran(); }
    else if (etat === "pause") { etat = "marche"; enPause = false; msg("Reprise."); majEcran(); if (reprise) { var r = reprise; reprise = null; r(); } }
  }
  function arret() { stopTout(); etat = "repos"; msg("Arrêté."); fermerSes(); majEcran(); }

  function boutons() {
    if (etat === "repos") return '<button data-guide="start">Démarrer la série</button> <button class="second" data-guide="read">Écouter la consigne</button>';
    return '<button class="second" data-guide="pause">' + (etat === "pause" ? "Reprendre" : "Pause") + '</button> <button data-guide="stop">Arrêter</button>';
  }

  function panel(e) {
    cur = e;
    var t = tenu(e), v = valeur(e);
    var h = '<div class="carte verre" id="guide"><h3>Guidage audio</h3>';
    h += '<p class="doux">La voix annonce l\'exercice, puis les bips donnent le rythme. Ils ne comptent pas tes répétitions à ta place : garde le mouvement propre avant la vitesse.</p>';
    h += '<div class="puces"><label class="puce"><input type="checkbox" data-guide-cfg="voix"' + (cfg.voix ? " checked" : "") + '>Voix</label><label class="puce"><input type="checkbox" data-guide-cfg="bip"' + (cfg.bip ? " checked" : "") + '>Bips</label></div>';
    if (t) h += '<label for="guide-val">Durée de la tenue (secondes)</label><input type="number" id="guide-val" inputmode="numeric" min="5" max="600" value="' + v + '" data-guide-cfg="duree">';
    else {
      h += '<label for="guide-val">Répétitions dans la série</label><input type="number" id="guide-val" inputmode="numeric" min="1" max="100" value="' + v + '" data-guide-cfg="reps">';
      h += '<label for="guide-tempo">Rythme : un bip toutes les</label><select id="guide-tempo" data-guide-cfg="tempo">' + [1, 2, 3, 4, 5, 6].map(function (n) { return '<option value="' + n + '"' + (cfg.tempo === n ? " selected" : "") + ">" + n + " seconde" + (n > 1 ? "s" : "") + "</option>"; }).join("") + "</select>";
    }
    h += '<p id="guide-btns" style="margin-top:12px">' + boutons() + '</p><p class="doux" id="guide-msg" role="status" aria-live="polite">' + esc(progres) + "</p>";
    h += '<p class="doux petit">Garde l\'écran allumé et l\'appli ouverte pendant la série. Le son passe par le volume média du téléphone.</p></div>';
    return h;
  }

  document.addEventListener("click", function (ev) {
    var t = ev.target.closest && ev.target.closest("button[data-guide]");
    if (!t) return;
    var a = t.getAttribute("data-guide");
    if (a === "start") lancer(); else if (a === "read") ecouter(); else if (a === "pause") pause(); else if (a === "stop") arret();
    else if (a === "seance-jour" || a === "seance-alea") ouvrirSes(a === "seance-jour" ? "jour" : "alea");
    else if (a === "sess-begin") commencerSes(); else if (a === "sess-close") { arret(); fermerSes(); }
    else if (a === "sess-go") { tais(); if (attenteTap) { var r = attenteTap; attenteTap = null; r(); } }
    else if (a === "sess-plus") { ajout += 15; }
    else if (a === "sess-skip") { sautVal = "compte"; if (ses && ses.phase === "serie") sautVal = "serie"; tais(); }
    else if (a === "sess-exo") { sautVal = "exo"; tais(); if (attenteTap) { var r2 = attenteTap; attenteTap = null; r2(); } if (reprise) { var r3 = reprise; reprise = null; enPause = false; etat = "marche"; r3(); } }
  });
  document.addEventListener("change", function (ev) {
    var t = ev.target, k = t.getAttribute && t.getAttribute("data-guide-cfg");
    if (!k) return;
    if (k === "voix" || k === "bip" || k === "auto") cfg[k] = !!t.checked;
    else if (k === "reps" || k === "duree") { var m = parseInt(t.value, 10); if (m > 0 && cur) { cfg.p = cfg.p || {}; cfg.p[cur.id] = cfg.p[cur.id] || {}; cfg.p[cur.id][k] = m; } }
    else { var n = parseInt(t.value, 10); if (n > 0 || (k === "repos" && n === 0)) cfg[k] = n; }
    sauver();
  });
  window.addEventListener("hashchange", function () { if (etat !== "repos") { stopTout(); etat = "repos"; progres = ""; } fermerSes(); });
  // Écran éteint ou appli en arrière-plan : les minuteurs du navigateur ralentissent, on met en pause plutôt que de dérégler le rythme.
  document.addEventListener("visibilitychange", function () {
    if (document.hidden && etat === "marche") { etat = "pause"; enPause = true; tais(); progres = "Mis en pause : l'écran s'est éteint ou l'appli est passée en arrière-plan."; }
    else if (!document.hidden) majEcran();
  });


  // ---------- Séance guidée : exercices, séries, repos, transitions ----------
  // Repères sur les repos : ~1 à 2 min pour l'entraînement général (AUSactive), 3 min ou plus pour les charges lourdes
  // (ACSM 2009, Schoenfeld 2016). Les valeurs de départ ci-dessous sont réglables.
  function Saut(t) { this.t = t; }
  function chk(j) { if (j !== jeton) throw new Saut("stop"); if (sautVal === "exo") throw new Saut("exo"); }
  function nbSeries(e) { var m = (e.series || "").match(/^\s*(\d+)\s*x/i); return m ? parseInt(m[1], 10) : 3; }
  function reposAuto(e) { return cfg.repos > 0 ? cfg.repos : e.groupe === "Cardio" ? 45 : e.groupe === "Tronc" ? 60 : 90; }
  var sources = {};
  function ouvrirSes(qui) {
    var l = sources[qui] ? sources[qui]() : [];
    if (!l || !l.length) { alert("Aucun exercice dans cette séance."); return; }
    stopTout(); etat = "repos";
    ses = { liste: l, i: 0, phase: "config", label: "", sub: "", big: "", msg: "" };
    renderSes();
  }
  function fermerSes() { ses = null; var o = el("guide-ses"); if (o) o.parentNode.removeChild(o); }
  function opts(vals, cur, fmt) { return vals.map(function (v) { return '<option value="' + v + '"' + (cur === v ? " selected" : "") + ">" + fmt(v) + "</option>"; }).join(""); }
  function renderSes() {
    if (!ses) return;
    var o = el("guide-ses");
    if (!o) { o = document.createElement("div"); o.id = "guide-ses"; o.className = "guide-ses"; o.setAttribute("role", "dialog"); o.setAttribute("aria-label", "Séance guidée"); document.body.appendChild(o); }
    var h = "<div class=\"guide-ses-in\"><h2>Séance guidée</h2>", ph = ses.phase;
    if (ph === "config") {
      h += '<p class="doux">' + ses.liste.length + " exercices : " + ses.liste.map(function (e) { return esc(e.nom); }).join(", ") + ".</p>";
      h += '<p class="doux">La voix annonce chaque exercice, tu te places, puis tu lances chaque série toi-même. Entre les séries : un repos chronométré. Entre les exercices : une transition avec le nom du prochain mouvement et un temps pour te placer. Tu peux mettre en pause, passer ou arrêter à tout moment.</p>';
      h += '<div class="puces"><label class="puce"><input type="checkbox" data-guide-cfg="voix"' + (cfg.voix ? " checked" : "") + '>Voix</label><label class="puce"><input type="checkbox" data-guide-cfg="bip"' + (cfg.bip ? " checked" : "") + ">Bips</label></div>";
      h += '<label for="g-repos">Repos entre les séries</label><select id="g-repos" data-guide-cfg="repos"><option value="0"' + (cfg.repos ? "" : " selected") + ">Automatique (45 à 90 s selon l'exercice)</option>" + opts([30, 45, 60, 90, 120, 150, 180], cfg.repos, function (v) { return v + " secondes"; }) + "</select>";
      h += '<label for="g-trans">Mise en place entre les exercices</label><select id="g-trans" data-guide-cfg="trans">' + opts([10, 15, 20, 30, 45, 60], cfg.trans, function (v) { return v + " secondes"; }) + "</select>";
      h += '<label class="puce" style="margin-top:10px"><input type="checkbox" data-guide-cfg="auto"' + (cfg.auto ? " checked" : "") + ">Lancer la série tout seul après le repos (sinon j'appuie sur Démarrer)</label>";
      h += '<p class="doux petit">Repères : environ 1 à 2 minutes de repos pour l\'entraînement général, 3 minutes ou plus pour les charges lourdes (ACSM 2009 ; Schoenfeld 2016). Pour tes charges légères, 45 à 90 secondes sont une valeur de départ : ajuste selon ta récupération. Cette séance guidée n\'enregistre rien : valide tes exercices comme d\'habitude.</p>';
      h += '<p><button data-guide="sess-begin">Commencer la séance guidée</button> <button class="second" data-guide="sess-close">Fermer</button></p>';
    } else {
      h += '<p class="doux" id="ses-pos">' + (ses.e && ph !== "fin" ? "Exercice " + (ses.i + 1) + " sur " + ses.liste.length : "") + "</p>";
      h += "<h3>" + esc(ses.label) + "</h3><p class=\"doux\">" + esc(ses.sub) + '</p><p class="guide-big" id="ses-big" aria-hidden="true">' + esc(ses.big) + '</p><p id="ses-msg" role="status" aria-live="polite" class="doux">' + esc(ses.msg) + "</p>";
      var pz = etat === "pause" ? "Reprendre" : "Pause", b = "";
      if (ph === "place" || ph === "repos") b = '<button class="second" data-guide="pause">' + pz + '</button> <button class="second" data-guide="sess-plus">+ 15 s</button> <button data-guide="sess-skip">' + (ph === "repos" ? "Passer le repos" : "Je suis prêt") + '</button> <button class="second" data-guide="sess-exo">Exercice suivant</button>';
      else if (ph === "attente") b = (etat === "pause" ? '<button class="second" data-guide="pause">Reprendre</button> ' : "") + '<button data-guide="sess-go">Démarrer la série</button> <button class="second" data-guide="sess-exo">Exercice suivant</button>';
      else if (ph === "serie") b = '<button class="second" data-guide="pause">' + pz + '</button> <button data-guide="sess-skip">Terminer la série</button> <button class="second" data-guide="sess-exo">Exercice suivant</button>';
      if (ph === "fin") h += '<p><button data-guide="sess-close">Fermer</button></p>';
      else h += "<p>" + b + '</p><p><button class="danger second" data-guide="stop">Arrêter la séance</button></p>';
    }
    o.innerHTML = h + "</div>";
  }
  function maj(big, msgTxt) {
    if (!ses) return;
    if (big !== undefined) { ses.big = big; var b = el("ses-big"); if (b) b.textContent = big; }
    if (msgTxt !== undefined) { ses.msg = msgTxt; var m = el("ses-msg"); if (m) m.textContent = msgTxt; }
  }
  function phase(p, label, sub, big, m) { ses.phase = p; ses.label = label; ses.sub = sub || ""; ses.big = big === undefined ? "" : big; ses.msg = m || ""; renderSes(); }
  async function compte(sec, j) {
    var reste = sec * 1000;
    while (reste > 0) {
      if (sautVal === "compte") { sautVal = null; break; }
      chk(j);
      if (ajout) { reste += ajout * 1000; ajout = 0; }
      maj(String(Math.ceil(reste / 1000)));
      if (cfg.bip && reste % 1000 === 0 && reste <= 3000) bip(660, 100);
      if (!(await attendre(100, j))) throw new Saut("stop");
      reste -= 100;
    }
    chk(j);
    if (cfg.bip) bip(1320, 250);
  }
  async function attendreAppui(j) {
    if (cfg.auto) return;
    phase("attente", ses.label, "À toi de lancer", "", "Appuie sur « Démarrer la série » quand tu es prêt.");
    var p = new Promise(function (r) { attenteTap = r; });
    await dire("Appuie sur Démarrer quand tu es prêt.", j); chk(j);
    await p;
    attenteTap = null; chk(j);
  }
  async function serieSes(e, k, n, j) {
    var nb = valeur(e), t = tenu(e);
    phase("serie", "Série " + k + " sur " + n + " : " + e.nom, t ? nb + " secondes" : nb + " répétitions", "", "Prêt ?");
    await dire("Série " + k + " sur " + n + " : " + (t ? nb + " secondes" : nb + " répétitions") + (cote(e) ? ", de chaque côté" : "") + ". Prêt ? 3, 2, 1, c'est parti.", j); chk(j);
    if (!cfg.voix) { for (var q = 3; q >= 1; q--) { maj(String(q), "Départ dans " + q); bip(660, 120); if (!(await attendre(1000, j))) throw new Saut("stop"); chk(j); } }
    if (t) {
      if (cfg.bip) bip(1320, 300);
      for (var s = nb; s >= 1; s--) {
        if (sautVal === "serie") { sautVal = null; break; }
        maj(String(s), "Tenue en cours");
        if (cfg.bip && s <= 3 && s !== nb) bip(880, 100);
        if (!(await attendre(1000, j))) throw new Saut("stop"); chk(j);
      }
      if (cfg.bip) { bip(1320, 200); await attendre(350, j); bip(1320, 200); await attendre(350, j); }
    } else if (cfg.bip) {
      var ms = Math.max(1, cfg.tempo) * 1000;
      for (var r = 1; r <= nb; r++) {
        if (sautVal === "serie") { sautVal = null; break; }
        maj(String(r), "Répétition " + r + " sur " + nb);
        bip(r === nb ? 1320 : 880, r === nb ? 300 : 120);
        if (!(await attendre(ms, j))) throw new Saut("stop"); chk(j);
      }
    } else {
      maj("", "À ton rythme : " + nb + " répétitions. Appuie sur « Terminer la série » quand c'est fini.");
      while (sautVal !== "serie") { if (!(await attendre(200, j))) throw new Saut("stop"); chk(j); }
      sautVal = null;
    }
    chk(j);
  }
  async function commencerSes() {
    if (!ses || ses.phase !== "config") return;
    var j = ++jeton; audio(); demander(); voixMuette = false; enPause = false; sautVal = null; etat = "marche";
    var voixVoulue = cfg.voix;
    var L = ses.liste;
    try {
      if (cfg.voix) { var d = await voixDispo(); if (d !== "ok") { cfg.voix = false; } }
      for (ses.i = 0; ses.i < L.length; ses.i++) {
        var e = L[ses.i], n = nbSeries(e);
        try {
          ses.e = e;
          phase("place", (ses.i === 0 ? "Premier exercice : " : "Prochain mouvement : ") + e.nom, "Mise en place, " + n + " séries", String(cfg.trans), e.etapes && e.etapes[0] ? e.etapes[0] : "");
          await dire((ses.i === 0 ? "C'est parti pour la séance guidée. Premier exercice : " : "Prochain mouvement : ") + e.nom + ". " + (e.etapes && e.etapes[0] ? e.etapes[0] : "") + " " + n + " séries. Place-toi, tu as " + cfg.trans + " secondes.", j); chk(j);
          await compte(cfg.trans, j);
          for (var k = 1; k <= n; k++) {
            if (k > 1) {
              var rp = reposAuto(e);
              phase("repos", "Repos avant la série " + k + " sur " + n, e.nom, String(rp));
              await dire("Série terminée. Repos, " + rp + " secondes.", j); chk(j);
              await compte(rp, j);
              await dire("Repos terminé.", j); chk(j);
            }
            ses.label = e.nom;
            await attendreAppui(j);
            await serieSes(e, k, n, j);
          }
          if (ses.i < L.length - 1) await dire("Exercice terminé. Bien joué.", j);
        } catch (x) {
          if (x instanceof Saut && x.t === "exo") { sautVal = null; enPause = false; continue; }
          throw x;
        }
      }
      if (j === jeton) {
        etat = "repos"; liberer();
        phase("fin", "Séance terminée", "Bien joué", "", "Pense au retour au calme et aux étirements.");
        await dire("Séance terminée. Bien joué. Pense au retour au calme et aux étirements.", j);
      }
    } catch (x) {
      if (!(x instanceof Saut)) { if (j === jeton) { etat = "repos"; if (ses) phase("fin", "Séance interrompue", "", "", "Le guidage s'est arrêté."); } }
    } finally { cfg.voix = voixVoulue; }
  }

  // Réglages (préférences) : lecture pour l'export, application validée pour l'import.
  // Les valeurs fausses sont écartées une à une ; "auto" (lancement sans appui) n'est jamais exporté ni importé.
  function nombreEntre(v, a, b) { return typeof v === "number" && isFinite(v) && Math.floor(v) === v && v >= a && v <= b; }
  function dans(v, liste) { return typeof v === "number" && liste.indexOf(v) !== -1; }
  var DEFAUT = { voix: true, bip: true, tempo: 3, repos: 0, trans: 30 };
  function reglagesValides(o) {
    if (!o || typeof o !== "object" || Array.isArray(o)) return null;
    var n = {}, ecartes = 0;
    ["voix", "bip"].forEach(function (k) { if (k in o) { if (typeof o[k] === "boolean") n[k] = o[k]; else ecartes++; } });
    if ("tempo" in o) { if (nombreEntre(o.tempo, 1, 6)) n.tempo = o.tempo; else ecartes++; }
    if ("repos" in o) { if (dans(o.repos, [0, 30, 45, 60, 90, 120, 150, 180])) n.repos = o.repos; else ecartes++; }
    if ("trans" in o) { if (dans(o.trans, [10, 15, 20, 30, 45, 60])) n.trans = o.trans; else ecartes++; }
    if ("p" in o) {
      if (!o.p || typeof o.p !== "object" || Array.isArray(o.p)) ecartes++;
      else {
        n.p = {};
        Object.keys(o.p).forEach(function (id) {
          if (id === "__proto__" || id === "constructor" || id === "prototype") { ecartes++; return; }
          var q = o.p[id]; if (!q || typeof q !== "object" || Array.isArray(q)) { ecartes++; return; }
          var r = {};
          if ("reps" in q) { if (nombreEntre(q.reps, 1, 100)) r.reps = q.reps; else ecartes++; }
          if ("duree" in q) { if (nombreEntre(q.duree, 5, 600)) r.duree = q.duree; else ecartes++; }
          if (Object.keys(r).length) n.p[id] = r;
        });
      }
    }
    var cles = Object.keys(n);
    if (!cles.length) return null;
    Object.defineProperty(n, "_ecartes", { value: ecartes, enumerable: false });
    return n;
  }
  // Forme comparable : valeurs par défaut complétées, clés triées, sans "auto".
  function formeComparable(o) {
    var n = reglagesValides(o); if (!n) return null;
    var c = { voix: DEFAUT.voix, bip: DEFAUT.bip, tempo: DEFAUT.tempo, repos: DEFAUT.repos, trans: DEFAUT.trans, p: {} };
    Object.keys(n).forEach(function (k) { if (k !== "p") c[k] = n[k]; });
    Object.keys(n.p || {}).sort().forEach(function (id) { var q = n.p[id], r = {}; Object.keys(q).sort().forEach(function (k) { r[k] = q[k]; }); c.p[id] = r; });
    return JSON.stringify(c);
  }
  window.S4Guide = { reglagesValides: reglagesValides, formeComparable: formeComparable,
    instantane: function () { return JSON.stringify(cfg); },
    restaurer: function (json) { try { var o = JSON.parse(json); Object.keys(cfg).forEach(function (k) { delete cfg[k]; }); Object.keys(o).forEach(function (k) { cfg[k] = o[k]; }); } catch (e) {} },
    appliquerReglages: function (o) {
    var n = reglagesValides(o); if (!n) return false;
    var avant = JSON.stringify(cfg);
    Object.keys(n).forEach(function (k) { cfg[k] = n[k]; });
    try { localStorage.setItem(CLE, JSON.stringify(cfg)); return true; } catch (e) { var ancien = JSON.parse(avant); Object.keys(cfg).forEach(function (k) { delete cfg[k]; }); Object.keys(ancien).forEach(function (k) { cfg[k] = ancien[k]; }); return false; }
  }, sources: sources, panel: panel, stop: arret, etat: function () { return etat; }, _cfg: cfg, _tenu: tenu };
})();
