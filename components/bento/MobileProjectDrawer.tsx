'use client';

import { Drawer } from 'vaul';
import type { Project } from '@/lib/projects';
import { ProjectDetailPanel } from './ProjectDetailPanel';

type Props = {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function MobileProjectDrawer({ project, open, onOpenChange }: Props) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 flex max-h-[88vh] flex-col rounded-t-lg bg-bg-light outline-none">
          <div className="mx-auto mt-3 h-1.5 w-10 shrink-0 rounded-full bg-ink/20" />
          <Drawer.Title className="visually-hidden">{project?.title ?? 'Project details'}</Drawer.Title>
          <div className="overflow-y-auto">
            {project && (
              <ProjectDetailPanel
                project={project}
                onClose={() => onOpenChange(false)}
                titleId="mobile-project-title"
                panelId="mobile-project-panel"
              />
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
