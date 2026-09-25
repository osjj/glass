"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** One-shot, below-the-fold enhancement. The server HTML is always visible. */
export function HomeMotion({ children, className }: { children: ReactNode; className: string }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = root.current;
    if (!element || !("IntersectionObserver" in window)) return;

    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let observer: IntersectionObserver | undefined;
    let targets: HTMLElement[] = [];
    let frame = 0;

    const reset = () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      targets.forEach((target) => target.removeAttribute("data-motion-state"));
    };

    const start = () => {
      reset();
      if (preference.matches) return;
      frame = requestAnimationFrame(() => {
        targets = Array.from(element.querySelectorAll<HTMLElement>("[data-motion]"));
        // Read every position before writing styles. Never hide the initial viewport,
        // including restored scroll positions or a direct visit to an anchor.
        const belowFold = targets.filter((target) => target.getBoundingClientRect().top >= window.innerHeight);
        observer = new IntersectionObserver((entries) => {
          entries.forEach(({ target, isIntersecting }) => {
            if (!isIntersecting) return;
            (target as HTMLElement).dataset.motionState = "entered";
            observer?.unobserve(target);
          });
        }, { threshold: 0, rootMargin: "0px 0px -24px 0px" });
        belowFold.forEach((target) => {
          target.dataset.motionState = "waiting";
          observer?.observe(target);
        });
      });
    };

    const revealFocused = (event: FocusEvent) => {
      if (!(event.target instanceof Element)) return;
      // Keyboard focus and in-page navigation must never land on veiled content.
      targets.filter((target) => target.contains(event.target as Node) || event.target instanceof Element && event.target.contains(target))
        .forEach((target) => {
          target.removeAttribute("data-motion-state");
          observer?.unobserve(target);
        });
    };

    start();
    preference.addEventListener("change", start);
    element.addEventListener("focusin", revealFocused);
    return () => {
      reset();
      preference.removeEventListener("change", start);
      element.removeEventListener("focusin", revealFocused);
    };
  }, []);

  return <div ref={root} className={className}>{children}</div>;
}
