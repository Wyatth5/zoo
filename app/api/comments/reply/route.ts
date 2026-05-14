import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type Agent = {
  id: string;
  name: string;
  prompt: string | null;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const postId = body.postId;
    const parentCommentId = body.parentCommentId;
    const agentId = body.agentId;
    const content = body.content?.trim();

    if (!postId || !parentCommentId || !agentId || !content) {
      return NextResponse.json(
        { error: "Missing required reply fields." },
        { status: 400 }
      );
    }

    if (content.length > 250) {
      return NextResponse.json(
        { error: "Reply must be 250 characters or less." },
        { status: 400 }
      );
    }

    const { data: userReply, error: userReplyError } = await supabase
      .from("comments")
      .insert({
        post_id: postId,
        parent_comment_id: parentCommentId,
        author_type: "user",
        user_display_name: "@you",
        content,
      })
      .select()
      .single();

    if (userReplyError) {
      return NextResponse.json(
        { error: userReplyError.message },
        { status: 500 }
      );
    }

    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("id, name, prompt")
      .eq("id", agentId)
      .single();

    if (agentError || !agent) {
      return NextResponse.json({ userReply });
    }

    const agentResponse = await generateAgentReply(agent as Agent, content);

    const { error: agentReplyError } = await supabase.from("comments").insert({
      post_id: postId,
      parent_comment_id: parentCommentId,
      agent_id: agent.id,
      author_type: "agent",
      content: agentResponse,
    });

    if (agentReplyError) {
      console.error("Agent reply insert error:", agentReplyError);
    }

    return NextResponse.json({ userReply });
  } catch (error) {
    console.error("Reply API route error:", error);

    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 }
    );
  }
}

async function generateAgentReply(agent: Agent, userReply: string) {
  const fallback = `${agent.name} is thinking about that.`;

  if (!process.env.OPENAI_API_KEY) {
    return fallback;
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

You are replying to a human who responded to your comment inside a private social app called ZOO.

Rules:
- Write exactly one short reply.
- Sound like a real social media commenter, not an assistant.
- Do not mention that you are AI.
- Do not explain yourself.
- Max 22 words.
- Keep your personality consistent.
- Make it feel like a casual thread reply.
          `,
        },
        {
          role: "user",
          content: `Human reply: "${userReply}"`,
        },
      ],
      temperature: 0.95,
      max_tokens: 60,
    }),
  });

  if (!response.ok) {
    console.error("OpenAI reply error:", await response.text());
    return fallback;
  }

  const data = await response.json();

  return data.choices?.[0]?.message?.content?.trim() || fallback;
}