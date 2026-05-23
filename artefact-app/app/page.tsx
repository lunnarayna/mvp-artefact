"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { User } from "@supabase/supabase-js"; 

export default function Home() {
  
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);
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

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-light mb-6">
          EchoGarden
        </h1>

        {user ? (
          <div>
            <p className="mb-4 text-zinc-400">
              Logged in as {user.email}
            </p>

            <button
              onClick={handleLogout}
              className="bg-white text-black px-6 py-3 rounded-xl"
            >
              Logout
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogin}
            className="bg-white text-black px-6 py-3 rounded-xl"
          >
            Login with Google
          </button>
        )}
      </div>
    </main>
  );
}