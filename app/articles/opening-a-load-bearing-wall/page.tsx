import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { WallOpeningDiagram, type WallOpeningNote } from '@/components/articles/WallOpeningDiagram';

export const metadata: Metadata = {
  title: 'Load-Bearing Wall Openings: Lintel, RSJ, Goalpost or Box Frame — LEAN structures',
  description:
    "It's not always a steel beam. Why a lintel, RSJ, goalpost or box frame each suits a different opening — and what decides which one your load-bearing wall needs.",
};

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Load-Bearing Wall Openings: Lintel, RSJ, Goalpost or Box Frame',
  description:
    "It's not always a steel beam. Why a lintel, RSJ, goalpost or box frame each suits a different opening, and what decides which one your load-bearing wall needs.",
  author: { '@type': 'Organization', name: 'LEAN structures' },
  publisher: { '@type': 'Organization', name: 'LEAN structures' },
  about: 'Structural options for openings in load-bearing walls',
  articleSection: 'Structural engineering',
  inLanguage: 'en-GB',
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Is this wall actually load-bearing?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The honest answer is that you can rarely tell for certain from the room. Direction of the floor joists above, the wall’s thickness, and what sits over it all matter — and the only reliable way to know is to have it checked.',
      },
    },
    {
      '@type': 'Question',
      name: 'What size RSJ or beam do I need?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'There is no lookup table that survives contact with a real house. The span direction of the floor, the masonry and any chimney above, and the roof all change the load — so two terraces that look identical can still need different beams. And even where the structure genuinely is identical, the glazing can decide it: a beam is often sized by how far it is allowed to deflect, and different window or door systems tolerate anywhere from about 2 mm to 10 mm. It is a calculation, not a guess.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is an ‘RSJ’ the same as a UB or steel beam?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'In everyday use, yes — ‘RSJ’ is just what most people call the steel beam over an opening, and any engineer will know what you mean. Strictly, a Rolled Steel Joist is an older rolled section with tapered flanges; the beams specified today are almost always Universal Beams (UB) or Universal Columns (UC), whose flat, parallel flanges are far easier to bolt and connect to — which is why your engineer writes ‘UB’ where you said ‘RSJ’. Same idea, current section.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I just put a beam in, or do I need columns?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'It depends on how much wall is left either side to take the bearing — and to keep bracing the house. Run short of return, or overload the foundation beneath, and the beam has to grow legs: a goalpost or a box frame down to the ground.',
      },
    },
    {
      '@type': 'Question',
      name: 'How wide can I go — can I take the whole wall out?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Often yes, but the further you go the more the solution changes shape. Past roughly two-thirds of the wall, or with little return left, you’re into a frame rather than a beam, and the cost steps with it.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do I need a structural engineer and Building Control?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes to both for anything load-bearing. An engineer designs and calculates the opening; the calculations and drawing form part of the Building Control submission your local authority signs off.',
      },
    },
    {
      '@type': 'Question',
      name: 'Will it cause cracks, sagging or a bouncy floor?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Done properly, no — deflection is designed out, not just strength. Problems tend to appear later when a wall has been removed without the load being properly redirected, which is the part you cannot see once it’s plastered over.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do the foundations need underpinning?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sometimes. New columns put large loads into small areas of ground, and if the existing foundation can’t take that, you need new pads, a ground beam, or local strengthening. It is one of the most overlooked parts of the job.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do I need a temporary works design?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Usually not — the builder normally takes responsibility for the temporary support. Traditionally that means needles through the wall with props on both sides while the beam goes in; increasingly it’s a proprietary needle system such as a Prop Pal, which supports both leaves of the wall and lifts the props clear of the work, at roughly three times the capacity of a Strongboy. Be wary of anyone propping from one side only with Strongboys — rated at around 340 kg each and prone to bending the prop sideways, they’re easily overloaded under real floor and roof loads. For larger or more complex openings, a proper temporary works design is worth having.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do I need a party wall agreement?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'If you’re working on or near a shared wall — common in terraces — then very likely. It’s a separate process from Building Control and worth starting early.',
      },
    },
  ],
};

