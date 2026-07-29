import { redirect } from "next/navigation";

import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import { ChatRoom } from "@/features/chat/components/chat-room";
import { getRecentMessages } from "@/features/chat/services/chat.service";
import { createClient } from "@/lib/supabase/server";

export default async function ChatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const messages = await getRecentMessages();

  return (
    <>
      <DashboardHeader
        title="Sohbet"
        description="Diğer oyuncularla konuş"
      />
      <main className="mx-auto max-w-3xl page-pad py-6 md:py-8">
        <ChatRoom initialMessages={messages} userId={user.id} />
      </main>
    </>
  );
}
