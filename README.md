# PCS Command AI

**Système de Gestion de Plan Communal de Sauvegarde (PCS) assisté par Intelligence Artificielle.**

Ce projet est une application web complète (Frontend React + Backend Node.js) destinée aux cellules de crise municipales. Elle permet de centraliser les informations, de cartographier les risques et les moyens, et d'assister le Directeur des Opérations de Secours (DOS) grâce à l'IA générative Google Gemini.

## 🚀 Fonctionnalités Principales

### 🗺️ Cartographie Tactique & SITAC
*   **Visualisation en temps réel :** Sites sensibles, Intervenants, Salles, Matériel.
*   **Outils de dessin (Leaflet Draw) :** Zones de danger, périmètres de sécurité, flèches tactiques.
*   **Annotation Textuelle :** Ajout de notes et labels directement sur la carte.
*   **Fonds de plan :** Bascule entre vue Satellite, Plan, Sombre (Nuit) et Clair.

### 🤖 Assistance IA (Google Gemini)
*   **Analyse de risques :** Évaluation automatique des menaces pour les sites sensibles.
*   **Génération de Fiches Réflexes :** Création instantanée de checklists opérationnelles adaptées au type de crise et au lieu.


### 🚨 Gestion de Crise
*   **Main Courante électronique :** Journalisation horodatée des événements et décisions.
*   **Fil d'actualité :** Suivi des alertes (Météo, Préfecture, etc.).
*   **Activation PCS :** Mode "Crise" dédié avec focus cartographique et journalisation intensive.
*   **Archivage :** Historique complet des crises passées consultable en lecture seule.

### 🛡️ Administration & Sécurité
*   **Authentification :** Système de connexion sécurisé.
*   **Gestion des utilisateurs :** Rôles (Viewer, User, Admin, DOS).
*   **Base de données JSON :** Persistance des données via un backend léger (Express).

### 📄 Rapports & Documents
*   **Génération PDF :** Export des fiches détails des sites et moyens.
*   **Bibliothèque documentaire :** Stockage et prévisualisation des plans (PPRI, annuaires, etc.).

---

## 🛠️ Prérequis

*   **Node.js** (v18 ou supérieur)
*   **Clé API Google Gemini** (pour les fonctionnalités IA)

---

## 📦 Installation

1.  Clonez le dépôt ou téléchargez les fichiers.
2.  Ouvrez un terminal à la racine du projet.
3.  Installez les dépendances :

```bash
npm install
```

4.  Créez un fichier `.env` à la racine pour configurer votre clé API IA :

```env
API_KEY=votre_cle_api_google_gemini_ici
```

---

## ▶️ Démarrage

L'application nécessite le lancement simultané du **Serveur Backend** (API & Base de données) et du **Client Frontend** (Interface React).

Ouvrez **deux terminaux** séparés :

### Terminal 1 : Lancer le Serveur (Backend)
Ce serveur gère l'authentification et la sauvegarde des données dans `db.json` (port 3001).

```bash
npm run server
```

### Terminal 2 : Lancer l'Application (Frontend)
Lance l'interface utilisateur avec Vite (port 5173 par défaut).

```bash
npm run dev
```

Ouvrez ensuite votre navigateur sur **http://localhost:5173**.

---

## 🔑 Connexion par défaut

Lors du premier lancement, un compte administrateur est créé automatiquement :

*   **Identifiant :** `admin`
*   **Mot de passe :** `admin`

> *Note : Vous pourrez créer d'autres utilisateurs et supprimer ce compte via l'onglet "Utilisateurs" une fois connecté.*

---

## 🏗️ Architecture Technique

*   **Frontend :** React 19, TypeScript, Tailwind CSS, Vite.
*   **Cartographie :** Leaflet, Leaflet Draw, OpenStreetMap/CartoDB/Esri tiles.
*   **Backend :** Node.js, Express.
*   **Base de données :** Fichier local `db.json` (NoSQL léger).
*   **IA :** Google Generative AI SDK (`gemini-2.5-flash`).
*   **Icônes :** Phosphor Icons.

## ⚠️ Avertissement

Ceci est une démonstration technique ("Proof of Concept").
Pour un usage réel en situation critique, assurez-vous de sécuriser le serveur, d'utiliser une base de données robuste et de vérifier la redondance des connexions internet pour l'accès à l'API Gemini.
