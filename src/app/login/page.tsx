import { login } from './actions';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;

  const bgImage = `/selos/${encodeURIComponent('COPA DO NORDESTE – SPORT X FORTALEZA.png')}`;

  return (
    <div className="min-h-screen flex bg-brand-dark">
      {/* Coluna do formulário */}
      <div className="w-full md:w-[440px] lg:w-[480px] flex flex-col justify-between px-8 py-10 sm:px-12">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Globo Esporte" className="h-8 w-fit object-contain" />

        <div className="w-full max-w-sm mx-auto">
          <h1 className="font-heading italic text-white text-2xl font-black uppercase tracking-widest mb-1">
            Entrar
          </h1>
          <p className="text-gray-400 text-sm mb-8">
            Acesse sua conta para gerenciar os selos do dia
          </p>

          <form className="flex flex-col gap-4">
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 6-10 7L2 6" />
                </svg>
              </span>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Email"
                required
                autoFocus
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#2a2a2a] text-white outline-none border-2 border-transparent transition-colors focus:border-white/20"
              />
            </div>

            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="11" width="18" height="10" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Senha"
                required
                minLength={6}
                className={`w-full pl-11 pr-4 py-3 rounded-xl bg-[#2a2a2a] text-white outline-none border-2 transition-colors ${
                  message ? 'border-brand-red' : 'border-transparent'
                }`}
              />
            </div>

            {message && (
              <p className="text-red-400 text-sm text-center -mt-1">{message}</p>
            )}

            <button
              formAction={login}
              className="w-full py-3 rounded-xl font-bold text-white uppercase tracking-wider transition-all hover:opacity-90 active:scale-95 bg-[linear-gradient(135deg,var(--color-brand-red),var(--color-brand-orange),var(--color-brand-yellow))]"
            >
              Entrar
            </button>

            <details className="text-center mt-1">
              <summary className="text-gray-500 text-xs cursor-pointer list-none hover:text-gray-300 transition-colors">
                Esqueci minha senha
              </summary>
              <p className="text-gray-600 text-xs mt-2">
                Fale com o administrador para redefinir sua senha.
              </p>
            </details>
          </form>
        </div>

        <p className="text-gray-700 text-xs text-center md:text-left">
          Globo Esporte · Uso interno
        </p>
      </div>

      {/* Coluna visual */}
      <div
        className="hidden md:block relative flex-1 bg-cover bg-center"
        style={{ backgroundImage: `url('${bgImage}')` }}
      >
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.85)_0%,rgba(0,0,0,0.15)_45%,transparent_70%)]" />
        <div className="absolute bottom-10 left-10 right-10">
          <p className="text-white text-2xl font-bold leading-snug max-w-md">
            Selos do dia, sempre à mão.
          </p>
          <p className="text-gray-300 text-sm mt-2 max-w-sm">
            Acompanhe e organize os selos de cada partida do Globo Esporte em um só lugar.
          </p>
        </div>
      </div>
    </div>
  );
}
