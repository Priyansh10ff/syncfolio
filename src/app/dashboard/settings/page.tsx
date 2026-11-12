import { PageHeader } from "@/components/ui";
import { getDashboardContext } from "@/lib/dashboard";
import SettingsForm from "./settings-form";

export default async function SettingsPage() {
  const ctx = await getDashboardContext();
  const {
    data: { user },
  } = await ctx.supabase.auth.getUser();
  return (
    <>
      <PageHeader title="settings" />
      <SettingsForm initial={ctx.settings} email={user?.email ?? null} />
    </>
  );
}
