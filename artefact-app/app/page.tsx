"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

// ── Icons ──────────────────────────────────────────────────────────────────

const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-3 flex-shrink-0" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const UploadIcon = () => (
  <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="m21 21-4.35-4.35" />
  </svg>
);

const BellIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
  </svg>
);

const HelpIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="10" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3m.08 4h.01" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const FigmaIcon = () => (
  <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 24c2.208 0 4-1.792 4-4v-4H8c-2.208 0-4 1.792-4 4s1.792 4 4 4z" fill="#0ACF83"/>
    <path d="M4 12c0-2.208 1.792-4 4-4h4v8H8c-2.208 0-4-1.792-4-4z" fill="#A259FF"/>
    <path d="M4 4c0-2.208 1.792-4 4-4h4v8H8C5.792 8 4 6.208 4 4z" fill="#F24E1E"/>
    <path d="M12 0h4c2.208 0 4 1.792 4 4s-1.792 4-4 4h-4V0z" fill="#FF7262"/>
    <path d="M20 12c0 2.208-1.792 4-4 4s-4-1.792-4-4 1.792-4 4-4 4 1.792 4 4z" fill="#1ABCFE"/>
  </svg>
);

// ── Mock data ──────────────────────────────────────────────────────────────

type SimilarityLevel = "VERY SIMILAR" | "MODERATELY SIMILAR" | "DISTANTLY SIMILAR";

interface MatchCard {
  id: string;
  title: string;
  subtitle: string;
  score: number;
  level: SimilarityLevel;
  bg: string;
  expanded?: boolean;
  colorMatch?: number;
  compMatch?: string;
  assetSource?: string;
}

const ownGardenMocks: MatchCard[] = [
  {
    id: "og1",
    title: "Neo-Brutalism Concept V2",
    subtitle: "Matched from 'Marketing Site 2024'",
    score: 94,
    level: "VERY SIMILAR",
    bg: "bg-slate-100",
    expanded: true,
    colorMatch: 88,
    compMatch: "High · 91%",
    assetSource: "Internal Library",
  },
  {
    id: "og2",
    title: "Gradient Hero",
    subtitle: "Matched from 'Brand Explorations'",
    score: 78,
    level: "MODERATELY SIMILAR",
    bg: "bg-gradient-to-br from-pink-200 to-purple-300",
  },
];

