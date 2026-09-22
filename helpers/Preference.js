
const OpenAI = require("openai");
const fetch = require('node-fetch');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const retryAsync = async (fn, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      const retryable =
        err?.status === 503 ||
        err?.status === 429 ||
        err?.message?.includes("Service Unavailable");

      if (!retryable || i === retries - 1) {
        throw err;
      }

      console.log(`Retry attempt ${i + 1}`);
      await new Promise(res => setTimeout(res, 1500 * (i + 1)));
    }
  }
};
const axios = require('axios');
const sectionimages = require("./SectionImageList");
const NO_IMAGE = 'https://placehold.co/600x400?text=No+Image';

async function isValidImage(url) {
  try {
    const res = await axios.head(url, { timeout: 2000 });
    return res.status === 200 &&
      res.headers['content-type']?.startsWith('image/');
  } catch {
    return false;
  }
}
function getRandomImage(images = []) {
  return images[Math.floor(Math.random() * images.length)];
}
async function fixImageSmart(url, sectionType) {
  const valid = await isValidImage(url);

  if (valid) return url;

  const images = sectionimages[sectionType];

  if (images && images.length) {
    return getRandomImage(images);
  }

  return NO_IMAGE;
}
function isImageField(key, value) {
  if (typeof value !== 'string') return false;

  const lowerKey = key.toLowerCase();

  return (
    (lowerKey.includes('image') ||
      lowerKey.includes('img') ||
      lowerKey.includes('thumbnail')) &&
    value.trim() !== '' // ✅ no empty
  );
}
async function processImagesDeep(data, sectionType) {
  if (Array.isArray(data)) {
    return Promise.all(
      data.map((item) => processImagesDeep(item, sectionType))
    );
  }

  if (data && typeof data === 'object') {
    const result = {};

    for (const key in data) {
      const value = data[key];

      if (isImageField(key, value)) {
        result[key] = await fixImageSmart(value, sectionType);
      } else {
        result[key] = await processImagesDeep(value, sectionType);
      }
    }

    return result;
  }

  return data;
}
function safeJSONParse(text) {
  if (!text || typeof text !== "string") {
    throw new Error("Invalid JSON input: expected string");
  }

  let cleaned = text.trim();

  // remove markdown code fences
  cleaned = cleaned.replace(/```json\s*/gi, "").replace(/```\s*/g, "");

  // remove BOM / invisible chars
  cleaned = cleaned.replace(/^\uFEFF/, "");

  // smart quotes to normal quotes
  cleaned = cleaned
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'");

  // try direct parse first
  try {
    return JSON.parse(cleaned);
  } catch (err1) {
    // try extracting first valid JSON object/array block
    const firstObj = cleaned.indexOf("{");
    const lastObj = cleaned.lastIndexOf("}");
    const firstArr = cleaned.indexOf("[");
    const lastArr = cleaned.lastIndexOf("]");

    let candidate = "";

    if (firstObj !== -1 && lastObj !== -1 && lastObj > firstObj) {
      candidate = cleaned.slice(firstObj, lastObj + 1);
    } else if (firstArr !== -1 && lastArr !== -1 && lastArr > firstArr) {
      candidate = cleaned.slice(firstArr, lastArr + 1);
    }

    if (candidate) {
      try {
        return JSON.parse(candidate);
      } catch (err2) {
        // remove trailing commas
        const noTrailingCommas = candidate.replace(/,\s*([}\]])/g, "$1");

        try {
          return JSON.parse(noTrailingCommas);
        } catch (err3) {
          console.error("Raw AI response:", text);
          console.error("Cleaned response:", cleaned);
          console.error("Candidate JSON:", candidate);
          console.error("No trailing commas JSON:", noTrailingCommas);
          throw new Error(`Failed to parse AI JSON: ${err3.message}`);
        }
      }
    }

    console.error("Raw AI response:", text);
    console.error("Cleaned response:", cleaned);
    throw new Error(`Failed to parse AI JSON: ${err1.message}`);
  }
}
function getSectionDataRules() {
  const sectionDataRules = `
 SECTION ITEM COUNT RULES:
- about:
  - timeline: 5 to 6 items
  - stats: 4 items
  - features: 4 items
  - mission: 2 items

- hero:
  -stats:
    - startup: 3 to 4 items
    - education: 4 items
    - other: 3 items
    
  -features:
      - event: 3 to 4 items
      - clinic: 3 to 4 items
      - gym: 3 to 4 items
      - other: 3 items

- blog:
  - grid: 3 or 6 items
  - cards: 3 or 6 items
  - list: 3 to 5 items
  - featured: 4 items
  - minimal: 3 to 5 items


- features:
  - grid: 3 or 6 items
  - cards: 3 or 6 items
  - list: 4 or 6 items
  - timeline: 4 to 6 items
  - stats: 2 to 4 items
  - other: 4 to 6 items

- gallery:
  - grid: 4 or 8 items
  - masonry: 3 or 6 items
  - slider: 5 to 8 items

- pricing:
  - tiers 3 items
  - features 5 to 7 items
  - companies 4 items

- products:
  - 4 or 8 items

- services:
  - cards: 3 or 6 items
  - icons: 4 or 8 items
  - split: 4 to 6 items
  - other: 4 to 6 items

- stats:
  - 4 items

- team:
  - grid: 4 or 8 items
  - cards: 3 or 6 items
  - minimal: 3 to 5 items
  - slider : 6 to 9 iems
  - other: 3 to 6 items

- testimonials:
  - grid: 3 or 6 items
  - carousel: 3 to 8 items
  - minimal: 3 to 5 items
  - other: 3 to 6 items

- whychoose:
  - features: 3 or 6 items
  - stats: 2 or 4 items

- offices:
  - 4 to 8 items

- awards:
  - 4 to 6 items

- clients:
  - 4 to 8  items

- hours:
  - hours: 4 to 6 items
  - listing: 2 to 4  items

- integrations:
  - 4 to 8 items

- newsletter:
  - 2 to 4 items

- process:
  - 3 to 6 items

- roadmap:
  - 4 to 8 items

- trust:
  - 6 to 12 items

- contact:
  - support: 3 to 6 items
  - globalOffice: 4 to 8 items
  

IMPORTANT:
- Always follow the preferred item count
- Do not generate too few or too many items
- Keep counts consistent with the variant layout`;

  return sectionDataRules;
}
const formatVariantsForPrompt = (variants) => {
    return `
PREVIOUS VARIANTS USED (BY SECTION):

${Object.entries(variants)
    .map(([section, values]) => {
      return `- ${section}: ${values.join(", ")}`;
    })
    .join("\n")}

VARIANT INSTRUCTIONS:
- Avoid repeating the same variant for the same section
- Choose a DIFFERENT variant than previously used
- Maintain overall design consistency
- Ensure visual diversity across sections
- Do NOT use the same layout style repeatedly on a page
`
};
function buildFullGeneratePrompt({
  websiteName = "",
  description = "",
  websiteType = "",
  industry = "",
  selectedPages = [],
  designStyle = "modern",
  brandTone = "professional",
  contentLength = "medium",
  allPages = [],
  allowedSections = [],
  sectionVariants = {},
  sectionSchemas = {},
  maxPages,
  maxSectionsPerPage,
  previousVariantsPrompt = {}
}) {
  const safeSelectedPages = Array.isArray(selectedPages) ? selectedPages : [];
  const safeAllPages = Array.isArray(allPages) ? allPages : [];
  const safeAllowedSections = Array.isArray(allowedSections) ? allowedSections : [];

const previousVariants =  previousVariantsPrompt ? formatVariantsForPrompt(previousVariantsPrompt) : "";

  const designStyleGuideMap = {
    modern: "clean, minimal, polished, modern, balanced layout, simple professional wording",
    bold: "high-impact, vibrant, energetic, strong headings, visually striking sections",
    elegant: "refined, premium, graceful, polished, soft and sophisticated wording",
    creative: "expressive, artistic, imaginative, engaging, visually rich and dynamic",
    corporate: "formal, structured, trustworthy, business-focused, clear and professional",
  };

  const brandToneGuideMap = {
    professional: "clear, polished, business-friendly, trustworthy",
    friendly: "warm, approachable, conversational, easy to understand",
    creative: "expressive, engaging, imaginative, lively",
    corporate: "formal, authoritative, structured, serious",
  };

  const contentLengthGuideMap = {
    short: "keep headings short, descriptions concise, mostly 1 short sentence",
    medium: "keep content balanced, descriptions around 2 short sentences",
    detailed: "write slightly more detailed content, around 3 to 5 sentences where relevant",
  };

  const designStyleGuide =
    designStyleGuideMap[String(designStyle).toLowerCase()] || designStyleGuideMap.modern;

  const brandToneGuide =
    brandToneGuideMap[String(brandTone).toLowerCase()] || brandToneGuideMap.professional;

  const contentLengthGuide =
    contentLengthGuideMap[String(contentLength).toLowerCase()] || contentLengthGuideMap.medium;
  const sectionDataRules = getSectionDataRules();
  return `
You are an expert AI website builder.

Generate a complete website structure in strict JSON format.

STRICT OUTPUT RULES:
- Return ONLY valid JSON
- No explanation
- No markdown
- No extra text
- Do not return JavaScript functions
- Do not return JSX
- Do not return comments
- Do not invent extra keys
- Do not use null
- Do not leave required fields empty
- Use only serializable JSON values
- Do not use trailing commas
- Do not wrap JSON in markdown
- Return one complete valid JSON object only

OUTPUT FORMAT:
{
  "pages": [
    {
      "id": "string",
      "name": "string",
      "sections": [
        {
          "type": "string",
          "variant": "string",
          "visible": true,
          "data": {}
        }
      ]
    }
  ]
}

USER INPUT:
- Name: ${websiteName}
- Description: ${description}
- Type: ${websiteType}
- Industry: ${industry}
- Selected Pages: ${safeSelectedPages.join(", ")}
- Design Style: ${designStyle}
- Brand Tone: ${brandTone}
- Content Length: ${contentLength}

DESIGN AND CONTENT GUIDANCE:
- Design Style Meaning: ${designStyleGuide}
- Brand Tone Meaning: ${brandToneGuide}
- Content Length Meaning: ${contentLengthGuide}

ALL AVAILABLE PAGES:
${safeAllPages.join(", ")}

ALL AVAILABLE SECTIONS:
${safeAllowedSections.join(", ")}

AVAILABLE VARIANTS:
${Object.entries(sectionVariants)
      .map(([type, variants]) => `${type}: ${(variants || []).join(", ")}`)
      .join("\n")}

SECTION DATA SCHEMAS:
${Object.entries(sectionSchemas)
      .map(([type, schema]) => `${type}: ${JSON.stringify(schema, null, 2)}`)
      .join("\n\n")}

${previousVariants}

GLOBAL PAGE RULES:
1. Create EXACTLY these selected pages: ${safeSelectedPages.join(", ")}
2. Do NOT generate extra pages
3. Use ONLY sections from the available sections list
4. Use ONLY valid variants for each section type
5. Do NOT repeat the same section type in the same page
6. Each page must include exactly ONE header and exactly ONE footer
7. ALL pages must reuse the SAME header structure, navigation, branding, variant, and data
8. ALL pages must reuse the SAME footer structure, variant, and data
9. Header and footer must remain globally consistent across the entire website
10. Do NOT generate different header/footer content for different pages
11. Generate the header and footer once and reuse them on every page
12. If page id is not "home", do NOT generate hero
13. Each page must have at least 3 sections
14. Each page must NOT exceed ${maxSectionsPerPage === 0 ? "4 to 7" : maxSectionsPerPage} sections
15. Content must be meaningful, readable, industry-specific, and aligned with design style, brand tone, and content length
16. Do not use dummy text or placeholders like "sample text", "dummy", or "your text here"


HOME PAGE SECTION RULES:
- Home page must include exactly one header, one hero and one footer
- Home page should also include 3 to ${maxSectionsPerPage === 0 ? "7" : maxSectionsPerPage} of these if available:
  about, features, services, products, stats, testimonials, pricing, faq, cta, gallery

HEADER NAVIGATION RULES:
- Header links must be generated ONLY from the final pages array
- Each page must have exactly one corresponding navigation link
- Do NOT create additional navigation links beyond the generated pages
- Do NOT include placeholder or future pages in navigation
- Navigation must strictly reflect the actual pages structure

NON-HOME PAGE PREFERENCES:
- About page should prefer: about, stats, team, testimonials, cta
- Services page should prefer: services, features, stats, testimonials, cta
- Pricing page should prefer: pricing, faq, testimonials, cta
- Products page should prefer: products, gallery, pricing, testimonials, faq
- Blog page should prefer: blog, cta, faq
- Team page should prefer: team, about, stats, testimonials
- FAQ page should prefer: faq, contact, cta
- Testimonials page should prefer: testimonials, stats, cta
- Contact page should prefer: contact, faq, cta
- Portfolio page should prefer: gallery, testimonials, cta
- Gallery page should prefer: gallery, testimonials, cta

WRITING RULES:
1. Follow the selected design style mood in all content
2. Follow the selected brand tone in all content
3. Follow the selected content length in all content
4. CTA text must match the brand tone
5. Keep wording natural and realistic

SECTION DATA RULES:
1. Same section type must always use the same data structure regardless of variant
2. Follow the exact schema for each section type
3. Do not rename fields
4. Do not add fields that are not in the schema
5. Use "href" for links and button URLs
6. Do not return "onClick", "ctaAction", JavaScript functions, or handler functions
7. Arrays must always contain proper objects in the expected format
8. All text must be industry relevant and readable
9. If a section field is optional and not needed, you may omit it
10. If a section supports images, use realistic public image URLs
11. Navigation links must use:
   { "label": "string", "href": "string" }
12. CTA buttons must use:
   { "text": "string", "href": "string" }

IMAGE RULES:
- Images must be real public image URLs
- Use direct HTTPS URLs only
- Do not use local paths
- Do not use base64
- Do not leave image fields empty if image is included

ICON RULES:
- Icons must be returned as string names only
- Use only these allowed lucide-react icon names:
  Sparkles, Zap, Users, Award, CheckCircle, Star, ShoppingBag, Shield, Truck, Target, HeartHandshake, Globe, Camera, Music, Calendar, PartyPopper, Phone, Mail, MapPin, Briefcase, TrendingUp, Layout, Image, Quote
- Do not return JSX
- Do not return React components
- Do not return SVG
- Do not return component code

${sectionDataRules}

LIMIT RULES:
- Maximum pages allowed: ${maxPages === 0 ? "3 to 12" : maxPages}
- Maximum sections per page: ${maxSectionsPerPage === 0 ? "4 to 7" : maxSectionsPerPage}

STRICT:
- Do NOT exceed page limit
- Do NOT exceed section limit per page
- If no limit is specified, keep the structure reasonable and well-balanced.

IMPORTANT:
- "type" must match one of the available sections
- "variant" must match one of the allowed variants for that type
- "id" must be lowercase and slug-friendly
- "name" must be human-readable
- "visible" must always be true
- Return only one final JSON object

Return ONLY JSON.
`;
}
const generateSectionId = (index) => {
  return "sec_" + index + "_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);
};