const NOTES: WallOpeningNote[] = [
  {
    in: 0.0171,
    out: 0.0877,
    content: (
      <>
        <p className="v-client">Can I put an opening in a load-bearing wall?</p>
        <p className="v-narr">Take the rear wall of a brick house.</p>
        <p className="v-eng">
          <span className="v-eng__label">Structural</span>
          It&rsquo;s doing several jobs at once: it&rsquo;s the weather skin, it carries its own weight
          and the floor and roof above, and it passes all of that down to the foundation.
        </p>
      </>
    ),
  },
  {
    in: 0.0877,
    out: 0.1562,
    content: (
      <>
        <p className="v-narr">Start with a simple window.</p>
        <p className="v-eng">
          <span className="v-eng__label">Structural</span>
          A small opening needs only an off-the-shelf lintel. The brickwork arches over it, so the
          lintel takes just a 45° triangle of masonry directly above — plus the floor load falling
          within a wider 60° zone of influence.
        </p>
      </>
    ),
  },
  {
    in: 0.1562,
    out: 0.2186,
    content: (
      <>
        <p className="v-client">Can we make it bigger, for more light?</p>
        <p className="v-eng">
          <span className="v-eng__label">Structural</span>
          Above 1.2 m a heavier stock lintel still copes; from there it needs noticeably more bearing.
          The load keeps the same triangular shape — it just grows with the opening.
        </p>
      </>
    ),
  },
  {
    in: 0.2186,
    out: 0.3356,
    content: (
      <>
        <p className="v-client">What about wide doors onto the garden?</p>
        <p className="v-eng">
          <span className="v-eng__label">Structural</span>
          Go wider still and the opening sits too close to the windows above — too little masonry
          between them for the brickwork to arch. A tall rectangle of wall and floor load now bears
          straight onto the opening rather than a neat triangle, so a steel beam takes over. What
          sizes that beam can surprise you: set bifold or sliding doors beneath it, and their slim
          frames tolerate so little movement that it&rsquo;s governed by how little it may deflect
          rather than by strength — often far heavier than the span alone suggests.
        </p>
      </>
    ),
  },
  {
    in: 0.3356,
    out: 0.4027,
    content: (
      <>
        <p className="v-client">So why won&rsquo;t a beam just do?</p>
        <p className="v-narr">Now the load itself becomes the problem.</p>
        <p className="v-eng">
          <span className="v-eng__label">Structural</span>
          It has to go somewhere, and two things can give. A narrow masonry pier — often soft in
          Victorian houses — can be overstressed. Or the load reaching the foundation climbs past
          what the ground already carries; more than about 10% over that, and you risk settling the
          building. It&rsquo;s a common cause of the cracking that appears after building work.
        </p>
      </>
    ),
  },
  {
    in: 0.4027,
    out: 0.4712,
    content: (
      <>
        <p className="v-narr">The goalpost frame.</p>
        <p className="v-eng">
          <span className="v-eng__label">Structural</span>
          A goalpost lifts the load off the fragile masonry entirely. Two posts carry the beam
          straight down to their own pad foundations, bypassing the old piers.
        </p>
      </>
    ),
  },
  {
    in: 0.4712,
    out: 0.5397,
    content: (
      <>
        <p className="v-client">There&rsquo;s a basement under there.</p>
        <p className="v-narr">The box frame.</p>
        <p className="v-eng">
          <span className="v-eng__label">Structural</span>
          Sometimes a pad isn&rsquo;t the way — a boundary too close, a basement below, or an existing
          footing generous enough to reuse. Closing the goalpost with a ground beam makes a box
          frame: the load spreads back along the original foundation line, over ground already
          settled under the old wall, and you save the excavation and concrete of new pads — a real
          help on soft clay.
        </p>
      </>
    ),
  },
  {
    in: 0.5397,
    out: 0.6137,
    content: (
      <>
        <p className="v-client">And if the extension needs a clear opening right through?</p>
        <p className="v-eng">
          <span className="v-eng__label">Structural</span>
          A bigger opening means bigger loads, so the beam gets deeper. And because the load still
          concentrates where the frame lands, the old footing rarely has the depth or width to take
          it — a long strip footing is easier to dig, and more efficient, than a few big pads. Tie the
          column bases along that strip, and it&rsquo;s no longer a goalpost but a box frame.
        </p>
      </>
    ),
  },
  {
    in: 0.6137,
    out: 0.7107,
    content: (
      <>
        <p className="v-client">We want it really wide — most of the back wall gone.</p>
        <p className="v-narr">Now it stops being about weight.</p>
        <p className="v-eng">
          <span className="v-eng__label">Structural</span>
          With most of the wall removed, too little masonry is left to resist sideways wind. The
          frame takes that on instead, acting as a stiff box that keeps the house square.
        </p>
      </>
    ),
  },
  {
    in: 0.7107,
    out: 0.76,
    content: (
      <>
        <p className="v-client">But I&rsquo;m mid-terrace — the wind hits my neighbours, not me.</p>
        <p className="v-eng">
          <span className="v-eng__label">Structural</span>
          Little direct wind reaches the party walls, true — but the extension&rsquo;s own flank walls
          still catch it. And removing your rear wall strips the buttressing it gave the party wall
          you share, weakening a structure whose stability you hold jointly with your neighbours.
        </p>
      </>
    ),
  },
  {
    in: 0.76,
    out: 0.8044,
    content: (
      <>
        <p className="v-narr">
          Building Regulations, Part A: &ldquo;regard shall be had to the &hellip; wind loads &hellip;
          in the ordinary course of its use.&rdquo;
        </p>
        <p className="v-eng">
          <span className="v-eng__label">Structural</span>
          A terrace was built as one structure, no single wall singled out to brace the rest. Let
          every house lean on the end terraces instead, and the whole row&rsquo;s stability runs
          through each property in turn — so accidental damage to one, or a neighbour demolishing
          theirs, could leave everything beyond it with nothing to brace against. That is a
          disproportionate collapse worth designing out, whatever the code asks of a single
          conversion.
        </p>
      </>
    ),
  },
  {
    in: 0.8044,
    out: 0.9458,
    content: (
      <>
        <p className="v-narr">The rule is simple: leave the terrace no weaker than you found it.</p>
        <p className="v-eng">
          <span className="v-eng__label">Structural</span>
          So the frame is designed for a conservative share of that lost stability — typically
          50&ndash;100% of the notional wind load, or enough to match the strength and stiffness
          removed.
        </p>
      </>
    ),
  },
  {
    in: 0.9458,
    out: 1.0,
    content: (
      <>
        <p className="v-client">Let&rsquo;s go full width.</p>
        <p className="v-narr">The open-plan rear.</p>
        <p className="v-eng">
          <span className="v-eng__label">Structural</span>
          The wall comes out entirely and the steel frame takes over every job it did — carrying the
          floors and roof, and bracing the whole house. What was the external wall is now an internal
          opening into the extension, whose walls and glazing become the new weather skin.
        </p>
      </>
    ),
  },
];

