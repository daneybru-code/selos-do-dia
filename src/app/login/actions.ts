'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

// App interno: não existe cadastro público. Novos usuários (admin ou viewer)
// são criados manualmente via Supabase Auth Admin API / service role — ver
// TASKS.md e o histórico da migração para autenticação.

export async function login(formData: FormData) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  });

  if (error) {
    redirect(`/login?message=${encodeURIComponent('Email ou senha inválidos')}`);
  }

  revalidatePath('/', 'layout');

  // Admin entra direto no painel; viewer vai pra galeria.
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single();

  redirect(profile?.role === 'admin' ? '/admin' : '/');
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}
