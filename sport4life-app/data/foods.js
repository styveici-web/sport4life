// Ingrédients des repas suggérés (v33). Valeurs pour 100 g de l'aliment indiqué (100 ml pour les liquides).
// SOURCE : table de composition nutritionnelle ANSES-CIQUAL 2025 (ciqual.anses.fr ; fichier publié sur
// entrepot.recherche.data.gouv.fr, doi 10.57745/RPWYZD). Pour chaque ingrédient : "ciqual" = code de l'aliment
// (alim_code), "ciqualNom" = libellé CIQUAL exact, kcal = colonne Énergie, Règlement UE N° 1169/2011 (kcal/100 g),
// prot = colonne Protéines, N x facteur de Jones (g/100 g). Ce sont des aliments génériques : une marque précise peut différer.
// Liquides : la valeur pour 100 g est appliquée à 100 ml (densité prise égale à 1).
//
// "repere" = poids d'une unité (œuf, banane, tranche de pain...) : simple REPÈRE pour mesurer, pas une donnée
// CIQUAL. Les calculs se font toujours sur les grammes indiqués dans les repas.
//
// Tags = catégories d'exclusion (voir ALIM_EXCLUSIONS plus bas). Un repas porte l'union des tags de ses ingrédients.
// Les tags NE viennent PAS de CIQUAL : ils sont posés par PRÉCAUTION d'après la nature de l'aliment ou sa recette
// habituelle (ex. moutarde et sulfites de la vinaigrette, gluten du muesli et de la sauce soja, fruits à coque du
// muesli, sulfites des raisins secs et du vin). Traces, additifs et recettes industrielles ne sont pas couverts.
// "lait" = tout produit laitier (allergie ou refus du lait). "lactose" = seulement les ingrédients riches en lactose
// (lait, yaourt, fromage blanc) ; le lait à teneur réduite en lactose, les fromages affinés, la mozzarella, la feta
// et le beurre ne portent que "lait". "viande" = chair des animaux terrestres ; poisson, crustacés et mollusques
// sont des catégories séparées.
window.ALIMENTS = [
  // Céréales, féculents, pains
  { "id": "flocons-avoine", "nom": "Flocons d'avoine", "etat": "", "kcal": 369, "prot": 10.6, "tags": ["gluten"], "ciqual": 32140, "ciqualNom": "Flocons d'avoine" },
  { "id": "muesli", "nom": "Muesli", "etat": "", "kcal": 433, "prot": 8.87, "tags": ["gluten", "fruits_coque"], "ciqual": 32004, "ciqualNom": "Muesli (aliment moyen)" },
  { "id": "pain-complet", "nom": "Pain complet", "etat": "", "kcal": 234, "prot": 8.66, "tags": ["gluten"], "ciqual": 7110, "ciqualNom": "Pain complet ou intégral (à la farine T150)", "repere": [40, "tranche", "tranches"] },
  { "id": "pain-sans-gluten", "nom": "Pain sans gluten préemballé", "etat": "", "kcal": 249, "prot": 4.58, "tags": [], "ciqual": 7130, "ciqualNom": "Pain sans gluten, préemballé" },
  { "id": "galettes-riz", "nom": "Galettes de riz complet soufflé", "etat": "", "kcal": 381, "prot": 8.39, "tags": [], "ciqual": 7352, "ciqualNom": "Galette de riz complet soufflé", "repere": [10, "galette", "galettes"] },
  { "id": "tortilla-ble", "nom": "Tortilla de blé souple", "etat": "", "kcal": 320, "prot": 8.01, "tags": ["gluten"], "ciqual": 7815, "ciqualNom": "Tortilla souple (à garnir), à base de blé", "repere": [60, "tortilla", "tortillas"] },
  { "id": "riz", "nom": "Riz", "etat": "cru", "kcal": 350, "prot": 7.02, "tags": [], "ciqual": 9100, "ciqualNom": "Riz blanc, cru" },
  { "id": "quinoa", "nom": "Quinoa", "etat": "cru", "kcal": 358, "prot": 13.2, "tags": [], "ciqual": 9340, "ciqualNom": "Quinoa, cru" },
  { "id": "pates-completes", "nom": "Pâtes complètes", "etat": "crues", "kcal": 353, "prot": 11.8, "tags": ["gluten"], "ciqual": 9870, "ciqualNom": "Pâtes sèches, au blé complet, crues" },
  { "id": "semoule", "nom": "Semoule de blé", "etat": "crue", "kcal": 350, "prot": 11.8, "tags": ["gluten"], "ciqual": 9610, "ciqualNom": "Semoule de blé dur, crue" },
  { "id": "pomme-de-terre", "nom": "Pommes de terre", "etat": "crues, sans peau", "kcal": 80, "prot": 2.02, "tags": [], "ciqual": 4008, "ciqualNom": "Pomme de terre, sans peau, crue" },
  { "id": "patate-douce", "nom": "Patate douce", "etat": "crue", "kcal": 81.2, "prot": 1.57, "tags": [], "ciqual": 4101, "ciqualNom": "Patate douce, crue" },
  // Viandes
  { "id": "poulet", "nom": "Poulet blanc (viande et peau)", "etat": "cru", "kcal": 122, "prot": 20.8, "tags": ["viande"], "ciqual": 36007, "ciqualNom": "Poulet blanc, viande et peau crues" },
  { "id": "dinde", "nom": "Escalope de dinde", "etat": "crue", "kcal": 108, "prot": 23.7, "tags": ["viande"], "ciqual": 36304, "ciqualNom": "Dinde, escalope crue" },
  { "id": "boeuf-hache", "nom": "Steak haché de bœuf 5 % MG", "etat": "cru", "kcal": 130, "prot": 21.9, "tags": ["viande"], "ciqual": 6250, "ciqualNom": "Boeuf, steak haché 5% MG cru" },
  { "id": "filet-porc", "nom": "Filet mignon de porc", "etat": "cru", "kcal": 123, "prot": 21.2, "tags": ["viande", "porc"], "ciqual": 28204, "ciqualNom": "Porc, filet mignon cru" },
  { "id": "jambon", "nom": "Jambon cuit supérieur", "etat": "cuit", "kcal": 113, "prot": 21, "tags": ["viande", "porc"], "ciqual": 28900, "ciqualNom": "Jambon cuit, supérieur" },
  // Poissons, crustacés, mollusques
  { "id": "saumon", "nom": "Saumon d'élevage", "etat": "cru", "kcal": 193, "prot": 20.5, "tags": ["poisson"], "ciqual": 26036, "ciqualNom": "Saumon, élevage, cru" },
  { "id": "cabillaud", "nom": "Cabillaud", "etat": "cru", "kcal": 77.4, "prot": 18.1, "tags": ["poisson"], "ciqual": 26043, "ciqualNom": "Cabillaud, cru" },
  { "id": "thon", "nom": "Thon au naturel", "etat": "égoutté", "kcal": 143, "prot": 26.8, "tags": ["poisson"], "ciqual": 26039, "ciqualNom": "Thon, au naturel, appertisé, égoutté", "repere": [110, "petite boîte", "petites boîtes"] },
  { "id": "sardines", "nom": "Sardines à l'huile", "etat": "égouttées", "kcal": 217, "prot": 23.3, "tags": ["poisson"], "ciqual": 26034, "ciqualNom": "Sardine, à l'huile, appertisée, égouttée" },
  { "id": "crevettes", "nom": "Crevettes", "etat": "cuites", "kcal": 91.3, "prot": 20.5, "tags": ["crustaces"], "ciqual": 10007, "ciqualNom": "Crevette, cuite" },
  { "id": "moules", "nom": "Moules", "etat": "cuites à l'eau", "kcal": 108, "prot": 17.2, "tags": ["mollusques"], "ciqual": 10013, "ciqualNom": "Moule, bouillie/cuite à l'eau" },
  { "id": "calamar", "nom": "Calamar", "etat": "cru", "kcal": 77, "prot": 14.4, "tags": ["mollusques"], "ciqual": 10001, "ciqualNom": "Calmar ou calamar ou encornet, cru" },
  // Œufs, produits laitiers
  { "id": "oeuf", "nom": "Œuf", "etat": "cru", "kcal": 140, "prot": 12.8, "tags": ["oeufs"], "ciqual": 22000, "ciqualNom": "Oeuf cru", "repere": [55, "œuf", "œufs"] },
  { "id": "lait", "nom": "Lait demi-écrémé", "etat": "", "kcal": 46.4, "prot": 3.19, "tags": ["lait", "lactose"], "ciqual": 19042, "ciqualNom": "Lait demi-écrémé, pasteurisé", "ml": true },
  { "id": "lait-sans-lactose", "nom": "Lait demi-écrémé à teneur réduite en lactose", "etat": "", "kcal": 44.4, "prot": 3.45, "tags": ["lait"], "ciqual": 19060, "ciqualNom": "Lait demi-écrémé (ou à teneur en matière grasse légèrement inférieure)", "ml": true },
  { "id": "fromage-blanc", "nom": "Fromage blanc nature 2-3 % MG", "etat": "", "kcal": 75.7, "prot": 7.28, "tags": ["lait", "lactose"], "ciqual": 19646, "ciqualNom": "Fromage blanc, nature, 2-3% MG" },
  { "id": "yaourt-grec", "nom": "Yaourt à la grecque nature", "etat": "", "kcal": 103, "prot": 3.02, "tags": ["lait", "lactose"], "ciqual": 19860, "ciqualNom": "Yaourt à la grecque nature" },
  { "id": "emmental", "nom": "Emmental", "etat": "", "kcal": 373, "prot": 27.9, "tags": ["lait"], "ciqual": 12115, "ciqualNom": "Emmental ou emmenthal" },
  { "id": "mozzarella", "nom": "Mozzarella", "etat": "", "kcal": 227, "prot": 16.5, "tags": ["lait"], "ciqual": 19590, "ciqualNom": "Mozzarella au lait de vache" },
  { "id": "feta", "nom": "Feta", "etat": "", "kcal": 273, "prot": 15.4, "tags": ["lait"], "ciqual": 12060, "ciqualNom": "Fromage type feta, au lait de vache 100%" },
  { "id": "beurre", "nom": "Beurre doux", "etat": "", "kcal": 753, "prot": 0.64, "tags": ["lait"], "ciqual": 16400, "ciqualNom": "Beurre à 80% MG minimum, doux" },
  // Légumineuses, soja
  { "id": "lentilles", "nom": "Lentilles vertes", "etat": "sèches", "kcal": 327, "prot": 25.1, "tags": [], "ciqual": 20585, "ciqualNom": "Lentille verte, sèche" },
  { "id": "haricots-rouges", "nom": "Haricots rouges", "etat": "cuits à l'eau", "kcal": 116, "prot": 9.63, "tags": [], "ciqual": 20503, "ciqualNom": "Haricot rouge, bouilli/cuit à l'eau" },
  { "id": "pois-chiches", "nom": "Pois chiches", "etat": "cuits à l'eau", "kcal": 148, "prot": 8.31, "tags": [], "ciqual": 20507, "ciqualNom": "Pois chiche, bouilli/cuit à l'eau" },
  { "id": "petits-pois", "nom": "Petits pois", "etat": "cuits à l'eau", "kcal": 80.7, "prot": 6.38, "tags": [], "ciqual": 20326, "ciqualNom": "Petits pois, bouillis/cuits à l'eau" },
  { "id": "tofu", "nom": "Tofu nature", "etat": "", "kcal": 147, "prot": 13.4, "tags": ["soja"], "ciqual": 20904, "ciqualNom": "Tofu nature, préemballé" },
  { "id": "tempeh", "nom": "Tempeh", "etat": "", "kcal": 157, "prot": 16.1, "tags": ["soja"], "ciqual": 20917, "ciqualNom": "Tempeh" },
  { "id": "boisson-soja", "nom": "Boisson au soja nature", "etat": "", "kcal": 42.4, "prot": 3.19, "tags": ["soja"], "ciqual": 18900, "ciqualNom": "Boisson au soja, nature, non enrichie, préemballée", "ml": true },
  { "id": "houmous", "nom": "Houmous préemballé", "etat": "", "kcal": 258, "prot": 8.06, "tags": ["sesame"], "ciqual": 25621, "ciqualNom": "Houmous, préemballé" },
  // Fruits à coque, graines, tartinables
  { "id": "beurre-cacahuete", "nom": "Beurre de cacahuète", "etat": "", "kcal": 643, "prot": 22.2, "tags": ["arachide"], "ciqual": 15202, "ciqualNom": "Beurre de cacahuète ou pâte d'arachide" },
  { "id": "amandes", "nom": "Amandes avec peau", "etat": "", "kcal": 615, "prot": 18.8, "tags": ["fruits_coque"], "ciqual": 15000, "ciqualNom": "Amande, avec peau, sans sel ajouté" },
  { "id": "noix", "nom": "Cerneaux de noix", "etat": "", "kcal": 709, "prot": 13.3, "tags": ["fruits_coque"], "ciqual": 15005, "ciqualNom": "Noix, cerneau, séchée" },
  { "id": "noix-cajou", "nom": "Noix de cajou grillées", "etat": "grillées", "kcal": 618, "prot": 17.4, "tags": ["fruits_coque"], "ciqual": 15054, "ciqualNom": "Noix de cajou, grillée, sans sel ajouté" },
  { "id": "graines-courge", "nom": "Graines de courge", "etat": "séchées", "kcal": 618, "prot": 29.5, "tags": [], "ciqual": 15064, "ciqualNom": "Courge, graine, séchée" },
  // Fruits
  { "id": "banane", "nom": "Banane", "etat": "chair, crue", "kcal": 87.6, "prot": 1.06, "tags": [], "ciqual": 13005, "ciqualNom": "Banane, chair sans peau, crue", "repere": [120, "banane", "bananes"] },
  { "id": "pomme", "nom": "Pomme", "etat": "chair et peau, crue", "kcal": 54, "prot": 0.25, "tags": [], "ciqual": 13039, "ciqualNom": "Pomme, chair et peau, crue", "repere": [150, "pomme", "pommes"] },
  { "id": "orange", "nom": "Orange", "etat": "chair, crue", "kcal": 42, "prot": 0.75, "tags": [], "ciqual": 13034, "ciqualNom": "Orange, chair sans peau, sans pépins, crue", "repere": [150, "orange", "oranges"] },
  { "id": "fruits-rouges", "nom": "Framboises", "etat": "crues", "kcal": 47.9, "prot": 1.19, "tags": [], "ciqual": 13015, "ciqualNom": "Framboise, crue" },
  { "id": "avocat", "nom": "Avocat", "etat": "chair, crue", "kcal": 203, "prot": 1.56, "tags": [], "ciqual": 13004, "ciqualNom": "Avocat, chair sans peau, sans noyau, cru", "repere": [120, "avocat", "avocats"] },
  { "id": "raisins-secs", "nom": "Raisins secs", "etat": "", "kcal": 322, "prot": 3, "tags": ["sulfites"], "ciqual": 13046, "ciqualNom": "Raisin sec" },
  // Légumes
  { "id": "brocolis", "nom": "Brocoli", "etat": "cru", "kcal": 31.9, "prot": 2.9, "tags": [], "ciqual": 20057, "ciqualNom": "Brocoli, cru" },
  { "id": "haricots-verts", "nom": "Haricots verts", "etat": "crus", "kcal": 31.9, "prot": 1.83, "tags": [], "ciqual": 20061, "ciqualNom": "Haricot vert, cru" },
  { "id": "epinards", "nom": "Épinards", "etat": "crus", "kcal": 33.3, "prot": 2.68, "tags": [], "ciqual": 20059, "ciqualNom": "Épinard, cru" },
  { "id": "carottes", "nom": "Carottes", "etat": "crues", "kcal": 30.2, "prot": 0.78, "tags": [], "ciqual": 20009, "ciqualNom": "Carotte, crue" },
  { "id": "poivron", "nom": "Poivron", "etat": "cru", "kcal": 22.6, "prot": 0.8, "tags": [], "ciqual": 20041, "ciqualNom": "Poivron, vert, jaune ou rouge, cru" },
  { "id": "tomate", "nom": "Tomate", "etat": "crue", "kcal": 17.5, "prot": 0.5, "tags": [], "ciqual": 20276, "ciqualNom": "Tomate ronde, crue" },
  { "id": "concombre", "nom": "Concombre", "etat": "cru", "kcal": 16.8, "prot": 0.65, "tags": [], "ciqual": 20019, "ciqualNom": "Concombre, chair et peau, cru" },
  { "id": "salade", "nom": "Laitue", "etat": "crue", "kcal": 14.7, "prot": 1.35, "tags": [], "ciqual": 20031, "ciqualNom": "Laitue, crue" },
  { "id": "oignon", "nom": "Oignon", "etat": "cru", "kcal": 39, "prot": 1.1, "tags": [], "ciqual": 20034, "ciqualNom": "Oignon, cru" },
  { "id": "celeri", "nom": "Céleri branche", "etat": "cru", "kcal": 15.4, "prot": 0.63, "tags": ["celeri"], "ciqual": 20023, "ciqualNom": "Céleri branche, cru" },
  { "id": "mais", "nom": "Maïs doux", "etat": "égoutté", "kcal": 105, "prot": 2.66, "tags": [], "ciqual": 20066, "ciqualNom": "Maïs doux, appertisé, égoutté" },
  { "id": "courgette", "nom": "Courgette", "etat": "crue", "kcal": 16.7, "prot": 1.21, "tags": [], "ciqual": 20020, "ciqualNom": "Courgette, chair et peau, crue" },
  { "id": "aubergine", "nom": "Aubergine", "etat": "crue", "kcal": 22.9, "prot": 0.98, "tags": [], "ciqual": 20053, "ciqualNom": "Aubergine, crue" },
  // Matières grasses, sauces, divers
  { "id": "huile-olive", "nom": "Huile d'olive vierge extra", "etat": "", "kcal": 899, "prot": 0.25, "tags": [], "ciqual": 17270, "ciqualNom": "Huile d'olive vierge extra" },
  { "id": "sauce-tomate", "nom": "Coulis de tomate", "etat": "", "kcal": 45.5, "prot": 2.05, "tags": [], "ciqual": 20260, "ciqualNom": "Tomate, coulis, appertisé (purée de tomates mi-réduite à 11%)" },
  { "id": "sauce-soja", "nom": "Sauce soja préemballée", "etat": "", "kcal": 39.9, "prot": 7.25, "tags": ["soja", "gluten"], "ciqual": 11104, "ciqualNom": "Sauce soja, préemballée" },
  { "id": "vinaigrette", "nom": "Vinaigrette préemballée (50 à 75 % d'huile)", "etat": "", "kcal": 475, "prot": 0.55, "tags": ["moutarde", "sulfites"], "ciqual": 11110, "ciqualNom": "Sauce vinaigrette (50 à 75% d'huile), préemballée" },
  { "id": "vin-blanc", "nom": "Vin blanc sec (cuisson)", "etat": "", "kcal": 55.3, "prot": 0.25, "tags": ["sulfites"], "ciqual": 5215, "ciqualNom": "Vin blanc sec", "ml": true },
  { "id": "miel", "nom": "Miel", "etat": "", "kcal": 331, "prot": 0.65, "tags": ["miel"], "ciqual": 31008, "ciqualNom": "Miel" }
];

