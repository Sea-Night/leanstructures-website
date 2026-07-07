import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { RevealOnScroll } from '@/components/RevealOnScroll';
import { ARTICLES } from '@/lib/articles';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Articles — LEAN structures',
  description: 'Technical articles from LEAN structures on structural engineering, sustainable design, and building practice.',
};

export default function ArticlesPage() {
  return (
    <>
      <Header />

      <section className="page-head">
        <div className="wrap">
          <p className="eyebrow">Technical writing</p>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)' }}>Articles</h1>
        </div>
      </section>

      <section style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className={styles.articleList}>
            {ARTICLES.map((article, i) => (
              <RevealOnScroll key={article.href} delay={Math.min(i, 3) * 0.1}>
                <Link className={styles.articleRow} href={article.href}>
                  <span className={styles.articleDate}>{article.label}</span>
                  <span className={styles.articleTitle}>{article.title}</span>
                  <span className={styles.articleArrow}>Read &rarr;</span>
                </Link>
              </RevealOnScroll>
            ))}
          </div>
          <p style={{ marginTop: 32, fontSize: 14, opacity: 0.6, maxWidth: '50ch' }}>
            Send over a draft or some notes for an article and it&rsquo;ll turn into a page like the
            ones above, linked here automatically.
          </p>
        </div>
      </section>

      <div className="hidden md:block">
        <Footer />
      </div>
    </>
  );
}
