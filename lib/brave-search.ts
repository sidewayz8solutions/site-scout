const BRAVE_API_KEY = process.env.BRAVE_API_KEY;

export async function findBusinessWebsite(businessName: string, location: string): Promise<string | null> {
  if (!BRAVE_API_KEY) return null;

  const query = encodeURIComponent(`${businessName} ${location}`);
  const url = `https://api.search.brave.com/res/v1/web/search?q=${query}&count=3&offset=0&safesearch=off&freshness=none`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "X-Subscription-Token": BRAVE_API_KEY,
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      console.error(`Brave API error ${res.status}`);
      return null;
    }

    const json = await res.json();
    const results: any[] = json.web?.results || json.results || [];

    for (const r of results) {
      const u = r.url?.trim() || r.href?.trim() || r.link?.trim();
      if (!u) continue;
      const lower = u.toLowerCase();
      if (
        lower.includes("yelp.com") ||
        lower.includes("facebook.com") ||
        lower.includes("instagram.com") ||
        lower.includes("linkedin.com") ||
        lower.includes("bbb.org") ||
        lower.includes("mapquest.com") ||
        lower.includes("yellowpages.com") ||
        lower.includes("angi.com") ||
        lower.includes("homeadvisor.com") ||
        lower.includes("google.com/maps") ||
        lower.includes("bing.com/maps")
      ) {
        continue;
      }
      return u;
    }

    return null;
  } catch (err) {
    clearTimeout(timeout);
    console.error("Brave lookup error:", err);
    return null;
  }
}

export async function findBusinessWebPresences(businessName: string, location: string): Promise<string[]> {
  if (!BRAVE_API_KEY) return [];

  const query = encodeURIComponent(`"${businessName}" "${location}"`);
  const url = `https://api.search.brave.com/res/v1/web/search?q=${query}&count=5&offset=0&safesearch=off&freshness=none`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "X-Subscription-Token": BRAVE_API_KEY,
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      console.error(`Brave API error ${res.status}`);
      return [];
    }

    const json = await res.json();
    const results: any[] = json.web?.results || json.results || [];

    const urls: string[] = [];
    for (const r of results) {
      const u = r.url?.trim() || r.href?.trim() || r.link?.trim();
      if (!u) continue;
      urls.push(u);
    }

    return urls;
  } catch (err) {
    clearTimeout(timeout);
    console.error("Brave lookup error:", err);
    return [];
  }
}
