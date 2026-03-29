# EBIOS RM -- Application web interactive d'analyse de risques

Application web 100% client-side pour conduire des analyses de risques selon la méthodologie **EBIOS Risk Manager** (ANSSI, France).

> Cet outil fait partie de la suite **[CISO Toolbox](https://www.cisotoolbox.org)** -- une collection d'outils open-source de sécurité, conçus pour les RSSI, analystes de risques et responsables conformité. L'objectif de cette suite logicielle est d'être modulaire et légère pour que chacun puisse utiliser uniquement le ou les outils dont il a besoin.
>
> Pour voir les autres outils de la suite vous pouvez consulter le site [cisotoolbox.org](https://www.cisotoolbox.org/#tools)

---

## Pourquoi cet outil ?

Il existe de nombreux outils de GRC qui intègrent des fonctionnalités d'analyses de risques -- comme l'excellent [CISO Assistant](https://intuitem.com/fr/ciso-assistant/) -- mais ceux-ci présentent des limites pour les utilisateurs qui souhaitent simplement mener des analyses de risques :

- Nécessité d'héberger, déployer et gérer l'application serveur
- Hébergement Cloud public qui peut poser des problèmes de confidentialité
- Outils plus complets mais donc plus lourds à paramétrer pour un usage unique

Cette application a été conçue autour de deux principes simples :

**1) Aucune donnée ne quitte le navigateur**

- Pas de serveur applicatif, pas de base de données, pas de compte utilisateur
- Tout le traitement se fait côté client, en JavaScript
- Les données restent sur le poste de l'analyste
- L'application fonctionne hors-ligne une fois chargée
- Le chiffrement/déchiffrement des sauvegardes (AES-256-GCM) est réalisé localement

**2) Aucune dépendance à l'outil**

- Export Excel à tout moment pour continuer l'analyse dans un tableur
- Outil et format de données ouverts

---

## Fonctionnalités

### Les 5 ateliers EBIOS RM

1. **Cadrage et socle de sécurité** -- Contexte, valeurs métier, biens supports, événements redoutés, socle de conformité (ANSSI 42 mesures ou ISO 27001 Annexe A 93 mesures)
2. **Sources de risque et objectifs visés** -- Identification et évaluation des couples SR/OV (Motivation, Ressources, Activité)
3. **Scénarios stratégiques** -- Chemins d'attaque, parties prenantes de l'écosystème, mesures écosystème
4. **Scénarios opérationnels** -- Kill chain détaillée, contrôles existants, efficacité, vraisemblance opérationnelle
5. **Traitement du risque** -- Plan de traitement, mesures de sécurité, risques résiduels

### Référentiels complémentaires (chargés à la demande)

GAMP 5, LPM, Loi 05-20 (Maroc), DORA, HDS, SecNumCloud, NIS 2, Cyber Resilience Act, SOC 2

### Tableaux de synthèse

Cartographies des risques initiaux/résiduels, distribution, évolution, conformité du socle

### Interface bilingue (FR/EN)

L'application détecte automatiquement la langue du navigateur et peut être basculée entre français et anglais via les Réglages (roue crantée dans la barre d'outils). Le contenu réglementaire (ANSSI, ISO, DORA, NIS 2, etc.) est disponible dans les deux langues avec les textes officiels anglais quand ils existent.

### Assistant IA (optionnel)

