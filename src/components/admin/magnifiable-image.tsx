"use client";

import Image from "next/image";
import { ZoomIn } from "lucide-react";
import { useRef, useState } from "react";

/** The zoom layer uses the same contain-fit box as the preview, including letterboxing. */
export function MagnifiableImage({ src, alt }: { src: string; alt: string }) {
  const containerRef = useRef<HTMLButtonElement>(null);
  const [point, setPoint] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [loaded, setLoaded] = useState(false);

  function showCenter() {
    const bounds = containerRef.current?.getBoundingClientRect();
    if (bounds) setPoint({ x: bounds.width / 2, y: bounds.height / 2, width: bounds.width, height: bounds.height });
  }

  const diameter = point ? Math.min(176, point.width, point.height) : 176;
  const lensLeft = point ? Math.max(0, Math.min(point.x - diameter / 2, point.width - diameter)) : 0;
  const lensTop = point ? Math.max(0, Math.min(point.y - diameter / 2, point.height - diameter)) : 0;

  return (
    <button
      ref={containerRef}
      type="button"
      className="relative block aspect-square w-full cursor-zoom-in overflow-hidden rounded-2xl border border-[#d7dcd8] bg-[#eef0ed] text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
      aria-label={`${alt} — 放大查看，方向键移动放大镜`}
      onPointerMove={(event) => {
        if (event.pointerType === "touch") return;
        const bounds = event.currentTarget.getBoundingClientRect();
        setPoint({ x: event.clientX - bounds.left, y: event.clientY - bounds.top, width: bounds.width, height: bounds.height });
      }}
      onPointerLeave={() => setPoint(null)}
      onFocus={showCenter}
      onBlur={() => setPoint(null)}
      onClick={() => point ? setPoint(null) : showCenter()}
      onKeyDown={(event) => {
        const directions: Record<string, [number, number]> = { ArrowLeft: [-20, 0], ArrowRight: [20, 0], ArrowUp: [0, -20], ArrowDown: [0, 20] };
        const delta = directions[event.key];
        if (!delta) return;
        event.preventDefault();
        if (!point) return showCenter();
        setPoint({ ...point, x: Math.max(0, Math.min(point.width, point.x + delta[0])), y: Math.max(0, Math.min(point.height, point.y + delta[1])) });
      }}
    >
      <Image src={src} alt={alt} fill unoptimized sizes="(min-width: 1024px) 40vw, 90vw" className="object-contain" onLoad={() => setLoaded(true)} onError={() => { setLoaded(false); setPoint(null); }} />
      <span className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-xs font-bold shadow-sm" aria-hidden="true">
        <ZoomIn className="size-4" /> 3×
      </span>
      {loaded && point ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute overflow-hidden rounded-full border-2 border-white bg-[#eef0ed] shadow-[0_3px_18px_rgba(0,0,0,0.35)]"
          style={{ width: diameter, height: diameter, left: lensLeft, top: lensTop }}
        >
          <span className="absolute" style={{ width: point.width * 3, height: point.height * 3, left: diameter / 2 - point.x * 3, top: diameter / 2 - point.y * 3 }}>
            <Image src={src} alt="" fill unoptimized sizes="120vw" className="object-contain" draggable={false} />
          </span>
        </span>
      ) : null}
    </button>
  );
}
