# EBIOS RM -- Application web interactive d'analyse de risques


> **Ceci est la version 100 % navigateur** — tout s'exécute dans votre
> navigateur, les données n'en sortent jamais (localStorage + export JSON).
> Idéale en solo, pour évaluer, pour un consultant sur les données d'un
> client, ou en contexte isolé. Besoin de comptes, d'une base partagée,
> d'une API et du multi-utilisateurs ? Le **backend standalone** du même
> module est à la [racine de ce dépôt](../) — mêmes fonctionnalités, même
> format de données, un export JSON fait passer votre travail de l'un à
> l'autre. Voir « One repository, two versions » dans le README principal.

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

### Socle de sécurité

Deux référentiels de socle intégrés à l'application : guide d'hygiène ANSSI (42 mesures) ou ISO 27001 Annexe A (93 mesures), au choix dans l'atelier 1.

### Tableaux de synthèse

Cartographies des risques initiaux/résiduels, distribution, évolution, conformité du socle

### Interface bilingue (FR/EN)

L'application détecte automatiquement la langue du navigateur et peut être basculée entre français et anglais via les Réglages (roue crantée dans la barre d'outils). Les mesures des socles ANSSI et ISO 27001 sont disponibles dans les deux langues.

### Assistant IA (optionnel)

Un assistant IA peut être activé dans les Réglages pour générer des suggestions contextualisées sur chaque atelier (valeurs métier, biens supports, scénarios, mesures, etc.). Il supporte les fournisseurs **Anthropic (Claude)**, **OpenAI (GPT)**, **Google (Gemini)** et **AWS Bedrock**. Voir la section [Assistant IA](#assistant-ia) pour les détails.

---

## Prise en main

### Démo en ligne

L'application est accessible en ligne : **https://risk.cisotoolbox.org/**

### Fichier de démonstration

Le dépôt fournit un jeu de démonstration décrivant la société fictive
**MedSecure** : `demo-fr.json` et `demo-en.json`. Il se charge via
**Réglages > Charger la démonstration** (le fichier correspondant à la langue
courante). Le chargement passe par `fetch()` : servir l'application via un
serveur statique, pas en `file://`.

### Démarrage rapide

```bash
git clone https://github.com/CISOToolbox/risk.git
cd risk/webapp
python3 -m http.server 8080      # n'importe quel serveur statique convient
```

1. Ouvrir http://127.0.0.1:8080/ dans un navigateur
2. Renseigner le contexte de l'étude (atelier 1)
3. Parcourir les 5 ateliers via la barre latérale
4. Enregistrer via **Fichier > Enregistrer** — tout reste en local
---

## Import / Export

L'application n'enferme pas les données. Tout peut être importé et exporté dans des formats ouverts :

| Format | Import | Export | Usage |
|--------|--------|--------|-------|
| **JSON** | Ouvrir | Enregistrer (sauvegarde rapide du fichier ouvert) / Enregistrer sous | Format natif, sauvegarde complète. Enregistrer écrase le fichier courant sans chiffrement. |
| **JSON chiffré** | Ouvrir (mot de passe) | Enregistrer sous (mot de passe) | Sauvegarde sécurisée (AES-256-GCM, PBKDF2 250k itérations). Utiliser Enregistrer sous pour activer le chiffrement. |
| **Excel (.xlsx)** | Import | Export | Interopérabilité -- continuer l'analyse dans un tableur |
| **Vendor (TPRM) JSON** | Import | -- | Import des parties prenantes depuis l'application Vendor |
| **PowerPoint (.pptx)** | -- | Synthèse managériale | Présentation de synthèse |
| **Word (.docx)** | -- | Export rapport | Rapport EBIOS RM à partir des modèles `templates/ebios-report-{fr,en}.docx` |

Le fichier Excel généré contient un onglet par atelier avec des formules automatiques (criticité, pertinence, vraisemblance, risque résiduel) qui permettent d'utiliser le fichier Excel de façon totalement autonome. **L'analyse reste exploitable sans l'application.**

> **Note :** l'import/export Excel utilise la bibliothèque [ExcelJS](https://github.com/exceljs/exceljs), l'export PowerPoint PptxGenJS et l'export Word PizZip + docxtemplater. Ces bibliothèques sont livrées avec l'application sous `js/vendor/` et chargées à la demande depuis la même origine. Aucune connexion Internet n'est requise : hors assistant IA, l'application fonctionne intégralement hors-ligne.

---

## Architecture

### Principes de conception

| Principe | Détail |
|----------|--------|
| 100% client-side | Pas de backend, pas de base de données, pas de comptes utilisateurs |
| Souveraineté des données | Toutes les données restent dans le navigateur (localStorage + fichiers) |
| Rien à compiler pour lancer l'app | Pas de framework ; le code propre au module est écrit en TypeScript (`ts/`) et le JS compilé (`js/`) est commité : il n'y a rien à compiler pour lancer l'app |
| Bibliothèque partagée | Code commun (`cisotoolbox.js`, `cisotoolbox_local.js`, `i18n.js`, `ai_common.js`, `ct_*.js`) identique entre les apps CISO Toolbox |
| Chargement à la demande | Assets lourds (descriptions des mesures, template Excel, bibliothèques de `js/vendor/`) chargés à la demande |
| Conforme CSP | Pas de script inline, pas de `eval`, pas de `unsafe-inline` pour le JS |

### Structure des fichiers

```
index.html                    Point d'entrée
css/
  cisotoolbox.css                Styles partagés (toolbar, rail de navigation, tableaux, dialogues)
  EBIOS_RM.css                   Styles spécifiques à l'application
js/
  i18n.js                        Moteur i18n (t(), switchLang, attributs data-i18n)
  i18n_core_en.js                Traductions partagées EN
  i18n_core_fr.js                Traductions partagées FR
  cisotoolbox.js                 Bibliothèque partagée (événements, chiffrement, undo, matrices, chargement d'assets)
  ct_schema.js                   Versionnement du schéma et migrations au chargement
  cisotoolbox_local.js           Persistance locale (auto-save, ouverture/enregistrement, snapshots, démo)
  ct_refselect.js                Widget de multi-sélection de références
  ct_settings.js                 Panneau des Réglages (langue, assistant IA, réglages du module)
  ai_common.js                   Module IA partagé (fournisseurs, appels API, UI du panneau)
  ct_bulkbar.js                  Fichier partagé, non chargé par index.html
  ct_measure_modal.js            Fichier partagé, non chargé par index.html
  ct_modal.js                    Fichier partagé, non chargé par index.html
  ct_table.js                    Fichier partagé, non chargé par index.html
  EBIOS_RM_data.js               Données initiales (analyse vide, socles ANSSI et ISO pré-remplis)
  EBIOS_RM_i18n_fr.js            Traductions FR (chargées au démarrage)
  EBIOS_RM_i18n_en.js            Traductions EN (chargées au démarrage)
  EBIOS_RM_app.js                Logique applicative principale (~3700 lignes)
  EBIOS_RM_catalog.js            Catalogue multi-analyses (IndexedDB)
  EBIOS_RM_ai_assistant.js       Suggestions IA pour chaque atelier
  EBIOS_RM_descriptions.js       Descriptions ANSSI/ISO (chargement différé)
  EBIOS_RM_template.js           Template Excel (chargement différé, base64)
  vendor/                        ExcelJS, PptxGenJS, PizZip, docxtemplater (chargement différé)
ts/                              Sources TypeScript du code propre au module (+ ts/types/)
templates/                       Modèles Word du rapport (FR, EN)
```

### Ordre de chargement des scripts

Les scripts sont chargés de manière synchrone dans un ordre strict en bas de `index.html`. L'ordre est important car chaque script dépend de globales définies par les précédents :

```
 1. i18n.js                  Le moteur i18n doit être disponible avant tout appel à t()
 2. i18n_core_en.js          Traductions partagées EN
 3. i18n_core_fr.js          Traductions partagées FR
 4. cisotoolbox.js           Bibliothèque partagée, utilise t() pour les chaînes UI
 5. ct_schema.js             Versionnement du schéma (migrations au chargement)
 6. cisotoolbox_local.js     Persistance locale
 7. EBIOS_RM_data.js         Définit EBIOS_INIT_DATA (objet analyse vide)
 8. EBIOS_RM_i18n_fr.js      Enregistre les clés de traduction FR
 9. EBIOS_RM_i18n_en.js      Enregistre les clés de traduction EN
10. ct_refselect.js          Widget de sélection de références
11. EBIOS_RM_app.js          App principale -- déclare CT_CONFIG et D
12. EBIOS_RM_catalog.js      Catalogue multi-analyses (IndexedDB)
13. ai_common.js             Fournit les fonctions IA partagées
14. ct_settings.js           Panneau des Réglages
15. EBIOS_RM_ai_assistant.js Enveloppe les fonctions de rendu avec les hooks IA
```

Charger un script dans le mauvais ordre provoquera des erreurs de référence (`t()` non défini, `D` indéfini, `CT_CONFIG` manquant).

### Patterns clés

**CT_CONFIG** -- Chaque application déclare un objet de configuration lu par `cisotoolbox.js` (ici en tête de `EBIOS_RM_app.js`) :

```javascript
window.CT_CONFIG = {
    autosaveKey: "ebios_rm_autosave",  // clé localStorage pour l'auto-save
    initDataVar: "EBIOS_INIT_DATA",    // nom de la globale contenant les données initiales
    descNamespace: "EBIOS_DESCRIPTIONS", // namespace pour les descriptions
    labelKey: "ebios.label",           // clé i18n du libellé ("analyse")
    filePrefix: "EBIOS_RM",            // préfixe par défaut du nom de fichier
    getSociete: function (d) { ... },  // retourne le nom de l'entreprise depuis D
    getDate: function (d) { ... },     // retourne la date de l'analyse depuis D
    getScope: function (d) { ... }     // retourne "EBIOS_RM"
};
```

**D** -- L'objet de données global contenant l'intégralité de l'analyse. Tous les ateliers lisent et écrivent dans `D`. Il est sérialisé en JSON pour la sauvegarde/export et désérialisé à l'ouverture/import.

**Délégation d'événements** -- Aucun gestionnaire d'événement inline (`onclick`, `onchange`). Toutes les interactions utilisent les attributs `data-click`, `data-change` et `data-input` dispatchés par `_safeDispatch()`. Ceci est conforme CSP et évite `unsafe-inline`.

**Chargement à la demande** -- `_loadAsset(filename, cb)` charge dynamiquement un fichier JS (descriptions, template Excel) et `_loadScript(url)` une bibliothèque de `js/vendor/`, uniquement quand nécessaire, évitant un payload initial trop lourd.

**Ref select** -- Widget multi-sélection avec recherche (`ct_refselect.js`) pour les références croisées entre éléments de l'analyse (valeurs métier, biens supports, parties prenantes, mesures, mesures du socle...).

**_rt()** -- Helper bilingue pour les données de référence. Retourne `field_en` quand la locale est EN, `field` sinon. Utilisé pour les mesures des socles ANSSI et ISO qui existent dans les deux langues.

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
openSettings() --> l'utilisateur configure fournisseur, clé API et modèle
    |
    v
Panneau IA     --> prompt automatique ou instruction personnalisée
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

Les fichiers partagés, identiques entre les applications CISO Toolbox, portent un en-tête "Generated file - do not edit" et sont réécrits à chaque release :

| Fichier | Rôle |
|---------|------|
| `cisotoolbox.js` | Délégation d'événements, chiffrement, undo/redo, toolbar, rail de navigation, matrices, chargement d'assets |
| `cisotoolbox_local.js` | Persistance locale : auto-save, ouverture/enregistrement de fichiers, snapshots, chargement de la démo |
| `i18n.js`, `i18n_core_*.js` | Moteur de traduction : `t(clé)`, `switchLang()`, scan des attributs `data-i18n`, traductions communes |
| `ai_common.js` | Configuration des fournisseurs IA, wrapper d'appel API, UI des suggestions |
| `ct_settings.js` | Panneau des Réglages (langue, assistant IA, réglages propres au module) |
| `ct_refselect.js`, `ct_schema.js` | Widget de sélection de références ; versionnement du schéma de données |
| `cisotoolbox.css` | Styles partagés pour toolbar, rail, tableaux, dialogues, formulaires |

---

## Sécurité

| Mesure | Détail |
|--------|--------|
| **CSP** | `script-src 'self'` -- pas de script inline, pas de `eval`, aucun CDN externe |
| **X-Frame-Options** | `DENY` -- empêche le clickjacking via iframe |
| **X-Content-Type-Options** | `nosniff` -- empêche le navigateur de deviner le Content-Type |
| **Permissions-Policy** | Désactive caméra, micro, géolocalisation, paiement, USB, capteurs |
| **Chiffrement** | AES-256-GCM avec dérivation PBKDF2 (250 000 itérations) |
| **Clés API** | Stockées uniquement en localStorage, jamais incluses dans les fichiers sauvegardés |
| **Blocklist de dispatch** | `_safeDispatch` refuse d'appeler les fonctions internes/dangereuses |
| **Assainissement HTML** | Les saisies utilisateur sont échappées avant insertion dans le DOM |
| **SRI** | Sans objet : toutes les bibliothèques sont servies depuis la même origine (`js/vendor/`), plus aucun chargement tiers |
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

| Fournisseur | Endpoint API |
|-------------|-------------|
| Anthropic (Claude) | `https://api.anthropic.com` |
| OpenAI (GPT) | `https://api.openai.com` |
| Google (Gemini) | `https://generativelanguage.googleapis.com` |
| AWS Bedrock | `https://bedrock-runtime.eu-west-3.amazonaws.com` (par défaut) |

Le modèle se choisit dans les Réglages parmi la liste proposée pour chaque fournisseur ; un endpoint personnalisé peut aussi y être saisi (optionnel).

### Configuration

1. Cliquer sur la roue crantée dans la barre d'outils
2. Saisir une clé API du fournisseur choisi
3. Activer le toggle "Assistant IA"
4. Un avertissement de confidentialité et de sécurité est affiché et doit être accepté (voir ci-dessous)

### Fichier d'instructions méthodologiques

Un fichier Markdown ou texte (`.md`, `.txt`, `.markdown`) peut être chargé dans les Réglages pour guider les suggestions de l'IA (référentiel interne, consignes de rédaction, vocabulaire sectoriel). Le contenu du fichier est ajouté au prompt système de chaque appel.

### Mode mise à jour

Quand l'analyse contient déjà des éléments (ex. : valeurs métier), l'assistant passe en "mode mise à jour" : il envoie les éléments existants en contexte et demande à l'IA de suggérer des ajouts ou améliorations, en évitant les doublons.

### Avertissements de confidentialité et de sécurité

> L'avertissement affiché à l'activation couvre le partage de données, l'exposition de la clé API et le réseau. Points à connaître :
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
> 4. **Validation des réponses** -- Les suggestions générées par l'IA sont des propositions présentées sous forme de cartes ; rien n'est écrit dans l'analyse sans acceptation de l'analyste.

---

## Déploiement

L'application est un ensemble de fichiers statiques. Aucun serveur applicatif n'est nécessaire.

### Options d'hébergement

- **Serveur web** (Apache, Nginx, hébergement statique) -- déposer les fichiers
- **Poste local** -- servir le dossier avec un serveur statique (`python3 -m http.server`) ; en `file://`, le navigateur bloque `fetch()` : la démo et l'export Word ne fonctionnent pas
- **Intranet** -- aucune connexion Internet requise après le chargement initial

### Fonctionnement hors-ligne

L'application fonctionne hors-ligne une fois chargée, à une exception près : l'**assistant IA** nécessite une connexion Internet pour communiquer avec l'API du fournisseur.

L'import/export Excel et les exports PowerPoint et Word chargent leurs bibliothèques depuis `js/vendor/` lors de la première utilisation (même origine, aucun accès Internet).

### Instances en ligne

| Environnement | URL |
|----------------|-----|
| Production | https://risk.cisotoolbox.org |

---

## Contribuer

Ce projet est open source. Les contributions sont les bienvenues : signalement de bugs, suggestions de fonctionnalités, ajout de référentiels, traductions, améliorations du code.

Dépôt GitHub : **https://github.com/CISOToolbox/risk**

---

## Licence

MIT
