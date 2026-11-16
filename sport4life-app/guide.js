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
  var cfg = { voix: true, bip: true, tempo: 3, reps: 0, duree: 0 };
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
  function valeur(e) { return tenu(e) ? (cfg.duree > 0 ? cfg.duree : parDefaut(e)) : (cfg.reps > 0 ? cfg.reps : parDefaut(e)); }

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
  function parle(texte) {
    texte = propre(texte);
    var p = plugin(), dur = 6000 + texte.length * 110;
    if (p) return course(p.speak({ text: texte, lang: "fr-FR", rate: 1.0, pitch: 1.0, volume: 1.0, category: "ambient", queueStrategy: 0 }), dur).catch(function () { return "erreur"; });
    if (window.speechSynthesis && window.SpeechSynthesisUtterance) {
      return course(new Promise(function (res) {
        var u = new SpeechSynthesisUtterance(texte); u.lang = "fr-FR"; u.rate = 1;
        u.onend = function () { res("ok"); }; u.onerror = function () { res("erreur"); };
        window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
      }), dur);
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
  function stopTout() { jeton++; enPause = false; if (reprise) { reprise(); reprise = null; } if (coupe) { coupe(); coupe = null; } tais(); liberer(); }
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
  function dire(texte, j) {
    if (!cfg.voix) return Promise.resolve(true);
    return new Promise(function (resolve) {
      (function essai() {
        if (j !== jeton) return resolve(false);
        if (enPause) { attendreReprise(j).then(function (ok) { if (ok) essai(); else resolve(false); }); return; }
        var fini = false;
        parle(texte).then(function (r) { fini = true; if (j !== jeton) return resolve(false); if (enPause) { essai(); return; } resolve(true); });
        coupe = function () { if (!fini) resolve(false); };
      })();
    });
  }
  function demander() {
    try { if (navigator.wakeLock && navigator.wakeLock.request) navigator.wakeLock.request("screen").then(function (l) { verrou = l; }).catch(function () {}); } catch (e) {}
  }
  function liberer() { try { if (verrou) { verrou.release(); verrou = null; } } catch (e) {} }

  function majEcran() {
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
  function arret() { stopTout(); etat = "repos"; msg("Arrêté."); majEcran(); }

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
  });
  document.addEventListener("change", function (ev) {
    var t = ev.target, k = t.getAttribute && t.getAttribute("data-guide-cfg");
    if (!k) return;
    if (k === "voix" || k === "bip") cfg[k] = !!t.checked;
    else { var n = parseInt(t.value, 10); if (n > 0) cfg[k] = n; }
    sauver();
  });
  window.addEventListener("hashchange", function () { if (etat !== "repos") { stopTout(); etat = "repos"; progres = ""; } });
  // Écran éteint ou appli en arrière-plan : les minuteurs du navigateur ralentissent, on met en pause plutôt que de dérégler le rythme.
  document.addEventListener("visibilitychange", function () {
    if (document.hidden && etat === "marche") { etat = "pause"; enPause = true; tais(); progres = "Mis en pause : l'écran s'est éteint ou l'appli est passée en arrière-plan."; }
    else if (!document.hidden) majEcran();
  });

  window.S4Guide = { panel: panel, stop: arret, etat: function () { return etat; }, _cfg: cfg, _tenu: tenu };
})();
