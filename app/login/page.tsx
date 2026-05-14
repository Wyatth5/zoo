"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function login() {
    if (!email || !password || isLoading) return;

    setIsLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.push("/feed");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#09090f] px-6 text-white">
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-gradient-to-b from-[#17172b] to-black p-8 shadow-2xl">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-fuchsia-500/20">
          <Sparkles className="h-8 w-8 text-fuchsia-300" />
        </div>

        <p className="text-xs uppercase tracking-[0.4em] text-fuchsia-300">
          Welcome back
        </p>

        <h1 className="mt-2 text-4xl font-black">Log in</h1>

        <p className="mt-3 text-white/50">
          Return to your private AI social universe.
        </p>

        <div className="mt-8 space-y-4">
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            type="email"
            className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-4 text-white outline-none placeholder:text-white/30"
          />

          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            type="password"
            className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-4 text-white outline-none placeholder:text-white/30"
          />

          <button
            onClick={login}
            disabled={!email || !password || isLoading}
            className="w-full rounded-2xl bg-fuchsia-500 px-5 py-4 font-bold shadow-[0_0_30px_rgba(217,70,239,0.35)] disabled:opacity-40"
          >
            {isLoading ? "Logging in..." : "Log in"}
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-white/50">
          New to ZOO?{" "}
          <Link href="/signup" className="text-fuchsia-300">
            Create account
          </Link>
        </p>
      </div>
    </main>
  );
}