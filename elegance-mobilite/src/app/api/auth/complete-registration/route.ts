import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, name, email } = body;
    
    if (!userId || !name) {
      return NextResponse.json(
        { error: "Informations utilisateur manquantes" },
        { status: 400 }
      );
    }
    
    // Créer un client Supabase côté serveur qui contourne le RLS
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Utiliser la clé de service qui a un accès complet
      {
        cookies: {
          get(name) {
            return cookies().get(name)?.value;
          },
          set(name, value, options) {
            cookies().set({ name, value, ...options });
          },
          remove(name, options) {
            cookies().delete({ name, ...options });
          }
        }
      }
    );
    
    // Insérer dans la table users avec la clé de service qui ignore les restrictions RLS
    const { error: usersError } = await supabase
      .from('users')
      .insert({
        id: userId,
        role: 'client',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
    if (usersError) {
      console.error("Erreur lors de l'insertion dans users:", usersError);
      return NextResponse.json(
        { error: "Erreur lors de la création du profil utilisateur" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur serveur:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de l'inscription" },
      { status: 500 }
    );
  }
}
