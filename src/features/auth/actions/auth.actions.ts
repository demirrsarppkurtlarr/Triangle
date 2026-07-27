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
    return { error: error.message };
  }

  // Email confirmation disabled in Supabase → session exists → go straight in
  if (data.session) {
    if (data.user) {
      await trackSession(data.user.id);
    }
    redirect("/dashboard");
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
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    if (error.message.includes("Email not confirmed")) {
      return {
        error: "Please verify your email before signing in.",
      };
    }
    return { error: error.message };
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
    return { error: error.message };
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
    return { error: error.message };
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

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: `${getAppUrl()}/auth/callback?next=/dashboard`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: "Verification email sent. Check your inbox." };
}
