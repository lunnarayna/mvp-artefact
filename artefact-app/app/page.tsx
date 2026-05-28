"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { User } from "@supabase/supabase-js";

const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-3 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);
      setIsLoading(false);
    };

    getUser();
  }, []);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (isLoading) {
    return <main className="min-h-screen bg-white flex items-center justify-center"></main>;
  }

  return (
    <main className="min-h-screen bg-white flex flex-col md:flex-row antialiased overflow-hidden">
      
      <div 
        className="w-full md:w-1/2 p-12 md:p-24 flex flex-col justify-end relative min-h-[45vh] md:min-h-screen bg-cover bg-center rounded-none md:rounded-r-[24px]"
        style={{ 
          backgroundImage: `url('/EchoGarden.png')` 
        }}
      >

        <div className="relative z-10 text-white select-none">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-2 drop-shadow-sm">
            EchoGarden
          </h1>
          <p className="text-white/90 text-sm md:text-lg font-medium tracking-wide drop-shadow-sm">
            Empathetic Forensics & Design Analysis
          </p>
        </div>
      </div>

      <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col items-center justify-center bg-white rounded-none md:rounded-l-[24px]">
        <div className="w-full max-w-sm text-center">
          
          <h2 className="text-4xl font-bold text-black tracking-tight mb-3">
            {user ? "Sua Conta" : "Entrar"}
          </h2>
          
          <p className="text-slate-600 text-sm md:text-base font-normal leading-relaxed mb-8 max-w-[280px] mx-auto">
            {user 
              ? "Você está autenticado no ecossistema forense." 
              : "Acesse sua conta para iniciar uma busca forense visual"
            }
          </p>

          {user ? (
            <div className="flex flex-col gap-4 w-full">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-left">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  Usuário Ativo
                </span>
                <span className="text-slate-800 font-semibold text-sm truncate block">
                  {user.email}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="w-full bg-slate-900 hover:bg-black text-white font-medium py-3.5 px-5 rounded-xl transition-all duration-200 active:scale-[0.99] text-sm cursor-pointer shadow-sm"
              >
                Sair do sistema
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="w-full flex items-center justify-center bg-white hover:bg-slate-50 text-slate-800 font-medium py-3.5 px-5 border border-slate-200 rounded-xl transition-all duration-200 active:scale-[0.99] shadow-sm hover:shadow-md text-sm cursor-pointer"
            >
              <GoogleIcon />
              Entrar com o Google
            </button>
          )}

          <div className="mt-10 text-[11px] text-slate-400 font-normal tracking-wide">
            Protegido por criptografia ponta a ponta via Supabase.
          </div>

        </div>
      </div>

    </main>
  );
}