// Static site-level data for Triad Realty
export const NAV = [
  { label: "Home", to: "/" },
  { label: "About Us", to: "/about" },
  { label: "Projects", to: "/projects" },
  // { label: "Reviews", to: "/reviews" },
  // { label: "Experience", to: "/gallery" },
  { label: "Blogs", to: "/blogs" },
  { label: "Careers", to: "/careers" },
  { label: "Contact", to: "/contact" },
];

export const COMPANY = {
  name: "Triad Realty",
  tagline: "Investment Consultants — Dubai & UAE",
  phone: "+971 54 519 3393",
  whatsapp: "https://wa.me/971545193393?text=Hello%2C%20I%27m%20interested%20in%20a%20property%20consultation.",
  email: "info@triadrealityuae.com",
  address: "Office 1102, Al Shafar Tower 1, Barsha Heights , Dubai, UAE",
  instagram: "https://www.instagram.com/triadrealty.ae?igsh=MWZpd2pmeTZwMGhzcA==",
  linkedin: "https://www.linkedin.com/company/triadrealty-ae/",
};

export const MILESTONES = [
  { year: "Q2 2025", label: "Triad Realty Founded" },
  { year: "Q3 2025", label: "Achieved AED 50M+ in Sales },
  { year: "Q4 2025", label: "Expanded the Team to 30 Members" },
  { year: "Q1 2026", label: "Launched Our In-House Market Research Desk Crossed AED 100M in Sales" },
  { year: "Q2 2026", label: "Achieved AED 200M+ in sales Served 80+ Investors" },
  { year: "Q3 2026", label: "Expended the Team to 53 Members" },
];
 
export const FOUNDERS = [];

export const TEAM = [];

export const IMMERSIVE_SECTIONS = [
  {
    id: "off-plan",
    index: "01",
    overline: "Off-Plan · 2026",
    title: "Dubai launches, curated.",
    body:
      "Hand-picked towers with flexible payment plans, developer track records vetted by our desk, and entry points from AED 1.2M — positioned for capital appreciation before handover.",
    image:
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?crop=entropy&cs=srgb&fm=jpg&w=1920&q=85",
    stats: [
      { label: "Avg. pre-handover growth", value: "+14%" },
      { label: "Entry from", value: "AED 1.2M" },
    ],
    cta: { label: "View off-plan projects", to: "/projects" },
  },
  {
    id: "marina",
    index: "02",
    overline: "Dubai Marina",
    title: "Waterfront yield, refined.",
    body:
      "High-occupancy rentals, walkable promenades, and marina views that hold value. Our analysts track absorption and service-charge trends block by block.",
    image:
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?crop=entropy&cs=srgb&fm=jpg&w=1920&q=85",
    stats: [
      { label: "Avg. rental yield", value: "8.5%" },
      { label: "Price / sqft", value: "AED 1,850" },
    ],
    cta: { label: "Marina opportunities", to: "/projects" },
  },
  {
    id: "palm",
    index: "03",
    overline: "Palm Jumeirah",
    title: "Iconic island living.",
    body:
      "Ultra-prime villas and branded residences on the world's most recognisable shoreline — discreet advisory for trophy assets and long-hold portfolios.",
    image:
      "https://images.unsplash.com/photo-1582719508461-905c673771fd?crop=entropy&cs=srgb&fm=jpg&w=1920&q=85",
    stats: [
      { label: "Avg. rental yield", value: "6.4%" },
      { label: "Price / sqft", value: "AED 3,400" },
    ],
    cta: { label: "Explore Palm listings", to: "/projects" },
  },
  {
    id: "downtown",
    index: "04",
    overline: "Downtown Dubai",
    title: "The centre of gravity.",
    body:
      "Burj Khalifa adjacency, DIFC connectivity, and institutional-grade liquidity. We map floor plates, views, and resale velocity for every acquisition.",
    image:
      "https://images.unsplash.com/photo-1546412414-e1885e51cfa5?crop=entropy&cs=srgb&fm=jpg&w=1920&q=85",
    stats: [
      { label: "YoY price growth", value: "+12.5%" },
      { label: "Price / sqft", value: "AED 2,300" },
    ],
    cta: { label: "Book a consultation", to: "/contact" },
  },
];

export const COMMUNITIES = [
  {
    name: "Dubai Marina",
    emirate: "Dubai",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?crop=entropy&cs=srgb&fm=jpg&w=1200&q=85",
    yield: "8.5%",
    ppsf: "AED 1,850",
  },
  {
    name: "Palm Jumeirah",
    emirate: "Dubai",
    image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?crop=entropy&cs=srgb&fm=jpg&w=1200&q=85",
    yield: "6.4%",
    ppsf: "AED 3,400",
  },
  {
    name: "Downtown Dubai",
    emirate: "Dubai",
    image: "https://images.unsplash.com/photo-1546412414-e1885e51cfa5?crop=entropy&cs=srgb&fm=jpg&w=1200&q=85",
    yield: "7.1%",
    ppsf: "AED 2,300",
  },
  {
    name: "Dubai Hills",
    emirate: "Dubai",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?crop=entropy&cs=srgb&fm=jpg&w=1200&q=85",
    yield: "7.8%",
    ppsf: "AED 1,950",
  },
  {
    name: "Aljada",
    emirate: "Sharjah",
    image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?crop=entropy&cs=srgb&fm=jpg&w=1200&q=85",
    yield: "9.0%",
    ppsf: "AED 950",
  },
  {
    name: "Business Bay",
    emirate: "Dubai",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?crop=entropy&cs=srgb&fm=jpg&w=1200&q=85",
    yield: "9.2%",
    ppsf: "AED 1,650",
  },
];

export const REVIEWS = [
  {
    name: "Client Review 01",
    country: "UAE",
    role: "Off-Plan Buyer",
    rating: 5,
    quote:
      "Triad explained every launch, payment plan, and risk with complete clarity. I felt informed at each step and confident before booking my unit.",
  },
  {
    name: "Client Review 02",
    country: "UAE",
    role: "Business Owner",
    rating: 5,
    quote:
      "The team understood my budget quickly, shortlisted serious options, and handled the negotiation professionally. Their follow-up after booking was excellent.",
  },
  {
    name: "Client Review 03",
    country: "India",
    role: "Portfolio Investor",
    rating: 5,
    quote:
      "What stood out was the transparency. Triad compared communities, rental potential, and exit options in a way that made the decision process simple.",
  },
  {
    name: "Client Review 04",
    country: "United Kingdom",
    role: "International Buyer",
    rating: 5,
    quote:
      "Buying from overseas felt much easier with Triad managing the details. They were responsive, honest, and careful with every document and deadline.",
  },
  {
    name: "Client Review 05",
    country: "UAE",
    role: "Family Buyer",
    rating: 5,
    quote:
      "They listened to our family needs first, then suggested communities that matched our lifestyle, schools, and long-term plans. The guidance felt personal.",
  },
];

export const GALLERY = [
  "https://images.unsplash.com/photo-1768069794857-9306ac167c6e?crop=entropy&cs=srgb&fm=jpg&w=1400&q=85",
  "https://images.unsplash.com/photo-1638454795595-0a0abf68614d?crop=entropy&cs=srgb&fm=jpg&w=1400&q=85",
  "https://images.unsplash.com/photo-1696880443820-3bc2838a0be0?crop=entropy&cs=srgb&fm=jpg&w=1400&q=85",
  "https://images.unsplash.com/photo-1772175057193-5f58ed26a785?crop=entropy&cs=srgb&fm=jpg&w=1400&q=85",
  "https://images.unsplash.com/photo-1715985160053-d339e8b6eb94?crop=entropy&cs=srgb&fm=jpg&w=1400&q=85",
  "https://images.unsplash.com/photo-1735320859351-61dd67be547e?crop=entropy&cs=srgb&fm=jpg&w=1400&q=85",
  "https://images.unsplash.com/photo-1709153880759-ed27e0590618?crop=entropy&cs=srgb&fm=jpg&w=1400&q=85",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?crop=entropy&cs=srgb&fm=jpg&w=1400&q=85",
  "https://images.unsplash.com/photo-1582719508461-905c673771fd?crop=entropy&cs=srgb&fm=jpg&w=1400&q=85",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?crop=entropy&cs=srgb&fm=jpg&w=1400&q=85",
];

export const WHY_TRIAD = [
  { k: "AED 200M+", v: "In Closed Sales" },
  { k: "80+", v: "Investors and end users" },
  { k: "4.9 / 5", v: "Client Rating" },
  { k: "2025", v: "Founded · Dubai" },
];

export const MARKET_KPIS = [
  { label: "YoY Price Growth", value: "+12.5%" },
  { label: "Avg. Rental Yield", value: "8.2%" },
  { label: "2025 Transactions", value: "AED 156B" },
  { label: "Foreign Investment Share", value: "68%" },
];

export const QUARTERS = [
  { q: "Q1 2025", vol: 38, growth: 8.2 },
  { q: "Q2 2025", vol: 42, growth: 12.5 },
  { q: "Q3 2025", vol: 39, growth: 15.1 },
  { q: "Q4 2025", vol: 47, growth: 18.3 },
];
