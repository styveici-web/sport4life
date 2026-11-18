# v35 - plan d'illustration des mouvements (41 exercices sans dessin)

Style : ligne noire sur fond clair (Everkinetic, CC BY-SA 3.0, Wikimedia Commons) ou generation IA dans le meme esprit (silhouettes diverses dont personnes noires, valide par Styve sur echantillon).

## Fait (echantillon, commit 7d1a2d2)
- rowing-inverse : Body row 1/2.svg (Everkinetic)
- pompes-diamant : Close triceps pushup 1/2.svg
- crunch-swissball : Crunches with legs on stability ball 1/2.svg
- planche-laterale : Side plank 1/2.svg
- montees-step : Step ups with dumbbells 1/2.svg

## Correspondances Everkinetic directes restantes
- squat-lestes : Squats using dumbbells 1/2.svg (deja credite, jamais branche)
- squat : Squats-1.png + Squats-2.png (a verifier visuellement) ou generer (echantillon squat genere deja produit : /downloads/squat-noir-1/2.png)
- fentes-marchees : Lunges-1.png + Lunges-2-1.png (a verifier)
- souleve-terre-roumain : Romanian dead lift 1/2.svg (barre dessinee ; fiche aux halteres -> generer variante halteres ou accepter)
- ab-wheel : Ab rollout on knees with barbell 1/2.svg (barre, pas roulette -> plutot generer)
- mollets-debout : Calf-raises-1/2.png (machine dessinee -> plutot generer) ou Rocking standing calf raise
- oiseau-halteres : Bent over rear deltoid raise with head on bench 1/2.svg (banc dessine -> plutot generer)
- curl-elastique : Quick alternating bicep curls with band 1/2.svg (verifier)
- developpe-sol-halteres : One arm barbell floor press 1/2.svg (1 bras, barre -> plutot generer)
- developpe-epaules-elastique : rien en band ; Dumbbell shoulder press existe mais mauvais materiel -> generer
- tirage-vertical-elastique : tirages cable machine existent, mauvais materiel -> generer

## A generer (pas de source Everkinetic fidele)
pompes-lestees (variante pompes + disque), pompes-genoux, pike-pompes, pompes-sangles, rowing-sangles, gainage-sangles, rowing-elastique, pompes-elastique, squat-disque, goblet-kettlebell, squat-saute, fentes-bulgares, chaise-murale, dead-bug, planche (front), leg-curl-swissball, corde (jump rope), rotation-medball, course-a-pied, burpees, mountain-climbers, jumping-jacks, swing-kettlebell, face-pull-elastique

## Pipeline
1. Pour chaque exercice : telecharger la paire SVG Commons (Special:FilePath) ou generer 2 frames IA (reference style = dessins existants).
2. Verifier visuellement (montage), recadrer, encoder base64 dans ANAT.dr (guide.js), credit dans ANAT.src + CREDITS.md.
3. Tests S4L.has sur les 50 + captures d'ecran, revue Claude Code, proposition de merge.
