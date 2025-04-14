-- Politique d'insertion pour les clients
create policy "Customers can create their own rides"
on rides
for insert
with check (
  -- L'utilisateur doit avoir le rôle app_customer et être le propriétaire de la course
  auth.uid() = user_id 
  and 
  auth.role() = 'app_customer'
);

-- Politique de lecture pour les clients
create policy "Customers can view their own rides"
on rides
for select
using (
  -- L'utilisateur doit être le propriétaire de la course
  auth.uid() = user_id 
  and 
  auth.role() = 'app_customer'
);

-- Politique de modification pour les clients
create policy "Customers can update their pending rides"
on rides
for update
using (
  -- L'utilisateur doit être le propriétaire et la course doit être en attente
  auth.uid() = user_id 
  and 
  auth.role() = 'app_customer'
  and 
  status = 'pending'
)
with check (
  -- Empêcher la modification de certains champs
  user_id = auth.uid()
  and
  status = 'pending'
);