# -*- coding: utf-8 -*-
SIL = [
 "a Black man with short dark hair and dark skin rendered with light gray hatching",
 "a white woman with a ponytail and light skin, athletic build",
 "a Black woman with curly hair and dark skin rendered with light gray hatching, athletic build",
 "a white man with a short beard, athletic build",
 "an East Asian man with short black hair, lean build",
 "a North African woman with tied-back hair, wearing a t-shirt and leggings",
 "a heavyset Black man with dark skin rendered with light gray hatching",
 "a slim white man with short light hair",
 "a Black woman with braided hair and dark skin rendered with light gray hatching",
 "a fit white man in his fifties with short gray hair",
 "a muscular white woman with short hair",
 "an East Asian woman with a ponytail, athletic build",
]
STYLE = "Black-and-white line-art fitness illustration in the exact style of the reference images: thin black outlines, fine anatomical muscle hatching, grayscale shading, plain white background, no color, no text, no background scenery, full body visible, side view or three-quarter view."
# id -> (equipement en anglais, frame1 pose, frame2 pose)
E = {
"pompes": ("no equipment", "in the top push-up position: arms straight, hands under the shoulders, body in a straight line from head to heels, face down", "at the bottom of the push-up: elbows bent at 90 degrees, chest an inch above the floor, body still in a straight line"),
"pompes-lestees": ("wearing a weighted vest", "in the top push-up position wearing a snug weighted vest, arms straight, body aligned", "at the bottom of the push-up wearing the weighted vest, elbows bent, chest near the floor"),
"pompes-pieds-sureleves": ("a sturdy chair", "decline push-up top position: feet up on a chair, hands on the floor, arms straight, body aligned", "decline push-up bottom: feet on the chair, elbows bent, chest near the floor"),
"pompes-diamant": ("no equipment", "top push-up position with hands close together under the chest, thumbs and index fingers touching in a diamond shape, arms straight", "bottom of the diamond push-up, elbows bent close to the body, chest near the hands"),
"dips-chaise": ("a sturdy chair behind", "chair dip top position: hands on the edge of a chair behind the back, arms straight, legs extended forward, hips lifted", "chair dip bottom: elbows bent at 90 degrees, hips lowered in front of the chair"),
"developpe-halteres": ("two dumbbells", "standing, holding two dumbbells at shoulder height, palms forward, elbows bent", "same standing position with the two dumbbells pressed overhead, arms nearly straight"),
"tractions": ("a pull-up bar", "hanging from a pull-up bar with straight arms, overhand grip slightly wider than shoulders", "pull-up top position: chin above the bar, elbows bent and pulled down"),
"rowing-halteres": ("one dumbbell and a chair", "bent over with one hand and one knee resting on a chair, back flat, free arm holding a dumbbell hanging straight down", "same position with the dumbbell rowed up, elbow pulled to the hip"),
"curl-halteres": ("two dumbbells", "standing upright holding two dumbbells at arm's length along the body, palms forward", "same position with the dumbbells curled up to shoulder level, elbows fixed at the sides"),
"superman": ("no equipment", "lying face down on the floor, arms extended forward overhead, legs straight, relaxed on the floor", "lying face down with arms, chest and legs lifted a few inches off the floor, holding the superman pose"),
"squat": ("no equipment", "standing upright, feet shoulder-width apart, arms extended straight forward at shoulder height, side view", "at the bottom of a bodyweight squat, thighs parallel to the floor, back straight, arms extended forward"),
"squat-lestes": ("a weighted vest", "standing upright wearing a weighted vest, feet shoulder-width apart, arms extended forward", "at the bottom of a squat wearing the weighted vest, thighs parallel to the floor"),
"fentes-bulgares": ("a chair behind", "Bulgarian split squat top: rear foot resting on a chair behind, front foot planted far ahead, torso upright", "Bulgarian split squat bottom: rear knee lowered toward the floor, front thigh horizontal, torso upright"),
"pont-fessier": ("no equipment", "lying on the back, knees bent, feet flat on the floor near the hips, arms along the body", "glute bridge top: hips lifted so the body forms a straight line from shoulders to knees"),
"planche": ("no equipment", "forearm plank: forearms on the floor, elbows under the shoulders, body in a straight line from head to heels", "the same forearm plank position held, slight variation of the head looking forward"),
"ab-wheel": ("an ab wheel", "kneeling on the floor, hands gripping an ab wheel on the floor directly under the shoulders, back slightly rounded", "kneeling with the ab wheel rolled forward, arms extended ahead, body stretched low and straight above the floor"),
"rotation-medball": ("a medicine ball", "seated on the floor, knees bent and feet lifted, torso leaned back, holding a medicine ball at the chest, rotated to one side touching the ball near the floor", "same seated position rotated to the opposite side, ball near the floor on the other side"),
"lancer-medball": ("a medicine ball", "standing, holding a medicine ball overhead with straight arms, slight back arch", "slamming the medicine ball down: bent forward, arms extended down, ball hitting the floor, knees slightly bent"),
"corde": ("a jump rope", "standing upright holding jump rope handles, rope resting behind the heels", "mid-jump a few inches off the floor, rope passing under the feet, elbows near the body"),
"rowing-elastique": ("a resistance band looped around the feet", "seated on the floor with legs straight, a resistance band looped around the feet, one handle in each hand, arms extended forward", "same seated position pulling the band handles to the ribs, elbows back, shoulder blades squeezed"),
"developpe-epaules-elastique": ("a resistance band under the feet", "standing on the middle of a resistance band, handles held at shoulder height, palms forward", "same stance with the band handles pressed overhead, arms nearly straight"),
"tirage-vertical-elastique": ("a resistance band anchored overhead", "kneeling, holding a resistance band anchored high above with straight arms raised", "kneeling, pulling the band down to the upper chest, elbows bent down and back"),
"pompes-elastique": ("a resistance band across the upper back", "top push-up position with a resistance band stretched across the upper back, each end pinned under a hand, arms straight", "bottom of the push-up with the band across the back, elbows bent, chest near the floor"),
"squat-disque": ("a weight plate held at the chest", "standing, holding a weight plate vertically against the chest with both hands, feet slightly wider than shoulders", "goblet squat bottom with the plate at the chest, thighs parallel to the floor, back straight"),
"pompes-genoux": ("no equipment", "knee push-up top: on the knees, hands under the shoulders, arms straight, body straight from knees to head", "knee push-up bottom: elbows bent, chest near the floor, body straight from knees to head"),
"developpe-sol-halteres": ("two dumbbells", "lying on the back on the floor, knees bent, holding two dumbbells above the chest with straight arms", "same lying position with elbows lowered to touch the floor, dumbbells beside the chest"),
"pike-pompes": ("no equipment", "pike push-up top: inverted V position, hands and feet on the floor, hips raised high, arms straight, head between the arms", "pike push-up bottom: same inverted V, elbows bent, head lowered toward the floor between the hands"),
"pompes-sangles": ("suspension straps anchored above, handles at knee height", "suspension push-up top: gripping the strap handles, body straight in a leaning plank facing the floor, arms straight", "suspension push-up bottom: elbows bent, chest lowered between the handles"),
"rowing-inverse": ("a sturdy table", "lying under a sturdy table gripping its edge with both hands, body straight resting on the heels, arms straight", "same position with the chest pulled up to the table edge, elbows bent, shoulder blades squeezed"),
"rowing-sangles": ("suspension straps anchored above", "facing the anchor, gripping suspension strap handles, arms straight, body leaning back in a straight line on the heels", "same position with the chest pulled up to the handles, elbows bent and back"),
"face-pull-elastique": ("a resistance band anchored at head height", "standing facing a resistance band anchored at head height, arms extended forward holding the band with tension", "pulling the band toward the face, elbows high and out, hands beside the ears, shoulder blades squeezed"),
"curl-elastique": ("a resistance band under the feet", "standing on the middle of a resistance band, one end in each hand, arms straight along the body, palms forward", "same stance with the band curled up to shoulder height, elbows fixed at the sides"),
"oiseau-halteres": ("two dumbbells", "bent over with the torso nearly horizontal, back flat, two dumbbells hanging straight down under the shoulders", "same bent-over position with the dumbbells raised out to the sides, arms nearly straight like wings"),
"goblet-kettlebell": ("a kettlebell held at the chest", "standing, holding a kettlebell by the horns against the chest with both hands, elbows pointing down", "goblet squat bottom holding the kettlebell at the chest, thighs parallel to the floor"),
"souleve-terre-roumain": ("two dumbbells", "standing upright holding two dumbbells in front of the thighs, feet hip-width apart", "Romanian deadlift: hips pushed back, torso hinged forward with a flat back, dumbbells lowered along the legs to mid-shin"),
"fentes-marchees": ("no equipment", "standing upright, one foot stepped far forward into a lunge stance, torso straight", "walking lunge bottom: front thigh horizontal, rear knee an inch above the floor, torso upright"),
"montees-step": ("a knee-high step platform", "standing facing a step platform with one foot entirely placed on it", "standing up on the step platform on that leg, the other knee raised, torso upright"),
"leg-curl-swissball": ("a stability ball", "lying on the back, arms on the floor, heels on a stability ball with legs straight, hips lifted in a straight line", "same position with the ball rolled in toward the hips, knees bent, soles on the ball, hips still lifted"),
"mollets-debout": ("no equipment", "standing upright, feet hip-width apart, flat on the floor, side view", "same standing position raised high on the balls of the feet, heels lifted as high as possible"),
"chaise-murale": ("a wall", "wall sit: back flat against a wall, thighs horizontal, knees bent at 90 degrees, arms crossed on the chest", "the same wall sit position held, viewed from the other side"),
"planche-laterale": ("no equipment", "side plank on the forearm: lying on the side propped on one forearm, elbow under the shoulder, hips on the floor", "side plank held: hips lifted, body in a straight line from head to feet, free arm pointing up"),
"dead-bug": ("no equipment", "lying on the back, arms pointing to the ceiling, knees bent at 90 degrees above the hips", "dead bug extended: same position with the opposite arm and leg extended toward the floor, lower back pressed down"),
"crunch-swissball": ("a stability ball", "lying with the lower back resting on a stability ball, feet on the floor, hands behind the head, torso extended back", "same position crunching up, ribs toward the pelvis, lower back still on the ball"),
"gainage-sangles": ("suspension straps anchored low", "forearm plank with both feet hooked in low suspension straps, body in a straight line", "the same suspended forearm plank held, slight variation of head angle"),
"course-a-pied": ("no equipment", "running outdoors, mid-stride: one leg forward with the foot about to land, arms bent at 90 degrees swinging, dynamic side view", "running, opposite stride: the other leg forward, same dynamic side view"),
"burpees": ("no equipment", "crouched down with hands flat on the floor in front, feet tucked, ready to kick back", "in the push-up position after kicking the feet back, body straight, arms straight"),
"mountain-climbers": ("no equipment", "high plank on straight arms, one knee driven toward the chest, the other leg extended", "high plank with the opposite knee driven toward the chest"),
"swing-kettlebell": ("a kettlebell", "kettlebell swing back position: hips hinged, flat back, the kettlebell swung back between the legs, held with both hands", "kettlebell swing front position: standing tall, hips snapped forward, the kettlebell floating at chest height, arms straight"),
"jumping-jacks": ("no equipment", "standing upright, feet together, arms along the body", "mid-jump with feet spread wide and arms raised overhead"),
"squat-saute": ("no equipment", "at the bottom of a squat, thighs parallel, back straight, arms slightly back ready to explode", "jumping straight up off the floor from the squat, legs extended, arms reaching up"),
"anges-neiges": ("no equipment", "lying face down, arms extended forward overhead with palms down, chest and arms slightly lifted", "lying face down with the elbows pulled down toward the hips, shoulder blades squeezed, chest slightly lifted"),
"ytw-allonge": ("no equipment", "lying face down, forehead on the floor, arms extended overhead in a Y shape, thumbs up", "lying face down with the arms raised off the floor in the Y shape, thumbs up, shoulder blades squeezed"),
"rowing-sac": ("a loaded backpack held by its straps", "bent over at 45 degrees with a flat back, holding a loaded backpack by its straps with both hands hanging toward the floor", "same bent-over position with the backpack rowed up to the navel, elbows bent and back"),
}
IDS = ["pompes","pompes-lestees","pompes-pieds-sureleves","pompes-diamant","dips-chaise","developpe-halteres","tractions","rowing-halteres","curl-halteres","superman","squat","squat-lestes","fentes-bulgares","pont-fessier","planche","ab-wheel","rotation-medball","lancer-medball","corde","rowing-elastique","developpe-epaules-elastique","tirage-vertical-elastique","pompes-elastique","squat-disque","pompes-genoux","developpe-sol-halteres","pike-pompes","pompes-sangles","rowing-inverse","rowing-sangles","face-pull-elastique","curl-elastique","oiseau-halteres","goblet-kettlebell","souleve-terre-roumain","fentes-marchees","montees-step","leg-curl-swissball","mollets-debout","chaise-murale","planche-laterale","dead-bug","crunch-swissball","gainage-sangles","course-a-pied","burpees","mountain-climbers","swing-kettlebell","jumping-jacks","squat-saute","anges-neiges","ytw-allonge","rowing-sac"]
def spec(i):
    exo = IDS[i]
    equip, f1, f2 = E[exo]
    sil = SIL[i % len(SIL)]
    p1 = ("Use the reference images only as a style guide. " + STYLE +
          " Draw FRAME 1 of 2 for this exercise: " + sil + ", " + f1 + ". Equipment: " + equip + ".")
    p2 = ("The reference images show FRAME 1 and the general style of the same fitness illustration series. Keep the SAME person (" + sil + "), same style, same clothes, same camera angle. " + STYLE +
          " Draw FRAME 2 of 2: " + f2 + ". Equipment: " + equip + ".")
    return exo, sil, p1, p2
