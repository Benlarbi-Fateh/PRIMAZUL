# Audit Et Roadmap Production PrimAzul

Objectif: rendre PrimAzul exploitable par des milliers d'utilisateurs reels, avec une application rapide, fiable, maintenable, securisee et observable.

Ce document remplace l'ancienne roadmap. Il sert a la fois d'audit complet et de plan d'execution. Les priorites sont classees ainsi:

- `P0`: indispensable avant une vraie production publique.
- `P1`: important pour passer de "fonctionnel" a "solide et scalable".
- `P2`: evolution produit ou optimisation avancee.

Statuts:

- `[FAIT]`: deja corrige ou mis en place.
- `[PARTIEL]`: commence, mais incomplet.
- `[A FAIRE]`: pas encore traite.
- `[A REVOIR]`: existe, mais doit etre restructure, securise ou fiabilise.

## 1. Resume Executif

PrimAzul est deja une application riche: messagerie, conversations, groupes, invitations, contacts, appels audio/video via Agora, statuts/stories, taches, profil, settings, blocage, media, notifications et temps reel Socket.IO.

Le risque principal n'est pas le manque d'idees produit. Le risque principal est que l'application a grandi vite: gros composants frontend, controllers backend tres longs, logique metier melangee aux routes, beaucoup de logs de debug, peu de tests, validation API encore partielle, stockage/session perfectibles, Socket.IO non pret pour multi-instance, et absence de monitoring.

Pour atteindre plusieurs milliers d'utilisateurs, il faut prioriser:

1. stabilite backend et validation stricte;
2. performance chat et navigation;
3. securite auth/uploads/tokens;
4. scalabilite Socket.IO et MongoDB;
5. observabilite, tests et CI;
6. UX fiable: loading states, erreurs, offline/retry.

## 2. Ce Qui Existe Deja

### Produit Et Fonctionnalites

- `[FAIT]` Authentification avec inscription, login, verification, reset password et OTP.
- `[FAIT]` Profil utilisateur, photo de profil, preferences et confidentialite.
- `[FAIT]` Conversations individuelles et groupes.
- `[FAIT]` Messages texte, media, audio, reactions, edition, suppression, traduction et messages programmes.
- `[FAIT]` Pagination initiale des messages avec `limit` et chargement des anciens messages via `before`.
- `[FAIT]` Invitations, contacts, blocage/deblocage et conversations archivees/supprimees.
- `[FAIT]` Appels audio/video avec Agora, etat actif, join/answer/decline/end/leave/ping.
- `[FAIT]` Statuts/stories avec media, vues, reactions et replies.
- `[FAIT]` Taches de conversation/projets et taches personnelles.
- `[FAIT]` Notifications frontend et sons.
- `[FAIT]` Presence en ligne et typing via Socket.IO.

### Corrections Production Deja Faites

- `[FAIT]` Roadmap production creee puis remplacee par ce document.
- `[FAIT]` CORS backend rendu configurable via `FRONTEND_URLS` / `FRONTEND_URL`.
- `[FAIT]` Indexes MongoDB elargis et script d'indexes ajoute.
- `[FAIT]` Logs Socket.IO frontend desactivables avec `NEXT_PUBLIC_DEBUG_SOCKET`.
- `[FAIT]` Navigation chat amelioree avec layout persistant pour `/chat`.
- `[FAIT]` Prechargement de routes/conversations principales cote frontend.
- `[FAIT]` Correction d'un `setState` pendant rendu dans la page profil.
- `[FAIT]` Gestion silencieuse du cas Agora `410` pour appels deja termines.
- `[FAIT]` `ProtectedMainLayout` introduit et applique a plusieurs pages principales.
- `[FAIT]` Cache memoire TTL pour les conversations de sidebar.
- `[FAIT]` Refactor progressif de `Sidebar.jsx`: hooks et composants extraits.
- `[FAIT]` Extraction de helpers d'affichage conversation.
- `[FAIT]` Rate limiting sur auth, OTP, reset password, messages, recherches, invitations, uploads et appels Agora.
- `[FAIT]` Helmet et compression HTTP ajoutes au backend.
- `[FAIT]` Validation API ajoutee sur routes messages et Agora.
- `[FAIT]` Correction de plusieurs routes messages pour eviter la capture par `/:conversationId`.
- `[FAIT]` Correction du payload typing socket frontend.
- `[FAIT]` Protection partielle contre double envoi des messages programmes via claim.

