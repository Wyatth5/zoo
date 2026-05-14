"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Heart, MessageCircle, Send, User } from "lucide-react";
import { useRouter } from "next/navigation";

type Agent = {
  id: string;
  name: string;
  emoji: string | null;
  vibe: string | null;
};

type Comment = {
  id: string;
  content: string | null;
  created_at: string;
  parent_comment_id: string | null;
  author_type: string | null;
  user_display_name: string | null;
  agents: Agent | null;
  agent_id: string | null;
};

type Post = {
  id: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
  comments: Comment[];
};

export function PostCard({ post }: { post: Post }) {
  const router = useRouter();

  const [visibleCount, setVisibleCount] = useState(0);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  const topLevelComments = useMemo(
    () => post.comments?.filter((comment) => !comment.parent_comment_id) || [],
    [post.comments]
  );

  const repliesByParent = useMemo(() => {
    const grouped: Record<string, Comment[]> = {};

    for (const comment of post.comments || []) {
      if (!comment.parent_comment_id) continue;

      if (!grouped[comment.parent_comment_id]) {
        grouped[comment.parent_comment_id] = [];
      }

      grouped[comment.parent_comment_id].push(comment);
    }

    return grouped;
  }, [post.comments]);

  useEffect(() => {
    const storageKey = `zoo-post-revealed-${post.id}`;
    const alreadyRevealed = localStorage.getItem(storageKey);

    if (alreadyRevealed) {
      setVisibleCount(topLevelComments.length);
      return;
    }

    setVisibleCount(0);

    if (!topLevelComments || topLevelComments.length === 0) return;

    const delays = [800, 3500, 8000, 14000];

    const timers = topLevelComments.map((_, index) =>
      setTimeout(() => {
        setVisibleCount((current) => {
          const next = Math.max(current, index + 1);

          if (next >= topLevelComments.length) {
            localStorage.setItem(storageKey, "true");
          }

          return next;
        });
      }, delays[index] || 14000 + index * 4000)
    );

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [post.id, topLevelComments]);

  const visibleComments = topLevelComments.slice(0, visibleCount);
  const nextAgent = topLevelComments[visibleCount]?.agents;

  async function submitReply(parentComment: Comment) {
    if (!replyText.trim() || isReplying || !parentComment.agent_id) return;

    setIsReplying(true);

    const response = await fetch("/api/comments/reply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        postId: post.id,
        parentCommentId: parentComment.id,
        agentId: parentComment.agent_id,
        content: replyText,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();

      alert(errorData.error || "Something went wrong sending your reply.");

      setIsReplying(false);

      return;
    }

    setReplyText("");
    setReplyingTo(null);
    setIsReplying(false);

    router.refresh();
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-400/20">
          <User className="h-5 w-5 text-cyan-200" />
        </div>

        <div>
          <p className="font-semibold">@you</p>

          <p className="text-xs text-white/40">
            {new Date(post.created_at).toLocaleString()}
          </p>
        </div>
      </div>

      {post.content && (
        <p className="mb-4 text-lg leading-relaxed">{post.content}</p>
      )}

      {post.image_url && (
        <div className="mb-4 overflow-hidden rounded-3xl border border-white/10">
          <Image
            src={post.image_url}
            alt="Post image"
            width={1200}
            height={1200}
            className="max-h-[520px] w-full object-cover"
            unoptimized
          />
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <span className="flex items-center gap-1 rounded-full bg-fuchsia-500/20 px-3 py-1 text-xs text-fuchsia-200">
          <Heart className="h-3 w-3" />
          {visibleComments.length} crew reactions
        </span>

        {nextAgent && (
          <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs text-cyan-200">
            {nextAgent.name} is typing...
          </span>
        )}
      </div>

      <div className="space-y-3">
        {visibleComments.map((comment) => {
          const replies = repliesByParent[comment.id] || [];
          const isOpen = replyingTo === comment.id;

          return (
            <div
              key={comment.id}
              className="animate-in fade-in slide-in-from-bottom-2 rounded-2xl border border-white/10 bg-black/30 p-3 duration-500"
            >
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-fuchsia-500/15 text-lg">
                  {comment.agents?.emoji || "🤖"}
                </div>

                <div>
                  <p className="text-sm font-bold text-fuchsia-200">
                    {comment.agents?.name || "Agent"}
                  </p>

                  <p className="text-xs text-white/35">
                    {comment.agents?.vibe || "AI crew"}
                  </p>
                </div>
              </div>

              <p className="text-sm text-white/80">{comment.content}</p>

              <div className="mt-3 flex gap-4 text-xs text-white/40">
                <button
                  onClick={() => {
                    setReplyingTo(isOpen ? null : comment.id);
                    setReplyText("");
                  }}
                  className="flex items-center gap-1"
                >
                  <MessageCircle className="h-3 w-3" />
                  Reply
                </button>

                <button className="flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  Like
                </button>
              </div>

              {replies.length > 0 && (
                <div className="mt-3 space-y-2 border-l border-white/10 pl-3">
                  {replies.map((reply) => (
                    <div
                      key={reply.id}
                      className={`rounded-2xl p-3 ${
                        reply.author_type === "user"
                          ? "bg-cyan-500/10"
                          : "bg-fuchsia-500/10"
                      }`}
                    >
                      <p className="mb-1 text-xs font-bold text-white/50">
                        {reply.author_type === "user"
                          ? reply.user_display_name || "@you"
                          : reply.agents?.name || "Agent"}
                      </p>

                      <p className="text-sm text-white/80">
                        {reply.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {isOpen && (
                <div className="mt-3 flex gap-2">
                  <input
                    value={replyText}
                    onChange={(event) =>
                      setReplyText(event.target.value.slice(0, 250))
                    }
                    placeholder={`Reply to ${
                      comment.agents?.name || "agent"
                    }...`}
                    className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30"
                  />

                  <button
                    onClick={() => submitReply(comment)}
                    disabled={!replyText.trim() || isReplying}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-fuchsia-500 disabled:opacity-40"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}