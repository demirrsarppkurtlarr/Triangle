import "server-only";

import { createClient } from "@/lib/supabase/server";

export type ChatMessage = {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  channel: string;
  createdAt: string;
};

export async function getRecentMessages(channel = "general", limit = 50) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("chat_messages")
    .select("id, sender_id, content, channel, created_at")
    .eq("channel", channel)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!data || data.length === 0) return [];

  const senderIds = [...new Set(data.map((m) => m.sender_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username")
    .in("id", senderIds);

  const nameMap = new Map((profiles ?? []).map((p) => [p.id, p.username]));

  return data
    .map((m) => ({
      id: m.id,
      senderId: m.sender_id,
      senderName: nameMap.get(m.sender_id) ?? "Unknown",
      content: m.content,
      channel: m.channel,
      createdAt: m.created_at,
    }))
    .reverse();
}
