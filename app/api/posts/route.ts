import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { supabase } from "@/lib/supabase";

type Agent = {
  id: string;
  name: string;
  bio: string | null;
  vibe: string | null;
  emoji: string | null;
  prompt: string | null;
};

type UserAgentRow = {
  agent_id: string;
};

type AuthSupabaseClient = Awaited<ReturnType<typeof createClient>>;

export async function POST(request: Request) {
  try {
    const authSupabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await authSupabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "You must be logged in to post." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const content = body.content?.trim() || "";
    const imageUrl = body.imageUrl || null;

    if (!content && !imageUrl) {
      return NextResponse.json(
        { error: "Post needs text or an image." },
        { status: 400 }
      );
    }

    if (content.length > 250) {
      return NextResponse.json(
        { error: "Post must be 250 characters or less." },
        { status: 400 }
      );
    }

    const { data: post, error: postError } = await authSupabase
      .from("posts")
      .insert({
        content,
        image_url: imageUrl,
        user_id: user.id,
      })
      .select()
      .single();

    if (postError) {
      return NextResponse.json({ error: postError.message }, { status: 500 });
    }

    const selectedAgents = await getSelectedAgents(authSupabase, user.id);

    console.log(
      "Selected crew names:",
      selectedAgents.map((agent) => agent.name)
    );

    if (selectedAgents.length === 0) {
      return NextResponse.json({ post });
    }

    const agentsToReact = selectedAgents;

    const generatedComments = await Promise.all(
      agentsToReact.map(async (agent) => {
        const comment = await generateAgentComment(agent, content, imageUrl);

        return {
          post_id: post.id,
          agent_id: agent.id,
          author_type: "agent",
          content: comment,
        };
      })
    );

    const { error: commentsError } = await authSupabase
      .from("comments")
      .insert(generatedComments);

    if (commentsError) {
      console.error("Comment insert error:", commentsError);
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error("API route error:", error);

    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 }
    );
  }
}

async function getSelectedAgents(
  authSupabase: AuthSupabaseClient,
  userId: string
): Promise<Agent[]> {
  const { data: selectedRows, error: selectedError } = await authSupabase
    .from("user_agents")
    .select("agent_id")
    .eq("user_id", userId);

  if (selectedError) {
    console.error("Selected crew fetch error:", selectedError);
    return [];
  }

  const selectedIds = ((selectedRows || []) as UserAgentRow[]).map(
    (row) => row.agent_id
  );

  console.log("Selected crew IDs:", selectedIds);

  if (selectedIds.length === 0) {
    return [];
  }

  const { data: selectedAgents, error: agentsError } = await authSupabase
    .from("agents")
    .select("*")
    .in("id", selectedIds);

  if (agentsError) {
    console.error("Selected agents fetch error:", agentsError);
    return [];
  }

  return (selectedAgents || []) as Agent[];
}

async function generateAgentComment(
  agent: Agent,
  postContent: string,
  imageUrl: string | null
) {
  const fallback = `${agent.name} is reacting to this.`;

  if (!process.env.OPENAI_API_KEY) {
    return fallback;
  }

  const userContent: Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } }
  > = [
    {
      type: "text",
      text: postContent
        ? `Post caption: "${postContent}"`
        : "This post has no caption. React to the image like a social media comment.",
    },
  ];

  if (imageUrl) {
    userContent.push({
      type: "image_url",
      image_url: {
        url: imageUrl,
      },
    });
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
${agent.prompt}

You are commenting on a private social media post inside an app called ZOO.

Rules:
- Write exactly one short comment.
- Sound like a real social media commenter, not an assistant.
- Do not mention that you are AI.
- Do not say "in this image", "this photo shows", or describe the image mechanically.
- React naturally to the vibe, outfit, moment, energy, expression, scene, or caption.
- No hashtags.
- Max 22 words.
- Be distinct, emotionally reactive, and memorable.
          `,
        },
        {
          role: "user",
          content: userContent,
        },
      ],
      temperature: 0.95,
      max_tokens: 60,
    }),
  });

  if (!response.ok) {
    console.error("OpenAI error:", await response.text());
    return fallback;
  }

  const data = await response.json();

  return data.choices?.[0]?.message?.content?.trim() || fallback;
}

function shuffle<T>(array: T[]) {
  return [...array].sort(() => Math.random() - 0.5);
}