const othersGardenMocks: MatchCard[] = [
  {
    id: "ext1",
    title: "Enterprise Analytics UI",
    subtitle: "Global Archive · User @j_forensics",
    score: 96,
    level: "VERY SIMILAR",
    bg: "bg-slate-800",
  },
  {
    id: "ext2",
    title: "Smart Home Control App",
    subtitle: "Community · Project 'Zen'",
    score: 65,
    level: "DISTANTLY SIMILAR",
    bg: "bg-teal-900",
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────

const levelColors: Record<SimilarityLevel, string> = {
  "VERY SIMILAR": "bg-[#9A0458]/10 text-[#9A0458]",
  "MODERATELY SIMILAR": "bg-amber-50 text-amber-700",
  "DISTANTLY SIMILAR": "bg-slate-100 text-slate-500",
};

const scoreColor = (score: number) =>
  score >= 85 ? "bg-[#9A0458] text-white" : score >= 70 ? "bg-amber-500 text-white" : "bg-slate-400 text-white";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

// ── Sub-components ─────────────────────────────────────────────────────────

function MatchCardComponent({ card }: { card: MatchCard }) {
  const [open, setOpen] = useState(card.expanded ?? false);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 p-3">
        <div className={`w-16 h-16 rounded-xl flex-shrink-0 ${card.bg}`} />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-slate-800 leading-tight truncate">{card.title}</p>
          <p className="text-[11px] text-slate-400 mt-0.5 truncate">{card.subtitle}</p>
          <span className={`inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${levelColors[card.level]}`}>
            {card.level}
          </span>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1.5 rounded-full flex-shrink-0 ${scoreColor(card.score)}`}>
          {card.score}%
        </span>
      </div>

      {card.expanded !== undefined && (
        <button
          onClick={() => setOpen(!open)}
          className="w-full text-[11px] font-medium text-[#9A0458] py-2 border-t border-slate-50 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1"
        >
          {open ? "Collapse Details ▲" : "Expand Details ▼"}
        </button>
      )}

      {open && card.colorMatch && (
        <div className="px-3 pb-3 pt-1 grid grid-cols-3 gap-2 border-t border-slate-50">
          <div className="text-center">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1">Color Palette Overlap</p>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#9A0458] rounded-full" style={{ width: `${card.colorMatch}%` }} />
            </div>
            <p className="text-[10px] font-semibold text-slate-600 mt-1">{card.colorMatch}% Match</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1">Compositional Match</p>
            <p className="text-[11px] font-semibold text-slate-700 mt-2">{card.compMatch}</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1">Asset Source</p>
            <p className="text-[11px] font-semibold text-slate-700 mt-2">{card.assetSource}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function DropZone({ onFileSelected }: { onFileSelected?: () => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files.length) onFileSelected?.(); }}
      onClick={() => inputRef.current?.click()}
      className={`rounded-3xl border-2 border-dashed p-10 md:p-14 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
        isDragging
          ? "border-[#9A0458] bg-[#9A0458]/5"
          : "border-[#9A0458]/25 bg-white hover:border-[#9A0458]/50 hover:bg-[#9A0458]/3"
      }`}
    >
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.length) onFileSelected?.(); }} />
      <div className="w-16 h-16 rounded-2xl bg-[#9A0458]/8 flex items-center justify-center text-[#9A0458] mb-4">
        <UploadIcon />
      </div>
      <h3 className="text-lg font-bold text-[#9A0458] mb-1">Drop a design to start a forensic search</h3>
      <p className="text-sm text-slate-400 mb-5">Supports PNG, JPG, or Figma URLs</p>
      <div className="flex gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
          className="px-4 py-2 text-sm font-medium bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
        >
          Browse Files
        </button>
        <button
          onClick={(e) => e.stopPropagation()}
          className="px-4 py-2 text-sm font-medium bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors shadow-sm flex items-center"
        >
          <FigmaIcon />
          Import from Figma
        </button>
      </div>
    </div>
  );
}

// ── Sidebar ────────────────────────────────────────────────────────────────

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
  )},
  { id: "garden", label: "My Garden", icon: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3C7 3 3 7.5 3 12c0 1.5.5 3 1 4l8-8 8 8c.5-1 1-2.5 1-4 0-4.5-4-9-9-9z"/><path strokeLinecap="round" d="M12 21v-9"/></svg>
  )},
  { id: "discover", label: "Discover", icon: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path strokeLinecap="round" strokeLinejoin="round" d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"/></svg>
  )},
  { id: "settings", label: "Settings", icon: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/></svg>
  )},
];

// ── Main dashboard ─────────────────────────────────────────────────────────

function Dashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [hasAnalysis, setHasAnalysis] = useState(false);
  const firstName = user.email?.split("@")[0] ?? "there";
  const avatarLetter = firstName[0]?.toUpperCase();

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex antialiased font-sans">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-slate-100 flex flex-col justify-between py-6 shrink-0 fixed h-full z-10">
        <div>
          <div className="px-5 mb-7">
            <h2 className="text-lg font-black text-[#9A0458] tracking-tight leading-none">EchoGarden</h2>
            <span className="text-[10px] font-semibold text-slate-400 tracking-wide uppercase">Empathetic Forensics</span>
          </div>

          <nav className="px-3 space-y-0.5">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  activeTab === item.id
                    ? "bg-[#9A0458] text-white shadow-sm shadow-[#9A0458]/20"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <span className={activeTab === item.id ? "text-white" : "text-slate-400"}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="px-3 space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors">
            <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01"/></svg>
            Help Center
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            Log Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 ml-56 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="font-medium text-slate-600">Path</span>
            <span>/</span>
            <span className="font-semibold text-[#9A0458]">Investigation Lab</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <SearchIcon />
              <input
                placeholder="Search investigations..."
                className="pl-7 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg w-48 focus:outline-none focus:ring-2 focus:ring-[#9A0458]/20 focus:border-[#9A0458]/40 transition-all"
              />
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <SearchIcon />
              </span>
            </div>
            <button className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-colors">
              <BellIcon />
            </button>
            <button className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-colors">
              <HelpIcon />
            </button>
            <div className="w-8 h-8 rounded-full bg-[#9A0458] text-white text-xs font-bold flex items-center justify-center">
              {avatarLetter}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 max-w-6xl w-full mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {getGreeting()}, {firstName}
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">Let&apos;s uncover the visual DNA of your latest concept.</p>
          </div>

          {/* Drop zone */}
          <div className="mb-8">
            <DropZone onFileSelected={() => setHasAnalysis(true)} />
          </div>

          {/* Gardens — only shown after an analysis is run */}
          {hasAnalysis ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Your Garden */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🌱</span>
                    <h2 className="text-sm font-bold text-slate-800">Your Garden</h2>
                  </div>
                  <button className="text-xs font-semibold text-[#9A0458] hover:underline">View all</button>
                </div>
                <div className="space-y-3">
                  {ownGardenMocks.map((card) => (
                    <MatchCardComponent key={card.id} card={card} />
                  ))}
                </div>
              </div>

              {/* Others' Garden */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🧭</span>
                    <h2 className="text-sm font-bold text-slate-800">Others&apos; Garden</h2>
                  </div>
                  <button className="text-xs font-semibold text-[#9A0458] hover:underline">Explore Community</button>
                </div>
                <div className="space-y-3">
                  {othersGardenMocks.map((card) => (
                    <MatchCardComponent key={card.id} card={card} />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-slate-300 select-none">
              <div className="text-5xl mb-3">🌿</div>
              <p className="text-sm font-medium text-slate-400">Your garden is empty.</p>
              <p className="text-xs text-slate-300 mt-1">Drop a design above to start your first forensic search.</p>
            </div>
          )}
        </main>
      </div>

      {/* FAB */}
      <button className="fixed bottom-6 right-6 bg-[#9A0458] text-white px-4 py-3 rounded-2xl shadow-lg shadow-[#9A0458]/30 flex items-center gap-2 text-sm font-semibold hover:bg-[#7d0348] transition-colors z-20">
        <PlusIcon />
        New Analysis
      </button>
    </div>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      options: { redirectTo: `${window.location.origin}/auth/confirm` },
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-white flex flex-col items-center justify-center antialiased">
        <div className="w-10 h-10 border-4 border-slate-100 border-t-[#9A0458] rounded-full animate-spin mb-2" />
        <p className="text-slate-400 text-xs font-medium">Carregando laboratório...</p>
      </main>
    );
  }

  if (user) return <Dashboard user={user} onLogout={handleLogout} />;

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

      <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col items-center justify-center bg-white">
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