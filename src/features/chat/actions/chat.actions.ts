"use server";

import { createClient } from "@/lib/supabase/server";

export type ChatActionState = { error?: string; success?: boolean };

export async function sendMessageAction(
  _prev: ChatActionState,
  formData: FormData,
): Promise<ChatActionState> {
  const content = formData.get("content")?.toString()?.trim();
  if (!content || content.length < 1) return { error: "Mesaj boş olamaz" };
  if (content.length > 500) return { error: "Maksimum 500 karakter" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("send_chat_message", {
    p_content: content,
  });
  if (error) return { error: error.message };
  return { success: true };
}
