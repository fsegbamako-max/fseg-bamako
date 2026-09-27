# Portail FSEG Bamako

Plateforme web de la Faculté des Sciences Économiques et de Gestion de Bamako (FSEG), rattachée à l’Université des Sciences Sociales et de Gestion de Bamako (USSGB).

Le projet réunit un site institutionnel public, un espace étudiant et un espace d’administration. L’interface est une application React progressive (PWA) et les données sont servies par une API Node.js connectée à Supabase.

## Fonctionnalités

- **Site public** : présentation de la faculté, formations, départements, projets, actualités, documents et contact.
- **Espace étudiant** : inscription et connexion, tableau de bord, cours, notes, emplois du temps et profil.
- **Administration** : gestion des étudiants et des classes, des cours, des notes, des emplois du temps, des actualités, des documents et des comptes administrateurs.
- **PWA** : l’application cliente peut être installée sur les appareils compatibles.

## Technologies

- **Client** : React 18, Vite, Tailwind CSS, React Router, TanStack Query, Zustand et `vite-plugin-pwa`.
- **Serveur** : Node.js 18 ou supérieur, Express, JWT et bcrypt.
- **Données et fichiers** : Supabase (PostgreSQL et Storage).

## Organisation du dépôt

```text
client/       Application React et configuration PWA
server/       API Express et scripts d’administration
supabase/     Schéma SQL et migrations de base de données
```

## Prérequis

- Node.js 18 ou supérieur et npm.
- Un projet Supabase avec une base PostgreSQL et un bucket Storage.
- Git pour cloner le dépôt.

## Installation locale

### 1. Préparer Supabase

Dans l’éditeur SQL de Supabase, exécutez `supabase/schema.sql`, puis les migrations de `supabase/migrations/` dans l’ordre de leur nom. Créez également le bucket de stockage attendu par l’application (par défaut `fseg`) et configurez ses règles d’accès selon les documents que vous souhaitez rendre publics ou privés.

### 2. Configurer et démarrer l’API

Depuis la racine du dépôt :

```powershell
cd server
npm ci
Copy-Item .env.example .env
```

Ouvrez `server/.env` et renseignez les paramètres :

| Variable | Rôle |
| --- | --- |
| `SUPABASE_URL` | URL du projet Supabase. |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé privée utilisée uniquement par le serveur. Ne la placez jamais dans le client ou dans Git. |
| `JWT_SECRET` | Secret aléatoire fort utilisé pour signer les jetons. Remplacez impérativement la valeur d’exemple. |
| `ALLOWED_ORIGINS` | Origines autorisées par CORS, séparées par des virgules. En local, utilisez `http://localhost:5173`. |
| `PORT` | Port de l’API; valeur locale par défaut : `4000`. |
| `NODE_ENV` | Environnement; utilisez `development` en local et `production` en déploiement. |
| `SUPABASE_BUCKET` | Nom du bucket Supabase Storage; valeur par défaut : `fseg`. |

Vous pouvez générer un secret JWT aléatoire avec Node.js :

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Démarrez ensuite l’API :

```powershell
npm run dev
```

L’API répond sur `http://localhost:4000`. La route `http://localhost:4000/health` permet de vérifier qu’elle est démarrée.

### 3. Démarrer l’application cliente

Dans un second terminal, depuis la racine du dépôt :

```powershell
cd client
npm ci
npm run dev
```

Ouvrez l’adresse indiquée par Vite, généralement `http://localhost:5173`. En développement, Vite transmet les requêtes `/api` à l’API locale sur le port `4000`.

## Premier compte administrateur

Après avoir configuré le serveur et appliqué le schéma Supabase, le premier compte peut être créé depuis le dossier `server` :

```text
node src/scripts/create_admin.js <identifiant> <mot_de_passe> [nom_complet]
```

Le premier compte créé reçoit le rôle de super-administrateur. Le script reçoit le mot de passe comme argument de commande : ne saisissez pas votre vrai mot de passe dans un terminal partagé ou enregistré et ne publiez jamais cette commande avec le secret réel.

## Commandes utiles

Client, depuis `client/` :

```bash
npm run build      # Créer la version de production dans dist/
npm run preview    # Prévisualiser le build localement
npm run lint       # Vérifier le code client avec ESLint
```

Serveur, depuis `server/` :

```bash
npm start                  # Démarrer l’API
npm run supabase:health    # Vérifier les accès Supabase configurés
```

## Déploiement

Le dépôt contient une configuration Render pour l’API dans `server/render.yaml`. Configurez les secrets dans le tableau de bord de l’hébergeur, jamais dans le dépôt. Pour le client, construisez l’application avec `npm run build` depuis `client/`, puis publiez le contenu de `client/dist/` sur un hébergeur statique.

En production, définissez `ALLOWED_ORIGINS` sur l’origine exacte du site, configurez `VITE_API_URL` au moment de construire le client si l’API n’est pas servie sous `/api`, et utilisez HTTPS pour le site et l’API.

## Sécurité des secrets

- Ne commitez jamais `.env`, clés Supabase, secrets JWT, mots de passe ou données personnelles d’étudiants.
- La clé `SUPABASE_SERVICE_ROLE_KEY` donne des privilèges élevés : elle doit rester côté serveur.
- Utilisez des mots de passe uniques et forts pour les comptes administrateurs et les services d’hébergement.
- Avant une ouverture publique, vérifiez les règles d’accès Supabase, les politiques Storage, les sauvegardes et les parcours d’inscription et de récupération de compte.

## Licence

Aucune licence open source n’est définie pour le moment. Ajoutez un fichier `LICENSE` si vous souhaitez autoriser officiellement la réutilisation du code.
