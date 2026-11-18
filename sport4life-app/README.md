# Sport4Life

Web app statique de suivi sportif et nutritionnel, avec objectif au choix (prise de masse, perte de gras, remise en forme ou force). HTML, CSS et JavaScript, sans étape de build.

- Séance du jour selon le matériel disponible et le lieu choisi (maison, extérieur ou les deux)
- Bibliothèque de 50 exercices avec filtre par matériel (16 types de matériel)
- Mode « Composer ma séance » : chacun choisit ses exercices du jour, la séance guidée les enchaîne
- Séance aléatoire et séance guidée avec voix, minuteur, échauffement et étirements
- Repas suggérés (47 repas) calculés à partir de leurs ingrédients, filtrés par les préférences alimentaires du profil (exclusions, régimes végétarien/végétalien/pescétarien, goûts)
- Profils locaux (localStorage), sans compte ; chaque téléphone garde ses propres profils
- Style Liquid Glass en CSS

Les données restent dans le navigateur. Conseils généraux, pas un avis médical.
Les exclusions alimentaires filtrent des suggestions indicatives d'après les ingrédients listés : ce n'est pas une garantie contre les allergies (traces, produits transformés et sauces non listés ne sont pas couverts). Valeurs d'après la table ANSES-CIQUAL 2025 (aliments génériques, pour 100 g), calculées sur les grammes indiqués ; les poids d'unité sont des repères ; les recettes ne sont pas validées par un professionnel de santé.
Chaque fiche exercice affiche le schéma des muscles travaillés (voir CREDITS.md).
