import Link from "next/link";

import { VerifyEmailActions } from "@/features/auth/components/verify-email-actions";
import { AuthShell } from "@/features/auth/components/auth-shell";

type VerifyEmailPageProps = {
  searchParams: Promise<{ email?: string }>;
};

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const params = await searchParams;
  const email = params.email ?? "";

  return (
    <AuthShell
      title="Verify your email"
      description={
        email
          ? `We sent a verification link to ${email}`
          : "Check your inbox for a verification link"
      }
      footer={
        <Link href="/login" className="text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      <div className="space-y-4 text-sm text-muted-foreground">
        <p>
          Click the link in your email to activate your account and receive
          your Triangle ID.
        </p>
        {email && <VerifyEmailActions email={email} />}
      </div>
    </AuthShell>
  );
}
