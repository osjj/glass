"use client";

import Image from "next/image";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { useState } from "react";

type GalleryImage = { url: string; alt: string };

export function ProductDetailGallery({ images }: { images: GalleryImage[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex] ?? images[0];

  function move(direction: -1 | 1) {
    setActiveIndex((current) => (current + direction + images.length) % images.length);
  }

  if (!activeImage) return null;

  return (
    <div className="min-w-0">
      <div className="group relative aspect-[800/631] overflow-hidden border border-[var(--line)] bg-[#f7f7f7]">
        <Image
          src={activeImage.url}
          alt={activeImage.alt}
          fill
          priority
          unoptimized
          sizes="(min-width: 1280px) 38vw, (min-width: 1024px) 48vw, 100vw"
          className="object-cover"
        />
        {images.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => move(-1)}
              aria-label="Previous product image"
              className="absolute left-0 top-1/2 grid h-14 w-10 -translate-y-1/2 place-items-center bg-white/75 text-[#626a70] transition hover:bg-white"
            >
              <CaretLeft size={28} />
            </button>
            <button
              type="button"
              onClick={() => move(1)}
              aria-label="Next product image"
              className="absolute right-0 top-1/2 grid h-14 w-10 -translate-y-1/2 place-items-center bg-white/75 text-[#626a70] transition hover:bg-white"
            >
              <CaretRight size={28} />
            </button>
          </>
        ) : null}
      </div>

      {images.length > 1 ? (
        <div className="mt-4 hidden grid-cols-6 gap-2.5 sm:grid">
          {images.slice(0, 12).map((image, index) => (
            <button
              key={`${image.url}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`View product image ${index + 1}`}
              aria-current={index === activeIndex ? "true" : undefined}
              className={`relative aspect-square overflow-hidden border bg-white p-0.5 ${
                index === activeIndex ? "border-2 border-[#075989]" : "border-[var(--line)]"
              }`}
            >
              <Image
                src={image.url}
                alt=""
                fill
                unoptimized
                sizes="110px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
