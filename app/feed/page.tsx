import Link from "next/link";
import { Sparkles } from "lucide-react";
import { MobileShell } from "@/components/zoo/mobile-shell";
import { PostCard } from "@/components/zoo/post-card";
import { createClient } from "@/utils/supabase/server";

type Agent = {
  id: string;
  name: string;
  emoji: string | null;
  vibe: string | null;
};

type CommentLike = {
  user_id: string;
};

type Comment = {
  id: string;
  content: string | null;
  created_at: string;
  parent_comment_id: string | null;
  author_type: string | null;
  user_display_name: string | null;
  agent_id: string | null;
  agents: Agent | null;
  comment_likes: CommentLike[];
};

type Post = {
  id: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
  comments: Comment[];
};

export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#09090f] px-6 text-white">
        <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-gradient-to-b from-[#17172b] to-black p-8 text-center shadow-2xl">
          <p className="text-xs uppercase tracking-[0.4em] text-fuchsia-300">
            ZOO
          </p>

          <h1 className="mt-3 text-4xl font-black">Log in first</h1>

          <p className="mt-3 text-white/50">
            Create an account to start building your private AI social universe.
          </p>

          <Link
            href="/signup"
            className="mt-8 block rounded-2xl bg-fuchsia-500 px-5 py-4 font-bold text-white shadow-[0_0_30px_rgba(217,70,239,0.35)]"
          >
            Create account
          </Link>

          <Link
            href="/login"
            className="mt-4 block text-sm font-semibold text-fuchsia-300"
          >
            Already have an account? Log in
          </Link>
        </div>
      </main>
    );
  }

  const { data: posts, error } = await supabase
    .from("posts")
    .select(`
      id,
      content,
      image_url,
      created_at,
      comments (
        id,
        content,
        created_at,
        parent_comment_id,
        author_type,
        user_display_name,
        agent_id,
        agents (
          id,
          name,
          emoji,
          vibe
        ),
        comment_likes (
          user_id
        )
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .order("created_at", {
      referencedTable: "comments",
      ascending: true,
    });

  return (
    <MobileShell activeTab="feed">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/50 px-5 py-4 backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-fuchsia-300">
              ZOO
            </p>

            <h1 className="text-2xl font-black tracking-tight">Feed</h1>
          </div>

          <div className="rounded-full border border-fuchsia-400/40 bg-fuchsia-500/10 p-3">
            <Sparkles className="h-5 w-5 text-fuchsia-300" />
          </div>
        </div>
      </header>

      <div className="space-y-5 px-5 py-6">
        {error && (
          <div className="rounded-3xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
            Error loading posts: {error.message}
          </div>
        )}

        {!error && (!posts || posts.length === 0) && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-center">
            <p className="text-lg font-bold">Your ZOO is empty</p>

            <p className="mt-2 text-sm text-white/50">
              Create your first post and let the crew react.
            </p>

            <Link
              href="/create"
              className="mt-5 block rounded-2xl bg-fuchsia-500 px-5 py-3 font-bold text-white"
            >
              Create first post
            </Link>
          </div>
        )}

        {!error &&
          posts?.map((post) => (
            <PostCard
              key={post.id}
              post={post as unknown as Post}
              currentUserId={user.id}
            />
          ))}
      </div>
    </MobileShell>
  );
}