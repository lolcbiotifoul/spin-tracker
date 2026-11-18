# Sources

Le site publié (`../index.html`) est généré à partir de ces fichiers :

```
mkdir -p site && python3 build_pwa.py   # crée pwa_site/ (index.html, sw.js, manifest, icônes)
```

- `app.html` : interface, vues, graphiques, état
- `engine.js` : lecture des historiques Betclic, pots, équités, EV
- `hud.js` : HUD heads-up et 3 joueurs du Leak Finder, références perso
- `extra.js` : fenêtres d'aide « ? », menus déroulants, onglet Multiplicateurs
- `rp.js` / `rp.css` : replayer
- `fm.js` : filtres
- `pwa.js` : dossier lié, synchronisation, sauvegarde des réglages
