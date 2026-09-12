/**
 * config.js
 * ---------------------------------------------------------------
 * Central place for business info, SEO, and integrations.
 * Edit THIS file to update contact details, hours, social links,
 * and the form-submission endpoint. Nothing else needs to change.
 * ---------------------------------------------------------------
 */

const SITE_CONFIG = {
  company: {
    legalName: "Jayden's Premier Construction LLC",
    shortName: "Jayden's Premier Construction",
    phone: "862-387-5465",
    phoneHref: "tel:+18623875465",
    email: "jaydenspremier@icloud.com",
    emailHref: "mailto:jaydenspremier@icloud.com",
    city: "Paterson",
    state: "New Jersey",
    stateAbbr: "NJ",
    // No exact street address was provided. Replace only if you want
    // a public business address to appear (e.g. for a map embed).
    publicAddress: "[ADD PUBLIC BUSINESS LOCATION OR MAP EMBED]",
    businessHours: "[ADD BUSINESS HOURS]",
    logo: "assets/images/logo_jaydens.jpg"
  },

  // Used to center the interactive Contact map. Change this if the
  // business ZIP code changes — no other code needs to change.
  mapZip: "07522",

  // Shown as small trust points under the hero. No licensing/insurance
  // claims are made here — add "Licensed & Insured" only once confirmed.
  trustPoints: [
    { icon: "ti-file-check", label: "Free estimates" },
    { icon: "ti-hammer", label: "Quality work" },
    { icon: "ti-building", label: "Residential and commercial" },
    { icon: "ti-map-pin", label: "Serving New Jersey" }
  ],

  social: {
    facebook: "[ADD SOCIAL MEDIA LINK]",
    instagram: "[ADD SOCIAL MEDIA LINK]"
  },

  legal: {
    privacyPolicyUrl: "[ADD PRIVACY POLICY URL OR PAGE]",
    termsUrl: "[ADD TERMS URL OR PAGE]"
  },

  seo: {
    title: "Jayden's Premier Construction LLC | Construction & Remodeling in Paterson, NJ",
    description:
      "Jayden's Premier Construction LLC provides roofing, siding, masonry, concrete, and remodeling services throughout New Jersey. Request a free estimate today.",
    canonicalUrl: "[ADD DOMAIN]",
    socialShareImage: "assets/images/hero-poster.jpg"
  },

  // EmailJS setup for the estimate request form. Until these are set,
  // the form will show an honest "not yet connected" message instead
  // of pretending to submit. Get these values from dashboard.emailjs.com
  // (same account used for HomeQuotePro is fine — different template).
  emailjs: {
    serviceId: "service_ckxhlpc",
    templateId: "template_fzpf387",
    publicKey: "AmNhsYyCAW_N9MMPi"
  },

  // Hero media. Swap these files (same names) to update the hero
  // without touching any code.
  hero: {
    videoMp4: "assets/video/hero-construction.mp4",
    poster: "assets/images/hero-poster.jpg",
    fallbackImage: "assets/images/hero-fallback.jpg",
    headline: "Built right. Designed to last.",
    subheadline: "Professional construction and remodeling services throughout New Jersey."
  }
};
