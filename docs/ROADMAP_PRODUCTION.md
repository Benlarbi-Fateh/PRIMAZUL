# Roadmap Production PrimAzul

Objectif: transformer PrimAzul d'une application qui fonctionne en une application fiable, rapide, maintenable et capable de supporter des milliers d'utilisateurs.

Le but prioritaire n'est pas d'ajouter beaucoup de fonctionnalites tout de suite. Le plus important est de rendre les fonctionnalites actuelles solides: navigation fluide, backend stable, securite, cache, pagination, monitoring et architecture temps reel scalable.

## 1. Gros Chantiers Pour Une App Production

### Architecture Frontend

- Creer un layout commun protege pour toutes les pages connectees.
- Eviter que `MainSidebar`, `Sidebar` et `ProtectedRoute` soient recrees page par page.
- Ajouter un cache frontend avec React Query ou SWR.
- Decouper les gros composants comme `Sidebar.jsx`, `Callcontext.jsx`, `SettingsPage` et les pages tres longues.
- Reduire les composants `"use client"` quand ce n'est pas necessaire.
- Corriger tous les warnings hydration.
- Ameliorer la navigation mobile et desktop.
- Ajouter des loading states propres, rapides et coherents.
- Ajouter des error boundaries par zone: chat, appels, profil, settings.

### Backend Et API

- Separarer clairement routes, controllers, services, validators et acces database.
- Ajouter une validation stricte avec Zod, Joi ou express-validator.
- Ajouter de la pagination partout: messages, conversations, contacts, statuts, taches, notifications.
- Ajouter du rate limiting sur login, register, OTP, messages, uploads, invitations et appels.
- Ajouter compression HTTP.
- Ajouter un cache serveur pour certaines donnees frequentes.
- Ameliorer les erreurs API: codes propres, messages propres, logs internes separes.
- Ajouter des tests backend sur auth, messages, invitations, appels et uploads.

### Base De Donnees MongoDB

- Verifier les indexes avec `explain()`.
- Paginer les messages correctement.
- Eviter les requetes N+1 dans conversations/messages.
- Nettoyer les anciennes donnees temporaires: appels expires, statuts expires, fichiers orphelins.
- Ajouter une strategie d'archivage ou TTL quand c'est pertinent.
- Surveiller les collections volumineuses: `messages`, `conversations`, `statuses`, `calls`.

### Temps Reel Et Socket

- Separer la logique Socket.IO du reste du code.
- Gerer les reconnexions proprement.
- Eviter les listeners dupliques.
- Structurer les rooms:
  - room utilisateur
  - room conversation
  - room appel
- Ajouter des acknowledgements pour les evenements importants.
- Ajouter une protection contre le spam socket.
- Prevoir Redis adapter Socket.IO pour scaler sur plusieurs serveurs backend.

### Appels Audio Et Video

- Clarifier tous les etats d'appel:
  - `initiated`
  - `ringing`
  - `ongoing`
  - `missed`
  - `declined`
  - `ended`
  - `expired`
- Nettoyer les appels perimes cote frontend et backend.
- Eviter les appels fantomes.
- Ajouter une meilleure reprise apres refresh.
- Ajouter du monitoring pour les erreurs Agora.
- Separer toute la logique Agora dans un vrai service backend.

### Securite

- Stocker le token plus proprement, idealement avec cookies HTTP-only.
- Ajouter refresh tokens.
- Gerer les sessions actives.
- Ajouter deconnexion de tous les appareils.
- Proteger tous les uploads.
- Valider type, taille et extension des fichiers.
- Ajouter CORS strict.
- Ajouter Helmet.
- Ajouter rate limiting global et par action sensible.
- Ajouter logs de securite.
- Verifier toutes les routes privees et permissions.

### Performance

- Mesurer avec Lighthouse, React Profiler et logs de temps API.
- Reduire la taille du bundle frontend.
- Lazy-loader les composants lourds: appels, media viewer, settings avances.
- Virtualiser les longues listes de messages et conversations.
- Optimiser images avec CDN.
- Ajouter pagination et infinite scroll efficaces.
- Eviter les re-renders globaux quand un message arrive.
- Ajouter memoization ciblee.

### Infrastructure

