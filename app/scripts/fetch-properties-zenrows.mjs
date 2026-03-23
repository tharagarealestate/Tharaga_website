#!/usr/bin/env node
/**
 * Property Fetching Script using ZenRows API
 * Fetches properties from MagicBricks, 99acres, and NoBroker for Chennai
 * Filters for medium builders and syncs to Supabase
 * 
 * Usage: node app/scripts/fetch-properties-zenrows.mjs
 * 
 * Required Environment Variables:
 * - ZENROWS_API_KEY: Your ZenRows API key
 * - NEXT_PUBLIC_SUPABASE_URL: Supabase project URL
 * - SUPABASE_SERVICE_ROLE_KEY: Supabase service role key
 */

import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync } from 'fs';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Load from multiple locations (app directory and root)
config({ path: join(__dirname, '../.env.local') });
config({ path: join(__dirname, '../.env') });
config({ path: join(__dirname, '../../.env.production') });
config({ path: join(__dirname, '../../.env') });

const ZENROWS_API_KEY = process.env.ZENROWS_API_KEY || 'f7d0615680def70adeb563edfdaf3dfe966f335c';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

if (!ZENROWS_API_KEY) {
  console.error('❌ ZENROWS_API_KEY not found in environment variables');
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Supabase credentials not found in environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Large builders to exclude (filtering for medium builders)
const LARGE_BUILDERS = [
  'DLF', 'Godrej', 'Raheja', 'Prestige', 'Sobha', 'Tata Housing',
  'Mahindra Lifespaces', 'Lodha', 'Shapoorji Pallonji', 'Adani Realty',
  'K Raheja Corp', 'Brigade', 'Puravankara', 'Salarpuria', 'Embassy'
];

// Chennai-specific URLs
const PORTAL_URLS = {
  magicbricks: 'https://www.magicbricks.com/property-for-sale/residential-real-estate?bedroom=&proptype=Multistorey-Apartment,Builder-Floor-Apartment,Penthouse,Studio-Apartment&cityName=Chennai',
  '99acres': 'https://www.99acres.com/search/property/buy/residential-all/chennai',
  nobroker: 'https://www.nobroker.in/property/sale/chennai/all-residential_society'
};

/**
 * Fetch HTML from a URL using ZenRows API with retry logic
 */
async function fetchWithZenRows(url, retries = 3, delay = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const zenrowsUrl = 'https://api.zenrows.com/v1/';
      const params = {
        apikey: ZENROWS_API_KEY,
        url: url,
        js_render: 'true',
        antibot: 'true',
        premium_proxy: 'true',
        proxy_country: 'in',
        wait: 3000
      };

      if (attempt > 1) {
        console.log(`   🔄 Retry attempt ${attempt}/${retries}...`);
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }

      console.log(`📡 Fetching with ZenRows (attempt ${attempt}/${retries}): ${url}`);
      const response = await axios.get(zenrowsUrl, { 
        params, 
        timeout: 90000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        maxRedirects: 5,
        validateStatus: (status) => status < 500
      });
      
      // Check for successful response
      if (response.status === 200 && typeof response.data === 'string' && response.data.length > 1000) {
        console.log(`   ✅ Received ${(response.data.length / 1024).toFixed(2)} KB of HTML`);
        // Save HTML for debugging if needed
        try {
          const sample = response.data.substring(0, 50000);
          const filename = `debug-${url.split('/').pop() || 'page'}-${Date.now()}.html`;
          writeFileSync(join(__dirname, filename), sample);
          console.log(`   💾 Saved HTML sample to: ${filename}`);
        } catch (e) {
          // Ignore file write errors
        }
        return response.data;
      } else if (response.status === 200) {
        console.log(`   ⚠️  Received short response (${response.data?.length || 0} chars), might be an error page`);
        if (attempt < retries) continue;
      } else if (response.status === 402) {
        console.error(`   ❌ ZenRows API 402 - Usage limit exceeded or account issue`);
        return null;
      } else if (response.status === 401 || response.status === 403) {
        console.error(`   ❌ ZenRows API authentication failed (${response.status})`);
        if (attempt < retries) continue;
        return null;
      } else {
        console.log(`   ⚠️  Status ${response.status}, retrying...`);
        if (attempt < retries) continue;
      }
      
      return response.data || null;
    } catch (error) {
      console.error(`❌ Error fetching ${url} (attempt ${attempt}/${retries}):`, error.message);
      if (error.response) {
        console.error(`   Status: ${error.response.status}`);
        if (error.response.data) {
          const errorData = typeof error.response.data === 'string' 
            ? error.response.data.substring(0, 200) 
            : JSON.stringify(error.response.data).substring(0, 200);
          console.error(`   Response: ${errorData}`);
        }
        
        // Don't retry on client errors (4xx) except 429 (rate limit)
        if (error.response.status >= 400 && error.response.status < 500 && error.response.status !== 429) {
          console.error(`   ⚠️  Client error (${error.response.status}), skipping retries`);
          return null;
        }
      }
      
      // If last attempt, return null
      if (attempt === retries) {
        console.error(`   ❌ All ${retries} attempts failed`);
        return null;
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
    }
  }
  
  return null;
}

