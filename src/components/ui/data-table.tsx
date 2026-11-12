import { cn } from "@/lib/cn";

export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  /** Tailwind width class, e.g. "w-24". */
  width?: string;
  align?: "left" | "right";
  mono?: boolean;
};

/**
 * Dense mono table. Selection is controlled by the parent (keyboard
 * navigation lives in the screen, via useHotkey), so this stays dumb.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  activeIndex,
  onRowClick,
  label,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  activeIndex?: number;
  onRowClick?: (row: T, index: number) => void;
  /** Accessible name for the table. */
  label: string;
}) {
  return (
    <table className="w-full border-collapse text-[13px]" aria-label={label}>
      <thead>
        <tr className="border-b border-line">
          {columns.map((c) => (
            <th
              key={c.key}
              scope="col"
              className={cn(
                "font-mono text-label uppercase text-muted font-normal py-1.5 px-2",
                c.align === "right" ? "text-right" : "text-left",
                c.width
              )}
            >
              {c.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr
            key={rowKey(row)}
            aria-selected={activeIndex === i || undefined}
            onClick={onRowClick ? () => onRowClick(row, i) : undefined}
            className={cn(
              "border-b border-line/60",
              onRowClick && "cursor-pointer hover:bg-surface-2",
              activeIndex === i && "bg-surface-2 shadow-[inset_2px_0_0_var(--sf-thread)]"
            )}
          >
            {columns.map((c) => (
              <td
                key={c.key}
                className={cn(
                  "py-1.5 px-2 align-top",
                  c.align === "right" && "text-right",
                  c.mono !== false && "font-mono"
                )}
              >
                {c.render(row)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