- Deployer le frontend sur Vercel ou equivalent.
- Deployer le backend sur Render, Fly.io, Railway, AWS ou equivalent selon budget.
- Utiliser Cloudinary, S3 ou equivalent pour les fichiers.
- Ajouter CDN pour images et videos.
- Gerer proprement les variables d'environnement par environnement.
- Avoir au moins deux environnements: staging et production.
- Ajouter backup MongoDB automatique.
- Ajouter monitoring: Sentry, Logtail, Datadog, Grafana ou equivalent.

### Observabilite

- Ajouter logs structures backend.
- Ajouter Sentry frontend et backend.
- Ajouter metriques:
  - temps de reponse API
  - erreurs 500
  - connexions socket
  - messages envoyes
  - appels echoues
  - uploads echoues
- Ajouter tracing pour les requetes lentes.
- Ajouter alertes quand les erreurs augmentent.

### Qualite Code

- Ajouter tests unitaires sur fonctions critiques.
- Ajouter tests API.
- Ajouter tests end-to-end avec Playwright.
- Ajouter CI GitHub Actions:
  - lint
  - build
  - tests
- Ajouter conventions de commits et branches.
- Ajouter documentation technique.

### UX Produit

- Ameliorer onboarding.
- Ajouter page/indicateur d'etat de connexion.
- Ajouter feedback clair pour erreurs reseau.
- Ajouter recherche globale.
- Ajouter systeme de notifications fiable.
- Ajouter parametres de confidentialite plus clairs.
- Ajouter mode offline partiel plus tard.
- Ajouter meilleure gestion des conversations archivees et supprimees.

## 2. Fonctionnalites Manquantes

### Notifications Fiables

- Notifications push web/mobile.
- Notifications quand l'utilisateur est hors ligne.
- Preferences par conversation: mute 1h, 8h, toujours.
- Compteur global fiable des messages non lus.
- Notification d'erreur quand un message n'est pas envoye.

### Recherche Globale

- Recherche dans les conversations.
- Recherche dans les messages.
- Recherche contacts, groupes et fichiers.
- Filtres par images, documents, liens, audio et video.
- Recherche par date ou par participant.

### Pagination Et Historique Avance

- Chargement progressif des anciens messages.
- Infinite scroll propre.
- Aller a une date precise.
- Messages epingles dans une discussion.
- Conservation de la position scroll quand on revient dans une conversation.

### Gestion Des Fichiers

- Limites par type et taille.
- Preview PDF, image, video et audio.
- Telechargement securise.
- Stockage Cloudinary, S3 ou CDN, pas stockage local en production.
- Nettoyage des fichiers orphelins.
- Scan ou validation avancee des fichiers si l'application devient publique.

### Messagerie Avancee

- Modifier un message.
- Supprimer un message pour moi.
- Supprimer un message pour tout le monde.
- Messages favoris.
- Messages programmes mieux integres.
- Brouillons par conversation.
- Mentions dans les groupes.
- Reponses/threading plus propres.
- Reactions mieux affichees.
- Accuses de lecture plus lisibles.

### Groupes

- Roles clairs: admin, moderateur, membre.
- Permissions: ajouter, supprimer, modifier l'info groupe, gerer les roles.
- Invitation par lien.
- Quitter un groupe proprement.
- Supprimer ou archiver un groupe.
- Historique des actions groupe visible.

### Presence Et Statuts

- En ligne.
- Vu a...
- Ecrit...
- Confidentialite par utilisateur.
- Statuts/stories mieux integres.
- Nettoyage automatique clair des statuts expires.
- Reponse aux statuts mieux integree dans le chat.

### Securite Utilisateur

- Refresh token.
- Sessions actives.
- Deconnexion de tous les appareils.
- Historique de connexions.
- Blocage et signalement utilisateur.
- Suppression de compte.
- Export des donnees utilisateur.

### Administration

- Dashboard admin.
- Gestion utilisateurs.
- Gestion des signalements.
- Logs d'activite.
- Moderation fichiers/messages si l'application devient publique.

### Mode Offline Et Reprise Reseau

- Indicateur de connexion.
- Retry automatique.
- Queue locale pour messages echoues.
- Bouton "reessayer" sur message non envoye.
- Synchronisation apres retour reseau.

## 3. Fonctionnalites Existantes Mais Mal Structurees

### Chat

- Ajouter pagination messages.
- Ajouter virtualisation des longues conversations.
- Ajouter cache local.
- Eviter les rechargements visibles.
- Ameliorer loading, empty state et error state.
- Eviter les re-renders inutiles quand un evenement socket arrive.

### Sidebar

Le composant `Sidebar.jsx` fait trop de choses:

