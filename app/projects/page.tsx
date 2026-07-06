import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MosaicGrid } from '@/components/bento/MosaicGrid';
import { PROJECTS } from '@/lib/projects';

export const metadata: Metadata = {
  title: 'Projects — LEAN structures',
  description:
    'A selection of structural engineering projects by LEAN structures, including private houses, heritage renovations, and feature structures.',
};

export default function ProjectsPage() {
  return (
    <>
      <Header />

      <section className="page-head">
        <div className="wrap">
          <p className="eyebrow">Selected work</p>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)' }}>Projects</h1>
        </div>
      </section>

      <section style={{ paddingTop: 0 }}>
        <div className="wrap">
          <MosaicGrid projects={PROJECTS} />
        </div>
      </section>

      <Footer />
    </>
  );
}
