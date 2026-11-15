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
        width={1378}
        height={748}
        sizes={compact ? "(max-width: 539px) 150px, (max-width: 1279px) 165px, 190px" : "(min-width: 640px) 142px, 133px"}
        loading="eager"
        className={compact ? "h-14 w-auto" : "h-[4.5rem] w-auto sm:h-[4.8rem]"}
      />
    </Link>
  );
}
