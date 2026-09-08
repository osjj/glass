"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import styles from "./exhibition-carousel.module.css";

const scenes = [
  "Booth entrance and reception",
  "Glassware selection along the display shelves",
  "Collection discussions around the table",
  "Glassware and tableware display island",
  "Blue archway and glassware displays",
  "Buyers reviewing glass samples",
  "Glassware collection and colorful storage bowls",
  "Sample discussions inside the booth",
];
const photos = scenes.map((title, index) => ({
  title,
  src: `/images/about/exhibition/glarivo-exhibition-${String(index + 1).padStart(2, "0")}.webp`,
}));
// Three copies at either end cover the widest (three-photo) viewport.
const copies = 3;
const slides = [...photos.slice(-copies), ...photos, ...photos.slice(0, copies)];
const normalize = (index: number) => ((index - copies + photos.length) % photos.length) + copies;

export function ExhibitionCarousel() {
  const [position, setPosition] = useState({ index: copies, animate: false });
  const moving = useRef(false);
  const pointer = useRef<{ id: number; x: number; y: number } | null>(null);
  const active = normalize(position.index) - copies;

  function finishMove() {
    setPosition((current) => ({ index: normalize(current.index), animate: false }));
  }

  useEffect(() => {
    if (position.animate) {
      // Recover if a resize or a browser visibility change cancels transitionend.
      const timeout = window.setTimeout(finishMove, 650);
      return () => window.clearTimeout(timeout);
    }
    // Paint the equivalent original slides before allowing another animation.
    let secondFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => { moving.current = false; });
    });
    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
    };
  }, [position]);

  function move(direction: number) {
    if (moving.current) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    moving.current = !reduceMotion;
    setPosition((current) => ({
      index: reduceMotion ? normalize(current.index + direction) : current.index + direction,
      animate: !reduceMotion,
    }));
  }

  return (
    <div className={styles.carousel} role="region" aria-roledescription="carousel" aria-label="Glarivo exhibition gallery">
      <div className={styles.stage}>
        <div
          id="exhibition-slides"
          className={styles.viewport}
          tabIndex={0}
          aria-label="Exhibition images. Use left and right arrow keys to browse."
          onKeyDown={(event) => {
            if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
            event.preventDefault();
            move(event.key === "ArrowLeft" ? -1 : 1);
          }}
          onPointerDown={(event) => {
            if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
            pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerUp={(event) => {
            const start = pointer.current;
            pointer.current = null;
            if (!start || start.id !== event.pointerId) return;
            const dx = event.clientX - start.x;
            const dy = event.clientY - start.y;
            if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.3) move(dx < 0 ? 1 : -1);
          }}
          onPointerCancel={() => { pointer.current = null; }}
          onLostPointerCapture={() => { pointer.current = null; }}
        >
          <div
            className={styles.track}
            data-animating={position.animate}
            style={{ "--position": position.index } as CSSProperties}
            onTransitionEnd={(event) => {
              if (event.target === event.currentTarget && event.propertyName === "transform") finishMove();
            }}
          >
            {slides.map((photo, index) => {
              const clone = index < copies || index >= copies + photos.length;
              return (
                <div key={`${photo.src}-${index}`} className={styles.slide} role="group" aria-roledescription="slide" aria-label={clone ? undefined : `${index - copies + 1} of ${photos.length}: ${photo.title}`} aria-hidden={clone || undefined}>
                  <Image src={photo.src} alt={clone ? "" : `AI-generated GLARIVO exhibition scene: ${photo.title.toLowerCase()}`} fill sizes="(max-width: 539px) 90vw, (max-width: 899px) 45vw, (max-width: 1466px) 30vw, 440px" draggable={false} />
                </div>
              );
            })}
          </div>
        </div>
        <button type="button" className={`${styles.arrow} ${styles.previous}`} aria-label="Previous exhibition image" aria-controls="exhibition-slides" onClick={() => move(-1)}><ArrowLeft size={21} strokeWidth={1.6} aria-hidden="true" /></button>
        <button type="button" className={`${styles.arrow} ${styles.next}`} aria-label="Next exhibition image" aria-controls="exhibition-slides" onClick={() => move(1)}><ArrowRight size={21} strokeWidth={1.6} aria-hidden="true" /></button>
      </div>
      <div className={styles.footer}>
        <p className={styles.caption}>AI-generated exhibition scenes.</p>
        <p className={styles.counter} aria-live="polite" aria-atomic="true"><span className={styles.srOnly}>Image </span>{String(active + 1).padStart(2, "0")}<span className={styles.separator}> / </span>{String(photos.length).padStart(2, "0")}</p>
      </div>
    </div>
  );
}
