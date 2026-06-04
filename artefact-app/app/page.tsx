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
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {

    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setIsLoading(false);
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/confirm`,
    },
  });
};

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-white flex flex-col items-center justify-center antialiased">
        <div className="w-10 h-10 border-4 border-slate-100 border-t-[#9A0458] rounded-full animate-spin mb-2"></div>
        <p className="text-slate-400 text-xs font-medium">Carregando laboratório...</p>
      </main>
    );
  }


  if (user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row antialiased font-sans">
        <aside className="w-full md:w-64 bg-white border-r border-slate-100 flex flex-col justify-between p-6 shrink-0">
          <div>
            <div className="mb-8">
              <h2 className="text-xl font-bold text-[#9A0458] tracking-tight">EchoGarden</h2>
              <span className="text-[11px] font-medium text-slate-400 block -mt-0.5">Empathetic Forensics</span>
            </div>
            <nav className="space-y-1">
              {[
                { id: "dashboard", label: "Dashboard", icon: "📊" },
                { id: "garden", label: "My Garden", icon: "🌱" },
                { id: "discover", label: "Discover", icon: "🧭" },
                { id: "settings", label: "Settings", icon: "⚙️" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center px-4 py-3 rounded-xl font-medium text-sm transition-all duration-150 ${
                    activeTab === item.id ? "bg-[#9A0458] text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span className="mr-3 text-base">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
          <div className="pt-6 border-t border-slate-100 space-y-2">
            <div className="text-xs text-slate-400 truncate px-2">👤 {user.email}</div>
            <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm text-slate-500 hover:text-red-600 font-medium cursor-pointer">
              🚪 Log Out
            </button>
          </div>
        </aside>

        <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Good morning, {user.email?.split("@")[0]}</h1>
          </header>
          <section className="bg-white border-2 border-dashed border-[#9A0458]/30 rounded-3xl p-12 text-center">
            <h3 className="text-xl font-bold text-[#9A0458] mb-2">Drop a design to start a forensic search</h3>
          </section>
        </main>
      </div>
    );
  }


  return (
    <main className="min-h-screen bg-white flex flex-col md:flex-row antialiased overflow-hidden">
      <div 
        className="w-full md:w-1/2 p-12 md:p-24 flex flex-col justify-end relative min-h-[45vh] md:min-h-screen bg-cover bg-center rounded-none md:rounded-r-[24px]"
        style={{ backgroundImage: `url('/EchoGarden.png')` }}
      >
        <div className="relative z-10 text-white select-none hidden md:block">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-2 drop-shadow-sm">EchoGarden</h1>
          <p className="text-white/90 text-sm md:text-lg font-medium tracking-wide">Empathetic Forensics & Design Analysis</p>
        </div>
      </div>

      <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col items-center justify-center bg-white rounded-none md:rounded-l-[24px]">
        <div className="w-full max-w-sm text-center">
          <h2 className="text-4xl font-bold text-black tracking-tight mb-3">Entrar</h2>
          <p className="text-slate-600 text-sm mb-8 max-w-[280px] mx-auto">Acesse sua conta para iniciar uma busca forense visual</p>

          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center bg-white hover:bg-slate-50 text-slate-800 font-medium py-3.5 px-5 border border-slate-200 rounded-xl transition-all duration-200 active:scale-[0.99] shadow-sm text-sm cursor-pointer"
          >
            <GoogleIcon />
            Entrar com o Google
          </button>
        </div>
      </div>
    </main>
  );
}