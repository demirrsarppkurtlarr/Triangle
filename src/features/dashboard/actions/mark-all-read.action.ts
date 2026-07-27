"use server";

import { markAllNotificationsRead } from "@/features/dashboard/actions/notifications.actions";

export async function markAllReadAction() {
  await markAllNotificationsRead();
}
