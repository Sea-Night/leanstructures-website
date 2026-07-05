import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'What LEAN design actually means in practice — LEAN structures',
};

export default function ExampleArticlePage() {
  return (
    <>
      <Header />

      <section className="article-head">
        <div className="wrap">
          <Link className="back-link" href="/articles">
            &larr; All articles
          </Link>
          <p className="eyebrow">Coming soon</p>
          <h1>What LEAN design actually means in practice</h1>
        </div>
      </section>

      <section style={{ paddingTop: 0 }}>
        <div className="wrap article-body">
          <p>
            This is a placeholder article page, set up so the structure is ready as soon as
            there&rsquo;s real content to add. Send over a draft, some notes, or even a rough voice
            memo&rsquo;s worth of thoughts, and this will become a proper article.
          </p>
          <h2>How this page works</h2>
          <p>
            Every article on the site follows this same template: a short title, an optional section
            heading or two, and body text set at a comfortable reading width. New articles get their
            own page under <code>app/articles/</code> and a new row added to{' '}
            <code>lib/articles.ts</code>.
          </p>
        </div>
      </section>

      <Footer />
    </>
  );
}
