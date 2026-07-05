'use client';

import { useState } from 'react';
import { LayoutGroup } from 'motion/react';
import type { Project } from '@/lib/projects';
import { BentoTile } from './BentoTile';
import { MobileProjectDrawer } from './MobileProjectDrawer';
import { useIsDesktop } from './use-is-desktop';

export function BentoGrid({ projects }: { projects: Project[] }) {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const isDesktop = useIsDesktop();
  const activeProject = projects.find((p) => p.slug === activeSlug) ?? null;

  return (
    <>
      <LayoutGroup>
        <div
          role="tablist"
          aria-label="Projects"
          className="grid grid-cols-2 gap-4 [grid-auto-flow:dense] md:grid-cols-4 md:auto-rows-[180px]"
        >
          {projects.map((project, index) => (
            <BentoTile
              key={project.slug}
              project={project}
              isActive={isDesktop && activeSlug === project.slug}
              isAnyActive={isDesktop && activeSlug !== null}
              onSelect={() => setActiveSlug(project.slug)}
              onClose={() => setActiveSlug(null)}
              priority={index === 0}
            />
          ))}
        </div>
      </LayoutGroup>

      {!isDesktop && (
        <MobileProjectDrawer
          project={activeProject}
          open={activeSlug !== null}
          onOpenChange={(open) => {
            if (!open) setActiveSlug(null);
          }}
        />
      )}
    </>
  );
}
