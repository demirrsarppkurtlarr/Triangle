import "server-only";

import { createClient } from "@/lib/supabase/server";

export type QuickContact = {
  userId: string;
  username: string;
  triangleId: string;
  transferCount: number;
  lastTransferAt: string;
};

export async function getQuickContacts(
  userId: string,
  limit = 8,
): Promise<QuickContact[]> {
  const supabase = await createClient();

  const { data: contacts } = await supabase
    .from("transfer_contacts")
    .select("contact_user_id, transfer_count, last_transfer_at")
    .eq("user_id", userId)
    .order("last_transfer_at", { ascending: false })
    .limit(limit);

  if (contacts?.length) {
    const ids = contacts.map((c) => c.contact_user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, triangle_id")
      .in("id", ids);

    const map = new Map((profiles ?? []).map((p) => [p.id, p]));
    return contacts
      .map((c) => {
        const p = map.get(c.contact_user_id);
        if (!p) return null;
        return {
          userId: p.id,
          username: p.username,
          triangleId: p.triangle_id,
          transferCount: Number(c.transfer_count),
          lastTransferAt: c.last_transfer_at,
        } satisfies QuickContact;
      })
      .filter((c): c is QuickContact => c !== null);
  }

  // Fallback: derive from recent outgoing transfers if contacts table empty / not migrated
  const { data: account } = await supabase
    .from("bank_accounts")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!account) return [];

  const { data: txs } = await supabase
    .from("transactions")
    .select("to_account_id, completed_at")
    .eq("from_account_id", account.id)
    .eq("type", "transfer")
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(40);

  if (!txs?.length) return [];

  const toAccountIds = [...new Set(txs.map((t) => t.to_account_id).filter(Boolean))];
  const { data: accounts } = await supabase
    .from("bank_accounts")
    .select("id, user_id")
    .in("id", toAccountIds as string[]);

  const accountToUser = new Map(
    (accounts ?? []).map((a) => [a.id, a.user_id]),
  );
  const userIds = [
    ...new Set(
      (accounts ?? [])
        .map((a) => a.user_id)
        .filter((id) => id !== userId),
    ),
  ];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, triangle_id")
    .in("id", userIds);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const counts = new Map<string, { count: number; last: string }>();

  for (const tx of txs) {
    const uid = accountToUser.get(tx.to_account_id as string);
    if (!uid || uid === userId) continue;
    const prev = counts.get(uid);
    const last = tx.completed_at ?? new Date().toISOString();
    if (!prev) counts.set(uid, { count: 1, last });
    else counts.set(uid, { count: prev.count + 1, last: prev.last });
  }

  return [...counts.entries()]
    .map(([uid, meta]) => {
      const p = profileMap.get(uid);
      if (!p) return null;
      return {
        userId: uid,
        username: p.username,
        triangleId: p.triangle_id,
        transferCount: meta.count,
        lastTransferAt: meta.last,
      } satisfies QuickContact;
    })
    .filter((c): c is QuickContact => c !== null)
    .slice(0, limit);
}

export async function recordTransferContact(
  userId: string,
  contactUserId: string,
) {
  const supabase = await createClient();
  await supabase.rpc("upsert_transfer_contact", {
    p_user_id: userId,
    p_contact_user_id: contactUserId,
  });
}
