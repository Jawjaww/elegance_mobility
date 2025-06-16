# Trigger Supabase : assign_user_role_trigger

## Objectif
Assigner automatiquement le rôle correct (`app_driver`, `app_customer`, `app_admin`) dans `raw_app_meta_data` lors de la création d’un utilisateur, selon la valeur de `portal_type` reçue dans `raw_user_meta_data`.

---

## Fonction SQL
```sql
CREATE OR REPLACE FUNCTION public.assign_user_role_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.raw_user_meta_data ? 'portal_type' THEN
    CASE NEW.raw_user_meta_data->>'portal_type'
      WHEN 'driver' THEN
        NEW.raw_app_meta_data = COALESCE(NEW.raw_app_meta_data, '{}'::jsonb) || '{"role": "app_driver"}'::jsonb;
      WHEN 'customer' THEN
        NEW.raw_app_meta_data = COALESCE(NEW.raw_app_meta_data, '{}'::jsonb) || '{"role": "app_customer"}'::jsonb;
      WHEN 'admin' THEN
        NEW.raw_app_meta_data = COALESCE(NEW.raw_app_meta_data, '{}'::jsonb) || '{"role": "app_admin"}'::jsonb;
      ELSE
        RAISE EXCEPTION 'portal_type non reconnu: %', NEW.raw_user_meta_data->>'portal_type';
    END CASE;
  ELSE
    RAISE EXCEPTION 'portal_type est requis lors de l''inscription.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Points importants
- **Obligatoire** : `portal_type` doit être présent dans les métadonnées utilisateur à l’inscription.
- **Rôles supportés** :
  - `driver` → `app_driver`
  - `customer` → `app_customer`
  - `admin` → `app_admin`
- **Sécurité** : Si `portal_type` est absent ou inconnu, l’inscription échoue avec une erreur explicite.
- **Évolutivité** :
  - Pour ajouter un nouveau rôle, il suffit d’ajouter un nouveau `WHEN` dans le `CASE`.
  - Pour changer la logique, modifiez simplement la fonction.

---

## Maintenance & évolution
- **Pour ajouter un nouveau type de portail** :
  Ajoutez une clause `WHEN` dans le `CASE`.
- **Pour changer le mapping** :
  Modifiez la valeur JSON assignée dans la clause correspondante.
- **Pour forcer une politique stricte** :
  Gardez le `ELSE` qui lève une exception pour tout type inconnu.

---

## Exemple d’appel côté frontend
```js
await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      portal_type: 'driver', // ou 'customer', 'admin'
      // autres champs...
    }
  }
})
```

---

**À conserver dans la documentation technique du projet pour toute évolution future.**
