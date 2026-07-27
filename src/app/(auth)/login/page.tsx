import Link from "next/link";

import { LoginForm } from "@/features/auth/components/login-form";
import { AuthShell } from "@/features/auth/components/auth-shell";

type LoginPageProps = {
  searchParams: Promise<{
    redirect?: string;
    message?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to your TriangleBank account"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-primary hover:underline">
            Create one
          </Link>
        </>
      }
    >
      {params.message === "password_updated" && (
        <p className="mb-4 rounded-xl bg-success/10 px-4 py-3 text-sm text-success">
          Password updated successfully. You can sign in now.
        </p>
      )}
      <LoginForm redirect={params.redirect} />
    </AuthShell>
  );
}
