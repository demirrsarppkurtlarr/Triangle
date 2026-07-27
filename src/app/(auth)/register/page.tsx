import Link from "next/link";

import { RegisterForm } from "@/features/auth/components/register-form";
import { AuthShell } from "@/features/auth/components/auth-shell";

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create your account"
      description="Get your unique Triangle ID and start exploring"
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
