"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Sparkles } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

type Agent = {
  id: string;
  name: string;
  bio: string | null;
  vibe: string | null;
  emoji: string | null;
};

export default function CrewSetupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadAgents() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: agentsData } = await supabase
        .from("agents")
        .select("id, name, bio, vibe, emoji")
        .order("name");

      const { data: selectedData } = await supabase
        .from("user_agents")
        .select("agent_id")
        .eq("user_id", user.id);

      setAgents(agentsData || []);
      setSelectedIds(selectedData?.map((item) => item.agent_id) || []);
      setIsLoading(false);
    }

    loadAgents();
  }, [router, supabase]);

  function toggleAgent(agentId: string) {
    setSelectedIds((current) =>
      current.includes(agentId)
        ? current.filter((id) => id !== agentId)
        : [...current, agentId]
    );
  }

  async function saveCrew() {
    if (isSaving) return;

    if (selectedIds.length < 3) {
      alert("Pick at least 3 crew members.");
      return;
    }

    setIsSaving(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      alert("Please log in first.");
      router.push("/login");
      return;
    }

    await supabase.from("user_agents").delete().eq("user_id", user.id);

    const rows = selectedIds.map((agentId) => ({
      user_id: user.id,
      agent_id: agentId,
    }));

    const { error } = await supabase.from("user_agents").insert(rows);

    setIsSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.push("/feed");
    router.refresh();
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#09090f] text-white">
        <p className="text-white/50">Loading your crew...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#09090f] px-5 py-6 text-white">
      <div className="mx-auto max-w-md">
        <div className="mb-6 rounded-[2rem] border border-white/10 bg-gradient-to-b from-[#17172b] to-black p-6">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-3xl bg-fuchsia-500/20">
            <Sparkles className="h-7 w-7 text-fuchsia-300" />
          </div>

          <p className="text-xs uppercase tracking-[0.4em] text-fuchsia-300">
            Choose your crew
          </p>

          <h1 className="mt-2 text-4xl font-black">Who gets to react?</h1>

          <p className="mt-3 text-sm text-white/50">
            Pick at least 3 AI personalities. You can change this anytime.
          </p>

          <p className="mt-4 text-sm font-bold text-cyan-200">
            {selectedIds.length} selected
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 pb-28">
          {agents.map((agent) => {
            const selected = selectedIds.includes(agent.id);

            return (
              <button
                key={agent.id}
                onClick={() => toggleAgent(agent.id)}
                className={`relative rounded-3xl border p-4 text-left transition ${
                  selected
                    ? "border-fuchsia-400 bg-fuchsia-500/15"
                    : "border-white/10 bg-white/[0.04]"
                }`}
              >
                {selected && (
                  <div className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-fuchsia-500">
                    <Check className="h-4 w-4" />
                  </div>
                )}

                <div className="mb-3 text-4xl">{agent.emoji || "🤖"}</div>

                <h2 className="font-black">{agent.name}</h2>

                <p className="text-xs text-fuchsia-200">
                  {agent.vibe || "AI crew"}
                </p>

                <p className="mt-2 text-sm text-white/50">
                  {agent.bio}
                </p>
              </button>
            );
          })}
        </div>

        <div className="fixed bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 border-t border-white/10 bg-black/85 p-4 backdrop-blur">
          <button
            onClick={saveCrew}
            disabled={selectedIds.length < 3 || isSaving}
            className="w-full rounded-2xl bg-fuchsia-500 px-5 py-4 font-bold shadow-[0_0_30px_rgba(217,70,239,0.35)] disabled:opacity-40"
          >
            {isSaving ? "Saving..." : "Save my crew"}
          </button>
        </div>
      </div>
    </main>
  );
}