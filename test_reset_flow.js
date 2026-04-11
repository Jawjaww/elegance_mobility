// Test du flux de réinitialisation de mot de passe Supabase
// Basé sur la documentation officielle

const supabaseAuthFlow = `
Flux de réinitialisation de mot de passe Supabase (PKCE) :

1. resetPasswordForEmail(email, { redirectTo: '...' })
   - Envoie un lien avec code PKCE
   - Le lien pointe vers redirectTo avec paramètres ?code=...&type=recovery

2. Quand l'utilisateur clique sur le lien :
   - La page à redirectTo doit appeler exchangeCodeForSession(code)
   - Cela crée une session temporaire pour la réinitialisation

3. Avec cette session, on peut appeler updateUser({ password: 'newpassword' })

4. Après la mise à jour, la session est invalidée

Problème identifié : exchangeCodeForSession nécessite que le code n'ait pas été utilisé.
Si on obtient "both auth code and code verifier should be non-empty", c'est que :
- Le code a déjà été utilisé (déjà échangé)
- Ou le code verifier n'est pas disponible (session perdue)

Solution alternative : 
- Stocker le code dans l'URL et le passer à update-password
- Utiliser verifyOtp avec type='recovery' au lieu de exchangeCodeForSession
- Puis appeler updateUser avec le token
`;

console.log(supabaseAuthFlow);
