import { findBusinessWebsite } from "./brave-search";

const YELP_API_KEY = process.env.YELP_API_KEY;

export type RealBusiness = {
  name: string;
  industry: string;
  location: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  website: string | null;
  hasWebsite: boolean;
};

function buildAddress(business: any): string | null {
  const parts: string[] = [];
  if (business.location?.address1) parts.push(business.location.address1);
  if (business.location?.address2) parts.push(business.location.address2);
  if (business.location?.address3) parts.push(business.location.address3);
  const cityState: string[] = [];
  if (business.location?.city) cityState.push(business.location.city);
  if (business.location?.state) cityState.push(business.location.state);
  if (business.location?.zip_code) cityState.push(business.location.zip_code);
  if (cityState.length) parts.push(cityState.join(", "));
  return parts.length ? parts.join(", ") : null;
}

export async function searchRealBusinesses(
  industry: string,
  location: string,
  limit = 50
): Promise<RealBusiness[]> {
  if (!YELP_API_KEY) {
    throw new Error(
      "Yelp API key not configured. Set YELP_API_KEY in your .env.local file. Get a free key at https://www.yelp.com/developers/v3/manage_app"
    );
  }

  const url = `https://api.yelp.com/v3/businesses/search?term=${encodeURIComponent(industry)}&location=${encodeURIComponent(location)}&limit=${Math.min(limit, 50)}&sort_by=best_match`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${YELP_API_KEY}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Yelp API error ${res.status}: ${text.slice(0, 200)}`);
  }

  const json = await res.json();
  const raw: any[] = json.businesses || [];

  const mapped: RealBusiness[] = raw.map((item) => {
    const name = String(item.name || "").trim();
    const phone = item.display_phone?.trim() || item.phone?.trim() || null;
    const address = buildAddress(item);
    const detectedIndustry =
      Array.isArray(item.categories) && item.categories.length > 0
        ? String(item.categories[0].title || item.categories[0].alias || "").trim()
        : industry;

    return {
      name,
      industry: detectedIndustry || industry,
      location,
      phone: phone || null,
      email: null,
      address: address || null,
      website: null,
      hasWebsite: false,
    };
  }).filter((b) => b.name);

  // Enrich top 15 businesses with Brave Search (find actual websites)
  // Run all 15 in parallel with a hard global timeout of 12 seconds
  const toEnrich = mapped.slice(0, 15);
  const enrichmentPromise = Promise.all(
    toEnrich.map(async (business) => {
      const website = await findBusinessWebsite(business.name, location);
      if (website) {
        business.website = website;
        business.hasWebsite = true;
      }
    })
  );

  const timeoutPromise = new Promise<void>((_, reject) =>
    setTimeout(() => reject(new Error("enrichment-timeout")), 12000)
  );

  try {
    await Promise.race([enrichmentPromise, timeoutPromise]);
  } catch {
    // timeout or partial failure is fine — return what we have
  }

  return mapped;
}
