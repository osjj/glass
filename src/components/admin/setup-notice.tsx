import { Info } from "lucide-react";

export function SetupNotice() {
  return (
    <div className="flex gap-3 rounded-2xl border border-[#e9c8a8] bg-[#fff5e8] p-4 text-sm text-[#6c4326]">
      <Info className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <p className="leading-6">
        Product maintenance is connected to PostgreSQL and can use R2 when its credentials are configured.
        Admin authentication and blog save actions remain part of the next development stage.
      </p>
    </div>
  );
}
