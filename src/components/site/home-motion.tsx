"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Optional motion enhancement. The server HTML is always visible. */
export function HomeMotion({ children, className }: { children: ReactNode; className: string }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hero = root.current?.querySelector<HTMLElement>("[data-home-hero]");
    const light = root.current?.querySelector<HTMLElement>("[data-home-light]");
    if (!hero || !light || !("IntersectionObserver" in window) || !light.animate) return;

    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let inView = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let sweep: Animation | undefined;

    const stop = () => {
      clearTimeout(timer);
      sweep?.cancel();
      sweep = undefined;
    };

    const play = () => {
      if (!inView || document.hidden || preference.matches) return;
      // A finite compositor animation, then 8.2 seconds of actual idle time.
      // No continuous animation or requestAnimationFrame loop during the pause.
      sweep = light.animate([
        { transform: "translateX(220%) rotate(16deg)", opacity: 0, offset: 0 },
        { opacity: .85, offset: .25 },
        { opacity: .65, offset: .75 },
        { transform: "translateX(690%) rotate(16deg)", opacity: 0, offset: 1 },
      ], { duration: 1800, easing: "cubic-bezier(.2,.6,.3,1)" });
      timer = setTimeout(play, 10000);
    };

    const sync = () => {
      stop();
      if (inView && !document.hidden && !preference.matches) timer = setTimeout(play, 100);
    };

    const observer = new IntersectionObserver(([entry]) => {
      const visible = entry.isIntersecting && entry.intersectionRatio >= .2;
      if (visible === inView) return;
      inView = visible;
      sync();
    }, { threshold: .2 });

    observer.observe(hero);
    document.addEventListener("visibilitychange", sync);
    preference.addEventListener("change", sync);
    return () => {
      stop();
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      preference.removeEventListener("change", sync);
    };
  }, []);

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
