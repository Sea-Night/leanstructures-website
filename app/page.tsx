import Image from 'next/image';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { HeroTruss } from '@/components/HeroTruss';
import { KeywordCycle } from '@/components/KeywordCycle';
import { ParallaxLayer } from '@/components/ParallaxLayer';
import { RevealOnScroll } from '@/components/RevealOnScroll';
import styles from './page.module.css';

const businessSchema = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  name: 'LEAN structures',
  description:
    'Structural engineering consultancy handling everyday domestic work — extensions, loft conversions, structural calculations, beam design, party wall matters — alongside specialist projects in structural timber, Passivhaus and AECB high-performance houses, natural and low-carbon materials, and heritage structures.',
  url: 'https://leanstructures.co.uk',
  email: 'info@leanstructures.co.uk',
  telephone: '+441873903710',
  areaServed: ['South East Wales', 'Monmouthshire', 'United Kingdom'],
  address: {
    '@type': 'PostalAddress',
    addressRegion: 'Monmouthshire',
    addressCountry: 'GB',
  },
  sameAs: ['https://www.instagram.com/lean_structures/'],
  serviceType: [
    'Domestic structural engineering',
    'Extensions and loft conversions',
    'Structural calculations and beam design',
    'Party wall matters',
    'Structural timber design',
    'Passivhaus and AECB structural design',
    'Natural and low-carbon materials',
    'Heritage structural engineering',
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(businessSchema) }}
      />
      <div className={styles.hero}>
        <Header variant="hero-nav" />
        <HeroTruss />
        <div className={styles.heroCaption}>
          <KeywordCycle />
          <span className="visually-hidden">LEAN structures</span>
          <p>
            Structural engineering for natural materials, heritage and high-performance sustainable
            design.
          </p>
        </div>
      </div>

      <section className={styles.intro}>
        <ParallaxLayer speed={0.25} className={styles.introBgOversize} />
        <div className="wrap">
          <RevealOnScroll>
            <p className={styles.statement}>
              Structure that does <span className={styles.accent}>exactly</span> enough, and no more.
            </p>
          </RevealOnScroll>
          <RevealOnScroll delay={0.1}>
            <p className={styles.sub}>
              LEAN structures is a structural engineering practice based in Monmouthshire, South East
              Wales. We focus on South East Wales and its borders, but take on projects across the UK
              and overseas. We specialise in structural timber, high-performance sustainable houses,
              natural and low-carbon materials, and heritage buildings — working with architects and
              clients who want a structural engineer genuinely engaged with what the building is
              trying to be.
            </p>
          </RevealOnScroll>
        </div>
      </section>

      <section className="tint">
        <div className={`wrap ${styles.philosophy}`}>
          <RevealOnScroll>
            <p className="eyebrow">Our philosophy</p>
            <h2>LEAN design</h2>
          </RevealOnScroll>
          <RevealOnScroll delay={0.1}>
            <div className={styles.stat}>50%</div>
            <p className={styles.statLabel}>
              Structural engineers typically design to an average utilisation of 50–60% — the rest is
              often over-specified, adding cost and embodied carbon without adding performance.
            </p>
            <p style={{ marginTop: 28, maxWidth: '56ch', opacity: 0.85 }}>
              This is partly a result of designers protecting themselves from late design changes, and
              partly a fractured industry that undervalues collaboration and communication. LEAN
              design requires greater input at early project stages and more effective communication
              between disciplines — the result is high-performance, economical, low-waste structures,
              built precisely to what each project needs, and nothing more.
            </p>
          </RevealOnScroll>
        </div>
      </section>

      <section className={styles.featurePhoto}>
        <div className={styles.featurePhotoFrame}>
          <ParallaxLayer speed={0.18} className={styles.featurePhotoOversize}>
            <Image
              src="/images/canopy-install.jpg"
              alt="Hand-painted timber canopy panels of the Dog Walking Pavilion being installed at East Quay, Watchet"
              fill
              className="object-cover"
              sizes="100vw"
            />
          </ParallaxLayer>
        </div>
        <RevealOnScroll>
          <p className={styles.featurePhotoCaption}>
            On site: the <span className={styles.highlightRose}>Dog Walking Pavilion</span> at East
            Quay, Watchet, mid-installation.
          </p>
        </RevealOnScroll>
      </section>

      <section id="services" style={{ background: 'var(--bg-light)', position: 'relative' }}>
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">What we do</p>
            <h2>Areas of practice</h2>
          </div>

          <RevealOnScroll>
            <div className="service-row">
              <h3>Structural timber</h3>
              <p>
                Timber is one of the structural materials people actually want to see. We design green
                oak frames the way carpenters have for centuries, and engineered timber — CLT, glulam,
                LVL — with the same care. Same material, same honesty about what&rsquo;s holding the
                building up.
              </p>
            </div>
          </RevealOnScroll>
          <RevealOnScroll delay={0.1}>
            <div className="service-row">
              <h3>High-performance houses</h3>
              <p>
                A Passivhaus or AECB building lives or dies at the junctions. Get the thermal bridging
                wrong at the eaves or the foundation and it shows up in the numbers, no matter how good
                the insulation is everywhere else. We aim to design structure and performance together
                from the first sketch, rather than retrofitting one around the other once the drawings
                are already fixed.
              </p>
            </div>
          </RevealOnScroll>
          <RevealOnScroll delay={0.2}>
            <div className="service-row">
              <h3>Natural and low-carbon materials</h3>
              <p>
                Straw bale, rammed earth, hempcrete, bamboo. These materials store carbon instead of
                releasing it, and they behave structurally in ways that standard design codes
                don&rsquo;t fully cover. Whether it&rsquo;s a technique that&rsquo;s been used for
                centuries or one the industry is only just working out, we&rsquo;re always excited to
                bring low-carbon alternatives into a project.
              </p>
            </div>
          </RevealOnScroll>
          <RevealOnScroll delay={0.3}>
            <div className="service-row">
              <h3>Heritage structures</h3>
              <p>
                Historic buildings carry their structural history in them — the timber frame shows how
                it was assembled, the masonry can reveal how loads have shifted over centuries. We read
                that story before adding our chapter.
              </p>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      <section className="tint" id="how-we-work">
        <div className="wrap">
          <div className="section-head">
            <p className="eyebrow">Approach</p>
            <h2>How we work</h2>
          </div>
          <div className="how-we-work-grid">
            <RevealOnScroll>
              <div className="how-item">
                <h3>Hand calculations</h3>
                <p>
                  The foundation of good structural engineering is understanding what is happening in a
                  structure well enough to predict it with a pencil and paper. We maintain hand
                  calculations as a discipline — they keep the engineer connected to the physics, and
                  they provide a check on every computational output.
                </p>
              </div>
            </RevealOnScroll>
            <RevealOnScroll delay={0.1}>
              <div className="how-item">
                <h3>Computational analysis</h3>
                <p>
                  We use finite element modelling (FEM) for structural behaviour and form optimisation
                  of complex or non-standard structures, and computational fluid dynamics (CFD) for
                  wind load analysis on complex geometries where standard code methods would be overly
                  conservative or simply don&rsquo;t apply.
                </p>
              </div>
            </RevealOnScroll>
            <RevealOnScroll delay={0.2}>
              <div className="how-item">
                <h3>Flexible delivery</h3>
                <p>
                  We work in BIM, CAD, hand drawings and PDFs — whichever suits the project and the
                  client. Full BIM coordination is available for publicly funded and larger commercial
                  projects where it is required, but we don&rsquo;t impose it on projects where a
                  well-detailed drawing set does the job more efficiently.
                </p>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      <section className={styles.featurePhoto}>
        <div className={styles.featurePhotoFrame}>
          <ParallaxLayer speed={0.18} className={styles.featurePhotoOversize}>
            <Image
              src="/images/westonbirt-playspace.jpg"
              alt="Green oak acorn watchtower and timber fence panels at the new play space, Westonbirt Arboretum"
              fill
              className="object-cover"
              sizes="100vw"
            />
          </ParallaxLayer>
        </div>
        <RevealOnScroll>
          <p className={styles.featurePhotoCaption}>
            The <span className={styles.highlightRose}>Acorn Watchtower</span> — a new play space at
            Westonbirt Arboretum, green oak and sweet chestnut.
          </p>
        </RevealOnScroll>
      </section>

      <section className="tint" id="contact">
        <div className={`wrap ${styles.contactBlock}`}>
          <RevealOnScroll>
            <p className="eyebrow">Get in touch</p>
            <h2>Send us your drawings</h2>
            <p style={{ marginTop: 20, maxWidth: '50ch', opacity: 0.85 }}>
              If you have a project you&rsquo;d like us to work on, send us your drawings or details
              and we&rsquo;ll get back to you. Based in Monmouthshire, we focus on South East Wales and
              its borders, but work on projects across the UK and overseas.
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