## 3. Audit Architecture Globale

### Etat Actuel

- Frontend Next.js avec App Router, React 19, beaucoup de composants `use client`.
- Backend Express 5, MongoDB/Mongoose, Socket.IO, Agora, Cloudinary, Multer.
- Temps reel centralise dans Socket.IO mais pas encore scalable multi-instance.
- Beaucoup de logique metier directement dans controllers/routes.
- Pas de vraie couche service/repository uniforme.
- Pas de tests automatises visibles.
- Pas de CI/CD visible.
- Pas de monitoring applicatif visible.

### Points Forts

- Produit deja riche et coherent autour de la messagerie.
- Separation frontend/backend claire.
- Socket.IO deja integre.
- Cloudinary deja utilise pour plusieurs uploads.
- Debut de cache frontend conversations.
- Debut de pagination messages.
- Debut de validation API et rate limiting.
- Roadmap et approche production deja en place.

### Faiblesses Structurelles

- `[A REVOIR]` Gros fichiers frontend: `ChatHeader.jsx`, `MessageBubble.jsx`, `settings/page.jsx`, `status/page.js`, `chat/[id]/page.jsx`, `VideCall.jsx`, `Callcontext.jsx`.
- `[A REVOIR]` Gros fichiers backend: `messageController.js`, `agoraRoutes.js`, `socketHandler.js`, `messageSettingsController.js`, `authController.js`.
- `[A REVOIR]` Routes et controllers melangent validation, permissions, DB, socket events et reponses HTTP.
- `[A REVOIR]` Deux zones d'appel semblent exister: `agoraRoutes.js` et `agoraController.js`; clarifier et supprimer duplication morte.
- `[A REVOIR]` Plusieurs routes contiennent des handlers inline directement dans les fichiers routes.
- `[A REVOIR]` Beaucoup de `console.log` en production potentielle.
- `[A REVOIR]` Certains fichiers ont des caracteres encodes/corrompus dans commentaires/logs.
- `[A FAIRE]` Contrats API documentes et versionnes.
- `[A FAIRE]` Strategie d'erreurs uniforme.

## 4. Audit Fonctionnel

### Fonctionnalites Actuelles

- Authentification et OTP.
- Conversations, contacts, invitations.
- Groupes et gestion basique.
- Chat temps reel.
- Messages media, audio, reactions, traduction, edition, suppression.
- Messages programmes.
- Appels audio/video.
- Statuts/stories.
- Blocage, mute, archive, suppression conversation pour utilisateur.
- Taches personnelles et taches/projets de conversation.
- Profil, preferences, confidentialite.
- Notifications et sons.

### Fonctionnalites Manquantes Ou Incompletes

#### Messagerie

- `[P0][PARTIEL]` Pagination messages: existe, mais UX "charger plus" doit etre transformee en scroll haut fluide si necessaire.
- `[P0][A FAIRE]` Virtualisation des longues conversations.
- `[P0][A FAIRE]` Retry d'envoi de message en cas d'echec.
- `[P0][A FAIRE]` Etat clair: envoi en cours, envoye, echoue, retry.
- `[P1][A FAIRE]` Brouillons par conversation.
- `[P1][A FAIRE]` Messages favoris/epingles.
- `[P1][A FAIRE]` Recherche par type: images, documents, liens, audio, video.
- `[P1][A FAIRE]` Recherche par date ou participant.
- `[P1][A REVOIR]` Reponses/threading: rendre le modele et l'UI plus coherents.
- `[P1][A REVOIR]` Reactions: UX et permissions a fiabiliser.
- `[P1][A REVOIR]` Messages programmes: mieux integrer dans l'UI, historique, edition, annulation, erreurs.

#### Notifications

- `[P0][A FAIRE]` Notifications hors ligne via Web Push ou app mobile future.
- `[P0][A FAIRE]` Preferences par conversation: mute 1h, 8h, toujours.
- `[P0][A FAIRE]` Compteur global non lu verifie cote backend.
- `[P1][A FAIRE]` Notifications fiables sur appels manques, invitations, mentions, taches.
- `[P1][A FAIRE]` Centre de notifications.

#### Appels Audio/Video