- conversations
- contacts
- invitations
- statuts
- recherche
- evenements socket
- compteurs
- prechargement

A faire:

- Extraire `useConversations`.
- Extraire `useInvitations`.
- Extraire `useOnlineUsers`.
- Extraire `ConversationList`.
- Extraire `InvitationList`.
- Extraire `SidebarTabs`.
- Garder `Sidebar.jsx` comme composant assembleur simple.

### Appels Audio Et Video

- Etats d'appel encore fragiles.
- Appels termines parfois visibles cote frontend.
- Reprise apres refresh a fiabiliser.
- Erreurs Agora a mieux traiter.
- Appels fantomes a eviter.
- Logique Agora a separer dans un service dedie.

### Auth

- Token a renforcer.
- Ajouter refresh token.
- Gerer expiration session.
- Proteger OTP avec rate limit.
- Securiser login/register/forgot-password.
- Idealement passer a cookies HTTP-only.

### Settings Et Profile

- Pages trop grosses et trop couplees.
- Separarer securite, notifications, confidentialite, archives.
- Corriger tous les problemes hydration theme.
- Ameliorer skeletons et loading states.
- Eviter les effets inutiles au chargement.

### Statuts Et Stories

- Ajouter pagination/tri.
- Precharger medias.
- Rendre l'affichage plus fluide.
- Nettoyer les statuts expires.
- Ameliorer integration avec les reponses dans le chat.

### Taches

- Clarifier taches personnelles vs taches de conversation.
- Clarifier projets.
- Ajouter permissions.
- Ajouter notifications.
- Ajouter filtres avances.
- Ameliorer assignations et commentaires.

## 4. Corrections Techniques Necessaires

### Layout Commun Protege

Priorite tres elevee.

Actuellement plusieurs pages recrent leurs sidebars/layouts. Il faut un layout unique pour les pages connectees afin de rendre la navigation plus fluide et reduire la duplication.

### Cache Frontend

Ajouter React Query ou SWR pour:

- conversations
- messages
- profil
- contacts
- invitations
- statuts
- taches

### Pagination Backend

Obligatoire pour plusieurs milliers d'utilisateurs:

- messages
- conversations
- contacts
- notifications
- statuts
- taches

### Socket.IO Scalable

- Ajouter Redis adapter si plusieurs serveurs backend.
- Structurer les rooms.
- Eviter les listeners dupliques.
- Ajouter acknowledgements sur evenements importants.
- Ajouter rate limiting socket.

### Validation API

Ajouter validation stricte sur:

- body
- params
- query
- files
- permissions

### Rate Limiting

Obligatoire sur:

- auth
- OTP
- messages
- upload
- invitations
- appels
- recherche

### Tests

Ajouter:

- tests auth
- tests messages
- tests appels
- tests invitations
- tests uploads
- tests e2e navigation/chat

### Monitoring

Ajouter:

- Sentry frontend/backend
- logs structures backend
- metriques API/socket
- alertes erreurs 500
- suivi des appels echoues
- suivi uploads echoues

## 5. Priorite Recommandee

### Court Terme

1. Layout commun protege.
2. Cache frontend conversations/messages.
3. Pagination messages.
4. Refactor progressif de `Sidebar.jsx`.
5. Correction hydration/theme restante.
6. Rate limiting auth/OTP/uploads.

### Moyen Terme

1. Recherche globale.
2. Notifications fiables.
3. Uploads robustes avec stockage externe.
4. Appels Agora plus robustes.
5. Tests API et E2E.
6. Monitoring Sentry.

### Long Terme

1. Redis adapter Socket.IO.
2. Architecture backend services/repositories.
3. Dashboard admin.
4. Moderation et signalement.
5. Mode offline partiel.
6. CI/CD complet.

## 6. Definition D'Une Version Prete Pour Des Milliers D'Utilisateurs

PrimAzul commence a etre pret pour plusieurs milliers d'utilisateurs quand:

- les messages sont pagines et indexes;
- les conversations sont cachees cote frontend;
- les listes longues sont virtualisees;
- Socket.IO peut scaler avec Redis;
- les fichiers sont stockes hors serveur local;
- l'auth a refresh token ou cookies HTTP-only;
- les actions sensibles sont rate-limitees;
- les erreurs sont monitorées;
- les builds sont verifies par CI;
- le backend a des logs structures;
- MongoDB a des backups automatiques;
- les pages connectees partagent un layout stable.

