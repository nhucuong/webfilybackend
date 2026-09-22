
const aboutSchema = {
  label: "string",
  title: "string",
  description: "string",
  image: "string",
  stats: [
    {
      label: "string",
      value: "string"
    }
  ],
  timeline: [
    {
      year: "string",
      chapter: "string",
      title: "string",
      description: "string"
    }
  ],
  features: [
    {
      icon: "string",
      title: "string",
      description: "string"
    }
  ],
  mission: [
    {
      icon: "string",
      label: "string",
      title: "string",
      description: "string",
    }
  ],
  video: "string",
  quote: "string",
};

const blogSchema = {
  title: "string",
  description: "string",
  posts: [
    {
      title: "string",
      description: "string",
      image: "string",
      author: "string",
      date: "string",
      category: "string",
      readTime: "string"
    }
  ]
};

const contactSchema = {
  lebel: "string",
  title: "string",
  description: "string",
  contactInfo: {
    email: "string",
    phone: "string",
    address: "string",
    officeHours: "string"
  },
  socialLinks: {
    facebook: "string",
    twitter: "string",
    instagram: "string",
    linkedin: "string"
  },
  support: [{
    icon: "string",
    label: "string",
    title: "string",
    description: "string"
  }],
  actions: {
    primary: {
      text: "string",
      href: "string"
    },
    secondary: {
      text: "string",
      href: "string"
    }
  },
  globalOffice: [{
    city: "string",
    country: "string",
    address: "string",
    time: "string",
    flag: "string",
  }],
  cta: {
    title: "string",
    description: "string",
  }
};

const ctaSchema = {
  label: "string",
  title: "string",
  description: "string",
  primaryCta: {
    text: "string",
    href: "string"
  },
  secondaryCta: {
    text: "string",
    href: "string"
  },
  benefits: ["string"]
};

const faqSchema = {
  title: "string",
  description: "string",
  items: [
    {
      question: "string",
      answer: "string"
    }
  ]
};
const featuresSchema = {
  title: "string",
  badge: "string",
  description: "string",
  features: [
    {
      icon: "string",
      title: "string",
      description: "string",
      badge: "string",
      image: "string",
      tags: ["string"],
      stats: [{
        value: "string",
        label: "string",
      }],
      comparison: {
        true_value: "string",
        false_value: "string",
      }
    },
  ],
  actions: {
    primary: {
      text: "string",
      href: "string"
    },
  },
};

const footerSchema = {
  description: "string",
  links: [
    {
      title: "string",
      href: "string",
      items: [
        {
          label: "string",
          href: "string",
        }
      ]
    }
  ],
  socialLinks: {
    facebook: "string",
    twitter: "string",
    instagram: "string",
    linkedin: "string",
    github: "string",
  },
  copyright: "string",
  address: "string",
  phone: "string",
  highlights: [{
    icon: "string",
    title: "string",
    description: "string"
  }],
  actions: {
    privacypolicy: {
      text: "string",
      href: "string",
    },
    termsservice: {
      text: "string",
      href: "string",
    },
  },
};

const gallerySchema = {
  title: "string",
  description: "string",
  items: [
    {
      image: "string",
      title: "string",
      category: "string"
    }
  ]
};

const headerSchema = {
  links: [
    {
      label: "string",
      href: "string",
      subMenu: [
        {
          label: "string",
          href: "string"
        }
      ]
    }
  ],
  ctaText: "string",
  ctaHref: "string",
};

const heroSchema = {
  badge: "string",
  title: "string",
  description: "string",
  actions: {
    primary: {
      text: "string",
      href: "string"
    },
    secondary: {
      text: "string",
      href: "string"
    }
  },
  image: "string",
  video: "string",
  stats: [
    {
      icon: "string",
      label: "string",
      value: "string"
    }
  ],
  features: [
    {
      icon: "string",
      label: "string",
      value: "string"
    }
  ]
};

const pricingSchema = {
  lebel: "string",
  title: "string",
  description: "string",
  tiers: [
    {
      title: "string",
      name: "string",
      price: "string",
      interval: "string",
      features: ["string"],
      values: ["string", "boolean"],
      highlighted: "boolean",
      ctaText: "string",
      monthlyPrice: "string",
      yearlyPrice: "string",
    }
  ],
  discount: "string",
  actions: {
    primary: {
      text: "string",
      href: "string"
    },
    secondary: {
      text: "string",
      href: "string"
    }
  },
  enterpriseShowcase: {
    title: "string",
    companies: ["string"],
    highlight: {
      value: "string",
      label: "string",
    }
  }
};

const productsSchema = {
  label: "string",
  title: "string",
  description: "string",
  products: [
    {
      name: "string",
      description: "string",
      price: "number",
      image: "string",
      category: "string",
      rating: "number",
      reviews: "number",
      features: ["string"]
    }
  ]
};