- `[P0][PARTIEL]` Etats d'appel existants mais a formaliser: initiated, ringing, ongoing, missed, declined, ended, expired, cancelled, busy.
- `[P0][A REVOIR]` Eviter tous les appels fantomes apres refresh ou changement d'onglet.
- `[P0][A REVOIR]` Reprise apres refresh: synchronisation backend/frontend plus stricte.
- `[P0][A FAIRE]` Monitoring Agora: erreur token, join fail, track fail, network fail.
- `[P1][A FAIRE]` Service backend dedie Agora au lieu de grosse route.
- `[P1][A FAIRE]` Statistiques appels: duree, echecs, taux de join, taux de decline.

#### Groupes

- `[P0][A REVOIR]` Roles: admin, moderateur, membre.
- `[P0][A REVOIR]` Permissions: ajouter, supprimer, changer nom/image, gerer roles.
- `[P1][A FAIRE]` Invitation par lien.
- `[P1][A FAIRE]` Historique des actions groupe.
- `[P1][A FAIRE]` Quitter/supprimer/archiver groupe avec UX claire.

#### Statuts/Stories

- `[P1][A REVOIR]` Pagination et nettoyage des statuts expires.
- `[P1][A REVOIR]` Prechargement media et UX mobile.
- `[P1][A FAIRE]` Confidentialite par audience.
- `[P1][A FAIRE]` Replies aux statuts mieux integrees au chat.

#### Taches

- `[P1][A REVOIR]` Clarifier taches personnelles vs taches de conversation.
- `[P1][A REVOIR]` Clarifier projets, listes, assignations, permissions.
- `[P1][A FAIRE]` Notifications de taches.
- `[P2][A FAIRE]` Filtres avances, commentaires, fichiers attaches, echeances recurrentes.

#### Admin Et Moderation

- `[P0][A FAIRE]` Dashboard admin minimal.
- `[P0][A FAIRE]` Gestion utilisateurs, suspension, suppression.
- `[P0][A FAIRE]` Signalement utilisateur/message/fichier.
- `[P1][A FAIRE]` Moderation fichiers/messages.
- `[P1][A FAIRE]` Logs d'activite admin.

#### Donnees Utilisateur

- `[P0][A FAIRE]` Suppression de compte.
- `[P0][A FAIRE]` Export des donnees utilisateur.
- `[P0][A FAIRE]` Deconnexion de tous les appareils.
- `[P1][A FAIRE]` Sessions actives et historique de connexions.

## 5. Audit UI/UX

### Probleme Principal

L'application est fonctionnelle, mais elle doit devenir previsible. Pour des milliers d'utilisateurs, la UX doit gerer parfaitement: chargement, erreur, reseau lent, refresh, permissions, pages vides, actions en cours, echec d'upload, echec d'appel, message non envoye.

### A Corriger En Priorite

- `[P0][A FAIRE]` Loading states homogenes sur chat, contacts, statuts, settings, profil, appels.
- `[P0][A FAIRE]` Error states par zone: chat, appel, sidebar, profil, settings.
- `[P0][A FAIRE]` Empty states utiles: aucune conversation, aucun contact, aucun statut, aucune tache.
- `[P0][A FAIRE]` Feedback sur actions longues: upload, envoi message, creation groupe, appel.
- `[P0][A FAIRE]` Retry visible pour message/upload echoue.
- `[P0][A FAIRE]` Indicateur de connexion/reconnexion socket.
- `[P0][A FAIRE]` Gestion offline minimale: "hors ligne", "reconnexion", "action en attente".
- `[P1][A FAIRE]` Skeletons coherents.
- `[P1][A REVOIR]` Navigation mobile: sidebar, chat, header, panels, modals.
- `[P1][A REVOIR]` Hierarchie visuelle settings/profil/taches.
- `[P1][A REVOIR]` Accessibilite: focus visible, labels, aria, navigation clavier.
- `[P1][A FAIRE]` Design system minimal: boutons, inputs, modals, toasts, menus, tabs.

### UX Chat

- `[P0][A FAIRE]` Garder position scroll au retour conversation.
- `[P0][A FAIRE]` Ne pas recharger toute la page lors du changement de discussion.
- `[P0][PARTIEL]` Layout chat persistant commence, mais a generaliser.
- `[P0][A FAIRE]` Virtualiser messages longs.
- `[P0][A FAIRE]` Message composer stable sur mobile.
- `[P1][A FAIRE]` Apercu media/document avant envoi.
- `[P1][A FAIRE]` Menu message plus clair: copier, repondre, edit, delete, react, details.

### UX Appels

