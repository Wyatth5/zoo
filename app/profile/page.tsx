import Image from "next/image";
import Link from "next/link";
import { LogOut, MessageSquare, Settings, User } from "lucide-react";
import { MobileShell } from "@/components/zoo/mobile-shell";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#09090f] px-6 text-white">
        <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-gradient-to-b from-[#17172b] to-black p-8 text-center shadow-2xl">
          <h1 className="text-4xl font-black">Log in first</h1>

          <p className="mt-3 text-white/50">
            Create an account to view your ZOO profile.
          </p>

          <Link
            href="/signup"
            className="mt-8 block rounded-2xl bg-fuchsia-500 px-5 py-4 font-bold text-white"
          >
            Create account
          </Link>
        </div>
      </main>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, bio, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const { count: postCount } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { count: crewCount } = await supabase
    .from("user_agents")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const displayName = profile?.username ? `@${profile.username}` : "@you";

  return (
    <MobileShell activeTab="profile">
      <header className="flex items-center justify-between border-b border-white/10 px-5 py-5">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-fuchsia-300">
            Profile
          </p>

          <h1 className="text-2xl font-black">{displayName}</h1>
        </div>

        <Link
          href="/profile/setup"
          className="rounded-full border border-white/10 bg-white/[0.04] p-3"
        >
          <Settings className="h-5 w-5 text-white/70" />
        </Link>
      </header>

      <div className="space-y-5 px-5 py-6">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-center">
          <div className="mx-auto mb-4 h-24 w-24 overflow-hidden rounded-full bg-cyan-400/20">
            {profile?.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt="Profile avatar"
                width={240}
                height={240}
                className="h-full w-full object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <User className="h-10 w-10 text-cyan-200" />
              </div>
            )}
          </div>

          <h2 className="text-xl font-black">{displayName}</h2>

          <p className="mt-2 text-sm text-white/50">
            {profile?.bio ||
              "Your private archive of posts, chaos, validation, and AI lore."}
          </p>

          <Link
            href="/profile/setup"
            className="mt-5 block rounded-2xl bg-fuchsia-500 px-5 py-3 font-bold text-white"
          >
            Edit profile
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Stat label="Posts" value={String(postCount || 0)} />
          <Stat label="Crew" value={String(crewCount || 0)} />
          <Stat label="Reactions" value="∞" />
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <p className="mb-2 text-sm font-bold text-white/50">Account</p>
          <p className="text-sm text-white/50">{user.email}</p>
        </div>

        <Link
          href="/feedback"
          className="flex items-center justify-center gap-2 rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/10 px-5 py-4 font-bold text-fuchsia-200"
        >
          <MessageSquare className="h-4 w-4" />
          Help shape ZOO
        </Link>

        <Link
          href="/logout"
          className="flex items-center justify-center gap-2 rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-4 font-bold text-red-200"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </Link>
      </div>
    </MobileShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center">
      <p className="text-xl font-black">{value}</p>
      <p className="text-xs text-white/40">{label}</p>
    </div>
  );
}