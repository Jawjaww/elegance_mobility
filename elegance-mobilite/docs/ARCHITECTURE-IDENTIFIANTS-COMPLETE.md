# 📚 ARCHITECTURE DES IDENTIFIANTS - GUIDE COMPLET

## 🏗️ **Problématique : Double système d'identifiants**

Dans notre architecture, nous avons **2 systèmes d'ID** qui doivent communiquer :

### **1. Supabase Auth** (système d'authentification)
```
auth.users {
  id: "dc62bd52-0ed7-495b-9055-22635d6c5e74"  ← L'utilisateur authentifié
  email: "be.j@icloud.com"
  role: "authenticated"
}
```

### **2. Système métier** (notre logique applicative)
```
public.drivers {
  id: "a4c24faa-f001-4bac-b241-5d543d7fedf0"      ← ID unique du driver (métier)
  user_id: "dc62bd52-0ed7-495b-9055-22635d6c5e74" ← Référence vers auth.users.id
  first_name: "jaw"
  last_name: "ben"
}

public.driver_documents {
  id: "xyz..."
  driver_id: "a4c24faa-f001-4bac-b241-5d543d7fedf0" ← Référence vers drivers.id
  document_type: "vtc_card"
  file_url: "https://..."
}
```

## 🔗 **Chaîne de liaison complète**

```
Utilisateur authentifié → Driver → Documents → Fichiers Storage
     auth.uid()         →  drivers.user_id = auth.uid()  →  driver_documents.driver_id = drivers.id  →  storage filename contient driver_id
```

## 🔒 **Politiques RLS - Architecture sécurisée**

### **A. Table `driver_documents` ✅ CORRECTE**
```sql
"Drivers can manage own documents" 
USING (
  driver_id IN (
    SELECT drivers.id 
    FROM drivers 
    WHERE drivers.user_id = auth.uid()
  )
)
```

**Traduction** : "Un utilisateur peut gérer les documents du driver dont le `user_id` correspond à son `auth.uid()`"

### **B. Storage `storage.objects` ✅ CORRIGÉE**
```sql
"Drivers can upload own documents"
WITH CHECK (
  bucket_id = 'driver-documents' AND
  SPLIT_PART((storage.filename(name)), '_', 1) IN (
    SELECT id::text FROM drivers WHERE user_id = auth.uid()
  )
)
```

**Traduction** : "Un utilisateur peut uploader des fichiers dont le nom commence par son `driver_id`"

## 📁 **Format des fichiers Storage**

### **Format OBLIGATOIRE :**
```
Bucket: driver-documents
Chemin: driver-documents/[DRIVER_ID]_[DOCUMENT_TYPE]_[TIMESTAMP].[EXTENSION]

Exemple:
driver-documents/a4c24faa-f001-4bac-b241-5d543d7fedf0_vtc_card_1753376624510.png
                  └─────────────── DRIVER_ID ──────────────┘ └─ TYPE ─┘ └─ TIME ─┘
```

### **Extraction par RLS :**
```sql
SPLIT_PART(filename, '_', 1) = "a4c24faa-f001-4bac-b241-5d543d7fedf0"
```

## ⚠️ **Erreurs courantes et solutions**

### **1. Upload 403 "new row violates row-level security policy"**

**Cause :** Format de fichier incorrect
```javascript
// ❌ INCORRECT
return `${driverId}/${prefix}_${timestamp}.${extension}`
// Génère: a4c24faa.../vtc_card_123.png

// ✅ CORRECT  
return `driver-documents/${driverId}_${prefix}_${timestamp}.${extension}`
// Génère: driver-documents/a4c24faa..._vtc_card_123.png
```

### **2. Driver-portal ne fonctionne pas, backoffice fonctionne**

**Cause :** Dans driver-portal = rôle `app_driver`, dans backoffice = rôle `app_admin`
- Les politiques RLS pour drivers sont plus strictes
- Les politiques pour admins donnent accès à tout

### **3. Aperçu d'image ne s'affiche pas**

**Cause :** URL signée échoue à cause des politiques RLS
```javascript
// La génération d'URL signée peut échouer si l'utilisateur n'a pas les permissions
const { data, error } = await supabase.storage
  .from('driver-documents')
  .createSignedUrl(filePath, 3600)
```

## 🚀 **Flux de développement**

### **1. Nouveau document :**
1. Utilisateur sélectionne un fichier
2. `generateFileName()` crée le nom avec `driver_id`
3. Upload vers Storage avec politiques RLS
4. Insertion en base avec `driver_documents`

### **2. Affichage document :**
1. Requête `driver_documents` avec `driver_id`
2. Récupération `file_url` depuis la base
3. Génération URL signée si nécessaire
4. Affichage dans l'interface

### **3. Validation des permissions :**
1. `auth.uid()` = utilisateur authentifié
2. Recherche dans `drivers` où `user_id = auth.uid()`
3. Récupération du `driver_id` correspondant
4. Vérification que le document/fichier appartient à ce `driver_id`

## 🔧 **Scripts de maintenance**

- `fix-storage-policy-final.sql` : Corriger les politiques Storage
- `debug-driver-documents-rls.sql` : Diagnostiquer les problèmes RLS
- `test-storage-policy.sql` : Tester les permissions

## 💡 **Points clés à retenir**

1. **Toujours utiliser `driver_id`** dans les noms de fichiers
2. **Format strict** : `driver-documents/[DRIVER_ID]_[TYPE]_[TIMESTAMP].[EXT]`
3. **Politiques RLS strictes** pour la sécurité
4. **Double vérification** : base de données + storage
5. **Rôles différents** = permissions différentes

---

**Cette documentation doit être consultée à chaque modification des upload/storage !** 🎯
