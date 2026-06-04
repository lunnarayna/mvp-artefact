"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

export default function AuthConfirm() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (session) {
        router.replace("/");
      }
    });
  }, [router]);

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-4 border-slate-100 border-t-[#9A0458] rounded-full animate-spin mb-2"></div>
      <p className="text-slate-400 text-xs font-medium">Autenticando...</p>
    </main>
  );
}