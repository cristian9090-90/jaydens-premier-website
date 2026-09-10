/**
 * data.js
 * ---------------------------------------------------------------
 * All editable page content lives here. Add, remove, or edit
 * entries in these arrays to change what appears on the site —
 * no HTML or CSS editing required. This structure is also what
 * a future admin dashboard would read from and write to.
 * ---------------------------------------------------------------
 */

const SERVICES = [
  {
    id: "roofing",
    name: "Roofing",
    tagline: "Residential & Commercial Roofing Systems",
    icon: "ti-home",
    description: "Roof repair, replacement, and installation for residential and commercial properties.",
    fullDescription: "Servicios integrales de techos diseñados para proteger tu propiedad contra el clima de Nueva Jersey. Realizamos reemplazos completos con sistemas de shingle de alta durabilidad, instalación experta de barreras de protección como ice and water shield, membranas sintéticas y subcapas de bajo pendiente, además de reparaciones de goteras, sellado de juntas y colocación precisa de step flashing y bajantes."
  },
  {
    id: "siding",
    name: "Siding",
    icon: "ti-layout-board",
    description: "Siding installation and repair to protect and refresh the exterior of your property."
  },
  {
    id: "stucco",
    name: "Stucco",
    tagline: "Architectural Stucco & Exterior Finishes",
    icon: "ti-texture",
    description: "Stucco application and repair for a durable, finished exterior.",
    fullDescription: "Especialistas en aplicación tradicional de estuco de dos y tres capas sobre malla de alambre metálico. Brindamos acabados texturizados impecables tipo California finish, renovación de fachadas completas, sellado de grietas estructurales y refuerzo de muros de sótano para garantizar una barrera impermeable, estética y duradera."
  },
  {
    id: "masonry",
    name: "Masonry",
    tagline: "Expert Brick, Stone & Block Masonry",
    icon: "ti-brick",
    description: "Brick and stone masonry work, from repairs to new construction.",
    fullDescription: "Solidez artesanal en cada proyecto de mampostería exterior e interior. Ejecutamos construcción de fachadas de ladrillo visto, instalación de piedra decorativa o estructural, muros de contención, reparaciones de mampostería dañada e infills de ventanas con un acoplamiento perfecto que respeta la arquitectura original de la propiedad."
  },
  {
    id: "chimney",
    name: "Chimney",
    tagline: "Chimney Demolition, Rebuilding & Restoration",
    icon: "ti-flame",
    description: "Chimney repair and rebuilding services.",
    fullDescription: "Mantenimiento y reconstrucción estructural de chimeneas desde el nivel del techo. Realizamos demolición controlada y levantamiento de obra nueva con ladrillo refractario y mortero reforzado, construcción y sellado de coronas de concreto (crown wash), e instalación de tapas de aluminio para prevenir filtraciones de agua y daños por humedad."
  },
  {
    id: "remodeling",
    name: "Remodeling",
    tagline: "Interior & Exterior Property Remodeling",
    icon: "ti-tool",
    description: "Interior and exterior remodeling to update and improve your property.",
    fullDescription: "Renovación integral de espacios habitables y comerciales. Transformamos interiores con redistribución de áreas y acabados modernos, y optimizamos exteriores para maximizar el valor de la propiedad, combinando la experiencia en construcción estructural con un diseño estético de primer nivel."
  },
  {
    id: "steps",
    name: "Steps",
    tagline: "Custom Concrete & Bluestone Steps",
    icon: "ti-stairs-up",
    description: "Concrete and masonry steps, built or repaired to last.",
    fullDescription: "Diseño, reparación y restauración de escaleras de entrada seguras y estéticas. Trabajamos con vaciado de concreto de alta resistencia y colocación experta de escalones y descansos de piedra azul (bluestone) o ladrillo, asegurando nivelaciones exactas y anclajes firmes para soportar el tráfico pesado diario."
  },
  {
    id: "retaining-walls",
    name: "Retaining Walls",
    tagline: "Structural Retaining Walls & Stabilization",
    icon: "ti-wall",
    description: "Retaining wall construction and repair for sloped or uneven property lines.",
    fullDescription: "Construcción de muros de contención robustos para nivelar terrenos inclinados y proteger cimientos. Utilizamos bloques de concreto interconectados, piedra o mampostería reforzada con sistemas de drenaje integrados para prevenir deslizamientos de tierra, erosión y acumulación de presión hidrostática."
  },
  {
    id: "repointing",
    name: "Repointing",
    tagline: "Tuckpointing & Mortar Joint Restoration",
    icon: "ti-grid-dots",
    description: "Mortar repointing to restore and strengthen brick and stone surfaces.",
    fullDescription: "Restauración profunda de juntas de mortero deterioradas en muros de ladrillo y piedra. Eliminamos el material desgastado de forma milimétrica y aplicamos un mortero nuevo con la mezcla y color exactos para devolverle la integridad estructural a la pared, evitar la entrada de agua y renovar por completo la estética de la fachada."
  },
  {
    id: "concrete",
    name: "Concrete",
    tagline: "Professional Flatwork & Foundation Concrete",
    icon: "ti-road",
    description: "Concrete work for driveways, walkways, patios, and foundations.",
    fullDescription: "Vaciado de superficies de concreto de alta especificación para entradas de vehículos (driveways), aceras, patios residenciales y zapatas de cimentación. Garantizamos una correcta compactación del terreno, armado con malla de refuerzo, pendientes adecuadas para el escurrimiento de agua y acabados alisados o escobillados impecables."
  },
  {
    id: "gutters",
    name: "Gutters",
    tagline: "Seamless Gutters & Drainage Systems",
    icon: "ti-droplet",
    description: "Gutter installation, repair, and maintenance for water diversion.",
    fullDescription: "Sistemas de recolección y desvío de aguas pluviales diseñados a la medida para proteger los cimientos y paredes exteriores de tu propiedad. Instalamos canaletas sin costuras (seamless gutters), bajantes orientados y sistemas de protección contra hojas para asegurar un flujo de agua limpio y eficiente durante todo el año."
  },
  {
    id: "interior-remodeling",
    name: "Interior Remodeling",
    icon: "ti-sofa",
    description: "Kitchen, bathroom, and interior living space remodeling.",
    comingSoon: true,
    // Edit this message any time — no other code needs to change.
    comingSoonMessage: "We currently specialize in exterior work, masonry, and roofing. We'll be opening our schedule for interior remodeling soon. Contact us to be notified when we do."
  }
];

