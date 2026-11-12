import { getDashboardContext } from "@/lib/dashboard";
import Welcome from "./welcome";

export default async function WelcomePage() {
  const ctx = await getDashboardContext();
  return (
    <Welcome
      settings={ctx.settings}
      name={ctx.profile.name}
      headline={ctx.profile.headline ?? ""}
      githubUsername={ctx.row.github_username ?? ""}
    />
  );
}
