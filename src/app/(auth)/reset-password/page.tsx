import Link from "next/link";

import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
import { AuthShell } from "@/features/auth/components/auth-shell";

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Set new password"
      description="Choose a strong password for your account"
      footer={
        <Link href="/login" className="text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
