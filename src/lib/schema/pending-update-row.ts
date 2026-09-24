export type PendingUpdateRow = {
  id: string;
  profile_id: string;
  source: "ai_chat" | "github_scan" | "external_sync";
  target_table: "experience" | "projects" | "skills" | "education" | "profiles";
  payload: Record<string, unknown>;
  diff_summary: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};
