import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useLoginPage } from "./useLoginPage";

function BrandMark() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 shadow-sm">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M3 8.5L6.5 12L13 4"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <span className="text-[15px] font-bold tracking-tight text-neutral-900">
        Onboardly
      </span>
    </div>
  );
}

export default function LoginPage() {
  const {
    email,
    setEmail,
    password,
    setPassword,
    error,
    isSubmitting,
    handleLogin,
  } = useLoginPage();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void handleLogin();
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel — form */}
      <div className="flex w-full flex-col bg-white px-8 py-10 md:w-[480px] md:shrink-0 lg:px-14">
        <BrandMark />

        <div className="mt-10 flex-1">
          {/* AI badge */}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-[11.5px] font-600 text-primary-700">
            <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
            AI Workplace Assistant
          </span>

          <h1 className="mt-5 text-[28px] font-bold tracking-tight text-neutral-900">
            Welcome back
          </h1>
          <p className="mt-2 text-[13.5px] leading-relaxed text-neutral-600">
            Sign in to access your company's knowledge — policies, benefits, and
            onboarding answered instantly.
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-[12.5px] font-semibold text-neutral-800"
              >
                Work email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="jordan.blevins@northwind.co"
                value={email}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-[12.5px] font-semibold text-neutral-800"
                >
                  Password
                </label>
                <a
                  href="mailto:support@onboardly.app"
                  className="text-[12px] font-medium text-primary-600 transition-colors hover:text-primary-700"
                >
                  Forgot password?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center gap-2.5">
              <input
                id="remember"
                type="checkbox"
                className="h-4 w-4 cursor-pointer rounded border-neutral-300 accent-primary-600"
              />
              <label
                htmlFor="remember"
                className="cursor-pointer select-none text-[13px] text-neutral-600"
              >
                Keep me signed in for 30 days
              </label>
            </div>

            <Button
              type="submit"
              className="w-full gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
              {!isSubmitting && (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M2.5 7H11.5M7.5 3L11.5 7L7.5 11"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </Button>

            {error ? (
              <p
                className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                role="alert"
              >
                {error}
              </p>
            ) : null}
          </form>
        </div>

        <p className="mt-8 text-center text-[12.5px] text-neutral-500">
          Need an account?{" "}
          <a
            href="mailto:support@onboardly.app?subject=Sign%20up%20request"
            className="font-semibold text-primary-600 transition-colors hover:text-primary-700"
          >
            Contact your HR admin
          </a>
        </p>
      </div>

      {/* Right panel — marketing */}
      <div className="relative hidden flex-1 flex-col overflow-hidden bg-gradient-to-br from-primary-800 via-primary-900 to-[#0D1240] md:flex">
        {/* Subtle radial glow */}
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary-500/20 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-16 left-16 h-72 w-72 rounded-full bg-accent-500/15 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative flex flex-1 flex-col items-start justify-center px-14 py-16">
          {/* Chat preview card */}
          <div className="w-full max-w-sm rounded-2xl bg-white/10 p-5 shadow-xl backdrop-blur-sm border border-white/10">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white/20">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M1.5 6.5L4.5 9.5L10.5 3"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="text-[11px] font-semibold text-white/60 uppercase tracking-widest">
                Onboardly
              </span>
              <span className="ml-auto rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                online
              </span>
            </div>

            <div className="space-y-3">
              {/* User message */}
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary-500/60 px-3.5 py-2 text-[13px] text-white">
                  "How many vacation days do new engineers get?"
                </div>
              </div>

              {/* AI response */}
              <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-white/15 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-white/90">
                You're entitled to{" "}
                <span className="font-semibold text-white">20 PTO days</span> in
                your first year, with an additional 2 days each year after,
                capped at 28.
              </div>
            </div>

            {/* Source chips */}
            <div className="mt-4 flex flex-wrap gap-1.5">
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10.5px] font-medium text-white/60">
                Employee Handbook §4
              </span>
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10.5px] font-medium text-white/60">
                Benefits Guide p.23
              </span>
            </div>
          </div>

          {/* Marketing copy */}
          <div className="mt-10">
            <h2 className="text-[28px] font-bold leading-tight tracking-tight text-white">
              Your company's knowledge,
              <br />
              grounded in real documents.
            </h2>
            <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-white/60">
              Every answer cites the source, so your team trusts the result. No
              more pinging HR for the policy PDF.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
