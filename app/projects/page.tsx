import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MosaicGrid } from '@/components/bento/MosaicGrid';
import { PROJECTS } from '@/lib/projects';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Projects — LEAN structures',
  description:
    'A selection of structural engineering projects by LEAN structures, including private houses, heritage renovations, and feature structures.',
};

export default function ProjectsPage() {
  return (
    <>
      <Header />

      <h1 className="visually-hidden">Projects</h1>

      <section className={styles.stage}>
        <div className={styles.verticalLabel} aria-hidden="true">
          Projects
        </div>
        <div className={styles.gridWrap}>
          <MosaicGrid projects={PROJECTS} />
        </div>
      </section>

      <Footer />
    </>
  );
}
