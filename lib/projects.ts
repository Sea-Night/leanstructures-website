/* ============================================================
   PROJECTS
   To add a project: drop its images into
   public/images/projects/<slug>/{photos,drawings}/, then add ONE
   entry to the array below. Nothing else needs editing — the bento
   grid and detail view read straight from this list.

   `size` controls how much room the tile gets in the bento grid:
   'small' (1x1), 'wide' (2x1), 'tall' (1x2), 'large' (2x2). Pick
   whatever suits the project; the grid degrades gracefully as
   projects are added or removed.
   ============================================================ */

export type BentoSize = 'small' | 'wide' | 'tall' | 'large';

export type ProjectImage = {
  src: string;
  alt: string;
  type: 'photo' | 'drawing';
  caption?: string;
};

export type Project = {
  slug: string;
  title: string;
  meta: string;
  size: BentoSize;
  status?: 'live' | 'coming-soon';
  externalLink?: { href: string; label: string };
  coverImage: ProjectImage;
  images: ProjectImage[];
  structuralNotes: string;
};

export const PROJECTS: Project[] = [
  {
    slug: 'westonbirt-playscape',
    title: 'Silk Wood Playscape, Westonbirt Arboretum',
    meta: 'Structural design for PEARCE+ & Forestry England',
    size: 'large',
    status: 'live',
    externalLink: {
      href: 'https://www.dezeen.com/2026/05/29/silk-wood-playscape-gloucestershire/',
      label: 'Featured on Dezeen',
    },
    coverImage: {
      src: '/images/projects/westonbirt-playscape/photos/drone-overview.jpg',
      alt: 'Aerial view of the Silk Wood Playscape at Westonbirt Arboretum, showing the log scramble, hide-and-seek walls and The Acorn lookout tower within a wooded hollow',
      type: 'photo',
    },
    images: [
      {
        src: '/images/projects/westonbirt-playscape/photos/drone-overview.jpg',
        alt: 'Aerial view of the Silk Wood Playscape, showing the log scramble, hide-and-seek walls and The Acorn within a wooded hollow',
        type: 'photo',
      },
      {
        src: '/images/projects/westonbirt-playscape/photos/hide-and-seek-and-acorn.jpg',
        alt: 'The curving hide-and-seek walls of waney-edge oak fins, with The Acorn lookout tower behind',
        type: 'photo',
      },
      {
        src: '/images/projects/westonbirt-playscape/photos/log-scramble-detail.jpg',
        alt: 'Moss-covered green oak logs forming the log scramble, bridging the hollow',
        type: 'photo',
      },
      {
        src: '/images/projects/westonbirt-playscape/photos/child-at-wall.jpg',
        alt: 'A child exploring one of the hide-and-seek oak fin walls',
        type: 'photo',
      },
      {
        src: '/images/projects/westonbirt-playscape/photos/acorn-nest-interior.jpg',
        alt: 'Looking up through the dowelled oak nest structure inside The Acorn',
        type: 'photo',
      },
      {
        src: '/images/projects/westonbirt-playscape/photos/oak-block-texture.jpg',
        alt: 'Detail of the roughly 1,400 oak blocks, made from milling offcuts, that form the nest of The Acorn',
        type: 'photo',
      },
      {
        src: '/images/projects/westonbirt-playscape/drawings/exploded-axo.jpg',
        alt: 'Exploded axonometric drawing — The Acorn, structural design',
        type: 'drawing',
        caption: 'Exploded axonometric',
      },
      {
        src: '/images/projects/westonbirt-playscape/drawings/tower-section-aa.png',
        alt: 'Tower Section AA — structural drawing',
        type: 'drawing',
        caption: 'Tower Section AA',
      },
      {
        src: '/images/projects/westonbirt-playscape/drawings/tower-section-bb.png',
        alt: 'Tower Section BB — structural drawing',
        type: 'drawing',
        caption: 'Tower Section BB',
      },
      {
        src: '/images/projects/westonbirt-playscape/drawings/tower-lower-plan.png',
        alt: 'Tower Lower Plan — structural drawing',
        type: 'drawing',
        caption: 'Tower Lower Plan',
      },
      {
        src: '/images/projects/westonbirt-playscape/drawings/tower-roof-plan.png',
        alt: 'Tower Roof Plan — structural drawing',
        type: 'drawing',
        caption: 'Tower Roof Plan',
      },
      {
        src: '/images/projects/westonbirt-playscape/drawings/hide-and-seek-drawings.png',
        alt: 'Hide and Seek walls — structural drawing',
        type: 'drawing',
        caption: 'Hide and Seek walls',
      },
    ],
    structuralNotes:
      'The structural engineering challenge lay in making the uncertainty of green oak manageable without stripping away its character. The timber was expected to shrink, check, creep and move differently according to exposure, orientation and section size, so the detailing avoided the usual instinct to restrain everything tightly — instead, the structures were developed around bearing, compression, mass, timber-to-timber contact and accessible connections.\n\nThe deck of The Acorn became the clearest expression of this approach: a dowelled laminated green timber slab, with oak dowels used in place of glue at intersections. The assembly can tolerate local slip and deformation as the timber dries, while the dowel layout avoids locking the oak across the grain. Its everyday behaviour was considered as a movement-tolerant slab, while its ultimate strength was checked more conservatively as a stacked grillage of graded oak members.\n\nSteel fixings were detailed to avoid creating hard points, splitting forces or inaccessible maintenance problems as the oak shrinks. More broadly, the design followed a logic of tolerance and redundancy — asking what happens if a shake opens, a dowel loosens, sapwood decays, or one member moves more than its neighbour. The aim was not to prevent every change, but to make change non-critical: through replaceable elements, visible behaviour and resilient assembly. Local defects should not lead to disproportionate collapse; vulnerable pieces can be inspected and replaced; and more serious deterioration should announce itself through visible movement, leaning or looseness before becoming dangerous.',
  },
  {
    slug: 'private-house-london',
    title: 'Private house, London',
    meta: 'Completed at MHA Structural Engineers',
    size: 'wide',
    status: 'live',
    coverImage: {
      src: '/images/project-placeholder.jpg',
      alt: 'Private house, London — exposed structural frame',
      type: 'photo',
    },
    images: [
      {
        src: '/images/project-placeholder.jpg',
        alt: 'Private house, London — exposed structural frame',
        type: 'photo',
      },
    ],
    structuralNotes:
      'Send over photos and a short project profile and this entry will be filled in properly — for now this placeholder keeps the bento grid honest about what is and isn’t ready yet.',
  },
  {
    slug: 'coming-soon-1',
    title: 'Next project',
    meta: 'Send photos and a short caption and it will be added here',
    size: 'small',
    status: 'coming-soon',
    coverImage: {
      src: '/images/project-placeholder.jpg',
      alt: 'Placeholder for a future project',
      type: 'photo',
    },
    images: [],
    structuralNotes: '',
  },
  {
    slug: 'coming-soon-2',
    title: 'Next project',
    meta: 'Send photos and a short caption and it will be added here',
    size: 'small',
    status: 'coming-soon',
    coverImage: {
      src: '/images/project-placeholder.jpg',
      alt: 'Placeholder for a future project',
      type: 'photo',
    },
    images: [],
    structuralNotes: '',
  },
];
