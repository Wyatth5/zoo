"use client";

import { useEffect, useState } from "react";
import { Check, Save } from "lucide-react";
import { MobileShell } from "@/components/zoo/mobile-shell";
import { createClient } from "@/utils/supabase/client";

type Agent = {
  id: string;
  name: string;
  bio: string | null;
  vibe: string | null;
  emoji: string | null;
};

export default function CrewPage() {
  const supabase = createClient();

  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadCrew() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      setUserId(user.id);

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

    loadCrew();
  }, [supabase]);

  function toggleAgent(agentId: string) {
    setSelectedIds((current) =>
      current.includes(agentId)
        ? current.filter((id) => id !== agentId)
        : [...current, agentId]
    );
  }

  async function saveCrew() {
    if (!userId || isSaving) return;

    if (selectedIds.length < 3) {
      alert("Pick at least 3 crew members.");
      return;
    }

    setIsSaving(true);

    await supabase.from("user_agents").delete().eq("user_id", userId);

    const rows = selectedIds.map((agentId) => ({
      user_id: userId,
      agent_id: agentId,
    }));

    const { error } = await supabase.from("user_agents").insert(rows);

    setIsSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Crew updated.");
  }

  return (
    <MobileShell activeTab="crew">
      <header className="border-b border-white/10 px-5 py-5">
        <p className="text-xs uppercase tracking-[0.4em] text-fuchsia-300">
          Crew
        </p>

        <h1 className="text-2xl font-black">Your AI people</h1>

        <p className="mt-1 text-sm text-white/50">
          Pick who gets to react to your world.
        </p>

        <p className="mt-3 text-sm font-bold text-cyan-200">
          {selectedIds.length} selected
        </p>
      </header>

      {isLoading ? (
        <div className="px-5 py-8 text-center text-white/50">
          Loading your crew...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 px-5 py-6 pb-28">
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

                  <p className="mt-2 text-sm text-white/50">{agent.bio}</p>

                  <div
                    className={`mt-4 rounded-xl px-3 py-2 text-center text-sm font-bold ${
                      selected
                        ? "bg-fuchsia-500 text-white"
                        : "bg-white/10 text-white/60"
                    }`}
                  >
                    {selected ? "Following" : "Add to crew"}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="fixed bottom-20 left-1/2 z-30 w-full max-w-md -translate-x-1/2 px-4">
            <button
              onClick={saveCrew}
              disabled={selectedIds.length < 3 || isSaving}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-fuchsia-500 px-5 py-4 font-bold shadow-[0_0_30px_rgba(217,70,239,0.35)] disabled:opacity-40"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save crew"}
            </button>
          </div>
        </>
      )}
    </MobileShell>
  );
}