// Ingrédients des repas suggérés (v33). Valeurs pour 100 g (ou 100 ml pour les liquides), à l'état indiqué.
// SOURCE : ordres de grandeur inspirés de la table de composition nutritionnelle CIQUAL (ANSES, ciqual.anses.fr).
// Valeurs APPROXIMATIVES, arrondies et NON vérifiées ligne à ligne dans la table : elles servent à estimer un total
// de repas, pas à un suivi précis. "approx: true" marque les ingrédients dont la valeur est la plus incertaine
// (produit très variable selon la marque ou la recette, ou valeur moins sûre) : une valeur prudente a été choisie.
//
// Tags = catégories d'exclusion (voir ALIM_EXCLUSIONS plus bas). Un repas porte l'union des tags de ses ingrédients.
// "lait" = tout produit laitier (allergie ou refus du lait). "lactose" = seulement les ingrédients riches en lactose
// (lait, yaourt, fromage blanc, skyr) : fromages affinés, mozzarella, feta et beurre en contiennent peu et ne portent
// que "lait". "viande" = chair des animaux terrestres (bœuf, porc, volaille, charcuterie) ; poisson, crustacés et
// mollusques sont des catégories séparées. Les tags suivent les ingrédients listés : traces, additifs et recettes
// industrielles ne sont pas couverts.
window.ALIMENTS = [
  // Céréales, féculents, pains
  { id: "flocons-avoine", nom: "Flocons d'avoine", etat: "secs", kcal: 370, prot: 13, tags: ["gluten"] },
  { id: "muesli", nom: "Muesli aux fruits secs et noix", etat: "sec", kcal: 370, prot: 10, tags: ["gluten", "fruits_coque"], approx: true },
  { id: "pain-complet", nom: "Pain complet", etat: "", kcal: 240, prot: 9, tags: ["gluten"] },
  { id: "pain-sans-gluten", nom: "Pain sans gluten", etat: "", kcal: 250, prot: 4, tags: [], approx: true },
  { id: "galettes-riz", nom: "Galettes de riz soufflé", etat: "", kcal: 385, prot: 8, tags: [] },
  { id: "tortilla-ble", nom: "Tortilla de blé", etat: "", kcal: 300, prot: 8.5, tags: ["gluten"], approx: true },
  { id: "riz", nom: "Riz", etat: "cru", kcal: 355, prot: 7, tags: [] },
  { id: "quinoa", nom: "Quinoa", etat: "cru", kcal: 365, prot: 13, tags: [] },
  { id: "pates-completes", nom: "Pâtes complètes", etat: "crues", kcal: 350, prot: 13, tags: ["gluten"] },
  { id: "semoule", nom: "Semoule de blé", etat: "crue", kcal: 360, prot: 12, tags: ["gluten"] },
  { id: "pomme-de-terre", nom: "Pommes de terre", etat: "crues", kcal: 80, prot: 2, tags: [] },
  { id: "patate-douce", nom: "Patate douce", etat: "crue", kcal: 86, prot: 1.6, tags: [] },
  // Viandes
  { id: "poulet", nom: "Blanc de poulet", etat: "cru", kcal: 115, prot: 23.5, tags: ["viande"] },
  { id: "dinde", nom: "Escalope de dinde", etat: "crue", kcal: 110, prot: 24, tags: ["viande"] },
  { id: "boeuf-hache", nom: "Bœuf haché 5 % MG", etat: "cru", kcal: 125, prot: 21, tags: ["viande"] },
  { id: "filet-porc", nom: "Filet de porc", etat: "cru", kcal: 125, prot: 21, tags: ["viande", "porc"] },
  { id: "jambon", nom: "Jambon blanc", etat: "cuit", kcal: 115, prot: 20, tags: ["viande", "porc"] },
  // Poissons, crustacés, mollusques
  { id: "saumon", nom: "Saumon", etat: "cru", kcal: 200, prot: 20, tags: ["poisson"] },
  { id: "cabillaud", nom: "Cabillaud", etat: "cru", kcal: 80, prot: 18, tags: ["poisson"] },
  { id: "thon", nom: "Thon au naturel", etat: "égoutté", kcal: 110, prot: 25, tags: ["poisson"] },
  { id: "sardines", nom: "Sardines à l'huile", etat: "égouttées", kcal: 210, prot: 24, tags: ["poisson"] },
  { id: "crevettes", nom: "Crevettes", etat: "cuites, décortiquées", kcal: 100, prot: 22, tags: ["crustaces"] },
  { id: "moules", nom: "Moules", etat: "chair cuite", kcal: 115, prot: 18, tags: ["mollusques"], approx: true },
  { id: "calamar", nom: "Calamar", etat: "cru", kcal: 80, prot: 15.5, tags: ["mollusques"] },
  // Œufs, produits laitiers
  { id: "oeuf", nom: "Œuf", etat: "entier, cru (environ 55 g sans coquille)", kcal: 140, prot: 12.5, tags: ["oeufs"] },
  { id: "lait", nom: "Lait demi-écrémé", etat: "", kcal: 46, prot: 3.3, tags: ["lait", "lactose"], ml: true },
  { id: "lait-sans-lactose", nom: "Lait demi-écrémé sans lactose", etat: "", kcal: 46, prot: 3.3, tags: ["lait"], ml: true, approx: true },
  { id: "fromage-blanc", nom: "Fromage blanc 3 % MG", etat: "", kcal: 75, prot: 7.2, tags: ["lait", "lactose"] },
  { id: "yaourt-grec", nom: "Yaourt grec égoutté", etat: "", kcal: 95, prot: 9, tags: ["lait", "lactose"], approx: true },
  { id: "skyr", nom: "Skyr nature", etat: "", kcal: 60, prot: 10.5, tags: ["lait", "lactose"] },
  { id: "emmental", nom: "Emmental", etat: "", kcal: 380, prot: 28, tags: ["lait"] },
  { id: "mozzarella", nom: "Mozzarella", etat: "", kcal: 240, prot: 18, tags: ["lait"] },
  { id: "feta", nom: "Feta", etat: "", kcal: 265, prot: 14.5, tags: ["lait"] },
  { id: "beurre", nom: "Beurre", etat: "", kcal: 745, prot: 0.7, tags: ["lait"] },
  // Légumineuses, soja, végétal
  { id: "lentilles", nom: "Lentilles", etat: "crues", kcal: 330, prot: 24, tags: [] },
  { id: "haricots-rouges", nom: "Haricots rouges", etat: "cuits, égouttés", kcal: 110, prot: 8, tags: [] },
  { id: "pois-chiches", nom: "Pois chiches", etat: "cuits, égouttés", kcal: 135, prot: 7.5, tags: [] },
  { id: "petits-pois", nom: "Petits pois", etat: "cuits", kcal: 80, prot: 5, tags: [] },
  { id: "tofu", nom: "Tofu nature", etat: "", kcal: 140, prot: 14, tags: ["soja"] },
  { id: "tempeh", nom: "Tempeh", etat: "", kcal: 190, prot: 19, tags: ["soja"], approx: true },
  { id: "edamame", nom: "Edamame (fèves de soja)", etat: "cuites", kcal: 120, prot: 11, tags: ["soja"], approx: true },
  { id: "boisson-soja", nom: "Boisson au soja nature", etat: "", kcal: 40, prot: 3.3, tags: ["soja"], ml: true },
  { id: "houmous", nom: "Houmous", etat: "", kcal: 280, prot: 7.5, tags: ["sesame"], approx: true },
  // Fruits à coque, graines, tartinables
  { id: "beurre-cacahuete", nom: "Beurre de cacahuète", etat: "", kcal: 600, prot: 25, tags: ["arachide"] },
  { id: "amandes", nom: "Amandes", etat: "", kcal: 610, prot: 21, tags: ["fruits_coque"] },
  { id: "noix", nom: "Noix", etat: "", kcal: 690, prot: 15, tags: ["fruits_coque"] },
  { id: "noix-cajou", nom: "Noix de cajou", etat: "", kcal: 590, prot: 18, tags: ["fruits_coque"] },
  { id: "graines-courge", nom: "Graines de courge", etat: "", kcal: 560, prot: 28, tags: [], approx: true },
  // Fruits
  { id: "banane", nom: "Banane", etat: "épluchée (environ 120 g)", kcal: 90, prot: 1.1, tags: [] },
  { id: "pomme", nom: "Pomme", etat: "(environ 150 g)", kcal: 54, prot: 0.3, tags: [] },
  { id: "orange", nom: "Orange", etat: "épluchée", kcal: 46, prot: 0.9, tags: [] },
  { id: "fruits-rouges", nom: "Fruits rouges", etat: "frais ou surgelés", kcal: 45, prot: 1, tags: [], approx: true },
  { id: "avocat", nom: "Avocat", etat: "chair", kcal: 160, prot: 2, tags: [] },
  { id: "raisins-secs", nom: "Raisins secs", etat: "", kcal: 300, prot: 3, tags: ["sulfites"], approx: true },
  // Légumes
  { id: "brocolis", nom: "Brocolis", etat: "", kcal: 30, prot: 2.8, tags: [] },
  { id: "haricots-verts", nom: "Haricots verts", etat: "", kcal: 30, prot: 2, tags: [] },
  { id: "epinards", nom: "Épinards", etat: "", kcal: 25, prot: 2.8, tags: [] },
  { id: "carottes", nom: "Carottes", etat: "", kcal: 36, prot: 0.8, tags: [] },
  { id: "poivron", nom: "Poivron", etat: "", kcal: 30, prot: 1, tags: [] },
  { id: "tomate", nom: "Tomate", etat: "", kcal: 18, prot: 0.8, tags: [] },
  { id: "concombre", nom: "Concombre", etat: "", kcal: 13, prot: 0.6, tags: [] },
  { id: "salade", nom: "Salade verte", etat: "", kcal: 15, prot: 1.3, tags: [] },
  { id: "oignon", nom: "Oignon", etat: "", kcal: 40, prot: 1.2, tags: [] },
  { id: "celeri", nom: "Céleri branche", etat: "", kcal: 15, prot: 0.7, tags: ["celeri"] },
  { id: "mais", nom: "Maïs doux", etat: "en conserve, égoutté", kcal: 95, prot: 3, tags: [], approx: true },
  { id: "legumes-grilles", nom: "Légumes grillés (courgette, poivron, aubergine)", etat: "sans huile", kcal: 35, prot: 1.2, tags: [], approx: true },
  // Matières grasses, sauces, divers
  { id: "huile-olive", nom: "Huile d'olive", etat: "", kcal: 900, prot: 0, tags: [] },
  { id: "sauce-tomate", nom: "Sauce tomate nature (coulis)", etat: "", kcal: 40, prot: 1.4, tags: [], approx: true },
  { id: "sauce-soja", nom: "Sauce soja", etat: "", kcal: 60, prot: 8, tags: ["soja", "gluten"], approx: true },
  { id: "vinaigrette", nom: "Vinaigrette à la moutarde", etat: "huile, vinaigre de vin, moutarde", kcal: 450, prot: 0.5, tags: ["moutarde", "sulfites"], approx: true },
  { id: "vin-blanc", nom: "Vin blanc (cuisson)", etat: "", kcal: 70, prot: 0.1, tags: ["sulfites"], ml: true, approx: true },
  { id: "miel", nom: "Miel", etat: "", kcal: 320, prot: 0.4, tags: ["miel"] }
];