const servicesSchema = {
  label: "string",
  title: "string",
  description: "string",
  services: [
    {
      icon: "string",
      title: "string",
      description: "string",
      price: "string"
    }
  ],
  cta: {
    title: "string",
    description: "string",
  }
};

const statsSchema = {
  title: "string",
  label: "string",
  description: "string",
  stats: [
    {
      label: "string",
      value: "string",
      icon: "string",
      suffix: "string",
      prefix: "string",
      description: "string",
      progress: "number",
    }
  ],
  actions: {
    primary: {
      text: "string",
      href: "string",
    }
  },
  backgroundimage: "string",
};

const teamSchema = {
  label: "string",
  title: "string",
  description: "string",
  members: [
    {
      name: "string",
      role: "string",
      image: "string",
      bio: "string",
      social: {
        linkedin: "string",
        twitter: "string",
        email: "string",
        github: "string"
      }
    }
  ]
};

const testimonialsSchema = {
  label: "string",
  title: "string",
  description: "string",
  testimonials: [
    {
      name: "string",
      role: "string",
      company: "string",
      image: "string",
      content: "string",
      rating: "number",
      title: "string",
      videoUrl: "string",
    }
  ]
};

const awardsSchema = {
  label: "string",
  title: "string",
  description: "string",
  awards: [{
    icon: "string",
    title: "string",
    description: "string",
    year: "string",
  }]
};

const clientsSchema = {
  title: "string",
  description: "string",
  company: [{
    name: "string",
    companylogo: "string",
    sector: "string",
    stat: "string",
    statLabel: "string",
    quote: "string",
  }]

};

const hoursSchema = {
  title: "string",
  description: "string",
  hours: [{
    day: "string",
    open: "string",
    close: "string",
    isOpen: "boolean",
  }],
  timezone: "string",
  listing: [{
    title: "string",
    sub: "string",
    icon: "string",
  }]
};

const processSchema = {
  label: "string",
  title: "string",
  description: "string",
  steps: [{
    number: "string",
    icon: "string",
    title: "string",
    description: "string",
    image: "string",
  }],
  actions: {
    primary: {
      text: "string",
      href: "string"
    }
  },
};

const integrationsSchema = {
  badge: "string",
  title: "string",
  description: "string",
  mainIcon: "string",
  actions: {
    primary: {
      text: "string",
      href: "string"
    },
  },
  integrations: [{
    name: "string",
    category: "string",
    icon: "string",
    description: "string",
    badge: "string",
  }]
};

const newsletterSchema = {
  title: "string",
  description: "string",
  icon: "string",
  badge: "string",
  stats: [{
    value: "string",
    label: "string"
  }],
  actions: {
    primary: {
      text: "string",
      href: "string",
    },
  },
};

const officesSchema = {
  title: "string",
  badeg: "string",
  descrition: "string",
  offices: [{
    city: "string",
    country: "string",
    address: "string",
    phone: "string",
    hours: "string",
    mapUrl: "string",
    image: "string",
  }]
};

const roadmapSchema = {
  title: "string",
  badeg: "string",
  description: "string",
  items: [{
    phase: "string",
    title: "string",
    description: "string",
  }],
};

const trustSchema = {
  title: "string",
  description: "string",
  items: [{
    title: "string",
    description: "string",
    icon: "string",
    lebel: "string"
  }]
};

const videoSchema = {
  title: "string",
  description: "string",
  badge: "string",
  videourl: "string",
  features: ["string"],
  actions: {
    primary: {
      text: "string",
      href: "string",
    },
    secondary: {
      text: "string",
      href: "string",
    },
  },
};

const whychooseSchema = {
  label: "string",
  title: "string",
  description: "string",
  features: [{
    icon: "string",
    title: "string",
    description: "string",
    year: "string",
  }],
  image: "string",
  actions: {
    primary: {
      text: "string",
      href: "string",
    },
  },
  stats: [{
    icon: "string",
    value: "string",
    label: "string"
  }],
  cta: {
    title: "string",
    icon: "string",
    description: "string",
    qute: "string",
  }
};

const sectionSchemas = {
  header: headerSchema,
  hero: heroSchema,
  about: aboutSchema,
  features: featuresSchema,
  services: servicesSchema,
  contact: contactSchema,
  cta: ctaSchema,
  faq: faqSchema,
  gallery: gallerySchema,
  pricing: pricingSchema,
  products: productsSchema,
  stats: statsSchema,
  blog: blogSchema,
  team: teamSchema,
  testimonials: testimonialsSchema,
  footer: footerSchema,
  awards: awardsSchema,
  clients: clientsSchema,
  hours: hoursSchema,
  process: processSchema,
  integrations: integrationsSchema,
  newsletter: newsletterSchema,
  offices: officesSchema,
  roadmap: roadmapSchema,
  trust: trustSchema,
  video: videoSchema,
  whychoose: whychooseSchema
};
module.exports = sectionSchemas;