export const seoConfig = {
  siteName: 'Tharaga',
  siteUrl: 'https://tharaga.co.in',
  defaultTitle: "Tharaga - India's First Zero-Commission Real Estate Platform",
  defaultDescription:
    'Find verified builders and properties directly. No broker fees, no commission. Connect directly with builders for apartments, villas, and plots in Chennai.',
  defaultImage: 'https://tharaga.co.in/og-image.jpg',
  twitterHandle: '@tharaga_in',

  // Structured data
  organization: {
    '@type': 'Organization',
    name: 'Tharaga',
    url: 'https://tharaga.co.in',
    logo: 'https://tharaga.co.in/logo.png',
    sameAs: [
      'https://www.facebook.com/tharaga',
      'https://www.instagram.com/tharaga_in',
      'https://www.linkedin.com/company/tharaga',
      'https://twitter.com/tharaga_in',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+91-XXXXXXXXXX',
      contactType: 'customer service',
      areaServed: 'IN',
      availableLanguage: ['English', 'Tamil'],
    },
  },
};

// Generate property structured data
export function generatePropertySchema(property: any) {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: property.title,
    description: property.description,
    url: `${seoConfig.siteUrl}/properties/${property.slug || property.id}`,
    image: Array.isArray(property.images) ? property.images : [property.images],
    datePosted: property.published_at || property.created_at,

    // Location
    address: {
      '@type': 'PostalAddress',
      streetAddress: property.address,
      addressLocality: property.locality,
      addressRegion: property.city,
      postalCode: property.pincode,
      addressCountry: 'IN',
    },

    geo:
      property.latitude && property.longitude
        ? {
            '@type': 'GeoCoordinates',
            latitude: property.latitude,
            longitude: property.longitude,
          }
        : undefined,

    // Pricing
    offers: {
      '@type': 'Offer',
      price: property.price_min || property.price_inr,
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
    },

    // Property details
    numberOfRooms: property.bedrooms,
    numberOfBathroomsTotal: property.bathrooms,
    floorSize:
      property.carpet_area_min || property.carpet_area
        ? {
            '@type': 'QuantitativeValue',
            value: property.carpet_area_min || property.carpet_area,
            unitCode: 'FTK', // Square feet
          }
        : undefined,

    // Builder
    seller: property.builder
      ? {
          '@type': 'Organization',
          name: property.builder.company_name,
          url: `${seoConfig.siteUrl}/builders/${property.builder.slug || property.builder.id}`,
        }
      : undefined,
  };
}

// Generate breadcrumb schema
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// Generate FAQ schema
export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}