/**
 * Featured projects. Replace the placeholders below with real
 * project photos and details as they become available. Do not
 * publish photos of work Jayden's Premier Construction LLC did
 * not perform.
 */
const PROJECTS = [
  {
    id: "project-1",
    name: "[ADD PROJECT NAME]",
    service: "[ADD SERVICE TYPE]",
    location: "[ADD CITY OR AREA]",
    description: "[ADD PROJECT DESCRIPTION]",
    image: null, // e.g. "assets/images/projects/project-1.jpg"
    beforeImage: null,
    afterImage: null
  },
  {
    id: "project-2",
    name: "[ADD PROJECT NAME]",
    service: "[ADD SERVICE TYPE]",
    location: "[ADD CITY OR AREA]",
    description: "[ADD PROJECT DESCRIPTION]",
    image: null,
    beforeImage: null,
    afterImage: null
  },
  {
    id: "project-3",
    name: "[ADD PROJECT NAME]",
    service: "[ADD SERVICE TYPE]",
    location: "[ADD CITY OR AREA]",
    description: "[ADD PROJECT DESCRIPTION]",
    image: null,
    beforeImage: null,
    afterImage: null
  }
];

// Before/after comparison. Add real image paths once available.
const BEFORE_AFTER = {
  beforeImage: null, // e.g. "assets/images/before-1.jpg"
  afterImage: null,  // e.g. "assets/images/after-1.jpg"
  beforeAlt: "[ADD BEFORE IMAGE]",
  afterAlt: "[ADD AFTER IMAGE]"
};

/**
 * Testimonials. Do not invent reviews — leave placeholders until
 * real, confirmed client reviews are provided.
 */
const TESTIMONIALS = [
  {
    text: "[ADD REAL CLIENT REVIEW]",
    name: "[Client name]",
    location: "[City or area, if authorized]",
    service: "[Service performed, if confirmed]",
    rating: null
  },
  {
    text: "[ADD REAL CLIENT REVIEW]",
    name: "[Client name]",
    location: "[City or area, if authorized]",
    service: "[Service performed, if confirmed]",
    rating: null
  }
];

// Service areas. Add specific counties/cities as needed —
// this list drives the "Areas We Serve" section directly.
const SERVICE_AREAS = ["All of New Jersey"];

// Fallback used by coverage-map.js only if /api/coverage isn't reachable
// yet (admin panel not deployed). Once the admin "Coverage" tab is used,
// the live data from Vercel KV takes over automatically.
const DEFAULT_COVERAGE = { counties: ["Passaic"], zip: "07522" };

const WHY_CHOOSE_US = [
  { icon: "ti-hammer", label: "Quality craftsmanship" },
  { icon: "ti-file-text", label: "Clear estimates" },
  { icon: "ti-focus-2", label: "Attention to detail" },
  { icon: "ti-briefcase", label: "Professional service" },
  { icon: "ti-building", label: "Residential and commercial" },
  { icon: "ti-message-circle", label: "Responsive communication" }
];

// Rendered as separate paragraphs — split on blank lines. Edit freely; no
// HTML/CSS changes are needed when this text is updated.
const ABOUT_TEXT = `Jayden's Premier Construction LLC was built on a simple idea: a construction company should be run the way a family runs anything that matters — with accountability, attention to detail, and a name worth protecting. We are a family-owned and operated general contracting business, and that isn't a marketing line. It means the people who quote your project, oversee the work, and stand behind the finished result are the same people whose name is on the door.

Being directly owner-operated shapes how we work. There is no layer of subcontracted management between you and the crew doing the work, no call center, and no runaround when you have a question. You deal with people who are personally invested in getting it right the first time, because every project we complete carries our family's reputation with it.

Jayden's Premier Construction LLC is fully licensed and insured, and we treat that as a baseline responsibility to our clients — not a footnote. From roofing, siding, and masonry to concrete, remodeling, and everything in between, we bring the same structural discipline and finish-level craftsmanship to a small repair as we do to a full residential or commercial rebuild.

Our approach is built on three commitments we don't compromise on: excellence in the workmanship itself, honesty in every estimate and conversation along the way, and durability that holds up long after the job is done. We proudly serve homeowners, property managers, and commercial clients throughout Northern New Jersey, and we build every project the way we'd build our own home.`;

// Photo shown next to the "Who we are" text. Set to a real path once you
// have a team or work photo, e.g. "assets/images/about-photo.jpg" — the
// placeholder box shows automatically until this is set.
const ABOUT_IMAGE = null;