function buildContentOnlyPrompt({
  websiteName = "",
  description = "",
  websiteType = "",
  industry = "",
  designStyle = "modern",
  brandTone = "professional",
  contentLength = "medium",
  existingPages = [],
  sectionSchemas = {},
  maxPages,
  maxSectionsPerPage
}) {
  const safeExistingPages = Array.isArray(existingPages) ? existingPages : [];

  const designStyleGuideMap = {
    modern: "clean, minimal, polished, modern, balanced layout, simple professional wording",
    bold: "high-impact, vibrant, energetic, strong headings, visually striking sections",
    elegant: "refined, premium, graceful, polished, soft and sophisticated wording",
    creative: "expressive, artistic, imaginative, engaging, visually rich and dynamic",
    corporate: "formal, structured, trustworthy, business-focused, clear and professional",
  };

  const brandToneGuideMap = {
    professional: "clear, polished, business-friendly, trustworthy",
    friendly: "warm, approachable, conversational, easy to understand",
    creative: "expressive, engaging, imaginative, lively",
    corporate: "formal, authoritative, structured, serious",
  };

  const contentLengthGuideMap = {
    short: "keep headings short, descriptions concise, mostly 1 short sentence",
    medium: "keep content balanced, descriptions around 2 short sentences",
    detailed: "write slightly more detailed content, around 3 to 5 sentences where relevant",
  };

  const designStyleGuide =
    designStyleGuideMap[String(designStyle).toLowerCase()] || designStyleGuideMap.modern;

  const brandToneGuide =
    brandToneGuideMap[String(brandTone).toLowerCase()] || brandToneGuideMap.professional;

  const contentLengthGuide =
    contentLengthGuideMap[String(contentLength).toLowerCase()] || contentLengthGuideMap.medium;

  const sectionDataRules = getSectionDataRules();

  return `
You are an expert AI website content generator.

Regenerate website content only in strict JSON format.

STRICT OUTPUT RULES:
- Return ONLY valid JSON
- No explanation
- No markdown
- No extra text
- Do not return JavaScript functions
- Do not return JSX
- Do not return comments
- Do not invent extra keys
- Do not use null
- Do not remove pages
- Do not remove sections
- Do not add new pages
- Do not add new sections
- Do not change section order
- Do not change page order
- Do not change any page id
- Do not change any page name
- Do not change any section type
- Do not change any section variant
- Do not change "visible"
- Only refresh and improve the "data" content
- Return one complete valid JSON object only

OUTPUT FORMAT:
{
  "pages": [
    {
      "id": "string",
      "name": "string",
      "sections": [
        {
          "type": "string",
          "variant": "string",
          "visible": true,
          "data": {}
        }
      ]
    }
  ]
}

USER INPUT:
- Name: ${websiteName}
- Description: ${description}
- Type: ${websiteType}
- Industry: ${industry}
- Design Style: ${designStyle}
- Brand Tone: ${brandTone}
- Content Length: ${contentLength}

DESIGN AND CONTENT GUIDANCE:
- Design Style Meaning: ${designStyleGuide}
- Brand Tone Meaning: ${brandToneGuide}
- Content Length Meaning: ${contentLengthGuide}

SECTION DATA SCHEMAS:
${Object.entries(sectionSchemas)
      .map(([type, schema]) => `${type}: ${JSON.stringify(schema, null, 2)}`)
      .join("\n\n")}

EXISTING WEBSITE STRUCTURE:
${JSON.stringify(safeExistingPages, null, 2)}

CONTENT REGENERATION RULES:
1. Keep the exact same pages
2. Keep the exact same sections
3. Keep the exact same variants
4. Keep the exact same order
5. Update only the "data" object values
6. All text must be industry relevant and realistic
7. Follow the selected design style, brand tone, and content length
8. Use better wording, cleaner descriptions, and stronger CTA text where relevant
9. If image fields exist, keep them valid public HTTPS image URLs
10. If icon fields exist, return only allowed icon string names
11. Do not rename any keys
12. Do not add extra keys
13. Do not remove required keys

ICON RULES:
- Icons must be returned as string names only
- Use only these allowed lucide-react icon names:
  Sparkles, Zap, Users, Award, CheckCircle, Star, ShoppingBag, Shield, Truck, Target, HeartHandshake, Globe, Camera, Music, Calendar, PartyPopper, Phone, Mail, MapPin, Briefcase, TrendingUp, Layout, Image, Quote

${sectionDataRules}

LIMIT RULES:
- Maximum pages allowed: ${maxPages === 0 ? "No Limit" : maxPages}
- Maximum sections per page: ${maxSectionsPerPage === 0 ? "No Limit" : maxSectionsPerPage}

STRICT:
- Do NOT exceed page limit
- Do NOT exceed section limit per page
- If no limit is specified, keep the structure reasonable and well-balanced.

IMPORTANT:
- Preserve the exact structure
- Return only one final JSON object

Return ONLY JSON.
`;
}
function filterAIResponse(aiResponse, maxPages, maxSectionsPerPage) {
  if (!aiResponse || !Array.isArray(aiResponse)) {
    throw new Error("Invalid AI response");
  }

  let pages = aiResponse;

  // =========================
  // 🔹 PAGE LIMIT
  // =========================
  if (maxPages !== 0) {
    pages = pages.slice(0, maxPages);
  }

  // =========================
  // 🔹 SECTION LIMIT PER PAGE
  // =========================
  pages = pages.map((page) => {
    let sections = Array.isArray(page.sections) ? page.sections : [];

    if (maxSectionsPerPage !== 0) {
      sections = sections.slice(0, maxSectionsPerPage);
    }

    // =========================
    // 🔹 REMOVE DUPLICATE SECTION TYPES
    // =========================
    const seen = new Set();

    sections = sections.filter((sec) => {
      if (seen.has(sec.type)) return false;
      seen.add(sec.type);
      return true;
    });

    // =========================
    // 🔹 ENSURE HEADER & FOOTER
    // =========================
    const hasHeader = sections.some((s) => s.type === "header");
    const hasFooter = sections.some((s) => s.type === "footer");

    if (!hasHeader) {
      sections.unshift(
        page?.sections?.find((s) => s.type === "header")
        ||
        {
        id: generateSectionId(1 + 1),
        type: "header",
        variant: "classic",
        visible: true,
        data: {}
      });
    }

    if (!hasFooter) {
    
      sections.push(page?.sections?.find((s) => s.type === "footer")
       || {
        id: generateSectionId(1 + 1),
        type: "footer",
        variant: "classic",
        visible: true,
        data: {}
      });
    }

    // =========================
    // 🔹 HERO ONLY ON HOME
    // =========================
    if (page.id !== "home") {
      sections = sections.filter((s) => s.type !== "hero");
    }

    // =========================
    // 🔹 HOME MUST HAVE HERO
    // =========================
    if (page.id === "home") {
      const hasHero = sections.some((s) => s.type === "hero");

      if (!hasHero) {
      
        sections.splice(1, 0, 
             page?.sections?.find((s) => s.type === "hero")
         ||
          {
          type: "hero",
          variant: "centered",
          visible: true,
          data: {}
        });
      }
    }

    return {
      ...page,
      sections
    };
  });

  return pages;
}

