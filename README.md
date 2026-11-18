# Tablée

**Le carnet de cuisine privé de ta famille et de tes amis.**

Chacun publie ce qu'il a cuisiné (photo, recette, ustensiles), la tribu le refait, le fait « à sa sauce », ou garde l'idée dans ses envies. Pas de notes entre proches : une recette qui plaît est une recette qu'on refait.

- Application web installable (PWA) : « Ajouter à l'écran d'accueil » sur iPhone et Android.
- Plusieurs tribus possibles. Chacune est privée et on y entre par un lien d'invitation.
- Pré-saisie de la recette par l'IA (Claude) à partir de la photo du plat, d'une recette écrite ou d'une étiquette.

Application : **https://oliv74frouze.github.io/tablee/**
Démo sans compte (les données restent dans le navigateur) : **https://oliv74frouze.github.io/tablee/?demo**

---

## Comment c'est construit

| Élément | Rôle | Coût |
|---|---|---|
| **GitHub Pages** | héberge l'application (`index.html`, `app.js`…) | gratuit |
| **Supabase** | comptes, base de données, photos, temps réel | gratuit pour démarrer |
| **Fonction `ai`** (Supabase Edge Function) | appelle Claude avec la clé gardée côté serveur | environ 0,1 centime par pré-saisie (Claude Haiku) |

Fichiers :

- `index.html`, `app.js` : l'application.
- `config.js` : l'adresse du projet Supabase et sa **clé publique**. Ces deux valeurs sont publiques par nature : la sécurité vient des règles de la base.
- `supabase/schema.sql` : tables, règles de sécurité (chacun ne modifie que ses posts, une tribu ne voit que son carnet), stockage des photos.
- `supabase/functions/ai/index.ts` : la fonction serveur pour l'IA.
- `manifest.webmanifest`, `sw.js`, `icons/` : ce qu'il faut pour installer l'application.
- `tests/mock-supabase.js` : faux Supabase utilisé seulement par les tests automatiques.

---

## Installation (une seule fois)

### 1. Base de données

Dans Supabase, ouvre **SQL Editor**, puis **New query**. Colle tout le contenu de [`supabase/schema.sql`](supabase/schema.sql) et clique sur **Run**.
Le message attendu est « Success. No rows returned ». Le script peut être relancé sans risque.

### 2. Connexion sans e-mail de confirmation

Le service d'e-mails gratuit de Supabase est très limité. Pour que tes proches puissent créer leur compte tout de suite, ouvre **Authentication**, puis **Sign In / Providers**, puis **Email**. Désactive **Confirm email**, puis enregistre.

(Plus tard, on pourra brancher un service d'e-mails gratuit comme Brevo ou Resend pour réactiver la confirmation et permettre « mot de passe oublié ».)

### 3. Fonction IA

1. Ouvre **Edge Functions**, puis **Deploy a new function**, puis **Via Editor**.
2. Remplace le code d'exemple par tout le contenu de [`supabase/functions/ai/index.ts`](supabase/functions/ai/index.ts).
3. Nomme la fonction **`ai`** (exactement), puis clique sur **Deploy**.
4. Dans les réglages de la fonction (**Details**), désactive **Verify JWT** / **Enforce JWT verification** : la fonction vérifie elle-même la personne connectée.
5. Ouvre **Edge Functions**, puis **Secrets**, et ajoute :
   - `ANTHROPIC_API_KEY` = ta clé d'API Claude (console.anthropic.com, rubrique API Keys). **Ne la mets jamais dans le code ni dans GitHub.**
   - facultatif : `AI_MONTHLY_LIMIT` = nombre de pré-saisies par personne et par mois (30 par défaut).
   - facultatif : `AI_MODEL` = modèle Claude (`claude-haiku-5-5` par défaut).

Pense aussi à fixer un **plafond de dépenses** mensuel dans la console Anthropic.

### 4. Mise en ligne

Sur GitHub, ouvre le dépôt **tablee**, puis **Settings**, puis **Pages**. Dans **Build and deployment**, choisis la source **Deploy from a branch**, la branche **main** et le dossier **/ (root)**, puis enregistre.
Après une minute environ, l'application est en ligne à l'adresse indiquée.

---

## Utilisation

1. Ouvre l'application, crée ton compte (prénom, e-mail, mot de passe) puis **crée ta tribu**.
2. Dans **Moi**, touche **Partager le lien** et envoie-le à tes proches. Ils créent leur compte et arrivent directement dans le carnet.
3. Sur le téléphone, choisis **Ajouter à l'écran d'accueil** (Safari : bouton Partager ; Chrome : menu ⋮) pour avoir l'icône Tablée.

## Mettre à jour

Toute modification poussée sur la branche `main` est en ligne en une minute environ. Les téléphones prennent la nouvelle version au prochain lancement.
