import { redirect } from "next/navigation";

/**
 * Home Page Component
 * Root page that redirects users to the main chat interface
 */
export default function Home() {
  redirect("/chat");
}
