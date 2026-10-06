import LoginForm from "./login-form";
import { safeNextPath } from "@/lib/safe-next";

const ERRORS: Record<string, string> = {
  missing_code: "That sign-in link was incomplete. Request a new one.",
  link_invalid: "That sign-in link has expired or was already used. Request a new one.",
  profile_create_failed: "Signed in, but your profile couldn't be created. Check that the schema is applied, then try again.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = safeNextPath(typeof params.next === "string" ? params.next : null);
  const errorKey = typeof params.error === "string" ? params.error : null;

  return <LoginForm next={next} initialError={errorKey ? ERRORS[errorKey] ?? null : null} />;
}