- `[P0][A FAIRE]` Ecran d'appel robuste sur permission camera/micro refusee.
- `[P0][A FAIRE]` Messages clairs pour appel termine, occupe, rate, reseau faible.
- `[P0][A FAIRE]` Boutons d'appel non cliquables si un appel est deja en cours.
- `[P1][A FAIRE]` Mini-player ou retour chat pendant appel.

## 6. Audit Frontend

### Architecture Frontend

- `[P0][PARTIEL]` `ProtectedMainLayout` existe, mais doit devenir un vrai route group Next.js pour toutes les pages connectees.
- `[P0][PARTIEL]` Sidebar refactoree en partie; garder `Sidebar.jsx` comme assembleur simple.
- `[P0][A REVOIR]` `ChatHeader.jsx` est trop gros et doit etre decoupe.
- `[P0][A REVOIR]` `MessageBubble.jsx` est trop gros et doit etre decoupe.
- `[P0][A REVOIR]` `Callcontext.jsx` et `VideCall.jsx` contiennent trop de logique temps reel, UI et Agora.
- `[P1][A REVOIR]` `settings/page.jsx`, `personal-tasks/page.jsx`, `status/page.js`, `Contacts.jsx` sont trop gros.
- `[P1][A FAIRE]` Reduire les `"use client"` quand possible.
- `[P1][A FAIRE]` Isoler les composants lourds avec dynamic import: appels, media viewer, settings avances, camera capture.

### Etat Et Data Fetching

- `[P0][PARTIEL]` Cache conversations en memoire existe.
- `[P0][A FAIRE]` Ajouter cache messages par conversation.
- `[P0][A FAIRE]` Remplacer progressivement les fetchs manuels par React Query ou SWR.
- `[P0][A FAIRE]` Invalidation propre apres message, invitation, contact, statut, tache.
- `[P0][A FAIRE]` Eviter les refetchs globaux au moindre evenement socket.
- `[P1][A FAIRE]` Optimistic updates pour messages et reactions.

### Performance Frontend

- `[P0][A FAIRE]` Mesurer bundle avec `next build` et analyzer.
- `[P0][A FAIRE]` Virtualiser messages et listes longues.
- `[P0][A FAIRE]` Memoization ciblee des listes et message bubbles.
- `[P0][A FAIRE]` Eviter re-render global via contexts trop larges.
- `[P1][A FAIRE]` Lazy load composants appels/media/settings.
- `[P1][A FAIRE]` Optimiser images: tailles, placeholders, CDN.
- `[P1][A FAIRE]` Supprimer logs de debug frontend ou les rendre conditionnels.

### Qualite Frontend

- `[P0][A FAIRE]` Error boundaries par zone: chat, appels, profil, settings, taches.
- `[P0][A FAIRE]` Tests E2E navigation/chat/appels basiques.
- `[P1][A FAIRE]` Tests composants critiques: MessageInput, MessageBubble, Sidebar, Call UI.
- `[P1][A FAIRE]` Storybook ou documentation composants si l'UI grandit.

## 7. Audit Backend

### Architecture Backend

- `[P0][A REVOIR]` Separer routes, controllers, services, validators, repositories.
- `[P0][PARTIEL]` Validation API commencee, mais doit couvrir toutes les routes.
- `[P0][PARTIEL]` Rate limiting ajoute, mais en memoire seulement.
- `[P0][A REVOIR]` Controllers trop gros: messages, auth, message settings, status, group.
- `[P0][A REVOIR]` `agoraRoutes.js` doit devenir route + controller + service.
- `[P1][A REVOIR]` Handlers inline dans routes a extraire.
- `[P1][A FAIRE]` Normaliser format des reponses API: `{ success, data, error }`.
- `[P1][A FAIRE]` Normaliser codes HTTP et messages d'erreur.

### API Et Validation

- `[P0][FAIT]` Validation params/query sur messages et Agora.
- `[P0][A FAIRE]` Validation body sur messages: content, type, fileUrl, replyTo, reactions, schedule.
- `[P0][A FAIRE]` Validation uploads: type, extension, taille, nom, nombre.
- `[P0][A FAIRE]` Validation auth/profile/settings.
- `[P0][A FAIRE]` Validation contacts/invitations/groupes/taches/statuts.
- `[P0][A FAIRE]` Verifier permissions sur chaque route privee.
- `[P1][A FAIRE]` Utiliser Zod/Joi/express-validator si l'equipe veut un schema standard.

