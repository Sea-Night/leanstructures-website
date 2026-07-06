'use client';

import { motion, useReducedMotion } from 'motion/react';

/** House style for crediting a collaborating architect: bold, slightly
 * larger than surrounding text, slowly fading between the brand's rose
 * and teal accents, linked out to their site. Reused anywhere a project
 * credits an architect — add `architect: { name, url }` to a project in
 * lib/projects.ts and include the literal token `{architect}` in its
 * `meta` string; ExpandedProjectView splices this component in for you. */
export function ArchitectLink({ name, url }: { name: string; url: string }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="font-bold text-[1.08em]"
      style={{ color: prefersReducedMotion ? 'var(--accent-rose)' : undefined }}
      animate={
        prefersReducedMotion
          ? undefined
          : { color: ['#C0596A', '#2E7A6E', '#C0596A'] }
      }
      transition={
        prefersReducedMotion
          ? undefined
          : { duration: 8, repeat: Infinity, ease: 'easeInOut' }
      }
    >
      {name}
    </motion.a>
  );
}
