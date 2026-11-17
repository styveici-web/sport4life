// Repas indicatifs pour la prise de masse (v33). Chaque repas est une liste d'ingrédients (data/foods.js) en grammes
// (ml pour les liquides). Les kcal, les protéines, les tags d'exclusion et le détail affiché sont CALCULÉS à partir
// des ingrédients et de leurs valeurs ANSES-CIQUAL 2025 : aucune valeur nutritionnelle n'est écrite à la main.
// Les poids d'unité affichés ("environ 3 œufs") sont des repères ; le calcul se fait sur les grammes.
// Recettes rédigées pour Sport4Life, non validées par un professionnel de santé.
// Les 12 repas d'origine (p1-p3, d1-d6, c1-c3) gardent leur id ; leur nom aussi, sauf c3 ("Skyr et fruits")
// renommé car le skyr, sans correspondance CIQUAL établie, est remplacé par du fromage blanc.
(function () {
  var M = [
    // ----- Petits-déjeuners -----
    { id: "p1", moment: "Petit-déjeuner", nom: "Porridge banane", ing: [["flocons-avoine", 80], ["lait", 300], ["banane", 120]] },
    { id: "p2", moment: "Petit-déjeuner", nom: "Omelette et pain complet", ing: [["oeuf", 165], ["pain-complet", 80], ["pomme", 150]] },
    { id: "p3", moment: "Petit-déjeuner", nom: "Fromage blanc, muesli et amandes", ing: [["fromage-blanc", 250], ["muesli", 40], ["amandes", 20]] },
    { id: "p4", moment: "Petit-déjeuner", nom: "Porridge au soja, fruits rouges et graines de courge", ing: [["flocons-avoine", 80], ["boisson-soja", 300], ["fruits-rouges", 100], ["graines-courge", 20]] },
    { id: "p5", moment: "Petit-déjeuner", nom: "Tofu brouillé aux épinards et pain complet", ing: [["tofu", 150], ["epinards", 80], ["huile-olive", 5], ["pain-complet", 80], ["orange", 150]] },
    { id: "p6", moment: "Petit-déjeuner", nom: "Œufs brouillés, patate douce et avocat", ing: [["oeuf", 165], ["patate-douce", 200], ["avocat", 60], ["huile-olive", 5]] },
    { id: "p7", moment: "Petit-déjeuner", nom: "Fromage blanc, banane et graines de courge", ing: [["fromage-blanc", 250], ["banane", 120], ["graines-courge", 20], ["miel", 10]] },
    { id: "p8", moment: "Petit-déjeuner", nom: "Tartines jambon-emmental et orange", ing: [["pain-complet", 100], ["jambon", 60], ["emmental", 30], ["orange", 150]] },
    { id: "p9", moment: "Petit-déjeuner", nom: "Galettes de riz, beurre de cacahuète et boisson au soja", ing: [["galettes-riz", 40], ["beurre-cacahuete", 30], ["banane", 120], ["boisson-soja", 250]] },
    { id: "p10", moment: "Petit-déjeuner", nom: "Porridge au lait sans lactose, pomme et noix", ing: [["flocons-avoine", 80], ["lait-sans-lactose", 300], ["pomme", 150], ["noix", 15]] },
    { id: "p11", moment: "Petit-déjeuner", nom: "Pain sans gluten, œufs et avocat", ing: [["pain-sans-gluten", 80], ["oeuf", 110], ["avocat", 60], ["tomate", 100]] },
    { id: "p13", moment: "Petit-déjeuner", nom: "Galettes de riz, houmous et avocat", ing: [["galettes-riz", 40], ["houmous", 60], ["avocat", 60], ["tomate", 100], ["orange", 150]] },
    { id: "p12", moment: "Petit-déjeuner", nom: "Yaourt grec, flocons d'avoine et fruits rouges", ing: [["yaourt-grec", 250], ["flocons-avoine", 40], ["fruits-rouges", 100], ["miel", 10]] },
    // ----- Repas -----
    { id: "d1", moment: "Repas", nom: "Poulet, riz et brocolis", ing: [["poulet", 150], ["riz", 100], ["brocolis", 200], ["huile-olive", 10]] },
    { id: "d2", moment: "Repas", nom: "Saumon, patate douce et haricots verts", ing: [["saumon", 150], ["patate-douce", 250], ["haricots-verts", 150]] },
    { id: "d3", moment: "Repas", nom: "Pâtes complètes au bœuf", ing: [["pates-completes", 100], ["boeuf-hache", 125], ["sauce-tomate", 150]] },
    { id: "d4", moment: "Repas", nom: "Lentilles et œufs", ing: [["lentilles", 80], ["oeuf", 110], ["salade", 50], ["huile-olive", 10]] },
    { id: "d5", moment: "Repas", nom: "Thon, quinoa et légumes grillés", ing: [["thon", 110], ["quinoa", 80], ["courgette", 80], ["aubergine", 70], ["poivron", 60], ["huile-olive", 10]] },
    { id: "d6", moment: "Repas", nom: "Dinde et pommes de terre", ing: [["dinde", 150], ["pomme-de-terre", 300], ["haricots-verts", 150]] },
    { id: "d7", moment: "Repas", nom: "Filet de porc, semoule et carottes", ing: [["filet-porc", 150], ["semoule", 90], ["carottes", 150], ["huile-olive", 10]] },
    { id: "d8", moment: "Repas", nom: "Crevettes sautées, riz et petits pois", ing: [["crevettes", 150], ["riz", 100], ["petits-pois", 100], ["sauce-soja", 15], ["huile-olive", 10]] },
    { id: "d9", moment: "Repas", nom: "Moules au vin blanc et pommes de terre", ing: [["moules", 250], ["vin-blanc", 50], ["beurre", 10], ["pomme-de-terre", 300]] },
    { id: "d10", moment: "Repas", nom: "Calamars à la plancha, quinoa et poivrons", ing: [["calamar", 200], ["quinoa", 80], ["poivron", 150], ["huile-olive", 10]] },
    { id: "d11", moment: "Repas", nom: "Cabillaud, pommes de terre et épinards", ing: [["cabillaud", 200], ["pomme-de-terre", 300], ["epinards", 150], ["huile-olive", 10]] },
    { id: "d12", moment: "Repas", nom: "Dahl de lentilles et riz", ing: [["lentilles", 90], ["riz", 80], ["tomate", 150], ["oignon", 50], ["huile-olive", 10]] },
    { id: "d13", moment: "Repas", nom: "Chili sin carne", ing: [["haricots-rouges", 200], ["riz", 70], ["mais", 60], ["poivron", 100], ["sauce-tomate", 100], ["huile-olive", 10]] },
    { id: "d14", moment: "Repas", nom: "Tofu sauté, riz et légumes à la sauce soja", ing: [["tofu", 170], ["riz", 75], ["brocolis", 150], ["carottes", 100], ["sauce-soja", 15], ["huile-olive", 10]] },
    { id: "d15", moment: "Repas", nom: "Bowl pois chiches, quinoa et houmous", ing: [["pois-chiches", 200], ["quinoa", 70], ["houmous", 50], ["concombre", 100], ["tomate", 100]] },
    { id: "d16", moment: "Repas", nom: "Omelette aux pommes de terre et salade", ing: [["oeuf", 220], ["pomme-de-terre", 250], ["salade", 60], ["huile-olive", 10]] },
    { id: "d17", moment: "Repas", nom: "Salade de poulet, pommes de terre et céleri", ing: [["poulet", 150], ["pomme-de-terre", 250], ["celeri", 80], ["salade", 60], ["vinaigrette", 20]] },
    { id: "d18", moment: "Repas", nom: "Tortillas haricots rouges, feta et avocat", ing: [["tortilla-ble", 120], ["haricots-rouges", 120], ["feta", 40], ["tomate", 100], ["avocat", 30]] },
    { id: "d19", moment: "Repas", nom: "Tempeh, patate douce et haricots verts", ing: [["tempeh", 150], ["patate-douce", 250], ["haricots-verts", 150], ["huile-olive", 10]] },
    { id: "d20", moment: "Repas", nom: "Pâtes complètes, mozzarella et tomates", ing: [["pates-completes", 90], ["mozzarella", 100], ["tomate", 150], ["huile-olive", 10]] },
    { id: "d21", moment: "Repas", nom: "Bolognaise de lentilles", ing: [["pates-completes", 85], ["lentilles", 60], ["sauce-tomate", 150], ["celeri", 50], ["carottes", 80], ["huile-olive", 10]] },
    { id: "d23", moment: "Repas", nom: "Salade de crevettes, quinoa et avocat", ing: [["crevettes", 150], ["quinoa", 70], ["avocat", 60], ["tomate", 100], ["salade", 50], ["vinaigrette", 15]] },
    { id: "d22", moment: "Repas", nom: "Sardines, pommes de terre et salade", ing: [["sardines", 100], ["pomme-de-terre", 300], ["salade", 60], ["vinaigrette", 15]] },
    // ----- Collations -----
    { id: "c1", moment: "Collation", nom: "Yaourt grec, miel et noix", ing: [["yaourt-grec", 200], ["miel", 7], ["noix", 20]] },
    { id: "c2", moment: "Collation", nom: "Tartines de beurre de cacahuète", ing: [["pain-complet", 80], ["beurre-cacahuete", 30], ["banane", 120]] },
    { id: "c3", moment: "Collation", nom: "Fromage blanc, pomme et flocons d'avoine", ing: [["fromage-blanc", 200], ["pomme", 150], ["flocons-avoine", 15]] },
    { id: "c4", moment: "Collation", nom: "Houmous, carottes et galettes de riz", ing: [["houmous", 80], ["carottes", 150], ["galettes-riz", 20]] },
    { id: "c5", moment: "Collation", nom: "Salade de pois chiches, tomate et concombre", ing: [["pois-chiches", 150], ["tomate", 100], ["concombre", 100], ["huile-olive", 5]] },
    { id: "c6", moment: "Collation", nom: "Raisins secs, graines de courge et banane", ing: [["raisins-secs", 40], ["graines-courge", 30], ["banane", 120]] },
    { id: "c7", moment: "Collation", nom: "Œufs durs, galettes de riz et tomate", ing: [["oeuf", 110], ["galettes-riz", 20], ["tomate", 100]] },
    { id: "c8", moment: "Collation", nom: "Emmental, pomme et noix de cajou", ing: [["emmental", 40], ["pomme", 150], ["noix-cajou", 20]] },
    { id: "c9", moment: "Collation", nom: "Smoothie soja, banane et flocons d'avoine", ing: [["boisson-soja", 300], ["banane", 120], ["flocons-avoine", 30]] },
    { id: "c10", moment: "Collation", nom: "Fromage blanc et fruits rouges", ing: [["fromage-blanc", 200], ["fruits-rouges", 100], ["miel", 10]] },
    { id: "c11", moment: "Collation", nom: "Thon, galettes de riz et concombre", ing: [["thon", 80], ["galettes-riz", 30], ["concombre", 100]] }
  ];
  var A = {};
  (window.ALIMENTS || []).forEach(function (a) { A[a.id] = a; });
  function minus(s) { return s.charAt(0).toLowerCase() + s.slice(1); }
  function de(n) { return /^(huile|[aeéèêiïoôuœ])/i.test(n) ? "d'" : "de "; }
  window.REPAS = M.map(function (r) {
    var kcal = 0, prot = 0, tags = [], ingr = [], det = [];
    r.ing.forEach(function (x) {
      var a = A[x[0]]; if (!a) throw new Error("Ingrédient inconnu dans " + r.id + " : " + x[0]);
      kcal += a.kcal * x[1] / 100; prot += a.prot * x[1] / 100;
      a.tags.forEach(function (t) { if (tags.indexOf(t) === -1) tags.push(t); });
      ingr.push({ id: a.id, g: x[1] });
      // Poids d'unité = simple repère ("environ"), le calcul reste sur les grammes.
      var rep = a.repere ? Math.round(x[1] / a.repere[0] * 2) / 2 : 0, unite = rep >= 1 ? ", environ " + String(rep).replace(".", ",") + " " + (rep > 1 ? a.repere[2] : a.repere[1]) : "";
      var et = a.etat && /^(cru|crue|crues|cuit|cuits|cuites|sèches|égoutté|égouttées|grillées|séchées)/.test(a.etat) ? a.etat.split(",")[0] : "";
      det.push(x[1] + (a.ml ? " ml " : " g ") + de(a.nom) + minus(a.nom) + (et || unite ? " (" + [et, unite.replace(/^, /, "")].filter(Boolean).join(", ") + ")" : ""));
    });
    return { id: r.id, moment: r.moment, nom: r.nom, ingr: ingr, detail: det.join(", "), kcal: Math.round(kcal / 10) * 10, prot: Math.round(prot), tags: tags.sort() };
  });
})();