// Catégories d'exclusion : chaque code correspond à un tag d'ingrédient. Elles sont distinctes et indépendantes.
window.ALIM_EXCLUSIONS = [
  { code: "porc", groupe: "Viandes et produits de la mer", nom: "Porc (viande et charcuterie de porc)" },
  { code: "viande", groupe: "Viandes et produits de la mer", nom: "Viande : bœuf, porc, volaille, charcuterie (toute chair d'animal terrestre)" },
  { code: "poisson", groupe: "Viandes et produits de la mer", nom: "Poisson" },
  { code: "crustaces", groupe: "Viandes et produits de la mer", nom: "Crustacés (crevettes, crabe…)" },
  { code: "mollusques", groupe: "Viandes et produits de la mer", nom: "Mollusques (moules, calamar…)" },
  { code: "oeufs", groupe: "Allergènes et intolérances", nom: "Œufs" },
  { code: "lait", groupe: "Allergènes et intolérances", nom: "Lait et tous les produits laitiers (fromage, yaourt, beurre, lait à teneur réduite en lactose…)" },
  { code: "lactose", groupe: "Allergènes et intolérances", nom: "Lactose seulement (lait, yaourt, fromage blanc)", aide: "Retire seulement les aliments riches en lactose ; le lait à teneur réduite en lactose, les fromages affinés et le beurre restent proposés. Ne convient pas à une allergie au lait : coche alors « Lait et tous les produits laitiers »." },
  { code: "gluten", groupe: "Allergènes et intolérances", nom: "Gluten (blé, avoine, pâtes, pain, semoule, muesli, sauce soja…)" },
  { code: "arachide", groupe: "Allergènes et intolérances", nom: "Arachide (cacahuète)" },
  { code: "fruits_coque", groupe: "Allergènes et intolérances", nom: "Fruits à coque (amande, noix, noix de cajou…)" },
  { code: "soja", groupe: "Allergènes et intolérances", nom: "Soja (tofu, tempeh, boisson et sauce soja)" },
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
