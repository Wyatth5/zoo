"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Send } from "lucide-react";
import { MobileShell } from "@/components/zoo/mobile-shell";
import { createClient } from "@/utils/supabase/client";

export default function FeedbackPage() {
  const router = useRouter();
  const supabase = createClient();

  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function submitFeedback() {
    if (!message.trim() || isSending) return;

    setIsSending(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setIsSending(false);
      alert("Please log in first.");
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("feedback").insert({
      user_id: user.id,
      message: message.trim(),
    });

    setIsSending(false);

    if (error) {
      alert(error.message);
      return;
    }

    setMessage("");
    setSent(true);

    setTimeout(() => {
      router.push("/profile");
      router.refresh();
    }, 1200);
  }

  return (
    <MobileShell activeTab="profile">
      <header className="border-b border-white/10 px-5 py-5">
        <p className="text-xs uppercase tracking-[0.4em] text-fuchsia-300">
          Feedback
        </p>

        <h1 className="text-2xl font-black">Tell us what felt weird</h1>

        <p className="mt-1 text-sm text-white/50">
          Bugs, ideas, favorite agents, terrible agents — send anything.
        </p>
      </header>

      <div className="space-y-5 px-5 py-6">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-fuchsia-500/15">
            <MessageSquare className="h-6 w-6 text-fuchsia-300" />
          </div>

          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value.slice(0, 1000))}
            maxLength={1000}
            placeholder="What worked? What was confusing? Which agent made you laugh?"
            className="min-h-48 w-full resize-none rounded-2xl border border-white/10 bg-black/30 p-4 text-white outline-none placeholder:text-white/30"
          />

          <p className="mt-2 text-right text-xs text-white/35">
            {1000 - message.length} characters left
          </p>
        </div>

        {sent && (
          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-4 text-center text-sm font-semibold text-cyan-200">
            Feedback sent. Thank you.
          </div>
        )}

        <button
          onClick={submitFeedback}
          disabled={!message.trim() || isSending || sent}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-fuchsia-500 px-5 py-4 font-bold shadow-[0_0_30px_rgba(217,70,239,0.35)] disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
          {isSending ? "Sending..." : "Send feedback"}
        </button>
      </div>
    </MobileShell>
  );
}