const REGENERATE_ALLOWED_VARIANTS = {
  hero: [
    "centered",
    "media",
    "split",
    "minimal",
    "business",
    "portfolio",
    "saas",
    "consulting",
    "startup"
  ]
};
const VARIANT_CONTROL_TYPES = [
  "hero",
  "blog",
  "faq",
  "gallery",
  "pricing",
  "products",
  "testimonials"
];
function getAllowedVariants(sectionType, sectionVariants) {
  const all = sectionVariants[sectionType] || [];
  const restricted = REGENERATE_ALLOWED_VARIANTS[sectionType];
  return restricted?.length ? restricted : all;
}

async function validateAndFixAIResponse(aiPages, allowedPages, allowedSections, sectionVariants, previousVariants = null) {
  if (!Array.isArray(aiPages)) return [];

  return Promise.all(
    aiPages
      .filter((page) => page && allowedPages.includes(page.id))
      .map(async (page) => {
        const usedTypes = new Set();

        let sections = Array.isArray(page.sections) ? page.sections : [];

        sections = await Promise.all(
          sections
            .filter((section) => section && allowedSections.includes(section.type))
            .filter((section) => {
              if (usedTypes.has(section.type)) return false;
              usedTypes.add(section.type);
              return true;
            })
            .map(async (section, index) => {
              const validVariants = sectionVariants[section.type] || [];
              const fallbackVariant = validVariants[0] || "default";
              let variant = validVariants.includes(section.variant)
                ? section.variant
                : fallbackVariant;

              // 🔥 PAGE-WISE CHECK // 🔥 NEW LOGIC (IMPORTANT)
              if (previousVariants) {
                const prevVariant = previousVariants?.[page.id]?.[section.type];
                // 🔥 IMPORTANT CONDITION
                if (
                  VARIANT_CONTROL_TYPES.includes(section.type) &&
                  section.type !== 'header' &&
                  section.type !== 'footer' &&
                  prevVariant &&
                  variant === prevVariant
                ) {
                  const allowedVariants = getAllowedVariants(
                    section.type,
                    sectionVariants
                  );
                  const available = allowedVariants.filter(v => v !== prevVariant);
                  if (available.length) {
                    variant = available[Math.floor(Math.random() * available.length)];
                  }
                }
              }

              // 🔥🔥🔥 IMAGE PROCESSING HERE
              const fixedData = await processImagesDeep(
                section.data || {},
                section.type
              );

              return {
                id: generateSectionId(index + 1),
                type: section.type,
                variant: variant,
                visible: true,
                data: fixedData, // 👈 updated
              };
            })
        );

        const hasHeader = sections.some((s) => s.type === "header");
        const hasFooter = sections.some((s) => s.type === "footer");
        const hasHero = sections.some((s) => s.type === "hero");

        if (!hasHeader && allowedSections.includes("header")) {
          sections.unshift({
            id: generateSectionId(1),
            type: "header",
            variant: (sectionVariants.header || [])[0] || "split",
            visible: true,
            data: {},
          });
        }

        if (page.id === "home" && !hasHero && allowedSections.includes("hero")) {
          const insertAt = sections.findIndex((s) => s.type !== "header");

          const heroData = await processImagesDeep({}, "hero");

          const heroSection = {
            id: generateSectionId(1),
            type: "hero",
            variant: (sectionVariants.hero || [])[0] || "split",
            visible: true,
            data: heroData,
          };

          if (insertAt === -1) {
            sections.push(heroSection);
          } else {
            sections.splice(insertAt, 0, heroSection);
          }
        }

        if (!hasFooter && allowedSections.includes("footer")) {
          sections.push({
            id: generateSectionId(1),
            type: "footer",
            variant: (sectionVariants.footer || [])[0] || "minimal",
            visible: true,
            data: {},
          });
        }
        return {
          id: page.id,
          name: page.name,
          slug: page.id === "home" ? "index" : page.id,
          sections,
        };
      })
  );
}
const generateWebsiteOpenAI = async (prompt, apiKey) => {

  if (!apiKey) {
    throw new Error("API key missing");
  }
  const openai = new OpenAI({ apiKey });

  const response = await openai.chat.completions.create({
    model: "gpt-4.1", //gpt-4o-mini
    response_format: {
      type: "json_object"
    },
    messages: [
      {
        role: "system",
        content: `
You are a professional AI website generator.

STRICT RULES:
- Return ONLY valid JSON
- No markdown
- No explanation
- No comments
- No trailing commas
- Response must be valid JSON.parse()
- Keep descriptions concise
- Avoid unnecessary repetition
- Keep arrays reasonably sized
`
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.2,
    top_p: 0.1,

    max_completion_tokens: 12000
  });

  let text = response?.choices[0]?.message?.content;
  if (!text) {
    throw new Error("Empty AI response");
  }
  // 🧹 Clean markdown if exists
  text = text.replace(/```json|```/g, "").trim();
  // JSON parse
  const json = safeJSONParse(text);

  if (!json) {
    throw new Error("Invalid JSON from AI");
  }

  return json;

};


const generateWebsiteGeminiAI = async (prompt, apiKey) => {


  if (!apiKey) {
    throw new Error("API key missing");
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash", // fast + cheap 
  });
  const result = await model.generateContent(prompt);
  const response = await result.response; // ✅ IMPORTANT
  const text = response.text();
  if (!text) {
    throw new Error("Empty AI response");
  }
  const json = safeJSONParse(text);
  return json;

};


function getDefaultPagesByIndustry(industry) {
  const value = String(industry || "").toLowerCase();

  // 🛍️ E-Commerce
  if (["ecommerce", "store", "shop"].includes(value)) {
    return ["home", "products", "about", "faq", "contact"];
  }

  // 📈 Marketing / Lead Gen (specific → top priority)
  if (["marketing", "lead"].includes(value)) {
    return ["home", "services", "testimonials", "faq", "contact"];
  }

  // 🚀 SaaS / Startup
  if (["saas", "software", "startup"].includes(value)) {
    return ["home", "features", "pricing", "faq", "contact"];
  }

  // 📱 App Showcase (separate from SaaS)
  if (["app", "mobile", "showcase"].includes(value)) {
    return ["home", "features", "pricing", "gallery", "contact"];
  }

  // 🏢 Corporate / Business
  if (["corporate", "company", "business"].includes(value)) {
    return ["home", "about", "services", "team", "contact"];
  }

  // 💼 Agency / Consulting (removed "marketing" from here)
  if (["agency", "consulting"].includes(value)) {
    return ["home", "services", "portfolio", "testimonials", "contact"];
  }

  // 🍽️ Restaurant / Cafe
  if (["restaurant", "cafe", "food"].includes(value)) {
    return ["home", "about", "gallery", "faq", "contact"];
  }

  // 🏨 Hotel / Resort
  if (["hotel", "resort"].includes(value)) {
    return ["home", "about", "gallery", "faq", "contact"];
  }

  // 🎨 Portfolio
  if (["portfolio", "designer", "creative"].includes(value)) {
    return ["home", "portfolio", "about", "testimonials", "contact"];
  }

  // 👤 Personal Brand
  if (["personal", "brand", "resume"].includes(value)) {
    return ["home", "about", "services", "blog", "contact"];
  }

  // ✍️ Blog / Content
  if (["blog", "content", "creator"].includes(value)) {
    return ["home", "blog", "about", "faq", "contact"];
  }

  // 📰 News / Magazine
  if (["news", "magazine"].includes(value)) {
    return ["home", "blog", "about", "faq", "contact"];
  }

  // 📄 Landing Page
  if (["landing", "funnel"].includes(value)) {
    return ["home", "features", "pricing", "faq", "contact"];
  }

  // 🏥 Medical / Clinic
  if (["medical", "clinic", "doctor", "health"].includes(value)) {
    return ["home", "services", "team", "faq", "contact"];
  }

  // 🏋️ Fitness / Gym
  if (["fitness", "gym", "workout"].includes(value)) {
    return ["home", "services", "gallery", "pricing", "contact"];
  }

  // 💄 Salon / Spa
  if (["salon", "spa", "beauty"].includes(value)) {
    return ["home", "services", "gallery", "pricing", "contact"];
  }

  // 🏡 Real Estate
  if (["realestate", "property"].includes(value)) {
    return ["home", "products", "about", "faq", "contact"];
  }

  // 🎓 Education / Courses
  if (["education", "course", "learning", "school"].includes(value)) {
    return ["home", "services", "about", "faq", "contact"];
  }

  // 👥 Community / Membership
  if (["community", "membership", "forum"].includes(value)) {
    return ["home", "about", "services", "faq", "contact"];
  }

  // ❤️ Nonprofit / Charity
  if (["nonprofit", "charity", "ngo", "donation"].includes(value)) {
    return ["home", "about", "services", "gallery", "contact"];
  }

  // 🧩 Default fallback
  return ["home", "about", "services", "faq", "contact"];
}
const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

async function generateScreenshot({ url, fileName }) {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: "new",

/* live server */
    // executablePath: "/usr/bin/chromium-browser",
    // headless: "new",
    // timeout: 0,
    // args: [
    //   "--no-sandbox",
    //   "--disable-setuid-sandbox",
    //   "--disable-dev-shm-usage",
    //   "--disable-gpu",
    //   "--single-process",
    //   "--no-zygote",
    // ],
  });

  try {
    const page = await browser.newPage();

    const WIDTH = 1440;
    const HEIGHT = 900;

    await page.setViewport({
      width: WIDTH,
      height: HEIGHT,
    });

    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    // ✅ Wait for DOM
    await page.waitForSelector("body");

    // ✅ Wait for fonts
    await page.evaluate(async () => {
      await document.fonts.ready;
    });

    // ✅ Trigger animations (scroll down)
    await autoScroll(page);

    // ✅ Scroll back to top (IMPORTANT)
    await page.evaluate(() => window.scrollTo(0, 0));

    // ✅ Wait for animations to finish
    await new Promise((r) => setTimeout(r, 1200));

    // ✅ Create folder if not exists
    const dirPath = path.join(__dirname, "../uploads/websites/thumbnails");
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    const filePath = path.join(dirPath, `${fileName}.png`);

    // ✅ Take viewport screenshot (NOT full page)
    await page.screenshot({
      path: filePath,
    });

    return `/uploads/websites/thumbnails/${fileName}.png`;
  } catch (error) {
    console.error("Screenshot Error:", error);
    throw error;
  } finally {
    await browser.close();
  }
}

// 🔥 Auto scroll function (to trigger animations)
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 200;

      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= document.body.scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}


module.exports = {
  retryAsync, generateScreenshot, generateWebsiteOpenAI, generateWebsiteGeminiAI, filterAIResponse, validateAndFixAIResponse, getDefaultPagesByIndustry, buildFullGeneratePrompt, buildContentOnlyPrompt
}

