"use client";

import { FileSearch, LoaderCircle, Rocket } from "lucide-react";
import { useFormStatus } from "react-dom";

export function ImportSubmitButton({
  mode = "import",
  className = "button-primary min-w-60 justify-center",
}: {
  mode?: "preview" | "import";
  className?: string;
}) {
  const { pending } = useFormStatus();
  const preview = mode === "preview";

  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? (
        <>
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          {preview ? "Scanning Garbo…" : "Importing products…"}
        </>
      ) : (
        <>
          {preview ? <FileSearch className="size-4" aria-hidden="true" /> : <Rocket className="size-4" aria-hidden="true" />}
          {preview ? "Scan & preview" : "Import & publish"}
        </>
      )}
    </button>
  );
}
