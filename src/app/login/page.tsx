import { login } from './actions';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ backgroundColor: '#0D0D0D' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ backgroundColor: '#1A1A1A' }}
      >
        {/* Header do card com gradiente */}
        <div
          className="px-8 pt-8 pb-6 flex flex-col items-center gap-3"
          style={{ background: 'linear-gradient(135deg, #CC0000 0%, #FF6600 55%, #FFC200 100%)' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Globo Esporte"
            className="h-12 object-contain"
            style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))' }}
          />
          <h1 className="text-white text-xl font-black uppercase tracking-widest">
            Selos do Dia
          </h1>
        </div>

        {/* Formulário */}
        <div className="px-8 py-7">
          <p className="text-gray-400 text-sm text-center mb-5">
            Entre com sua conta para acessar
          </p>

          <form className="flex flex-col gap-4">
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Email"
              required
              autoFocus
              className="w-full px-4 py-3 rounded-xl text-white outline-none border-2 border-transparent transition-colors focus:border-white/20"
              style={{ backgroundColor: '#2a2a2a' }}
            />

            <input
              id="password"
              name="password"
              type="password"
              placeholder="Senha"
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-xl text-white outline-none border-2 transition-colors"
              style={{
                backgroundColor: '#2a2a2a',
                borderColor: message ? '#CC0000' : 'transparent',
              }}
            />

            {message && (
              <p className="text-red-400 text-sm text-center -mt-1">{message}</p>
            )}

            <button
              formAction={login}
              className="w-full py-3 rounded-xl font-bold text-white uppercase tracking-wider transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #CC0000, #FF6600, #FFC200)' }}
            >
              Entrar
            </button>
          </form>
        </div>
      </div>

      <p className="text-gray-700 text-xs mt-6">Globo Esporte · Uso interno</p>
    </div>
  );
}
