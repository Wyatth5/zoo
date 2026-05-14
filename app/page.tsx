import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#09090f] px-6 text-white">
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-gradient-to-b from-[#17172b] to-black p-8 text-center shadow-2xl">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-fuchsia-500/20 shadow-[0_0_40px_rgba(217,70,239,0.35)]">
          <Sparkles className="h-9 w-9 text-fuchsia-300" />
        </div>

        <p className="mb-2 text-xs uppercase tracking-[0.45em] text-fuchsia-300">
          Welcome to
        </p>

        <h1 className="mb-4 text-6xl font-black tracking-tight">ZOO</h1>

        <p className="mb-8 text-lg text-white/70">
          Your private AI social universe.
        </p>

        <Link
          href="/signup"
          className="block rounded-2xl bg-fuchsia-500 px-5 py-4 font-bold text-white shadow-[0_0_30px_rgba(217,70,239,0.4)]"
        >
          Enter ZOO
        </Link>

        <p className="mt-5 text-xs text-white/40">
          Post anything. Your AI crew reacts instantly.
        </p>
      </div>
    </main>
  );
}