Voici une description complète de la structure de votre base de données, y compris les tables, les politiques de sécurité au niveau des lignes (RLS), ainsi que les fonctions et triggers associés. Cela vous donnera une vue d'ensemble de votre schéma de base de données.

1. Structure des Tables
Table auth.users
instance_id: UUID, identifiant d'instance (peut être NULL).
id: UUID, identifiant unique de l'utilisateur (clé primaire).
aud: Chaîne de caractères, audience de l'utilisateur (peut être NULL).
role: Chaîne de caractères, rôle de l'utilisateur (peut être NULL).
email: Chaîne de caractères, adresse email de l'utilisateur (doit être unique).
encrypted_password: Chaîne de caractères, mot de passe chiffré de l'utilisateur.
email_confirmed_at: Timestamp, date de confirmation de l'email (peut être NULL).
invited_at: Timestamp, date d'invitation (peut être NULL).
confirmation_token: Chaîne de caractères, token de confirmation (peut être NULL).
confirmation_sent_at: Timestamp, date d'envoi du token de confirmation (peut être NULL).
recovery_token: Chaîne de caractères, token de récupération (peut être NULL).
recovery_sent_at: Timestamp, date d'envoi du token de récupération (peut être NULL).
email_change_token_new: Chaîne de caractères, token pour le changement d'email (peut être NULL).
email_change: Chaîne de caractères, nouvel email (peut être NULL).
email_change_sent_at: Timestamp, date d'envoi du token de changement d'email (peut être NULL).
last_sign_in_at: Timestamp, date de la dernière connexion de l'utilisateur (peut être NULL).
raw_app_meta_data: JSONB, métadonnées d'application (peut être NULL).
raw_user_meta_data: JSONB, métadonnées utilisateur (peut être NULL).
created_at: Timestamp, date de création de l'utilisateur.
updated_at: Timestamp, date de la dernière mise à jour de l'utilisateur.
phone: Chaîne de caractères, numéro de téléphone (peut être NULL).
phone_confirmed_at: Timestamp, date de confirmation du téléphone (peut être NULL).
phone_change: Chaîne de caractères, changement de téléphone (peut être NULL).
phone_change_token: Chaîne de caractères, token pour le changement de téléphone (peut être NULL).
phone_change_sent_at: Timestamp, date d'envoi du token de changement de téléphone (peut être NULL).
confirmed_at: Timestamp, date de confirmation (générée automatiquement).
email_change_token_current: Chaîne de caractères, token actuel de changement d'email (peut être NULL).
email_change_confirm_status: Petit entier, statut de confirmation du changement d'email (0 par défaut).
banned_until: Timestamp, date jusqu'à laquelle l'utilisateur est banni (peut être NULL).
reauthentication_token: Chaîne de caractères, token de réauthentification (peut être NULL).
reauthentication_sent_at: Timestamp, date d'envoi du token de réauthentification (peut être NULL).
is_sso_user: Booléen, indique si l'utilisateur utilise SSO (par défaut, faux).
deleted_at: Timestamp, date de suppression (peut être NULL).
is_anonymous: Booléen, indique si l'utilisateur est anonyme (par défaut, faux).
Table public.drivers
id: UUID, identifiant unique du conducteur (clé primaire).
user_id: UUID, identifiant de l'utilisateur associé à ce conducteur (doit correspondre à un enregistrement dans la table auth.users).
first_name: Texte, prénom du conducteur (obligatoire).
last_name: Texte, nom de famille du conducteur (obligatoire).
phone: Texte, numéro de téléphone du conducteur (obligatoire).
status: Enum (public.driver_status), statut du conducteur (valeurs possibles : inactive, pending_validation, active, suspended).
avatar_url: Texte, URL de l'avatar du conducteur (peut être NULL).
vehicle_id: UUID, identifiant du véhicule associé au conducteur (peut être NULL).
vtc_card_number: Texte, numéro de la carte VTC (obligatoire).
driving_license_number: Texte, numéro de permis de conduire (obligatoire).
vtc_card_expiry_date: Date, date d'expiration de la carte VTC (obligatoire).
driving_license_expiry_date: Date, date d'expiration du permis de conduire (obligatoire).
insurance_number: Texte, numéro d'assurance (peut être NULL).
insurance_expiry_date: Date, date d'expiration de l'assurance (peut être NULL).
rating: Numérique, note du conducteur (peut être NULL).
total_rides: Entier, nombre total de courses effectuées par le conducteur (par défaut 0).
languages_spoken: Tableau de texte, langues parlées par le conducteur (peut être NULL).
preferred_zones: Tableau de texte, zones préférées du conducteur (peut être NULL).
availability_hours: JSONB, heures de disponibilité du conducteur (peut être NULL).
company_name: Texte, nom de l'entreprise du conducteur (par défaut une chaîne vide).
company_phone: Texte, numéro de téléphone de l'entreprise (par défaut une chaîne vide).
employee_phone: Texte, numéro de téléphone de l'employé (par défaut une chaîne vide).
employee_name: Texte, nom de l'employé (par défaut une chaîne vide).
created_at: Timestamp, date de création de l'enregistrement (par défaut la date et l'heure actuelles).
updated_at: Timestamp, date de la dernière mise à jour de l'enregistrement (par défaut la date et l'heure actuelles).
2. Politiques RLS Actuelles
Politique pour les Conducteurs
Nom: "Users can view their own driver profile"
Action: Sélection (SELECT)
Rôles: public
Condition: auth.uid() = user_id OR auth.role() IN ('app_admin', 'app_super_admin')
Description: Permet aux utilisateurs de voir leur propre profil de conducteur ou aux administrateurs d'accéder à tous les profils.
Politique pour la Mise à Jour du Statut
Nom: "Only admins can update validation status"
Action: Mise à jour (UPDATE)
Rôles: public
Condition:
SQL Query



CASE 
  WHEN NEW.status != OLD.status THEN
    auth.role() IN ('app_admin', 'app_super_admin')
  ELSE
    auth.uid() = user_id OR auth.role() IN ('app_admin', 'app_super_admin')
END

Description: Permet aux administrateurs de mettre à jour le statut des conducteurs, tout en permettant aux conducteurs de mettre à jour leur propre profil.
3. Fonctions et Triggers Associés
Fonction pour Gérer les Nouveaux Utilisateurs
Nom: public.handle_new_signup()
Description: Cette fonction attribue le rôle approprié à un nouvel utilisateur en fonction de l'URL d'inscription.
Trigger pour les Nouveaux Utilisateurs
Nom: on_auth_user_created
Description: Ce trigger appelle la fonction handle_new_signup avant l'insertion d'un nouvel utilisateur dans la table auth.users.

