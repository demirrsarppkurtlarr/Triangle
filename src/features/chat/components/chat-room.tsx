"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";

import { MotionButton } from "@/components/motion/motion-button";
import {
  sendMessageAction,
  type ChatActionState,
} from "@/features/chat/actions/chat.actions";
import type { ChatMessage } from "@/features/chat/services/chat.service";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const initial: ChatActionState = {};

type Props = {
  initialMessages: ChatMessage[];
  userId: string;
};

export function ChatRoom({ initialMessages, userId }: Props) {
  const [messages, setMessages] = useState(initialMessages);
  const [state, action, pending] = useActionState(sendMessageAction, initial);
  const bottomRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.success) formRef.current?.reset();
  }, [state]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("chat-general")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: "channel=eq.general" },
        async (payload) => {
          const msg = payload.new as {
            id: string;
            sender_id: string;
            content: string;
            channel: string;
            created_at: string;
          };
          const { data: profile } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", msg.sender_id)
            .maybeSingle();

          setMessages((prev) => [
            ...prev,
            {
              id: msg.id,
              senderId: msg.sender_id,
              senderName: profile?.username ?? "Unknown",
              content: msg.content,
              channel: msg.channel,
              createdAt: msg.created_at,
            },
          ]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <div className="flex h-[calc(100vh-14rem)] flex-col rounded-[1.35rem] border border-border/50 bg-card/80 shadow-soft md:h-[calc(100vh-12rem)]">
      <div className="border-b border-border/50 px-4 py-3">
        <h2 className="text-sm font-semibold">Genel Sohbet</h2>
        <p className="text-xs text-muted-foreground">{messages.length} mesaj</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="space-y-3">
          {messages.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Henüz mesaj yok. İlk mesajı sen gönder!
            </p>
          )}
          {messages.map((msg) => {
            const isMe = msg.senderId === userId;
            return (
              <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[80%] rounded-2xl px-3.5 py-2.5",
                  isMe ? "bg-primary text-primary-foreground" : "bg-secondary",
                )}>
                  {!isMe && (
                    <p className="mb-0.5 text-[10px] font-semibold text-primary">
                      @{msg.senderName}
                    </p>
                  )}
                  <p className="text-sm">{msg.content}</p>
                  <p className={cn(
                    "mt-1 text-[10px]",
                    isMe ? "text-primary-foreground/60" : "text-muted-foreground",
                  )}>
                    {new Date(msg.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      <form ref={formRef} action={action} className="flex gap-2 border-t border-border/50 px-4 py-3">
        <input
          type="text"
          name="content"
          maxLength={500}
          placeholder="Mesaj yaz…"
          autoComplete="off"
          className="flex-1 rounded-xl border border-border/60 bg-secondary/40 px-3 py-2.5 text-sm"
        />
        <MotionButton type="submit" size="sm" className="min-h-10 px-4" pending={pending} pendingLabel="…">
          <Send className="size-4" />
        </MotionButton>
      </form>
    </div>
  );
}
