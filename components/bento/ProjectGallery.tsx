'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import type { ProjectImage } from '@/lib/projects';

export function ProjectGallery({ images }: { images: ProjectImage[] }) {
  const [api, setApi] = useState<CarouselApi>();
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!api) return;
    setSelected(api.selectedScrollSnap());
    const onSelect = () => setSelected(api.selectedScrollSnap());
    api.on('select', onSelect);
    return () => {
      api.off('select', onSelect);
    };
  }, [api]);

  if (images.length === 0) return null;

  return (
    <div>
      <Carousel setApi={setApi} className="w-full">
        <CarouselContent>
          {images.map((img) => (
            <CarouselItem key={img.src}>
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm bg-bg-mid">
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-contain"
                  sizes="(min-width: 768px) 60vw, 100vw"
                />
                {img.type === 'drawing' && (
                  <span className="absolute left-2 top-2 rounded-sm bg-ink/80 px-2 py-0.5 text-xs font-medium text-paper">
                    Drawing
                  </span>
                )}
              </div>
              {img.caption && <p className="mt-2 text-sm opacity-70">{img.caption}</p>}
            </CarouselItem>
          ))}
        </CarouselContent>
        {images.length > 1 && (
          <>
            <CarouselPrevious />
            <CarouselNext />
          </>
        )}
      </Carousel>

      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img.src}
              type="button"
              onClick={() => api?.scrollTo(i)}
              className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-sm border transition-opacity ${
                i === selected ? 'border-brand opacity-100' : 'border-transparent opacity-60'
              }`}
              aria-label={`Go to image ${i + 1}: ${img.alt}`}
            >
              <Image src={img.src} alt="" fill className="object-cover" sizes="56px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
