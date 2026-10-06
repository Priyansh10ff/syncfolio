import { getSettings } from "@/lib/profile";
import SettingsClient from "./settings-client";

export default async function SettingsPage() {
  const settings = await getSettings();
  return (
    <div className="max-w-xl">
      <h1 className="font-display text-2xl mb-1">Settings</h1>
      <p className="text-sm text-[var(--sf-muted)] mb-8">
        Resume and Portfolio are separate modules on top of the same profile. Use one or both.
      </p>
      <SettingsClient initial={settings} />
    </div>
  );
}
