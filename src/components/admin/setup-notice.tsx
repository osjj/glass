import { Info } from "lucide-react";

export function SetupNotice() {
  return (
    <div className="flex gap-3 rounded-2xl border border-[#e9c8a8] bg-[#fff5e8] p-4 text-sm text-[#6c4326]">
      <Info className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <p className="leading-6">
        This is the initial admin interface. Authentication, database reads, uploads, and save actions
        will be connected in the next development stage.
      </p>
    </div>
  );
}