export default function OpeningALoadBearingWallPage() {
  return (
    <div className="article-editorial">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <Header />

      <main>
        <section className="hero">
          <div className="wrap">
            <p className="eyebrow">Field note — Opening a load-bearing wall</p>
            <h1>
              It&rsquo;s not always a <em>steel beam</em>
            </h1>
            <p className="standfirst">
              Lintel, RSJ, goalpost or box frame — and which one your opening needs. Scroll to follow
              one wall, from a window to a fully open span.
            </p>
            <p className="scrollcue">Scroll to begin</p>
          </div>
        </section>

        <section className="section">
          <div className="wrap prose">
            <p className="kicker">In short</p>
            <h2 className="heading">What a load-bearing wall is actually doing</h2>
            <p className="lead">
              Almost everyone starts with the same picture: it&rsquo;s a wall, so it needs a beam to
              hold up what&rsquo;s above — and a wider opening just needs a bigger beam.
            </p>
            <p>
              But a load-bearing wall rarely does one job. It carries the floor and the brickwork
              above it; it braces the house sideways against the wind; and it hands its load down to
              a foundation sized for a wall, not for two points.
            </p>
            <p>
              So the real question isn&rsquo;t <em>which beam replaces the wall</em>, but{' '}
              <em>what the wall was doing — and where each of those jobs goes now.</em> Answer that,
              and why the solution keeps changing shape — lintel, beam, goalpost, box frame — stops
              being arbitrary.
            </p>
            <p className="pull">You don&rsquo;t replace the wall with a beam. You replace everything the wall was doing.</p>
          </div>
        </section>

        <WallOpeningDiagram notes={NOTES} />

        <section className="section section--tint">
          <div className="wrap prose">
            <p className="kicker">Why the answer keeps changing</p>
            <h2 className="heading">
              The width sets the problem — the limit it meets first sets the answer
            </h2>
            <p className="lead">
              The opening grew, but a bigger span never chose the answer on its own. As it widened it
              met one limit after another — the masonry&rsquo;s ability to arch, then to bear; the
              length of wall left to land on, and to brace against the wind. The first limit it
              reached is what set the solution — and which limit that is depends on the house, not the
              tape measure. So two openings the same width can still need very different structures.
            </p>
          </div>
          <div className="wrap">
            <div className="ladder">
              <div className="rung">
                <div className="rung__limit">Span</div>
                <div className="rung__body">
                  <h3>Lintel or beam</h3>
                  <p>
                    While there&rsquo;s generous wall either side, the masonry returns carry the
                    bearing and brace the house. A lintel, then a beam, is all it takes.
                  </p>
                </div>
              </div>
              <div className="rung">
                <div className="rung__limit">Bearing</div>
                <div className="rung__body">
                  <h3>Padstones</h3>
                  <p>
                    Widen further and it&rsquo;s no longer strength that governs, but the masonry
                    being crushed at the ends — so the beam lands on padstones, and deflection, not
                    collapse, sets the size.
                  </p>
                </div>
              </div>
              <div className="rung">
                <div className="rung__limit">Return</div>
                <div className="rung__body">
                  <h3>Goalpost</h3>
                  <p>
                    Run short of wall either side — roughly 550 mm of return is the rule of thumb —
                    and the beam ends have nowhere to land. It grows columns: a goalpost, on its own
                    pad footings.
                  </p>
                </div>
              </div>
              <div className="rung">
                <div className="rung__limit">Ground</div>
                <div className="rung__body">
                  <h3>Box frame</h3>
                  <p>
                    Where the foundation can&rsquo;t take concentrated pad loads — over a cellar, or
                    weak ground — a closed box frame ties the column bases with a ground beam and
                    spreads the load along the footing.
                  </p>
                </div>
              </div>
              <div className="rung">
                <div className="rung__limit">Wind</div>
                <div className="rung__body">
                  <h3>Moment frame</h3>
                  <p>
                    Take enough of the wall and the job stops being about weight. With too little left
                    to brace against the wind, the frame&rsquo;s corners are made rigid so it can do
                    the lateral work the wall used to.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="wrap">
            <p className="kicker">Questions people ask</p>
            <h2 className="heading">Opening a load-bearing wall: common questions</h2>
            <div className="faq">
              {faqSchema.mainEntity.map((q) => (
                <details className="faq__item" key={q.name}>
                  <summary>{q.name}</summary>
                  <p>{q.acceptedAnswer.text}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="section cta">
          <div className="wrap prose">
            <h2>Thinking about opening up a wall?</h2>
            <p>
              We work the load path through before anyone reaches for a beam — so the answer fits the
              house, the ground and the budget. Based in Monmouthshire, working across South Wales and
              the borders.
            </p>
            <a className="btn" href="/#contact">
              Talk to LEAN structures
            </a>
            <a className="ghost" href="/articles">
              More articles
            </a>
            <p className="byline">
              Words &amp; drawings — LEAN structures. Diagrams are illustrative; every opening is
              designed to its own calculations.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
