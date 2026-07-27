"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/features/auth/schemas/auth.schemas";
import { createServiceClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = {
  error?: string;
  success?: string;
};

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

function mapAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("email logins are disabled")) {
    return "Email login is turned off in Supabase. Enable Authentication → Providers → Email.";
  }
  if (lower.includes("signup is disabled")) {
    return "New signups are disabled in Supabase. Enable Email signup under Providers → Email.";
  }
  if (lower.includes("email not confirmed")) {
    return "Email is not confirmed yet. Try again — we will confirm it automatically.";
  }
  return message;
}

/** Confirm email via service role so users can enter without clicking mail links. */
async function confirmEmailByUserId(userId: string): Promise<boolean> {
  try {
    const admin = createServiceClient();
    const { error } = await admin.auth.admin.updateUserById(userId, {
      email_confirm: true,
    });
    return !error;
  } catch {
    return false;
  }
}

async function confirmEmailByAddress(email: string): Promise<string | null> {
  try {
    const admin = createServiceClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (!profile?.id) {
      // Fallback: scan auth users (small projects)
      const { data, error } = await admin.auth.admin.listUsers({
        page: 1,
        perPage: 200,
      });
      if (error || !data?.users) return null;
      const user = data.users.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase(),
      );
      if (!user) return null;
      const { error: updateError } = await admin.auth.admin.updateUserById(
        user.id,
        { email_confirm: true },
      );
      return updateError ? null : user.id;
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(
      profile.id,
      { email_confirm: true },
    );
    return updateError ? null : profile.id;
  } catch {
    return null;
  }
}

async function trackSession(userId: string) {
  const supabase = await createClient();
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") ?? undefined;

  await supabase.from("sessions").insert({
    user_id: userId,
    user_agent: userAgent,
  });
}

export async function signUpAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse({
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    fullName: formData.get("fullName") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { username, email, password, fullName } = parsed.data;

  try {
    const adminClient = createServiceClient();
    const { data: existingUsername } = await adminClient
      .from("profiles")
      .select("username")
      .eq("username", username)
      .maybeSingle();

    if (existingUsername) {
      return { error: "Username is already taken" };
    }
  } catch {
    // Service role not configured — DB unique constraint will catch duplicates
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${getAppUrl()}/auth/callback?next=/dashboard`,
      data: {
        username,
        full_name: fullName ?? "",
      },
    },
  });

  if (error) {
    return { error: mapAuthError(error.message) };
  }

  // Already signed in (Confirm email off in Supabase)
  if (data.session) {
    if (data.user) await trackSession(data.user.id);
    redirect("/dashboard");
  }

  // Confirm email still on, but skip the mail step: confirm + sign in
  if (data.user) {
    const confirmed = await confirmEmailByUserId(data.user.id);
    if (confirmed) {
      const { data: signedIn, error: signInError } =
        await supabase.auth.signInWithPassword({ email, password });

      if (!signInError && signedIn.session) {
        await trackSession(data.user.id);
        redirect("/dashboard");
      }
    }
  }

  redirect("/verify-email?email=" + encodeURIComponent(email));
}

export async function signInAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  let { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  // Auto-confirm unconfirmed accounts (no email link required)
  if (error?.message.toLowerCase().includes("email not confirmed")) {
    const confirmedId = await confirmEmailByAddress(parsed.data.email);
    if (confirmedId) {
      const retry = await supabase.auth.signInWithPassword(parsed.data);
      data = retry.data;
      error = retry.error;
    }
  }

  if (error) {
    return { error: mapAuthError(error.message) };
  }

  if (data.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_frozen")
      .eq("id", data.user.id)
      .single();

    if (profile?.is_frozen) {
      await supabase.auth.signOut();
      return { error: "Your account has been frozen. Contact support." };
    }

    await trackSession(data.user.id);
  }

  const redirectTo = formData.get("redirect")?.toString() || "/dashboard";
  redirect(redirectTo);
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function forgotPasswordAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    parsed.data.email,
    {
      redirectTo: `${getAppUrl()}/auth/callback?next=/reset-password`,
    },
  );

  if (error) {
    return { error: mapAuthError(error.message) };
  }

  return {
    success:
      "If an account exists for that email, a reset link has been sent.",
  };
}

export async function resetPasswordAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { error: mapAuthError(error.message) };
  }

  redirect("/login?message=password_updated");
}

export async function resendVerificationAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = formData.get("email")?.toString();

  if (!email) {
    return { error: "Email is required" };
  }

  // Prefer auto-confirm over resending mail
  const confirmedId = await confirmEmailByAddress(email);
  if (confirmedId) {
    return {
      success: "Account confirmed. You can sign in now — no email needed.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: `${getAppUrl()}/auth/callback?next=/dashboard`,
    },
  });

  if (error) {
    return { error: mapAuthError(error.message) };
  }

  return { success: "Verification email sent. Check your inbox." };
}
