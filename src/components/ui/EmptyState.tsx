import type { ReactNode } from "react";

export function EmptyState({ icon = "○", title, children, action }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-surface-2 text-xl text-subtle" aria-hidden>{icon}</span>
      <h3 className="mt-4 text-base font-semibold text-fg">{title}</h3>
      {children && <div className="mt-1 max-w-md text-sm text-muted">{children}</div>}
      {action && <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}
