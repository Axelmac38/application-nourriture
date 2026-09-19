# Repas & stock

Première version mobile installable dans un navigateur, indépendante de MyFitnessPal. Elle conserve les données uniquement sur l’appareil.

## Fonctions livrées

- journal alimentaire quotidien avec calories, protéines, glucides et lipides ;
- objectifs facultatifs et configurables ;
- recettes à plusieurs ingrédients, enregistrables dans le journal ;
- déduction des ingrédients présents dans le stock ;
- seuils de stock et liste de courses proposée ;
- articles de courses ajoutés manuellement.

Le catalogue initial comporte des aliments génériques courants ; leurs valeurs sont des moyennes indicatives pour 100 g et ne remplacent jamais l’étiquette d’un produit précis. Certains noms ont été identifiés dans la liste hors ligne de l’APK de référence, mais aucune base propriétaire complète n’est importée. L’application ne fournit aucun objectif nutritionnel personnel ni conseil médical.

## Lancer localement

```powershell
npm.cmd run start
```

Puis ouvrir `http://localhost:4173` sur un navigateur. Sur téléphone, elle pourra être installée comme application web ; la génération d’un APK Android constitue une étape ultérieure.

## Vérifier

```powershell
npm.cmd run verify
```

Le suivi détaillé est conservé dans le dépôt de pilotage Codex-work, dans `IMPORTANT/Sport Repas/SUIVI_PROJET.md`. Les anciens classeurs Excel restent séparés comme références.
