'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, useReducedMotion, AnimatePresence } from 'motion/react';
import type { Project } from '@/lib/projects';
import { BENTO_SIZE_CLASSES, BENTO_ACTIVE_CLASS, BENTO_COLLAPSED_CLASS } from '@/lib/bento-sizes';
import { ProjectDetailPanel } from './ProjectDetailPanel';

type Props = {
  project: Project;
  isActive: boolean;
  isAnyActive: boolean;
  onSelect: () => void;
  onClose: () => void;
  priority?: boolean;
};

export function BentoTile({ project, isActive, isAnyActive, onSelect, onClose, priority }: Props) {
  const prefersReducedMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const isComingSoon = project.status === 'coming-soon';
  const tabId = `project-tab-${project.slug}`;
  const panelId = `project-panel-${project.slug}`;

  const sizeClass = isActive
    ? BENTO_ACTIVE_CLASS
    : isAnyActive
      ? BENTO_COLLAPSED_CLASS
      : BENTO_SIZE_CLASSES[project.size];

  useEffect(() => {
    if (isActive) {
      panelRef.current?.querySelector('h3')?.focus();
    }
  }, [isActive]);

  return (
    <motion.div
      layout={!prefersReducedMotion}
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : { type: 'spring', stiffness: 380, damping: 38 }
      }
      className={`relative overflow-hidden rounded-sm bg-bg-mid ${sizeClass} ${
        isComingSoon ? 'opacity-60' : ''
      }`}
      role="tab"
      id={tabId}
      aria-selected={isActive}
      aria-controls={panelId}
    >
      {!isActive && (
        <button
          type="button"
          onClick={isComingSoon ? undefined : onSelect}
          disabled={isComingSoon}
          className="absolute inset-0 z-10 h-full w-full cursor-pointer disabled:cursor-default"
          aria-label={isComingSoon ? project.title : `View ${project.title}`}
        />
      )}

      <motion.div
        layout={!prefersReducedMotion}
        transition={
          prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 38 }
        }
        className={`absolute inset-x-0 top-0 ${isActive ? 'h-40 md:h-56' : 'inset-y-0'}`}
      >
        <Image
          src={project.coverImage.src}
          alt={project.coverImage.alt}
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 50vw, 100vw"
          priority={priority}
        />
      </motion.div>

      {!isActive && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <p className="font-display text-sm font-semibold text-white">{project.title}</p>
          {!isAnyActive && <p className="mt-1 text-xs text-white/80">{project.meta}</p>}
        </div>
      )}

      <AnimatePresence>
        {isActive && (
          <motion.div
            ref={panelRef}
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.25, delay: prefersReducedMotion ? 0 : 0.12 }}
            className="absolute inset-0 z-20 mt-40 flex flex-col overflow-y-auto bg-bg-light md:mt-56"
          >
            <ProjectDetailPanel project={project} onClose={onClose} titleId={tabId} panelId={panelId} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
