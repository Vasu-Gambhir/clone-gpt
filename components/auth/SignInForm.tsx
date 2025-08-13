"use client";
import { useState } from "react";
import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Chrome, Github, ChevronRight, Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

/**
 * SignInForm Component
 * Handles user authentication with email/password and OAuth providers (Google, GitHub)
 * Integrates with Clerk authentication system for user sign-in
 */
const SignInForm = () => {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  /**
   * Handles email/password sign-in form submission
   * Validates credentials with Clerk and redirects to chat on success
   * @param e - Form submission event
   */
  const handleEmailPasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;

    setIsLoading(true);
    setError("");

    try {
      // Create sign in with email and password
      const result = await signIn.create({
        identifier: email,
        password: password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/chat");
      } else {
        // Handle other statuses (like 2FA)
        setError("Additional verification required");
      }
    } catch (err: unknown) {
      console.error("Error:", err);
      setError(
        (err as { errors?: { message: string }[] })?.errors?.[0]?.message ||
        "Invalid email or password"
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles OAuth sign-in with Google or GitHub
   * Redirects to OAuth provider for authentication
   * @param strategy - OAuth provider strategy (Google or GitHub)
   */
  const handleOAuthSignIn = async (
    strategy: "oauth_google" | "oauth_github"
  ) => {
    if (!isLoaded || !signIn) return;

    try {
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/chat",
      });
    } catch (err: unknown) {
      console.error("OAuth error:", err);
      setError(
        (err as { errors?: { message: string }[] })?.errors?.[0]?.message ||
        "An error occurred"
      );
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="px-6 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <span className="text-lg font-semibold">ChatGPT</span>
          <ThemeToggle />
        </div>
      </header>
      <main className="container mx-auto max-w-md pt-12 px-6 pb-16">
        <section className="mt-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">
            Welcome back
          </h1>
        </section>
        <div className="mt-6 space-y-4">
          <div className="rounded-full border border-input px-4 py-2">
            <Input
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="h-11 border-0 focus-visible:ring-0 rounded-full"
              required
            />
          </div>

          <div className="rounded-full border border-input px-4 py-2">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="h-11 border-0 focus-visible:ring-0 rounded-full"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <Button
            onClick={handleEmailPasswordSignIn}
            className="w-full rounded-full h-11"
            variant="default"
            disabled={isLoading || !email || !password}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <>
                Continue
                <ChevronRight className="ml-1 h-4 w-4" />
              </>
            )}
          </Button>

          <p className="text-sm text-muted-foreground text-center">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-primary underline-offset-4 hover:underline"
            >
              Sign up
            </Link>
          </p>

          <div className="relative my-4">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
              OR
            </span>
          </div>

          <div className="space-y-4">
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-full h-11 justify-start"
              onClick={() => handleOAuthSignIn("oauth_google")}
              disabled={isLoading}
            >
              <Chrome className="mr-2 h-5 w-5" />
              Continue with Google
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-full h-11 justify-start"
              onClick={() => handleOAuthSignIn("oauth_github")}
              disabled={isLoading}
            >
              <Github className="mr-2 h-5 w-5" />
              Continue with GitHub
            </Button>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            <a href="#" className="hover:underline">
              Terms of Use
            </a>
            <span className="mx-2">|</span>
            <a href="#" className="hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </main>
    </div>
  );
};

export default SignInForm;
