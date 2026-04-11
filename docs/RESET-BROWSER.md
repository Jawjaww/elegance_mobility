# Reset Cache Navigateur - Arrêter la Boucle Infinie

## 🛑 Pour arrêter la boucle IMMÉDIATEMENT

### Chrome / Edge / Firefox

1. **Ouvrez les DevTools** (F12)
2. **Onglet Application** (Chrome/Edge) ou **Stockage** (Firefox)
3. **Vider tout :**
   - Cookies → clic droit → "Clear"
   - Local Storage → clic droit → "Clear"
   - Session Storage → clic droit → "Clear"

4. **OU raccourci clavier :**
   ```
   Ctrl + Shift + R (hard refresh)
   ```
   ou
   ```
   Ctrl + F5
   ```

5. **Si ça ne marche pas :**
   ```
   F12 → Console → tapez :
   localStorage.clear();
   sessionStorage.clear();
   document.cookie.split(";").forEach(function(c) { 
     document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
   });
   location.href = '/';
   ```

### URL directe pour reset

Ouvrez dans un nouvel onglet privé :
```
http://localhost:3000/auth/logout
```

Puis :
```
http://localhost:3000/auth/login
```

## ✅ Après le reset

1. Arrêtez le serveur : `Ctrl + C`
2. Redémarrez : `npm run dev`
3. Allez à : `http://localhost:3000/auth/login`
4. Connectez-vous

## 🔧 Si le problème persiste

Modifiez l'URL manuellement pendant la boucle :
```
http://localhost:3000/auth/logout
```

Ou arrêtez le serveur, modifiez le code pour commenter la redirection, redémarrez.
