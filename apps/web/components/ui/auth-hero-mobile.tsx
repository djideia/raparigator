"use client";

import Image from "next/image";
import { BackButton } from "@/components/ui/back-button";
import { BrandWordmark } from "@/components/ui/brand-wordmark";

interface AuthHeroMobileProps {
  images: Array<{ src: string; heroPosition: string }>;
  activeIndex?: number;
  eyebrow: string;
  sizes?: string;
  unoptimized?: boolean;
}

export function AuthHeroMobile({
  images,
  activeIndex = 0,
  eyebrow,
  sizes = "50vw",
  unoptimized = false,
}: AuthHeroMobileProps) {
  return (
    <div className="relative -mx-4 h-[min(12.5rem,27svh)] shrink-0 overflow-hidden rounded-b-[28px] bg-zinc-950 shadow-[0_14px_32px_-18px_rgba(9,9,11,0.55)] sm:-mx-6 md:hidden">
      <div className="absolute inset-y-0 right-0 w-1/2 [mask-image:linear-gradient(to_right,transparent_0%,black_26%)] [-webkit-mask-image:linear-gradient(to_right,transparent_0%,black_26%)]">
        {images.map((image, index) => {
          const isActive = index === activeIndex % images.length;

          return (
            <Image
              key={image.src}
              src={image.src}
              alt=""
              fill
              priority={index === 0}
              quality={90}
              unoptimized={unoptimized}
              sizes={sizes}
              style={{ objectPosition: image.heroPosition }}
              className={`object-cover transition-opacity duration-1000 ease-in-out ${
                isActive ? "opacity-100" : "opacity-0"
              }`}
            />
          );
        })}
      </div>

      <div className="relative z-10 flex h-full flex-col justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top,0px))] pb-7 text-white sm:px-6">
        <div className="flex items-center gap-2">
          <BackButton />
          <BrandWordmark tone="light" className="drop-shadow-[0_2px_8px_rgba(0,0,0,0.55)]" />
        </div>
        <div className="max-w-40">
          <div className="h-px w-10 bg-wine-400/70" />
          <p className="mt-2.5 text-[10px] font-black uppercase leading-relaxed tracking-[0.25em] text-white/65">
            {eyebrow}
          </p>
        </div>
      </div>
    </div>
  );
}