### Logs Et Erreurs

- `[P0][A REVOIR]` Remplacer `console.log` massif par logger structure: pino/winston.
- `[P0][A FAIRE]` Masquer logs sensibles: email, token, headers, fichiers, contenu message.
- `[P0][A FAIRE]` Middleware d'erreur global plus propre.
- `[P0][A FAIRE]` Correlation ID par requete.
- `[P1][A FAIRE]` Logs par niveau: debug/info/warn/error.

### Uploads

- `[P0][PARTIEL]` Rate limiting uploads existe.
- `[P0][A FAIRE]` Validation stricte type/taille/extension par endpoint.
- `[P0][A FAIRE]` Nettoyage garanti des fichiers temporaires.
- `[P0][A FAIRE]` Stockage unique Cloudinary/S3, eviter melange local/cloud.
- `[P0][A FAIRE]` Scan antivirus ou moderation si public.
- `[P1][A FAIRE]` Suppression des fichiers orphelins Cloudinary.
- `[P1][A FAIRE]` Signed URLs si fichiers prives.

### Temps Reel Socket.IO

- `[P0][A REVOIR]` Rooms a formaliser: user, conversation, call, status, task.
- `[P0][A FAIRE]` Eviter listeners dupliques cote frontend et backend.
- `[P0][A FAIRE]` Acknowledgements pour events critiques: message, call, invitation.
- `[P0][A FAIRE]` Rate limiting socket.
- `[P0][A FAIRE]` Redis adapter Socket.IO pour multi-instance.
- `[P1][A FAIRE]` Presence robuste avec TTL/heartbeat.
- `[P1][A FAIRE]` Event contracts documentes.

## 8. Audit Donnees Et MongoDB

### Modeles Existants

- User
- Conversation
- Message
- Invitation
- Contact
- BlockedUser
- Status
- Call
- Task / Project
- PersonalTask / PersonalTaskList

### Risques Donnees

- `[P0][A FAIRE]` Verifier tous les indexes avec `explain()`.
- `[P0][PARTIEL]` Indexes elargis, mais a confirmer sur production.
- `[P0][A FAIRE]` Pagination conversations, contacts, statuts, notifications, taches.
- `[P0][A FAIRE]` Eviter requetes N+1 via populate non controle.
- `[P0][A FAIRE]` Nettoyer appels expires, statuts expires, fichiers orphelins.
- `[P0][A FAIRE]` TTL indexes pour donnees temporaires: OTP, reset codes, sessions, statuts expires, appels expires si pertinent.
- `[P0][A FAIRE]` Backups MongoDB automatiques.
- `[P0][A FAIRE]` Strategie de migration de schema.
- `[P1][A FAIRE]` Archivage messages anciens si volume tres grand.
- `[P1][A FAIRE]` Denormalisation controlee pour compteurs non lus.

### Collections A Surveiller

- `messages`: volume principal, pagination/virtualisation obligatoires.
- `conversations`: lastMessage, participants, unread, archive/delete states.
- `statuses`: expiration et media.
- `calls`: si modele dedie utilise plus tard.
- `contacts`: duplication relationnelle a verifier.
- `tasks`: permissions et index par conversation/projet.

## 9. Audit Securite

### Deja Fait

- `[FAIT]` CORS configurable.
- `[FAIT]` Helmet ajoute.
- `[FAIT]` Rate limiting sensible ajoute partiellement.
- `[FAIT]` Validation API commencee.
- `[FAIT]` Auth middleware sur routes principales.

### P0 Securite

- `[P0][A FAIRE]` Remplacer stockage token localStorage par cookies HTTP-only ou strategie plus sure.
- `[P0][A FAIRE]` Ajouter refresh tokens et rotation.
- `[P0][A FAIRE]` Sessions actives et deconnexion de tous les appareils.
- `[P0][A FAIRE]` Validation complete de tous les body/params/query/files.
- `[P0][A FAIRE]` Permissions exhaustives sur groupes, messages, fichiers, statuts, taches.
- `[P0][A FAIRE]` Proteger uploads contre fichiers dangereux.
- `[P0][A FAIRE]` Supprimer les logs sensibles.
- `[P0][A FAIRE]` Audit dependances: `npm audit` et upgrades prudents.
- `[P0][A FAIRE]` Secrets: verifier `.env`, jamais commiter secrets, rotation si fuite.
- `[P0][A FAIRE]` Ajouter `trust proxy` correctement si deploiement derriere proxy, sinon IP rate limiting peut etre faux.
- `[P0][A FAIRE]` Limiter taille body par route, pas seulement global.

