import { getProfileWithSettings } from "@/lib/profile";
import ProfileEditor from "./profile-editor";

export default async function ProfilePage() {
  const { profile, settings } = await getProfileWithSettings();
  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl mb-1">Your profile</h1>
      <p className="text-sm text-[var(--sf-muted)] mb-8">
        The one source everything reads from. R and P on each row decide whether it
        appears on the resume and on the portfolio.
      </p>
      <ProfileEditor initial={profile} settings={settings} />
    </div>
  );
}
