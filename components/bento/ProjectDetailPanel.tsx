'use client';

import type { Project } from '@/lib/projects';
import { ProjectGallery } from './ProjectGallery';

type Props = {
  project: Project;
  onClose: () => void;
  titleId: string;
  panelId: string;
};

export function ProjectDetailPanel({ project, onClose, titleId, panelId }: Props) {
  const isComingSoon = project.status === 'coming-soon';

  return (
    <div
      id={panelId}
      role="tabpanel"
      aria-labelledby={titleId}
      className="grid gap-8 p-6 md:grid-cols-2 md:p-8"
    >
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">{isComingSoon ? 'Coming soon' : 'Selected work'}</p>
            <h3 tabIndex={-1} className="font-display mt-1 text-2xl font-semibold">
              {project.title}
            </h3>
            <p className="mt-1 text-sm opacity-70">{project.meta}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close project"
            className="shrink-0 rounded-full border border-ink/20 px-3 py-1 text-sm"
          >
            Close
          </button>
        </div>

        {project.externalLink && (
          <a
            href={project.externalLink.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-link mt-4 inline-flex"
          >
            {project.externalLink.label} &#8599;
          </a>
        )}

        {project.structuralNotes && (
          <div className="mt-6 space-y-4 text-sm leading-relaxed opacity-90">
            {project.structuralNotes.split('\n\n').map((para) => (
              <p key={para.slice(0, 40)}>{para}</p>
            ))}
          </div>
        )}
      </div>

      <ProjectGallery images={project.images} />
    </div>
  );
}
