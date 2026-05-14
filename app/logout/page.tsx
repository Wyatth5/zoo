"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    async function logout() {
      try {
        const supabase = createClient();

        await supabase.auth.signOut();

        window.location.href = "/login";
      } catch {
        window.location.href = "/login";
      }
    }

    logout();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#09090f] px-6 text-white">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-fuchsia-300">
          ZOO
        </p>

        <h1 className="mt-3 text-3xl font-black">Logging out...</h1>

        <p className="mt-3 text-white/50">
          Closing the gates to your AI universe.
        </p>
      </div>
    </main>
  );
}