Un assistant IA peut être activé dans les Réglages pour générer des suggestions contextualisées sur chaque atelier (valeurs métier, biens supports, scénarios, mesures, etc.). Il supporte les fournisseurs **Anthropic (Claude)** et **OpenAI (GPT)**. Voir la section [Assistant IA](#assistant-ia) pour les détails.

---

## Prise en main

### Démo en ligne

L'application est accessible en ligne : **https://ebiosrm.cisotoolbox.org/**

### Fichier de démonstration

Un fichier de démonstration (`demo-fr.json`) est fourni avec l'application. Il contient une analyse complète pour une entreprise fictive (MedSecure) et permet de découvrir l'ensemble des fonctionnalités.

### Démarrage rapide

1. Ouvrir l'application dans un navigateur
2. Cliquer sur **Fichier > Ouvrir**
3. Sélectionner le fichier `demo-fr.json`
4. Parcourir les 5 ateliers via la barre latérale

Si vous utilisez la version en ligne **https://ebiosrm.cisotoolbox.org/** vous pouvez charger automatiquement les données d'exemples en allant dans les règlages (Roue crantée en haut à droite).
---

## Import / Export

L'application n'enferme pas les données. Tout peut être importé et exporté dans des formats ouverts :

| Format | Import | Export | Usage |
|--------|--------|--------|-------|
| **JSON** | Ouvrir | Enregistrer (sauvegarde rapide du fichier ouvert) / Enregistrer sous | Format natif, sauvegarde complète. Enregistrer écrase le fichier courant sans chiffrement. |
| **JSON chiffré** | Ouvrir (mot de passe) | Enregistrer sous (mot de passe) | Sauvegarde sécurisée (AES-256-GCM, PBKDF2 250k itérations). Utiliser Enregistrer sous pour activer le chiffrement. |
| **Excel (.xlsx)** | Import | Export | Interopérabilité -- continuer l'analyse dans un tableur |

Le fichier Excel généré contient un onglet par atelier avec des formules automatiques (criticité, pertinence, vraisemblance, risque résiduel) qui permettent d'utiliser le fichier Excel de façon totalement autonome. **L'analyse reste exploitable sans l'application.**

> **Note :** l'import/export Excel nécessite la bibliothèque [ExcelJS](https://github.com/exceljs/exceljs), chargée à la demande depuis un CDN (`cdn.jsdelivr.net`). Une connexion Internet est donc requise lors du premier import ou export Excel. Toutes les autres fonctionnalités (JSON, chiffrement, analyse) fonctionnent entièrement hors-ligne.

---

## Architecture

### Principes de conception

| Principe | Détail |
|----------|--------|
| 100% client-side | Pas de backend, pas de base de données, pas de comptes utilisateurs |
| Souveraineté des données | Toutes les données restent dans le navigateur (localStorage + fichiers) |
| Pas d'étape de build | JavaScript vanilla, pas de framework, pas de transpileur |
| Bibliothèque partagée | Code commun (`cisotoolbox.js`, `i18n.js`, `ai_common.js`) partagé entre les apps CISO Toolbox |
| Chargement à la demande | Assets lourds (descriptions, référentiels, template Excel) chargés à la demande |
| Conforme CSP | Pas de script inline, pas de `eval`, pas de `unsafe-inline` pour le JS |

### Structure des fichiers

```
index.html                    Point d'entrée
css/
  cisotoolbox.css                Styles partagés (toolbar, sidebar, tableaux, dialogues)
  EBIOS_RM.css                   Styles spécifiques à l'application
js/
  i18n.js                        Moteur i18n (t(), switchLang, attributs data-i18n)
  cisotoolbox.js                 Bibliothèque partagée (événements, fichiers, chiffrement, undo, snapshots)
  referentiels_catalog.js        Catalogue partagé des référentiels (9 référentiels FR/EN)
  ai_common.js                   Module IA partagé (fournisseurs, réglages, appels API, UI du panneau)
  EBIOS_RM_data.js               Données initiales (analyse vide)
  EBIOS_RM_i18n.js               Traductions FR/EN (~300 clés + contenu d'aide)
  EBIOS_RM_app.js                Logique applicative principale (~3000 lignes)
  EBIOS_RM_ai_assistant.js       Suggestions IA pour chaque atelier
  EBIOS_RM_descriptions.js       Descriptions ANSSI/ISO (chargement différé)
  EBIOS_RM_template.js           Template Excel (chargement différé, base64)
  EBIOS_RM_ref_cra.js            Mesures Cyber Resilience Act (chargement différé)
  EBIOS_RM_ref_dora.js           Mesures DORA (chargement différé)
  EBIOS_RM_ref_gamp.js           Mesures GAMP 5 (chargement différé)
  EBIOS_RM_ref_hds.js            Mesures HDS (chargement différé)
  EBIOS_RM_ref_loi0520.js        Mesures Loi 05-20 (chargement différé)
  EBIOS_RM_ref_lpm.js            Mesures LPM (chargement différé)
  EBIOS_RM_ref_nis2.js           Mesures NIS 2 (chargement différé)
  EBIOS_RM_ref_secnumcloud.js    Mesures SecNumCloud (chargement différé)
  EBIOS_RM_ref_soc2.js           Mesures SOC 2 (chargement différé)
```

### Ordre de chargement des scripts

Les scripts sont chargés de manière synchrone dans un ordre strict en bas de `index.html`. L'ordre est important car chaque script dépend de globales définies par les précédents :

```
1. i18n.js                  Le moteur i18n doit être disponible avant tout appel à t()
2. cisotoolbox.js            Bibliothèque partagée, utilise t() pour les chaînes UI
3. referentiels_catalog.js   Définit window._REFERENTIELS_CATALOG
4. EBIOS_RM_data.js          Définit D par défaut (objet analyse vide)
5. EBIOS_RM_i18n.js          Enregistre les clés de traduction FR/EN
6. EBIOS_RM_app.js           App principale -- lit CT_CONFIG, D, REFERENTIELS_META
7. ai_common.js              Lit AI_APP_CONFIG, fournit les fonctions IA partagées
8. EBIOS_RM_ai_assistant.js  Enveloppe les fonctions de rendu avec les hooks IA
```

Charger un script dans le mauvais ordre provoquera des erreurs de référence (`t()` non défini, `D` indéfini, `CT_CONFIG` manquant).

### Patterns clés

**CT_CONFIG** -- Chaque application déclare un objet de configuration avant que `cisotoolbox.js` ne s'exécute :

```javascript
window.CT_CONFIG = {
    autosaveKey: "ebios_autosave",    // clé localStorage pour l'auto-save
    initDataVar: "EBIOS_INIT_DATA",   // nom de la globale contenant les données initiales
    refNamespace: "EBIOS_REF",        // namespace pour les fichiers référentiels lazy
    descNamespace: "EBIOS_DESCRIPTIONS", // namespace pour les descriptions
    label: "analyse",                 // label pour les messages UI ("Nouvelle analyse")
    filePrefix: "EBIOS_RM",           // préfixe par défaut du nom de fichier
    getSociete: function() { ... },   // retourne le nom de l'entreprise depuis D
    getDate: function() { ... }       // retourne la date de l'analyse depuis D
};
```

**D** -- L'objet de données global contenant l'intégralité de l'analyse. Tous les ateliers lisent et écrivent dans `D`. Il est sérialisé en JSON pour la sauvegarde/export et désérialisé à l'ouverture/import.

**Délégation d'événements** -- Aucun gestionnaire d'événement inline (`onclick`, `onchange`). Toutes les interactions utilisent les attributs `data-click`, `data-change` et `data-input` dispatchés par `_safeDispatch()`. Ceci est conforme CSP et évite `unsafe-inline`.

**Chargement à la demande** -- `_loadAsset(namespace, path, callback)` charge dynamiquement les fichiers JS (descriptions, mesures de référentiels, template Excel) uniquement quand nécessaire, évitant un payload initial trop lourd.

**Ref select** -- Widget multi-sélection avec recherche pour les références croisées entre référentiels. Chaque bien support peut référencer des mesures de n'importe quel référentiel chargé.

**_rt()** -- Helper bilingue pour les données de référence. Retourne `field_en` quand la locale est EN, `field` sinon. Utilisé pour les descriptions de référentiels qui existent dans les deux langues.

**_REFERENTIELS_CATALOG / REFERENTIELS_META** -- Le catalogue (`referentiels_catalog.js`) fournit les métadonnées des 9 référentiels. Il est copié dans `REFERENTIELS_META` à l'initialisation, puis enrichi avec les mesures effectives quand un référentiel est chargé à la demande.

### Flux de données

```
Interaction utilisateur
    |
    v
updateField(path, value)  -- écrit dans D
    |
    v
_saveState()              -- empile dans la pile d'annulation
    |
    v
_autoSave()               -- écrit D dans localStorage
```

**Opérations sur les fichiers :**

```
Ouvrir    --> _loadBuffer() --> gère le chiffrement (AES-256-GCM) --> JSON.parse --> D
Enregistrer --> _serializeForSave() --> JSON ou blob chiffré --> File System Access API ou téléchargement
```

**Flux IA :**

```
openSettings() --> l'utilisateur configure le prompt
    |
    v
_aiCallAPI()   --> envoie contexte + prompt à l'API du fournisseur
    |
    v
_aiParseJSON() --> extrait le JSON structuré de la réponse
    |
    v
_normalizeSuggestions() --> valide la structure
    |
    v
_renderCards() --> affiche les cartes de suggestion dans le panneau
    |
    v
L'utilisateur accepte --> ACCEPT_HANDLERS --> écrit dans D
```

### Architecture de la bibliothèque partagée

Cinq fichiers sont partagés entre l'application et les autres applications de la suite cisotoolbox.org :

| Fichier | Rôle |
|---------|------|
| `cisotoolbox.js` | Délégation d'événements, I/O fichiers, chiffrement, undo/redo, auto-save, snapshots, toolbar, sidebar |
| `i18n.js` | Moteur de traduction : `t(clé)`, `switchLang()`, scan des attributs `data-i18n` |
| `ai_common.js` | Configuration des fournisseurs IA, wrapper d'appel API, panneau de réglages, UI des suggestions, injection CSS |
| `referentiels_catalog.js` | Métadonnées des 9 référentiels complémentaires (id, label, description, nombre de mesures) en FR et EN |
| `cisotoolbox.css` | Styles partagés pour toolbar, sidebar, tableaux, dialogues, formulaires, widget ref-select |

Chaque application vit dans son propre dépôt git. Les fichiers partagés sont maintenus à l'identique entre les deux applications.

---

## Sécurité

| Mesure | Détail |
|--------|--------|
| **CSP** | `script-src 'self' https://cdn.jsdelivr.net` -- pas de script inline, pas de `eval` |
| **X-Frame-Options** | `DENY` -- empêche le clickjacking via iframe |
| **X-Content-Type-Options** | `nosniff` -- empêche le navigateur de deviner le Content-Type |
| **Permissions-Policy** | Désactive caméra, micro, géolocalisation, paiement, USB, capteurs |
| **Chiffrement** | AES-256-GCM avec dérivation PBKDF2 (250 000 itérations) |
| **Clés API** | Stockées uniquement en localStorage, jamais incluses dans les fichiers sauvegardés |
| **Blocklist de dispatch** | `_safeDispatch` refuse d'appeler les fonctions internes/dangereuses |
| **Assainissement HTML** | Les saisies utilisateur sont échappées avant insertion dans le DOM |
| **SRI** | Intégrité vérifiée pour les bibliothèques chargées depuis un CDN (ExcelJS) |
| **HTTPS** | HTTPS doit être imposé au niveau du serveur/hébergement |
| **Pas de serveur** | Aucune donnée ne transite par un serveur tiers (sauf assistant IA si activé) |

---

## Assistant IA

### Fonctionnement

L'assistant IA fournit un panneau de suggestions pour chaque atelier. Lorsqu'il est ouvert, il envoie le contexte de l'analyse en cours (organisation, périmètre, éléments existants) accompagné d'un prompt au fournisseur IA sélectionné.

Deux modes de prompt sont disponibles :

- **Auto** -- L'assistant génère un prompt basé sur l'atelier en cours et le contexte de l'analyse
- **Personnalisé** -- L'analyste rédige un prompt libre, le contexte de l'analyse est ajouté automatiquement

### Fournisseurs supportés

| Fournisseur | Modèles | Endpoint API |
|-------------|---------|-------------|
| Anthropic | Claude (Sonnet, Haiku) | `https://api.anthropic.com` |
| OpenAI | GPT-4o, GPT-4o-mini | `https://api.openai.com` |

Il est possible d'ajouter très facilement d'autres fournisseurs comme Gemini mais nous cherchons des utilisateurs de ces solutions pour les tester avant de publier. N'hésitez pas à nous contacter si vous souhaitez tester.

### Configuration

1. Cliquer sur la roue crantée dans la barre d'outils
2. Saisir une clé API du fournisseur choisi
3. Activer le toggle "Assistant IA"
4. Un avertissement détaillé de sécurité est affiché (voir ci-dessous)

### Fichier d'instructions méthodologiques

Un fichier Markdown peut être chargé dans les Réglages pour guider les suggestions de l'IA (référentiel interne, consignes de rédaction, vocabulaire sectoriel). Le contenu du fichier est ajouté en tête de chaque prompt.

### Mode mise à jour

Quand l'analyse contient déjà des éléments (ex. : valeurs métier), l'assistant passe en "mode mise à jour" : il envoie les éléments existants en contexte et demande à l'IA de suggérer des ajouts ou améliorations, en évitant les doublons.

### Avertissements de confidentialité et de sécurité

> En activant l'assistant IA, vous acceptez les points suivants :
>
> 1. **Partage de données** -- Les données de votre analyse (contexte de l'organisation, exigences, mesures, scénarios) sont envoyées au fournisseur IA sélectionné pour générer des suggestions. Assurez-vous que votre politique de confidentialité et vos engagements contractuels (clauses de sous-traitance, RGPD, NDA) autorisent ce partage avec un service tiers.
>
> 2. **Exposition de la clé API** -- L'application fonctionne sans serveur backend. La clé API est donc transmise directement depuis votre navigateur vers l'API du fournisseur. Cela implique que :
>    - La clé est visible dans les outils de développement du navigateur (onglet Network)
>    - Les extensions navigateur disposant de la permission `webRequest` peuvent la capturer
>    - Un proxy d'entreprise peut journaliser les headers HTTP (même si le contenu est chiffré en HTTPS)
>
>    **Recommandation :** utilisez un profil navigateur dédié, sans extensions, pour les analyses contenant des données sensibles.
>
> 3. **Stockage de la clé** -- La clé API est stockée dans le `localStorage` du navigateur. Elle n'est jamais incluse dans les fichiers JSON sauvegardés. Toute personne ayant accès au navigateur (même session, même profil) peut la lire via les DevTools.
>
> 4. **Aucune garantie sur les réponses** -- Les suggestions générées par l'IA sont des propositions à valider par l'analyste. Elles ne se substituent pas à l'expertise humaine.

---

## Déploiement

L'application est un ensemble de fichiers statiques. Aucun serveur applicatif n'est nécessaire.

### Options d'hébergement

- **Serveur web** (Apache, Nginx, hébergement statique) -- déposer les fichiers
- **Poste local** -- ouvrir `index.html` dans un navigateur (les assets JS doivent être dans la même arborescence)
- **Intranet** -- aucune connexion Internet requise après le chargement initial

### Fonctionnement hors-ligne

L'application fonctionne hors-ligne une fois chargée, avec deux exceptions :

- **Import/export Excel** nécessite la bibliothèque ExcelJS depuis le CDN lors de la première utilisation
- **Assistant IA** nécessite une connexion Internet pour communiquer avec l'API du fournisseur

### Instances en ligne

| Environnement | URL |
|----------------|-----|
| Production | https://ebiosrm.cisotoolbox.org |
| Staging | https://staging.ebiosrm.cisotoolbox.org |

---

## Contribuer

Ce projet est open source. Les contributions sont les bienvenues : signalement de bugs, suggestions de fonctionnalités, ajout de référentiels, traductions, améliorations du code.

Dépôt GitHub : **https://github.com/CollectiveMakers/ebios_rm_webapp**

---

## Licence

MIT
