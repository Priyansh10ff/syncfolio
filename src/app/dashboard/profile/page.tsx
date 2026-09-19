import { getProfile } from "@/lib/profile";
import ProfileEditor from "./profile-editor";

export default async function ProfilePage() {
  const profile = await getProfile();
  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl mb-1">Your profile</h1>
      <p className="text-sm text-[var(--loom-muted)] mb-8">
        This is the source everything else — resume, portfolio — reads from.
      </p>
      <ProfileEditor initial={profile} />
    </div>
  );
}