### P1 Securite

- `[P1][A FAIRE]` 2FA mieux structuree et configurable.
- `[P1][A FAIRE]` Logs de securite: login fail, reset, changement email/password, blocage.
- `[P1][A FAIRE]` Detection abuse: spam messages, invitations, uploads, appels.
- `[P1][A FAIRE]` Signalement et moderation.

## 10. Audit Infrastructure

### Etat Actuel

- Backend Express demarrable via `npm run dev`/`start`.
- Frontend Next.js via `npm run dev`/`build`.
- Pas de CI visible.
- Pas de configuration multi-environnement visible.
- Pas de Docker visible.
- Pas de monitoring visible.

### P0 Infrastructure

- `[P0][A FAIRE]` Staging et production separes.
- `[P0][A FAIRE]` Variables d'environnement documentees.
- `[P0][A FAIRE]` CI GitHub Actions: lint, build frontend, node --check backend, tests.
- `[P0][A FAIRE]` Deploiement frontend: Vercel ou equivalent.
- `[P0][A FAIRE]` Deploiement backend: Render/Fly/Railway/AWS selon budget.
- `[P0][A FAIRE]` MongoDB Atlas production avec backups.
- `[P0][A FAIRE]` Stockage media Cloudinary/S3 avec quotas.
- `[P0][A FAIRE]` HTTPS obligatoire.
- `[P0][A FAIRE]` Health check backend.
- `[P0][A FAIRE]` Strategie rollback.

### P1 Infrastructure

- `[P1][A FAIRE]` Redis pour Socket.IO adapter et rate limiting distribue.
- `[P1][A FAIRE]` Queue jobs: messages programmes, notifications, nettoyage media.
- `[P1][A FAIRE]` Dockerfile backend/frontend si besoin.
- `[P1][A FAIRE]` CDN images/videos.
- `[P1][A FAIRE]` Load testing: k6/Artillery.

## 11. Audit Observabilite

### P0

- `[P0][A FAIRE]` Sentry frontend.
- `[P0][A FAIRE]` Sentry backend.
- `[P0][A FAIRE]` Logs structures backend.
- `[P0][A FAIRE]` Suivi erreurs 4xx/5xx.
- `[P0][A FAIRE]` Suivi temps reponse API.
- `[P0][A FAIRE]` Alertes: erreurs 500, latence haute, Mongo down, uploads fail, Agora fail.

### P1

- `[P1][A FAIRE]` Metriques Socket.IO: connexions, rooms, disconnects, reconnects.
- `[P1][A FAIRE]` Metriques produit: messages envoyes, appels echoues, uploads echoues.
- `[P1][A FAIRE]` Tracing des requetes lentes.
- `[P1][A FAIRE]` Dashboard production.

## 12. Audit Tests Et Qualite

### Etat Actuel

- Tests automatises non visibles dans la structure inspectee.
- Lint frontend existe via `npm run lint`.
- Backend n'a pas de script test visible.

### Tests P0

- `[P0][A FAIRE]` Tests backend auth: register, login, OTP, reset.
- `[P0][A FAIRE]` Tests backend messages: send, list, pagination, delete, edit, schedule.
- `[P0][A FAIRE]` Tests backend permissions: messages, conversations, groupes.
- `[P0][A FAIRE]` Tests backend invitations/contacts/block.
- `[P0][A FAIRE]` Tests backend Agora: token, initiate, join, end, expired.
- `[P0][A FAIRE]` Tests upload: types invalides, taille, absence fichier.
- `[P0][A FAIRE]` E2E Playwright: login, ouvrir chat, envoyer message, changer conversation.

### Qualite P1

- `[P1][A FAIRE]` Pre-commit lint/format.
- `[P1][A FAIRE]` TypeScript progressif ou JSDoc strict sur zones critiques.
- `[P1][A FAIRE]` Documentation API.
- `[P1][A FAIRE]` Conventions de commits/branches.

## 13. Plan Prioritaire P0

### Sprint 1: Stabilite Backend Critique

