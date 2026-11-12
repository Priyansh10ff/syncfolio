import { PageHeader } from "@/components/ui";
import { getDashboardContext } from "@/lib/dashboard";
import SettingsClient from "./settings-client";

export default async function SettingsPage() {
  const ctx = await getDashboardContext();
  const {
    data: { user },
  } = await ctx.supabase.auth.getUser();
  return (
    <>
      <PageHeader title="settings" />
      <SettingsClient initial={ctx.settings} email={user?.email ?? null} />
    </>
  );
}
