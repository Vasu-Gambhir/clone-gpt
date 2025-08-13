// app/sso-callback/page.tsx
"use client";
import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

/**
 * SSOCallback Component
 * Handles OAuth authentication callbacks from Google/GitHub
 * Completes the sign-in/sign-up process and redirects to chat
 */
export default function SSOCallback() {
  return (
    <>
      <AuthenticateWithRedirectCallback 
        afterSignInUrl="/chat"
        afterSignUpUrl="/chat"
        redirectUrl="/signin"
      />
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Completing sign in...</p>
        </div>
      </div>
    </>
  );
}