1. `[A FAIRE]` Continuer validation API: body messages, uploads, auth/profile, invitations, groupes, taches.
2. `[A FAIRE]` Remplacer logs sensibles par logger structure.
3. `[A FAIRE]` Normaliser erreurs API.
4. `[A FAIRE]` Verifier permissions route par route.
5. `[A FAIRE]` Audit dependances et corriger vulnerabilites sans casser.

### Sprint 2: Chat Performance Et UX

1. `[A FAIRE]` Cache messages par conversation.
2. `[A FAIRE]` Virtualiser liste messages.
3. `[A FAIRE]` Preserver scroll et eviter rechargements visibles.
4. `[A FAIRE]` Loading/error/empty states chat.
5. `[A FAIRE]` Retry message/upload echoue.

### Sprint 3: Architecture Frontend

1. `[A FAIRE]` Vrai route group Next.js pour pages connectees.
2. `[A FAIRE]` Decouper `ChatHeader.jsx`.
3. `[A FAIRE]` Decouper `MessageBubble.jsx`.
4. `[A FAIRE]` Decouper `Callcontext.jsx` / `VideCall.jsx`.
5. `[A FAIRE]` Reduire re-renders via contexts plus petits.

### Sprint 4: Temps Reel Et Appels

1. `[A FAIRE]` Formaliser rooms Socket.IO.
2. `[A FAIRE]` Ajouter acknowledgements events critiques.
3. `[A FAIRE]` Ajouter Redis adapter Socket.IO.
4. `[A FAIRE]` Nettoyage robuste appels fantomes.
5. `[A FAIRE]` Monitoring erreurs Agora.

### Sprint 5: Securite Et Infrastructure

1. `[A FAIRE]` Cookies HTTP-only / refresh tokens.
2. `[A FAIRE]` Sessions actives.
3. `[A FAIRE]` Backups MongoDB.
4. `[A FAIRE]` CI GitHub Actions.
5. `[A FAIRE]` Sentry frontend/backend.

## 14. Plan P1

- `[A FAIRE]` React Query/SWR generalise.
- `[A FAIRE]` Notifications push.
- `[A FAIRE]` Recherche globale avancee.
- `[A FAIRE]` Dashboard admin.
- `[A FAIRE]` Moderation/signalement.
- `[A FAIRE]` Uploads robustes avec nettoyage orphelins.
- `[A FAIRE]` WebSocket/Socket abuse protection.
- `[A FAIRE]` Load testing.
- `[A FAIRE]` Documentation API et architecture.

## 15. Plan P2

- `[A FAIRE]` Mode offline partiel.
- `[A FAIRE]` Queue locale de messages.
- `[A FAIRE]` Mentions groupes.
- `[A FAIRE]` Messages epingles/favoris avances.
- `[A FAIRE]` Admin analytics.
- `[A FAIRE]` Moderation automatique media.
- `[A FAIRE]` App mobile si strategie produit.

## 16. Definition D'Une Version Prete Pour Des Milliers D'Utilisateurs

PrimAzul peut etre considere pret pour plusieurs milliers d'utilisateurs quand:

- les messages, conversations, contacts, statuts et taches sont pagines;
- les listes longues sont virtualisees;
- les appels fantomes sont impossibles ou automatiquement nettoyes;
- Socket.IO utilise Redis adapter en production multi-instance;
- le rate limiting est distribue via Redis ou equivalent;
- les fichiers sont stockes hors serveur local avec validation stricte;
- l'auth utilise refresh tokens/cookies HTTP-only ou une strategie equivalente;
- les permissions sont testees;
- les erreurs sont monitorables dans Sentry;
- les logs backend sont structures et sans donnees sensibles;
- MongoDB a indexes verifies et backups automatiques;
- CI bloque les builds casses;
- les pages connectees partagent un layout stable;
- le chat reste fluide sur longues conversations;
- l'utilisateur voit toujours un etat clair: chargement, erreur, hors ligne, retry.

## 17. Prochaines Actions Recommandees

Ordre recommande a partir de maintenant:

1. `[P0]` Ajouter validation body messages et uploads.
2. `[P0]` Remplacer les logs de debug par un logger structure et des flags.
3. `[P0]` Ajouter error boundaries frontend.
4. `[P0]` Ajouter cache messages par conversation.
5. `[P0]` Virtualiser les messages.
6. `[P0]` Ajouter CI minimale.
7. `[P0]` Ajouter Sentry.

Note operationnelle: le disque local est tres bas. Avant de lancer beaucoup de builds, tests ou installations, liberer plusieurs Go d'espace.
