export type PendingUpdateRow = {
  id: string;
  profile_id: string;
  source: "ai_chat" | "github_scan" | "external_sync";
  target_table: "experience" | "projects" | "skills" | "education" | "profiles";
  /** Proposed fields plus control keys `__action` and `__target_id`. */
  payload: Record<string, unknown>;
  diff_summary: string | null;
  status: "pending" | "approved" | "rejected" | "undone";
  /** Set on approval: the row created / updated / deleted. */
  applied_row_id: string | null;
  /** Set on approval of an update or delete: the full row before the change. */
  previous: Record<string, unknown> | null;
  resolved_at: string | null;
  created_at: string;
};
