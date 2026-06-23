"use client";

import "@/lib/i18n";
import { AuthProvider } from "@/lib/AuthContext";
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <AuthProvider>
      <LoginForm />
    </AuthProvider>
  );
}
