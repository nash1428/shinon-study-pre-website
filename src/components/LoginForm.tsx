"use client";

import { useState, type FormEvent } from "react";
import { GraduationCap, Mail, Lock, User, AlertCircle, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import Logo from "./Logo";

export default function LoginForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const { login, signup, isFirebaseConfigured } = useAuth();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        if (name.trim().length < 2) {
          setError(t("auth.name"));
          setLoading(false);
          return;
        }
        await signup(email, password, name);
      }
      // Redirect immediately — user is already set in context
      router.push("/");
    } catch (err: any) {
      // Map Firebase error codes to translated messages
      const code = err?.code || "";
      if (code.includes("invalid-email")) setError(t("auth.errorEmail"));
      else if (code.includes("weak-password")) setError(t("auth.errorPassword"));
      else if (code.includes("user-not-found")) setError(t("auth.errorUserNotFound"));
      else if (code.includes("wrong-password")) setError(t("auth.errorWrongPassword"));
      else if (code.includes("email-already-in-use")) setError(t("auth.errorEmailInUse"));
      else setError(err?.message || t("auth.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ivory-dark shadow-[var(--shadow-card)]">
            <Logo className="h-10 w-10" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-ink">Study Garden</h1>
            <p className="text-xs text-ink-muted">{t("auth.subtitle")}</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white p-7 shadow-[var(--shadow-card)]">
          {/* Mode toggle */}
          <div className="mb-5 flex rounded-xl bg-ivory-warm p-1">
            <button
              onClick={() => { setMode("login"); setError(""); }}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                mode === "login"
                  ? "bg-white text-moss shadow-[var(--shadow-soft)]"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              {t("auth.login")}
            </button>
            <button
              onClick={() => { setMode("signup"); setError(""); }}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                mode === "signup"
                  ? "bg-white text-moss shadow-[var(--shadow-soft)]"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              {t("auth.signup")}
            </button>
          </div>

          {/* Title */}
          <h2 className="mb-4 text-lg font-semibold text-ink">
            {mode === "login" ? t("auth.welcome") : t("auth.createAccount")}
          </h2>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === "signup" && (
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("auth.name")}
                  required
                  className="w-full rounded-xl border border-ivory-deep bg-white py-3 pl-10 pr-4 text-sm text-ink placeholder:text-ink-muted focus:border-moss/30 focus:outline-none focus:ring-2 focus:ring-moss/10"
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("auth.email")}
                required
                className="w-full rounded-xl border border-ivory-deep bg-white py-3 pl-10 pr-4 text-sm text-ink placeholder:text-ink-muted focus:border-moss/30 focus:outline-none focus:ring-2 focus:ring-moss/10"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("auth.password")}
                required
                className="w-full rounded-xl border border-ivory-deep bg-white py-3 pl-10 pr-4 text-sm text-ink placeholder:text-ink-muted focus:border-moss/30 focus:outline-none focus:ring-2 focus:ring-moss/10"
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3.5 py-2.5 text-xs text-red-500">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {error}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-moss py-3 text-sm font-medium text-white transition-colors hover:bg-moss-dark disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : mode === "login" ? (
                t("auth.loginButton")
              ) : (
                t("auth.signupButton")
              )}
            </button>
          </form>

          {/* Mode switch link */}
          <p className="mt-4 text-center text-xs text-ink-muted">
            {mode === "login" ? t("auth.noAccount") : t("auth.haveAccount")}{" "}
            <button
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setError("");
              }}
              className="font-medium text-sage-600 hover:text-moss"
            >
              {mode === "login" ? t("auth.signup") : t("auth.login")}
            </button>
          </p>
        </div>

        {/* Demo mode notice */}
        {!isFirebaseConfigured && (
          <p className="mt-4 text-center text-[11px] text-ink-muted">
            {t("auth.demoMode")}
          </p>
        )}
      </div>
    </div>
  );
}
