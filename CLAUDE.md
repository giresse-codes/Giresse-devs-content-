# Giresse Devs Content — consignes pour Claude Code

Ce dépôt sert à produire les vidéos TikTok de deux comptes :
- **Dev Lyrique** : lyrics vidéos animées sur des musiques tendance du moment.
- **Dev Edit** : edits motion design inspirés des tendances et de l'actualité.

Audience visée : **Royaume-Uni**. Objectif : visibilité et revenus, donc chaque rendu doit être solide dès le premier essai (crédits limités, pas de rendus inutiles).

## Style Dev Lyrique (par défaut)

**Animation du texte**
- Affichage mot par mot, jamais la phrase entière d'un coup.
- Léger rebond / zoom à l'apparition de chaque mot.
- Refrain et punchlines : le mot ou la phrase clé grossit brièvement pour marquer l'impact.
- Effet karaoké : la couleur du mot change au moment exact où il est chanté.

**Couleurs**
- Flashy et chaud : rose fuchsia, jaune, orange, en alternance.
- Contour noir épais sur tout le texte pour rester lisible sur n'importe quel fond.
- Fond : vidéo d'origine ou ambiance en mouvement (floutée si besoin), jamais un fond fixe seul.

**Format**
- Vertical 9:16, 1080x1920, MP4.
- Texte centré ou légèrement dans le tiers inférieur.
- Police bold et arrondie, grande taille, lisible au scroll.
- Durée : celle de l'extrait fourni (15–30 s idéal), audio d'origine conservé.
- Les 2 premières secondes doivent accrocher l'œil.

## Méthode de production
1. Si les paroles sont fournies, les utiliser telles quelles et seulement les synchroniser.
2. Sinon, extraire l'audio (ffmpeg) et transcrire avec Whisper, horodatage au mot près.
3. Construire le rendu (Remotion, ou ffmpeg + sous-titres ASS animés), puis exporter en MP4.
4. Vérifier le rendu (quelques images clés) avant de le livrer.

## Publication (rappel)
- Horaires Royaume-Uni : midi–13 h ou 18 h–21 h (heure de Londres).
- Au moins une vidéo par jour au début.
- Choisir des sons qui montent, pas ceux déjà au sommet depuis des semaines.

## Premier test
- Son : « Baddies in Belgica » — Issah, extrait de 18 secondes.
