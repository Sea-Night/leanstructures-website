import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { RevealOnScroll } from '@/components/RevealOnScroll';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Contact — LEAN structures',
  description:
    'Get in touch with LEAN structures — send your drawings or project details and we will get back to you.',
};

export default function ContactPage() {
  return (
    <>
      <Header />

      <section className="tint" id="contact" style={{ paddingTop: 'clamp(140px, 16vw, 200px)' }}>
        <div className={`wrap ${styles.contactBlock}`}>
          <RevealOnScroll>
            <p className="eyebrow">Get in touch</p>
            <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)' }}>Send us your drawings</h1>
            <p style={{ marginTop: 20, maxWidth: '50ch', opacity: 0.85 }}>
              If you have a project you&rsquo;d like us to work on, send us your drawings or
              details and we&rsquo;ll get back to you. Based in Monmouthshire, we focus on South
              East Wales and its borders, but work on projects across the UK and overseas.
            </p>
          </RevealOnScroll>
          <RevealOnScroll delay={0.1}>
            <div className={styles.contactDetail}>
              <div className={styles.row}>
                <a href="mailto:info@leanstructures.co.uk">info@leanstructures.co.uk</a>
              </div>
              <div className={styles.row}>
                <a href="tel:+441873903710">01873 903 710</a>
              </div>
              <p className={styles.areas}>South East Wales &middot; UK wide &middot; Overseas</p>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      <Footer />
    </>
  );
}
