import { AppShell } from "@/components/app/app-shell";
import { getDashboardContext, getShellStatus } from "@/lib/dashboard";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getDashboardContext();
  const status = await getShellStatus(ctx);
  return <AppShell status={status}>{children}</AppShell>;
}