/**
 * Extract property listings from MagicBricks HTML
 */
function parseMagicBricks(html) {
  const properties = [];
  const $ = cheerio.load(html);
  
  // Try multiple selector patterns
  const selectors = [
    '.mb-srp__card',
    '[class*="mb-srp"]',
    '[class*="property-card"]',
    '[class*="listing-card"]',
    '.srp-card',
    '[data-testid*="property"]'
  ];
  
  let foundCards = [];
  for (const selector of selectors) {
    const cards = $(selector);
    if (cards.length > 0) {
      console.log(`   Found ${cards.length} cards with selector: ${selector}`);
      foundCards = cards;
      break;
    }
  }
  
  if (foundCards.length === 0) {
    // Try to find any elements with price-like text
    console.log('   ⚠️  No property cards found with standard selectors, trying text-based extraction...');
    return parseMagicBricksTextBased(html);
  }
  
  foundCards.each((i, el) => {
    try {
      const $card = $(el);
      
      // Try multiple title selectors
      const title = $card.find('.mb-srp__card--title, [class*="title"], h2, h3').first().text().trim() ||
                   $card.find('a[href*="/property"]').first().text().trim();
      
      // Try multiple price selectors - be very aggressive with fallbacks
      let priceText = $card.find('.mb-srp__card--price, [class*="price"], [class*="amount"], [data-price]').first().text().trim();
      
      // Try extracting from entire card text with multiple patterns
      if (!priceText || priceText.length < 3) {
        const cardText = $card.text();
        // Pattern 1: Standard format with currency
        const priceMatch1 = cardText.match(/[₹Rs\.]\s*([\d.,]+)\s*(?:Cr|L|Lakh|Crore|Million|Lac)/i);
        if (priceMatch1) priceText = priceMatch1[0];
        
        // Pattern 2: Just number with Cr/L
        if (!priceText) {
          const numMatch = cardText.match(/(\d{1,2}(?:\.\d+)?)\s*(?:Cr|Crore)/i);
          if (numMatch) priceText = `Rs. ${numMatch[1]} Cr`;
        }
        
        // Pattern 3: Lakh format
        if (!priceText) {
          const lakhMatch = cardText.match(/(\d{1,4}(?:\.\d+)?)\s*(?:L|Lakh|Lac)/i);
          if (lakhMatch) priceText = `Rs. ${lakhMatch[1]} L`;
        }
        
        // Pattern 4: Large numbers (likely in Lakhs if > 10L)
        if (!priceText) {
          const bigNumMatch = cardText.match(/(\d{2,8})/);
          if (bigNumMatch) {
            const num = parseInt(bigNumMatch[1].replace(/,/g, ''));
            if (num >= 100000 && num < 10000000) {
              priceText = `Rs. ${(num / 100000).toFixed(1)} L`;
            } else if (num >= 10000000) {
              priceText = `Rs. ${(num / 10000000).toFixed(2)} Cr`;
            }
          }
        }
      }
      
      if (!title || title.length < 5) {
        console.log(`   ⚠️  Missing/invalid title: "${title?.substring(0, 30)}"`);
        return;
      }
      
      if (!priceText) {
        console.log(`   ⚠️  Could not extract price for: "${title.substring(0, 50)}"`);
        return;
      }

      // Extract price
      const price = parsePrice(priceText);
      if (!price) return;
      
      // Extract BHK
      const bhkMatch = ($card.text() + ' ' + title).match(/(\d+)\s*BHK/i);
      const bhk = bhkMatch ? parseInt(bhkMatch[1]) : null;

      // Extract locality - try multiple patterns
      let locality = $card.find('.mb-srp__card--title--summary, [class*="locality"], [class*="location"]').first().text().trim();
      
      // If not found, extract from title pattern "X BHK Flat for Sale in Locality, Chennai"
      if (!locality || locality.length < 3) {
        // Pattern: "for Sale in Locality" or "in Locality"
        const titleMatch = title.match(/(?:for\s+Sale\s+in|in)\s+([A-Z][a-zA-Z\s]+?)(?:,|\s+Chennai|$)/i);
        if (titleMatch && titleMatch[1]) {
          locality = titleMatch[1].trim();
        }
      }
      
      // Clean up locality - remove common prefixes and suffixes
      if (locality) {
        locality = locality
          .replace(/^for\s+Sale\s+in\s+/i, '')
          .replace(/^Sale\s+(?:in|at)\s+/i, '')
          .replace(/,\s*Chennai.*$/i, '')
          .split(',')[0]
          .split('-')[0]
          .replace(/\s+/g, ' ')
          .trim();
      }
      
      // Final fallback - extract any capitalized words after "in"
      if (!locality || locality.length < 3) {
        const fallbackMatch = title.match(/in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
        if (fallbackMatch) locality = fallbackMatch[1].trim();
      }
      
      locality = locality || 'Chennai';

      // Extract area - try multiple patterns
      let areaText = $card.find('.mb-srp__card--summary--value, [class*="area"], [class*="sqft"]').first().text().trim();
      if (!areaText) {
        // Try extracting from card text with regex
        const areaMatch = $card.text().match(/(\d+(?:\.\d+)?)\s*(?:sqft|sq\.?\s*ft|sq\.?\s*feet|sq\.?\s*ft\.)/i);
        if (areaMatch) areaText = areaMatch[0];
      }
      const area = parseArea(areaText);

      // Extract builder
      const builder = $card.find('.mb-srp__card--builder, [class*="builder"], [class*="developer"]').first().text().trim() || 
                     $card.find('.mb-srp__card--society, [class*="society"]').first().text().trim() || null;

      // Extract URL
      const url = $card.find('a[href*="/property"], a[href*="/flat"]').first().attr('href') || null;
      const fullUrl = url && !url.startsWith('http') ? `https://www.magicbricks.com${url}` : url;

      // Ensure we have valid data before adding - be more lenient
      if (price && title && title.length > 5 && price >= 100000) {
        // Clean builder name - sometimes it contains amenities instead
        let cleanBuilder = builder;
        if (cleanBuilder && (cleanBuilder.includes('Pool') || cleanBuilder.includes('Gym') || cleanBuilder.includes('Garden') || cleanBuilder.length > 80)) {
          cleanBuilder = null; // Likely amenities, not builder name
        }
        
        properties.push({
          title: title.substring(0, 200), // Limit title length
          price_inr: price,
          locality: locality || 'Chennai',
          city: 'Chennai',
          state: 'Tamil Nadu',
          builder: cleanBuilder ? cleanBuilder.substring(0, 100) : null,
          bedrooms: bhk,
          sqft: area,
          source: 'magicbricks',
          url: fullUrl
        });
      } else {
        console.log(`   ⚠️  Skipping property - missing data: Title: "${title?.substring(0, 50)}" Price: ${price} TitleLen: ${title?.length || 0}`);
      }
    } catch (err) {
      console.error('Error parsing MagicBricks property:', err.message);
    }
  });

  return properties;
}

/**
 * Fallback: Text-based extraction for MagicBricks
 */
function parseMagicBricksTextBased(html) {
  const properties = [];
  const $ = cheerio.load(html);
  
  // Look for price patterns in the HTML
  const pricePattern = /[₹Rs\.]\s*([\d.,]+)\s*(Cr|L|Lakh|Crore)/gi;
  const text = $('body').text();
  const prices = [...text.matchAll(pricePattern)];
  
  console.log(`   Found ${prices.length} price mentions in text`);
  
  // This is a fallback - return empty for now, need to see actual HTML structure
  return properties;
}

/**
 * Extract property listings from 99acres HTML
 */
function parse99acres(html) {
  const properties = [];
  const $ = cheerio.load(html);
  
  // Try multiple selector patterns for 99acres
  const selectors = [
    '.projectTuple__tupleDetails',
    '.srpTuple__tupleDetails',
    '[class*="projectTuple"]',
    '[class*="srpTuple"]',
    '[class*="property-card"]',
    '[data-project-id]',
    '.propertyCard'
  ];
  
  let foundCards = [];
  for (const selector of selectors) {
    const cards = $(selector);
    if (cards.length > 0) {
      console.log(`   Found ${cards.length} cards with selector: ${selector}`);
      foundCards = cards;
      break;
    }
  }
  
  if (foundCards.length === 0) {
    console.log('   ⚠️  No property cards found, trying text-based extraction...');
    return parse99acresTextBased(html);
  }
  
  foundCards.each((i, el) => {
    try {
      const $card = $(el);
      
      // Try multiple selectors for each field
      const title = $card.find('.projectTuple__projectName, .srpTuple__projectName, [class*="projectName"], h2, h3, a[href*="/property"]').first().text().trim();
      const priceText = $card.find('.projectTuple__price, .srpTuple__price, [class*="price"], [class*="amount"]').first().text().trim() ||
                       $card.text().match(/[₹Rs\.]\s*[\d.,]+\s*(?:Cr|L|Lakh)/i)?.[0] || '';
      let locality = $card.find('.projectTuple__locality, .srpTuple__locality, [class*="locality"]').first().text().trim();
      const builder = $card.find('.projectTuple__builderName, .srpTuple__builderName, [class*="builder"]').first().text().trim();
      
      if (!title || !priceText) return;

      const price = parsePrice(priceText);
      if (!price) return;
      
      // Extract locality from title if not found
      if (!locality || locality.length < 3) {
        const titleMatch = title.match(/(?:for\s+Sale\s+in|in)\s+([A-Z][a-zA-Z\s]+?)(?:,|\s+Chennai|$)/i);
        if (titleMatch && titleMatch[1]) {
          locality = titleMatch[1].trim();
        }
      }
      if (locality) {
        locality = locality.replace(/^for\s+Sale\s+in\s+/i, '').replace(/,\s*Chennai.*$/i, '').split(',')[0].split('-')[0].trim();
      }
      locality = locality || 'Chennai';
      
      const bhkMatch = ($card.text() + ' ' + title).match(/(\d+)\s*BHK/i);
      const bhk = bhkMatch ? parseInt(bhkMatch[1]) : null;
      
      const areaText = $card.find('.projectTuple__areaValue, .srpTuple__areaValue, [class*="area"]').first().text().trim() ||
                      $card.text().match(/(\d+(?:\.\d+)?)\s*(?:sqft|sq\.?\s*ft)/i)?.[0] || '';
      const area = parseArea(areaText);

      const url = $card.find('a[href*="/property"], a[href*="/project"]').first().attr('href') || null;
      const fullUrl = url && !url.startsWith('http') ? `https://www.99acres.com${url}` : url;

      properties.push({
        title: title.substring(0, 200),
        price_inr: price,
        locality: locality,
        city: 'Chennai',
        state: 'Tamil Nadu',
        builder: builder ? builder.substring(0, 100) : null,
        bedrooms: bhk,
        sqft: area,
        source: '99acres',
        url: fullUrl
      });
    } catch (err) {
      console.error('Error parsing 99acres property:', err.message);
    }
  });

  return properties;
}

function parse99acresTextBased(html) {
  return []; // Fallback - need to see actual HTML
}

/**
 * Extract property listings from NoBroker HTML
 */
function parseNoBroker(html) {
  const properties = [];
  const $ = cheerio.load(html);
  
  // Try multiple selector patterns for NoBroker
  const selectors = [
    '.nb__card',
    '.card',
    '[class*="nb__"]',
    '[class*="property-card"]',
    '[data-testid*="property"]',
    '.search-card',
    '[id*="property"]'
  ];
  
  let foundCards = [];
  for (const selector of selectors) {
    const cards = $(selector);
    if (cards.length > 0) {
      console.log(`   Found ${cards.length} cards with selector: ${selector}`);
      foundCards = cards;
      break;
    }
  }
  
  if (foundCards.length === 0) {
    console.log('   ⚠️  No property cards found, trying comprehensive text extraction...');
    return parseNoBrokerComprehensive(html);
  }
  
  foundCards.each((i, el) => {
    try {
      const $card = $(el);
      const cardText = $card.text();
      
      const title = $card.find('.nb__card__title, .card-title, h2, h3, [class*="title"]').first().text().trim() ||
                   cardText.match(/(\d+\s*BHK.*?(?:in|at|,).+?)/i)?.[1]?.trim() || '';
      const priceText = $card.find('.nb__card__price, .price, [class*="price"]').first().text().trim() ||
                       cardText.match(/[₹Rs\.]\s*[\d.,]+\s*(?:Cr|L|Lakh|Crore)/i)?.[0] || '';
      let locality = $card.find('.nb__card__locality, .locality, [class*="locality"]').first().text().trim();
      if (!locality || locality.length < 3) {
        const localityMatch = cardText.match(/(?:in|at|,)\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
        if (localityMatch) locality = localityMatch[1].trim();
      }
      locality = (locality || '').replace(/,\s*Chennai.*$/i, '').split(',')[0].trim() || 'Chennai';
      const builder = $card.find('.nb__card__society, .society-name, [class*="society"]').first().text().trim() || null;
      
      if (!title || !priceText) return;

      const price = parsePrice(priceText);
      if (!price) return;
      
      const bhkMatch = (cardText + ' ' + title).match(/(\d+)\s*BHK/i);
      const bhk = bhkMatch ? parseInt(bhkMatch[1]) : null;
      
      const areaText = $card.find('.nb__card__area, .area, [class*="area"]').first().text().trim() ||
                      cardText.match(/(\d+(?:\.\d+)?)\s*(?:sqft|sq\.?\s*ft|sq\.?\s*feet)/i)?.[0] || '';
      const area = parseArea(areaText);

      const url = $card.find('a[href*="/property"], a[href*="/sale"]').first().attr('href') || null;
      const fullUrl = url && !url.startsWith('http') ? `https://www.nobroker.in${url}` : url;

      properties.push({
        title: title.substring(0, 200),
        price_inr: price,
        locality: locality.split(',')[0].trim() || 'Chennai',
        city: 'Chennai',
        state: 'Tamil Nadu',
        builder: builder ? builder.substring(0, 100) : null,
        bedrooms: bhk,
        sqft: area,
        source: 'nobroker',
        url: fullUrl
      });
    } catch (err) {
      console.error('Error parsing NoBroker property:', err.message);
    }
  });

  return properties;
}

/**
 * Comprehensive text-based extraction for NoBroker
 */
function parseNoBrokerComprehensive(html) {
  const properties = [];
  const $ = cheerio.load(html);
  
  // Look for patterns in the entire HTML
  const bodyText = $('body').text();
  
  // Find price mentions with context
  const pricePattern = /[₹Rs\.]\s*([\d.,]+)\s*(Cr|L|Lakh|Crore|Million)/gi;
  const prices = [...bodyText.matchAll(pricePattern)];
  
  // Find BHK mentions
  const bhkPattern = /(\d+)\s*BHK/gi;
  const bhks = [...bodyText.matchAll(bhkPattern)];
  
  console.log(`   Found ${prices.length} price mentions and ${bhks.length} BHK mentions in text`);
  
  // If we found some patterns, try to extract properties
  if (prices.length > 0 && bhks.length > 0) {
    // Look for property-like sections in HTML
    const sections = html.match(/<[^>]+class="[^"]*(?:card|property|listing)[^"]*"[^>]*>[\s\S]{0,2000}?<\/[^>]+>/gi) || [];
    console.log(`   Found ${sections.length} potential property sections`);
    
    // Try to extract from sections
    for (let i = 0; i < Math.min(sections.length, 20); i++) {
      const section = sections[i];
      const $section = cheerio.load(section);
      const text = $section.text();
      
      const priceMatch = text.match(/[₹Rs\.]\s*([\d.,]+)\s*(Cr|L|Lakh)/i);
      const bhkMatch = text.match(/(\d+)\s*BHK/i);
      const localityMatch = text.match(/(?:in|at|,)\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
      
      if (priceMatch && bhkMatch) {
        const price = parsePrice(priceMatch[0]);
        if (price && price >= 100000) { // Valid price
          properties.push({
            title: `${bhkMatch[0]} Apartment in ${localityMatch?.[1] || 'Chennai'}`,
            price_inr: price,
            locality: localityMatch?.[1]?.split(',')[0]?.trim() || 'Chennai',
            city: 'Chennai',
            state: 'Tamil Nadu',
            builder: null,
            bedrooms: parseInt(bhkMatch[1]),
            sqft: parseArea(text),
            source: 'nobroker',
            url: null
          });
          
          if (properties.length >= 10) break;
        }
      }
    }
  }
  
  return properties;
}

/**
 * Parse price string to INR number
 * Handles: "Rs. 1.2 Cr", "₹50 L", "1,50,00,000", etc.
 */
function parsePrice(priceText) {
  if (!priceText) return null;
  
  const clean = priceText.replace(/[₹Rs.,\s]/gi, '');
  const crMatch = clean.match(/(\d+\.?\d*)\s*cr/i);
  const lMatch = clean.match(/(\d+\.?\d*)\s*l/i);
  const numMatch = clean.match(/(\d+)/);
  
  if (crMatch) {
    return Math.round(parseFloat(crMatch[1]) * 10000000);
  } else if (lMatch) {
    return Math.round(parseFloat(lMatch[1]) * 100000);
  } else if (numMatch) {
    return parseInt(numMatch[1]);
  }
  
  return null;
}

/**
 * Parse area string to sqft number
 */
function parseArea(areaText) {
  if (!areaText) return null;
  
  const match = areaText.match(/(\d+(?:\.\d+)?)\s*(?:sqft|sq\.?\s*ft)/i);
  if (match) {
    return Math.round(parseFloat(match[1]));
  }
  
  return null;
}

/**
 * Filter out large builders (keep only medium builders)
 */
function filterMediumBuilders(properties) {
  return properties.filter(property => {
    const builderName = (property.builder || '').toLowerCase();
    return !LARGE_BUILDERS.some(large => 
      builderName.includes(large.toLowerCase())
    );
  });
}

/**
 * Group properties by builder and limit to 2 per builder
 */
function groupByBuilder(properties, maxPerBuilder = 2) {
  const grouped = {};
  const result = [];

  for (const property of properties) {
    const builderKey = (property.builder || 'Unknown').toLowerCase();
    if (!grouped[builderKey]) {
      grouped[builderKey] = [];
    }
    if (grouped[builderKey].length < maxPerBuilder) {
      grouped[builderKey].push(property);
      result.push(property);
    }
  }

  return result;
}

/**
 * Map property data to Supabase schema
 */
function mapToSupabaseSchema(property) {
  // Generate description from available data
  const descriptionParts = [];
  if (property.bedrooms) descriptionParts.push(`${property.bedrooms} BHK`);
  descriptionParts.push('Apartment');
  if (property.sqft) descriptionParts.push(`with ${property.sqft} sqft`);
  descriptionParts.push(`in ${property.locality || property.city || 'Chennai'}`);
  if (property.builder) descriptionParts.push(`by ${property.builder}`);
  descriptionParts.push(`Available for sale at ₹${property.price_inr?.toLocaleString('en-IN') || 'Price on request'}.`);
  
  const description = descriptionParts.join(' ') + ' This property offers modern amenities and a prime location.';
  
  return {
    title: property.title,
    description: description,
    city: property.city || 'Chennai',
    locality: property.locality || 'Chennai',
    state: property.state || 'Tamil Nadu',
    price_inr: property.price_inr,
    base_price: property.price_inr,
    bedrooms: property.bedrooms,
    sqft: property.sqft,
    carpet_area: property.sqft,
    builder: property.builder,
    property_type: 'Apartment',
    bhk_type: property.bedrooms ? `${property.bedrooms}BHK` : null,
    listing_status: 'active',
    status: 'active',
    is_verified: false,
    upload_source: 'api_import', // Allowed values: builder_direct, admin_on_behalf, api_import, bulk_upload
    property_metadata: {
      source_url: property.url,
      fetched_at: new Date().toISOString(),
      source_portal: property.source
    }
  };
}

/**
 * Validate property data before insertion
 */
function validateProperty(property) {
  // Must have at least title and price
  if (!property.title || !property.price_inr) {
    return false;
  }
  // Title should be meaningful (at least 10 chars)
  if (property.title.length < 10) {
    return false;
  }
  // Price should be reasonable (between 50K and 500Cr for Chennai - very lenient)
  if (property.price_inr < 50000 || property.price_inr > 50000000000) {
    console.log(`   ⚠️  Price out of range: ${property.price_inr} for "${property.title.substring(0, 40)}"`);
    return false;
  }
  // Must have city (default to Chennai if missing)
  if (!property.city) {
    property.city = 'Chennai';
  }
  // Locality should be reasonable (not empty or too long)
  if (property.locality && property.locality.length > 100) {
    property.locality = property.locality.substring(0, 100);
  }
  // Ensure locality exists - extract from title if missing
  if (!property.locality || property.locality.length < 2) {
    // Try to extract from title
    const titleMatch = property.title.match(/(?:in|at)\s+([A-Z][a-zA-Z\s]+?)(?:,|$)/i);
    if (titleMatch) {
      property.locality = titleMatch[1].trim().replace(/Chennai.*/i, '').trim();
    }
    property.locality = property.locality || property.city || 'Chennai';
  }
  // Clean locality - remove common prefixes
  property.locality = property.locality
    .replace(/^for\s+Sale\s+in\s+/i, '')
    .replace(/^Sale\s+(?:in|at)\s+/i, '')
    .split(',')[0]
    .split('-')[0]
    .trim();
    
  return true;
}

/**
 * Sync properties to Supabase
 */
async function syncToSupabase(properties) {
  console.log(`\n📦 Syncing ${properties.length} properties to Supabase...`);
  
  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  for (const property of properties) {
    try {
      // Validate property data
      if (!validateProperty(property)) {
        console.warn(`⚠️  Skipping invalid property: "${property.title}"`);
        skippedCount++;
        continue;
      }

      const mapped = mapToSupabaseSchema(property);
      
      // Ensure required fields
      if (!mapped.title || !mapped.city) {
        console.warn(`⚠️  Skipping property with missing required fields: "${property.title}"`);
        skippedCount++;
        continue;
      }
      
      // Use insert with conflict handling - check if exists first
      let error = null;
      
      // Check if property already exists
      const { data: existing } = await supabase
        .from('properties')
        .select('id')
        .eq('title', mapped.title)
        .eq('city', mapped.city)
        .limit(1)
        .maybeSingle();
      
      // Set is_verified to false to prevent triggers from firing (triggers check for is_verified = true)
      mapped.is_verified = false;
      
      if (existing) {
        // Update existing property
        const { error: updateError } = await supabase
          .from('properties')
          .update({
            ...mapped,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
        error = updateError;
        if (!error) {
          console.log(`   ↻ Updated existing property: ${property.title}`);
        }
      } else {
        // Insert new property - triggers won't fire because is_verified = false
        const { data: inserted, error: insertError } = await supabase
          .from('properties')
          .insert({
            ...mapped,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('id')
          .single();
        
        error = insertError;
      }

      // If that fails, try insert (might be a new property)
      if (error && error.code === '23505') { // Unique violation
        console.log(`   Property already exists, skipping: ${property.title}`);
        skippedCount++;
        continue;
      }

      if (error) {
        console.error(`❌ Error syncing "${property.title}":`, error.message);
        console.error(`   Data:`, JSON.stringify(mapped, null, 2));
        errorCount++;
      } else {
        successCount++;
        console.log(`✅ Synced: ${property.title} - ${property.locality || property.city} - ₹${property.price_inr?.toLocaleString('en-IN')}`);
      }
    } catch (err) {
      console.error(`❌ Error processing "${property.title}":`, err.message);
      errorCount++;
    }
  }

  console.log(`\n📊 Sync Summary: ${successCount} successful, ${errorCount} errors, ${skippedCount} skipped`);
  return { successCount, errorCount, skippedCount };
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 Starting property fetching from Chennai portals...\n');
  console.log(`📍 Target: Chennai, Tamil Nadu`);
  console.log(`🎯 Goal: 10 properties from 5 different builders (2 each)\n`);

  const allProperties = [];
  
  // Fetch from MagicBricks
  console.log('🔍 Fetching from MagicBricks...');
  const mbHtml = await fetchWithZenRows(PORTAL_URLS.magicbricks);
  if (mbHtml) {
    const mbProperties = parseMagicBricks(mbHtml);
    console.log(`   Found ${mbProperties.length} properties`);
    allProperties.push(...mbProperties);
  } else {
    console.log('   ⚠️  Failed to fetch from MagicBricks');
  }

  // Wait between requests to avoid rate limits
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Fetch from 99acres
  console.log('\n🔍 Fetching from 99acres...');
  const acresHtml = await fetchWithZenRows(PORTAL_URLS['99acres']);
  if (acresHtml) {
    const acresProperties = parse99acres(acresHtml);
    console.log(`   Found ${acresProperties.length} properties`);
    allProperties.push(...acresProperties);
  } else {
    console.log('   ⚠️  Failed to fetch from 99acres');
  }

  // Wait between requests to avoid rate limits
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Fetch from NoBroker
  console.log('\n🔍 Fetching from NoBroker...');
  const nbHtml = await fetchWithZenRows(PORTAL_URLS.nobroker);
  if (nbHtml) {
    const nbProperties = parseNoBroker(nbHtml);
    console.log(`   Found ${nbProperties.length} properties`);
    allProperties.push(...nbProperties);
  } else {
    console.log('   ⚠️  Failed to fetch from NoBroker');
  }

  console.log(`\n📊 Total properties found: ${allProperties.length}`);

  // Filter for medium builders
  const mediumBuilderProperties = filterMediumBuilders(allProperties);
  console.log(`📊 After filtering large builders: ${mediumBuilderProperties.length}`);

  // Group by builder and limit to 2 per builder
  const groupedProperties = groupByBuilder(mediumBuilderProperties, 2);
  console.log(`📊 After grouping (max 2 per builder): ${groupedProperties.length}`);

  // If we don't have enough, take top 10
  const finalProperties = groupedProperties.slice(0, 10);
  console.log(`📊 Final selection: ${finalProperties.length} properties\n`);

  // Display summary
  const builderGroups = {};
  finalProperties.forEach(p => {
    const builder = p.builder || 'Unknown';
    builderGroups[builder] = (builderGroups[builder] || 0) + 1;
  });
  
  console.log('🏗️  Properties by Builder:');
  Object.entries(builderGroups).forEach(([builder, count]) => {
    console.log(`   ${builder}: ${count}`);
  });

  // Sync to Supabase
  const result = await syncToSupabase(finalProperties);

  console.log('\n✨ Property fetching complete!');
  console.log(`✅ ${result.successCount} properties synced to Supabase`);
  console.log(`❌ ${result.errorCount} errors encountered`);

  return result;
}

// Run the script
main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});

