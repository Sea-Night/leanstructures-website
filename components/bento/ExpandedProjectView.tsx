'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import type { PoolItem } from '@/lib/bento-pool';

type Props = {
  item: PoolItem;
  anchorSide: 'left' | 'right';
  isFloor: boolean;
  onClose: () => void;
};

export function ExpandedProjectView({ item, anchorSide, isFloor, onClose }: Props) {
  const prefersReducedMotion = useReducedMotion();
  const { project } = item;
  const startIndex = Math.max(
    0,
    project.images.findIndex((img) => img.src === item.image.src)
  );
  const [imageIndex, setImageIndex] = useState(startIndex);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const currentImage = project.images[imageIndex] ?? item.image;

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  function cycleImage() {
    if (project.images.length <= 1) return;
    setImageIndex((i) => (i + 1) % project.images.length);
  }

  const photoFirst = isFloor ? true : anchorSide === 'left';
  const gridStyle = isFloor
    ? { gridTemplateRows: '2fr 1fr', gridTemplateColumns: '1fr' }
    : anchorSide === 'left'
      ? { gridTemplateColumns: '2fr 1fr' }
      : { gridTemplateColumns: '1fr 2fr' };

  const photoPane = (
    <motion.div
      layoutId={`mosaic-photo-${item.key}`}
      className="relative h-full w-full cursor-pointer overflow-hidden bg-bg-mid"
      style={{ order: isFloor ? 1 : photoFirst ? 1 : 2 }}
      onClick={cycleImage}
      role="button"
      tabIndex={0}
      aria-label={
        project.images.length > 1
          ? 'Show next photo'
          : `${project.title}: ${currentImage.alt}`
      }
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          cycleImage();
        }
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentImage.src}
          initial={prefersReducedMotion ? false : { opacity: 0, filter: 'blur(14px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, filter: 'blur(14px)' }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.35 }}
          className="absolute inset-0"
        >
          <Image
            src={currentImage.src}
            alt={`${project.title}: ${currentImage.alt}`}
            fill
            className="object-cover"
            sizes="(min-width: 768px) 60vw, 100vw"
            priority
          />
        </motion.div>
      </AnimatePresence>
      {project.images.length > 1 && (
        <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
          {imageIndex + 1} / {project.images.length}
        </span>
      )}
    </motion.div>
  );

  const textPane = (
    <div
      style={{ order: isFloor ? 2 : photoFirst ? 2 : 1 }}
      className="relative flex h-full w-full flex-col justify-center overflow-y-auto bg-brand p-6 text-paper md:p-8"
    >
      <p className="text-xs uppercase tracking-[0.12em] opacity-70">
        {project.status === 'coming-soon' ? 'Coming soon' : 'Selected work'}
      </p>
      <h3 className="font-display mt-2 text-xl font-semibold md:text-2xl">{project.title}</h3>
      <p className="mt-1 text-sm opacity-80">{project.meta}</p>
      {project.externalLink && (
        <a
          href={project.externalLink.href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex w-fit border-b border-paper/50 text-sm font-medium"
        >
          {project.externalLink.label} &#8599;
        </a>
      )}
      {project.structuralNotes && (
        <div className="mt-4 space-y-3 text-sm leading-relaxed opacity-90">
          {project.structuralNotes.split('\n\n').map((para) => (
            <p key={para.slice(0, 40)}>{para}</p>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <>
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
        className="fixed inset-0 z-40 bg-ink/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed inset-4 z-50 flex items-center justify-center md:inset-10"
        onClick={onClose}
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={`${project.title} — project details`}
          initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
          onClick={(e) => e.stopPropagation()}
          className="grid h-full max-h-[80vh] w-full max-w-6xl overflow-hidden rounded-sm shadow-2xl"
          style={gridStyle}
        >
          {photoPane}
          {textPane}
        </motion.div>
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Close project"
          className="fixed right-6 top-6 z-50 rounded-full bg-paper/90 px-4 py-2 text-sm font-medium text-ink"
        >
          Close
        </button>
      </div>
    </>
  );
}
