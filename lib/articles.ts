/* ============================================================
   ARTICLES
   To publish a new article: create its page under app/articles/<slug>/,
   then add ONE entry to the list below (newest first).
   Nothing else on the site needs editing.
   ============================================================ */

export type Article = {
  href: string;
  title: string;
  label: string;
};

export const ARTICLES: Article[] = [
  {
    href: '/articles/opening-a-load-bearing-wall',
    title: 'Opening a load-bearing wall: lintel, RSJ, goalpost or box frame',
    label: 'Featured',
  },
];
