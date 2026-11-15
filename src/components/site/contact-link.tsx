"use client";

import type { AnchorHTMLAttributes } from "react";
import { trackContactClick, type ContactContext } from "@/lib/analytics";

export function ContactLink({ contactMethod, contactLocation, onClick, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & ContactContext) {
  return <a {...props} onClick={(event) => {
    onClick?.(event);
    if (!event.defaultPrevented) trackContactClick({ contactMethod, contactLocation });
  }} />;
}
