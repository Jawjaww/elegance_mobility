Pour gérer la suppression d'un utilisateur dans auth.users tout en s'assurant que les enregistrements associés dans public.users et public.drivers sont également supprimés, vous pouvez utiliser une approche avec un trigger qui supprime d'abord les enregistrements associés avant de supprimer l'utilisateur.

Cependant, il est important de noter que vous ne pouvez pas directement supprimer un utilisateur de auth.users si des enregistrements dans d'autres tables dépendent de cet utilisateur (en raison des contraintes de clé étrangère). Pour contourner ce problème, vous pouvez utiliser une fonction qui supprime d'abord les enregistrements associés, puis l'utilisateur.

Solution avec une Fonction de Suppression
Voici comment vous pouvez procéder :

Créer une Fonction de Suppression : Cette fonction supprimera d'abord les enregistrements associés dans public.users et public.drivers, puis l'utilisateur dans auth.users.

Appeler cette Fonction lors de la Suppression : Vous pouvez appeler cette fonction manuellement ou via une interface utilisateur.

1. Créer la Fonction de Suppression
Voici la fonction qui gère la suppression :

SQL Query



CREATE OR REPLACE FUNCTION delete_user_and_associated_data(user_id uuid)
RETURNS void AS $$
BEGIN
    -- Supprimer les enregistrements associés dans public.drivers
    DELETE FROM public.drivers WHERE user_id = user_id;

    -- Supprimer les enregistrements associés dans public.users
    DELETE FROM public.users WHERE id = user_id;

    -- Supprimer l'utilisateur de auth.users
    DELETE FROM auth.users WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

2. Appeler la Fonction de Suppression
Vous pouvez appeler cette fonction pour supprimer un utilisateur et toutes ses traces :

SQL Query



SELECT delete_user_and_associated_data('e990e826-708d-4745-b9a1-ba6bd047a673');

3. Utilisation de l'API Supabase
Si vous souhaitez intégrer cela dans votre application, vous pouvez appeler cette fonction via l'API Supabase :

const
 { data, error } = 
await
 supabase
  .rpc(
'delete_user_and_associated_data'
, { 
user_id
: 
'e990e826-708d-4745-b9a1-ba6bd047a673'
 });
if
 (error) {
  
console
.error(
'Erreur lors de la suppression de l\'utilisateur:'
, error.message);
} 
else
 {
  
console
.log(
'Utilisateur et toutes ses traces supprimés avec succès:'
, data);
}

