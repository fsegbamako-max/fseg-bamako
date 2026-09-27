# Guide des administrateurs FSEG

## 1. Préparer la base Supabase

Avant de déployer le nouveau serveur, ouvrez **Supabase > SQL Editor** et exécutez le contenu de [`supabase/migrations/202609260001_admin_super_admin.sql`](supabase/migrations/202609260001_admin_super_admin.sql). Cette migration ajoute le rôle super-administrateur et attribue ce rôle au compte admin le plus ancien si aucun super-admin n’est encore défini.

Vérifiez le résultat :

```sql
SELECT id, username, nom_complet, is_super_admin, created_at
FROM admins
ORDER BY id;
```

Si le compte qui doit gérer les autres n’est pas celui qui a été sélectionné automatiquement, choisissez-le explicitement dans Supabase SQL Editor, en remplaçant `admin` par son identifiant :

```sql
UPDATE admins SET is_super_admin = (username = 'admin');
```

Cette commande donne le rôle super-admin à un seul compte, et le retire aux autres.

## 2. Déployer et ouvrir la page

Après la migration, déployez le serveur et le client. Déconnectez-vous puis reconnectez-vous sur `/admin/connexion` pour actualiser les informations de rôle. Le menu **Administrateurs** est visible pour un super-administrateur, sur `/admin/administrateurs`.

Depuis cette page, un super-admin peut consulter les comptes, en créer avec le rôle **Administrateur** ou **Super-administrateur**, et supprimer les autres comptes. Il n’est pas possible de supprimer son propre compte ni le dernier super-admin.

Un administrateur standard peut gérer les fonctions habituelles du portail, mais ne peut pas appeler l’API de gestion des administrateurs. Cette règle est contrôlée par le serveur, pas seulement par l’affichage du menu.

## 3. Créer le premier compte

Sur une base qui ne contient encore aucun administrateur, placez-vous dans le dossier `server` et exécutez :

```powershell
node src/scripts/create_admin.js identifiant "MotDePasseLongEtUnique" "Nom complet"
```

Le premier compte créé par ce script devient automatiquement super-admin. Les comptes ajoutés ensuite par le script sont des administrateurs standards; utilisez la page de gestion pour attribuer le rôle super-admin.

Le mot de passe passé en argument peut rester dans l’historique du terminal. Utilisez un mot de passe unique, ne partagez pas la commande ni sa sortie, et ne mettez jamais le mot de passe ou le jeton JWT dans Git.

## 4. Ajouter un collègue

1. Connectez-vous à l’espace admin avec un compte super-admin.
2. Ouvrez **Administrateurs**, puis **Ajouter un administrateur**.
3. Saisissez un identifiant, le nom complet et un mot de passe provisoire d’au moins 8 caractères.
4. Choisissez le rôle nécessaire et créez le compte.
5. Transmettez l’identifiant et le mot de passe au collègue par un canal privé. Ne les envoyez pas dans un groupe ni dans un dépôt de code.

Les identifiants doivent contenir de 3 à 40 lettres, chiffres, points, tirets ou tirets bas. Les mots de passe sont stockés sous forme de hash bcrypt; ils ne sont jamais affichés dans la liste.