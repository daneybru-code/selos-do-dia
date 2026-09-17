import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Rotas públicas: não exigem sessão autenticada. Tudo mais (galeria, admin,
// rotas de API de upload/exclusão/reordenação etc) exige login — o app é de
// uso interno, não existe mais "senha de visualizador" separada.
// `/auth/confirm` também precisa ser pública: é o link de convite/redefinição
// de senha do Supabase Auth, clicado por quem ainda não tem sessão nenhuma.
// `/i` (link curto de convite, ver src/app/i/[code]/route.ts) pelo mesmo
// motivo: redireciona pro /auth/confirm acima, então também é clicado por
// quem ainda não tem sessão.
const PUBLIC_PATHS = ['/login', '/auth/confirm', '/i'];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Atualiza o token de auth; precisa rodar antes de qualquer Server
  // Component ler a sessão.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Sem sessão: só /login (e assets estáticos, já filtrados pelo matcher)
  // são acessíveis. Qualquer outra rota redireciona pro login.
  if (!user) {
    if (isPublicPath(pathname)) {
      return supabaseResponse;
    }
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    // Marca a intenção quando a origem era /admin, só pra diferenciação
    // visual da tela de login — a checagem real de permissão continua
    // sendo feita abaixo, depois do login, via profiles.role.
    if (pathname === '/admin' || pathname.startsWith('/admin/')) {
      url.searchParams.set('intent', 'admin');
    }
    return NextResponse.redirect(url);
  }

  // Autenticado tentando acessar /login: manda pra galeria.
  if (isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.search = '';
    return NextResponse.redirect(url);
  }

  // /admin exige role 'admin' em public.profiles. A policy de RLS permite
  // que o usuário leia só o próprio perfil (auth.uid() = id), suficiente
  // aqui.
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      url.search = new URLSearchParams({ message: 'Acesso restrito a administradores' }).toString();
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
