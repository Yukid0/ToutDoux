# NovaList - Gestionnaire de Tâches avec MySQL et Node.js

Une application simple de gestion de tâches qui utilise Node.js, Express et MySQL pour stocker les données.

## Fonctionnalités

- Création, suppression et gestion de listes de tâches
- Ajout, modification, complétion et suppression de tâches
- Interface utilisateur intuitive
- Stockage des données dans une base de données MySQL

## Prérequis

- Node.js (v14 ou supérieur)
- MySQL (via XAMPP, WampServer, ou installation native)
- npm (gestionnaire de paquets Node.js)

## Installation

1. Clonez ce dépôt ou téléchargez les fichiers
2. Installez les dépendances :
   ```
   npm install
   ```
3. Créez la base de données MySQL:
   - Démarrez votre serveur MySQL (via XAMPP, WampServer, etc.)
   - Accédez à phpMyAdmin
   - Importez le fichier `db_init.sql` pour créer la base de données et les tables

4. Configurez le fichier `.env` avec vos informations de connexion à la base de données
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASS=votre_mot_de_passe
   DB_NAME=ToutDoux
   PORT=3000
   ```

5. Lancez l'application :
   ```
   npm start
   ```
   ou pour le développement :
   ```
   npm run dev
   ```

6. Accédez à l'application dans votre navigateur : [http://localhost:[VotrePort]]  Exemple : (http://localhost:3000)

## Structure du projet

- `/config` - Configuration de la base de données
- `/public` - Fichiers statiques (HTML, CSS, JS client)
  - `/scripts` - Code JavaScript côté client (app.js, api.js)
- `/routes` - Routes de l'API pour les listes et tâches
- `server.js` - Point d'entrée de l'application
- `db_init.sql` - Script d'initialisation de la base de données

## Déploiement

1. Assurez-vous que MySQL est installé et configuré sur votre serveur
2. Importez le fichier `db_init.sql` dans votre base de données MySQL
3. Configurez les variables d'environnement (fichier .env) avec les paramètres de connexion à la base de données
4. Installez les dépendances : `npm install --production`
5. Démarrez l'application : `npm start`

## API Endpoints

### Listes
- `GET /api/lists` - Récupérer toutes les listes
- `POST /api/lists` - Créer une nouvelle liste
- `DELETE /api/lists/:id` - Supprimer une liste

### Tâches
- `GET /api/tasks/list/:listId` - Récupérer toutes les tâches d'une liste
- `POST /api/tasks` - Créer une nouvelle tâche
- `PUT /api/tasks/:id/toggle` - Basculer l'état d'une tâche (terminée/non terminée)
- `PUT /api/tasks/:id` - Modifier le texte d'une tâche
- `DELETE /api/tasks/:id` - Supprimer une tâche
- `DELETE /api/tasks/completed/list/:listId` - Supprimer toutes les tâches terminées d'une liste 