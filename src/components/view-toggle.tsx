"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

type View = "day" | "week";

type Props = {
  current: View;
};

export function ViewToggle({ current }: Props) {
  const router = useRouter();
  const params = useSearchParams();

  function go(view: View) {
    const next = new URLSearchParams(params.toString());
    if (view === "day") next.delete("view");
    else next.set("view", view);
    const query = next.toString();
    router.push(`/${query ? `?${query}` : ""}`);
  }

  return (
    <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5 text-sm dark:border-slate-700 dark:bg-slate-900">
      <button
        type="button"
        onClick={() => go("day")}
        className={cn(
          "rounded px-3 py-1",
          current === "day"
            ? "bg-blue-600 text-white"
            : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
        )}
      >
        Diária
      </button>
      <button
        type="button"
        onClick={() => go("week")}
        className={cn(
          "rounded px-3 py-1",
          current === "week"
            ? "bg-blue-600 text-white"
            : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
        )}
      >
        Semanal
      </button>
    </div>
  );
}
