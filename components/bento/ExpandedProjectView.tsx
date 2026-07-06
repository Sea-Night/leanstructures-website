'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, useReducedMotion, type PanInfo } from 'motion/react';
import type { PoolItem } from '@/lib/bento-pool';

type Props = {
  item: PoolItem;
  onClose: () => void;
};

const SWIPE_THRESHOLD = 60;

function ChevronIcon({ direction }: { direction: 'left' | 'right' }) {
  const points = direction === 'left' ? '15 6 9 12 15 18' : '9 6 15 12 9 18';
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <polyline
        points={points}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ExpandedProjectView({ item, onClose }: Props) {
  const prefersReducedMotion = useReducedMotion();
  const { project } = item;
  const startIndex = Math.max(
    0,
    project.images.findIndex((img) => img.src === item.image.src)
  );
  const [imageIndex, setImageIndex] = useState(startIndex);
  const [notesOpen, setNotesOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const currentImage = project.images[imageIndex] ?? item.image;
  const hasMultiple = project.images.length > 1;

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  function cycleNext() {
    if (!hasMultiple) return;
    setImageIndex((i) => (i + 1) % project.images.length);
  }
  function cyclePrev() {
    if (!hasMultiple) return;
    setImageIndex((i) => (i - 1 + project.images.length) % project.images.length);
  }
  function toggleNotes() {
    setNotesOpen((v) => !v);
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') cycleNext();
      else if (e.key === 'ArrowLeft') cyclePrev();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose, project.images.length]);

  function handlePanEnd(_event: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) {
    if (info.offset.x <= -SWIPE_THRESHOLD) cycleNext();
    else if (info.offset.x >= SWIPE_THRESHOLD) cyclePrev();
  }

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
          className="relative h-full max-h-[82vh] w-full max-w-4xl overflow-hidden rounded-sm shadow-2xl"
        >
          <motion.div
            layoutId={`mosaic-photo-${item.key}`}
            className="relative h-full w-full touch-pan-y select-none overflow-hidden bg-bg-mid"
            onPanEnd={handlePanEnd}
            onClick={toggleNotes}
            role="button"
            tabIndex={0}
            aria-label={`${project.title}: ${currentImage.alt}. ${
              hasMultiple ? 'Swipe or use arrow keys for more photos. ' : ''
            }Press Enter to ${notesOpen ? 'hide' : 'show'} project notes.`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleNotes();
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
                {/* Ken Burns: slow zoom + downward drift while this photo is showing */}
                <motion.div
                  className="absolute inset-0"
                  initial={prefersReducedMotion ? false : { scale: 1, y: '0%' }}
                  animate={prefersReducedMotion ? undefined : { scale: 1.1, y: '3%' }}
                  transition={{ duration: 9, ease: 'easeOut' }}
                >
                  <Image
                    src={currentImage.src}
                    alt={`${project.title}: ${currentImage.alt}`}
                    fill
                    className="object-cover"
                    sizes="90vw"
                    priority
                  />
                </motion.div>
              </motion.div>
            </AnimatePresence>

            {hasMultiple && (
              <>
                <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
                  {imageIndex + 1} / {project.images.length}
                </span>
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    cyclePrev();
                  }}
                  aria-label="Previous photo"
                  className="absolute left-2 top-1/2 flex -translate-y-1/2 items-center justify-center text-white/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)] transition-transform hover:scale-110"
                >
                  <ChevronIcon direction="left" />
                </button>
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    cycleNext();
                  }}
                  aria-label="Next photo"
                  className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center justify-center text-white/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)] transition-transform hover:scale-110"
                >
                  <ChevronIcon direction="right" />
                </button>
              </>
            )}

            <AnimatePresence>
              {notesOpen && (
                <motion.div
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 24 }}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute inset-x-0 bottom-0 max-h-[75%] overflow-y-auto bg-gradient-to-t from-brand/70 via-brand/45 to-brand/0 p-6 text-paper backdrop-blur-[3px] md:p-8"
                >
                  <p className="text-xs uppercase tracking-[0.12em] opacity-70">
                    {project.status === 'coming-soon' ? 'Coming soon' : 'Selected work'}
                  </p>
                  <h3 className="font-display mt-2 text-xl font-semibold md:text-2xl">
                    {project.title}
                  </h3>
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
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
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
