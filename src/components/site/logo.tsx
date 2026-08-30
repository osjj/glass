import Image from "next/image";
import Link from "next/link";

export function Logo({
  variant = "blue",
  compact = false,
}: {
  variant?: "blue" | "white";
  compact?: boolean;
}) {
  return (
    <Link
      href="/"
      className="inline-flex shrink-0 items-center"
      aria-label="Glarivo Glassware home"
    >
      <Image
        src={variant === "white" ? "/brand/glarivo-logo-white.png" : "/brand/glarivo-logo-blue.png"}
        alt="Glarivo Glassware"
        width={760}
        height={550}
        priority
        className={compact ? "h-14 w-auto" : "h-[4.5rem] w-auto sm:h-[4.8rem]"}
      />
    </Link>
  );
}
