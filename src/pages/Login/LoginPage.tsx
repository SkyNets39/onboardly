import type { FormEvent } from "react";
import { Bolt } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { useLoginPage } from "./useLoginPage";

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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-neutral-50 px-4 py-10">
      <div
        className="pointer-events-none absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-primary/15 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-16 bottom-16 h-80 w-80 rounded-full bg-primary/20 blur-3xl"
        aria-hidden="true"
      />

      <Card className="relative w-full max-w-md  bg-card shadow-xl backdrop-blur-sm">
        <CardHeader className="items-center space-y-3 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
            <Bolt className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-semibold text-neutral-900">
              Welcome back
            </CardTitle>
            <CardDescription className="text-sm text-neutral-600">
              Enter your credentials to access your account.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-xs font-semibold tracking-wide text-neutral-700"
              >
                EMAIL
              </label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                autoComplete="email"
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-xs font-semibold tracking-wide text-neutral-700"
                >
                  PASSWORD
                </label>
                <a
                  href="mailto:support@onboardly.app"
                  className="text-xs font-medium text-primary transition-colors hover:text-primary/80"
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
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>

            {error ? (
              <p
                className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-error"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            <p className="pt-1 text-center text-sm text-neutral-600">
              Don&apos;t have an account?{" "}
              <a
                href="mailto:support@onboardly.app?subject=Sign%20up%20request"
                className="font-medium text-primary transition-colors hover:text-primary/80"
              >
                Sign up
              </a>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
