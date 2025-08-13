"use client";
import { useState } from "react";
import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Chrome, Github, ChevronRight, Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

/**
 * SignUpForm Component
 * Handles new user registration with email/password and OAuth providers
 * Includes email verification flow and integrates with Clerk authentication
 */
const SignUpForm = () => {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const router = useRouter();

  /**
   * Handles user registration and email verification
   * Two-step process: creates account, then verifies email with code
   * @param e - Form submission event
   */
  const handleEmailPasswordSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signUp) return;

    setIsLoading(true);
    setError("");

    try {
      if (!showVerification) {
        // Create the user
        await signUp.create({
          emailAddress: email,
          password: password,
        });

        // Send email verification code
        await signUp.prepareEmailAddressVerification({
          strategy: "email_code",
        });
        setShowVerification(true);
      } else {
        // Verify the email
        const completeSignUp = await signUp.attemptEmailAddressVerification({
          code,
        });

        if (completeSignUp.status === "complete") {
          await setActive({ session: completeSignUp.createdSessionId });
          router.push("/chat");
        }
      }
    } catch (err: any) {
      console.error("Error:", err);
      setError(err.errors?.[0]?.message || "An error occurred during sign up");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles OAuth registration with Google or GitHub
   * Redirects to OAuth provider for account creation
   * @param strategy - OAuth provider strategy (Google or GitHub)
   */
  const handleOAuthSignUp = async (
    strategy: "oauth_google" | "oauth_github"
  ) => {
    if (!isLoaded || !signUp) return;

    try {
      await signUp.authenticateWithRedirect({
        strategy,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/chat",
      });
    } catch (err: any) {
      console.error("OAuth error:", err);
      setError(err.errors?.[0]?.message || "An error occurred");
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
            {showVerification ? "Verify your email" : "Create your account"}
          </h1>
          {showVerification && (
            <p className="mt-2 text-sm text-muted-foreground">
              We've sent a verification code to {email}
            </p>
          )}
        </section>
        <div className="mt-6 space-y-4">
          {!showVerification ? (
            <>
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
            </>
          ) : (
            <div className="rounded-full border border-input px-4 py-2">
              <Input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Verification code"
                className="h-11 border-0 focus-visible:ring-0 rounded-full"
                required
                autoFocus
              />
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          {/* Clerk CAPTCHA element for bot protection */}
          <div id="clerk-captcha"></div>

          <Button
            onClick={handleEmailPasswordSignUp}
            className="w-full rounded-full h-11"
            variant="default"
            disabled={
              isLoading ||
              (!showVerification && (!email || !password)) ||
              (showVerification && !code)
            }
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <>
                {showVerification ? "Verify email" : "Continue"}
                <ChevronRight className="ml-1 h-4 w-4" />
              </>
            )}
          </Button>

          {!showVerification && (
            <>
              <p className="text-sm text-muted-foreground text-center">
                Already have an account?{" "}
                <Link
                  href="/signin"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Sign in
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
                  onClick={() => handleOAuthSignUp("oauth_google")}
                  disabled={isLoading}
                >
                  <Chrome className="mr-2 h-5 w-5" />
                  Continue with Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-full h-11 justify-start"
                  onClick={() => handleOAuthSignUp("oauth_github")}
                  disabled={isLoading}
                >
                  <Github className="mr-2 h-5 w-5" />
                  Continue with GitHub
                </Button>
              </div>
            </>
          )}

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

export default SignUpForm;
