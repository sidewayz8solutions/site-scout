const businessSuffixes = [
  "Services", "Solutions", "Pro", "Experts", "Masters", "Plus", "Care", "Group",
  "Company", "Co", "Inc", "LLC", "Team", "Pros",
];

const streetNames = [
  "Main St", "Oak Ave", "Maple Rd", "Washington Blvd", "Lakeview Dr", "Cedar Ln",
  "Pine St", "Elm St", "Broadway", "Market St", "Highland Ave", "River Rd",
];

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatPhone() {
  const area = randInt(200, 999);
  const prefix = randInt(200, 999);
  const line = randInt(1000, 9999);
  return `(${area}) ${prefix}-${line}`;
}

export type MockBusiness = {
  name: string;
  industry: string;
  location: string;
  phone: string;
  address: string;
  website: string | null;
  hasWebsite: boolean;
};

export function generateMockBusinesses(industry: string, location: string, count = 20): MockBusiness[] {
  const results: MockBusiness[] = [];

  for (let i = 0; i < count; i++) {
    const suffix = pick(businessSuffixes);
    const prefixes = [
      "Apex", "Prime", "Elite", "Bright", "Swift", "Golden", "Royal", "Top",
      "All-Star", "Premier", "Metro", "City", "United", "First", "True",
    ];
    const prefix = pick(prefixes);
    const name = `${prefix} ${industry.charAt(0).toUpperCase() + industry.slice(1)} ${suffix}`;

    const streetNum = randInt(100, 9999);
    const street = pick(streetNames);
    const address = `${streetNum} ${street}, ${location}`;

    const hasWebsite = Math.random() > 0.55; // ~45% don't have websites
    let website: string | null = null;
    if (hasWebsite) {
      const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20);
      website = `https://www.${slug}.com`;
    }

    results.push({
      name,
      industry,
      location,
      phone: formatPhone(),
      address,
      website,
      hasWebsite,
    });
  }

  return results;
}