// Catégories d'exclusion : chaque code correspond à un tag d'ingrédient. Elles sont distinctes et indépendantes.
window.ALIM_EXCLUSIONS = [
  { code: "porc", groupe: "Viandes et produits de la mer", nom: "Porc (viande et charcuterie de porc)" },
  { code: "viande", groupe: "Viandes et produits de la mer", nom: "Viande : bœuf, porc, volaille, charcuterie (toute chair d'animal terrestre)" },
  { code: "poisson", groupe: "Viandes et produits de la mer", nom: "Poisson" },
  { code: "crustaces", groupe: "Viandes et produits de la mer", nom: "Crustacés (crevettes, crabe…)" },
  { code: "mollusques", groupe: "Viandes et produits de la mer", nom: "Mollusques (moules, calamar…)" },
  { code: "oeufs", groupe: "Allergènes et intolérances", nom: "Œufs" },
  { code: "lait", groupe: "Allergènes et intolérances", nom: "Lait et tous les produits laitiers (fromage, yaourt, skyr, beurre…)" },
  { code: "lactose", groupe: "Allergènes et intolérances", nom: "Lactose seulement (lait, yaourt, fromage blanc, skyr)", aide: "Retire seulement les aliments riches en lactose. Ne convient pas à une allergie au lait : coche alors « Lait et tous les produits laitiers »." },
  { code: "gluten", groupe: "Allergènes et intolérances", nom: "Gluten (blé, avoine, pâtes, pain, semoule, muesli, sauce soja…)" },
  { code: "arachide", groupe: "Allergènes et intolérances", nom: "Arachide (cacahuète)" },
  { code: "fruits_coque", groupe: "Allergènes et intolérances", nom: "Fruits à coque (amande, noix, noix de cajou…)" },
  { code: "soja", groupe: "Allergènes et intolérances", nom: "Soja (tofu, tempeh, edamame, boisson et sauce soja)" },
  { code: "sesame", groupe: "Allergènes et intolérances", nom: "Sésame (dont houmous)" },
  { code: "celeri", groupe: "Allergènes et intolérances", nom: "Céleri" },
  { code: "moutarde", groupe: "Allergènes et intolérances", nom: "Moutarde (dont vinaigrette)" },
  { code: "sulfites", groupe: "Allergènes et intolérances", nom: "Sulfites (vin, vinaigre de vin, fruits secs)" },
  { code: "miel", groupe: "Autres", nom: "Miel" }
];
// Raccourcis : ils cochent les exclusions correspondantes, modifiables ensuite. Aucun régime religieux ou certifié.
window.ALIM_REGIMES = [
  { id: "vegetarien", nom: "Végétarien", exclus: ["viande", "poisson", "crustaces", "mollusques"] },
  { id: "vegetalien", nom: "Végétalien", exclus: ["viande", "poisson", "crustaces", "mollusques", "oeufs", "lait", "miel"] },
  { id: "pescetarien", nom: "Pescétarien", exclus: ["viande"] }
];
