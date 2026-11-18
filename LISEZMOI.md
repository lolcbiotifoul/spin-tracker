# Spin Tracker : mise en ligne

Ce dossier contient l'application complète. Elle ne contient aucune de tes mains :
elles restent dans ton navigateur, sur ton ordinateur.

## Mettre en ligne avec GitHub Pages (gratuit)

1. Crée un compte sur https://github.com (gratuit).
2. Bouton « + » en haut à droite > « New repository ». Nom : `spin-tracker`, visibilité « Public »
   (obligatoire pour GitHub Pages gratuit ; le code est public, tes mains non). Clique « Create repository ».
3. Sur la page du dépôt : lien « uploading an existing file ». Glisse **le contenu** de ce dossier
   (index.html, manifest.webmanifest, sw.js et le dossier icons), puis « Commit changes ».
4. Onglet « Settings » > « Pages » (menu de gauche). Source : « Deploy from a branch »,
   branche `main`, dossier `/ (root)`, « Save ».
5. Attends 1 à 2 minutes : l'adresse s'affiche en haut de la page Pages,
   du type `https://ton-pseudo.github.io/spin-tracker/`.

## Installer l'appli

Ouvre l'adresse dans **Chrome** ou **Edge**, puis clique sur l'icône d'installation à droite
de la barre d'adresse (ou menu ⋮ > « Installer Spin Tracker »). L'appli a ensuite sa propre
fenêtre et son icône, et fonctionne même hors connexion.

## Relier ton dossier d'historiques

Range tous tes exports Betclic (`ExportHH_….txt`) dans un même dossier. Dans l'appli :
bouton « Relier mon dossier » en haut à gauche, choisis ce dossier, autorise la lecture.
Ensuite « ⟳ Mettre à jour » importe uniquement les nouveaux fichiers. Pendant que l'appli
est ouverte, le dossier est relu toutes les 3 minutes.

## Mettre à jour l'appli plus tard

Remplace les fichiers dans le dépôt GitHub (même méthode qu'à l'étape 3). Tes mains et
réglages ne sont pas touchés. Pense à exporter tes réglages de temps en temps (Réglages >
« Exporter mes réglages »).
