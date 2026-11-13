/**
 * The one set of sample businesses and leads used everywhere: the marketing site's product mocks and
 * stories, the "Explore with sample data" workspace loader, and the local demo seed. Change it here
 * and the website and the product stay in step.
 *
 * Everything here is illustrative. People, businesses and phone numbers are invented, emails use
 * example.com, and the site labels these as example workspaces, never as customers or reviews.
 */
import type { CountryCode } from "./locations";

export type SampleLead = {
  ref: string;
  name: string;
  phone: string;
  service: string;
  title: string;
  suburb: string;
  city: string;
  postcode: string;
  county?: string;
  timing: string;
  budget?: string;
  answers: Record<string, string>;
  message: string;
  source: "landing_page" | "visitor_chat" | "manual";
  status: "unreviewed" | "qualifying" | "qualified" | "disqualified";
  stage: "new" | "reviewing" | "contact_attempted" | "connected" | "qualified" | "appointment_booked" | "proposal" | "won" | "lost";
  fit: "Strong fit" | "Possible fit" | "Weak fit";
  valueMinor?: number;
  lossReason?: "no_response" | "outside_area" | "budget_mismatch" | "timing" | "competitor" | "not_a_fit" | "other";
  /** How long ago the enquiry arrived, in hours (for realistic "4 min ago" / "2 days ago"). */
  hoursAgo: number;
  appointment?: { type: "phone" | "video" | "site_visit"; inDays: number; hour: number; minutes: number };
};

export type SampleProject = { ref: string; title: string; service: string; location: string; postcode: string; stage: string; valueMinor: number; observedDaysAgo: number; permission: "permitted" | "unknown" | "not_permitted"; source: string };

export type SampleBusiness = {
  key: "builders" | "electricians" | "plumbers" | "hvac" | "renovation" | "landscaping" | "cleaning" | "roofing";
  industry: string;
  name: string;
  tagline: string;
  country: CountryCode;
  state: string;
  county?: string;
  city: string;
  timezone: string;
  currency: "USD" | "AUD" | "NZD";
  services: string[];
  areas: { suburb?: string; city: string; county?: string; postcode: string }[];
  leads: SampleLead[];
  projects: SampleProject[];
};

export const SAMPLE_BUSINESSES: SampleBusiness[] = [
  {
    key: "builders",
    industry: "Builders & developers",
    name: "Coastline Homes",
    tagline: "Custom homes, knockdown rebuilds and duplexes across the Hunter.",
    country: "AU",
    state: "NSW",
    city: "Newcastle",
    timezone: "Australia/Sydney",
    currency: "AUD",
    services: ["home_builder", "property_developer"],
    areas: [
      { suburb: "Merewether", city: "Newcastle", postcode: "2291" },
      { suburb: "Adamstown", city: "Newcastle", postcode: "2289" },
      { suburb: "Hamilton", city: "Newcastle", postcode: "2303" },
      { suburb: "Wallsend", city: "Newcastle", postcode: "2287" },
      { city: "Lake Macquarie", postcode: "2280" },
    ],
    leads: [
      { ref: "B-01", name: "Sarah Mitchell", phone: "0412 555 101", service: "home_builder", title: "Double-storey new build", suburb: "Merewether", city: "Newcastle", postcode: "2291", timing: "1–3 months", answers: { land_owned: "Yes", build_type: "New build", house_type: "Double storey", site_visit: "Yes", start_timing: "1–3 months" }, message: "Four-bedroom double-storey home on our block in Merewether. We'd like a site visit before we go further.", source: "landing_page", status: "unreviewed", stage: "new", fit: "Strong fit", hoursAgo: 0.07 },
      { ref: "B-02", name: "Liam Chen", phone: "0412 555 102", service: "home_builder", title: "Knockdown rebuild", suburb: "Adamstown", city: "Newcastle", postcode: "2289", timing: "Within 1 month", budget: "$500k+", answers: { land_owned: "Yes", build_type: "Knockdown rebuild", house_type: "Single storey", decision_role: "Me and a partner", start_timing: "Within 1 month", budget_range: "$500k+" }, message: "Old fibro cottage to knock down and rebuild, single level, three bedrooms.", source: "visitor_chat", status: "qualified", stage: "appointment_booked", fit: "Strong fit", hoursAgo: 26, appointment: { type: "site_visit", inDays: 2, hour: 10, minutes: 60 } },
      { ref: "B-03", name: "Priya Nair", phone: "0412 555 103", service: "property_developer", title: "Duplex on two lots", suburb: "Wallsend", city: "Newcastle", postcode: "2287", timing: "3–6 months", budget: "$500k+", answers: { project_stage: "Planning approval", package_type: "Full build", start_timing: "3–6 months" }, message: "DA lodged for a duplex. Looking for a builder to price the full package.", source: "landing_page", status: "qualifying", stage: "proposal", fit: "Possible fit", valueMinor: 98000000, hoursAgo: 96 },
      { ref: "B-04", name: "Tom Becker", phone: "0412 555 104", service: "home_builder", title: "Granny flat", suburb: "Hamilton", city: "Newcastle", postcode: "2303", timing: "Not sure", answers: { land_owned: "Not yet", house_type: "Granny flat", start_timing: "Not sure" }, message: "Thinking about a granny flat at the back of a house we're buying.", source: "landing_page", status: "unreviewed", stage: "reviewing", fit: "Weak fit", hoursAgo: 5 },
      { ref: "B-05", name: "Grace Wilson", phone: "0412 555 105", service: "home_builder", title: "Single-storey family home", suburb: "Charlestown", city: "Lake Macquarie", postcode: "2290", timing: "1–3 months", budget: "$150k–$500k", answers: { land_owned: "Yes", build_type: "New build", house_type: "Single storey", start_timing: "1–3 months" }, message: "Four bedrooms, two living areas on a flat block.", source: "landing_page", status: "qualified", stage: "won", fit: "Strong fit", valueMinor: 61200000, hoursAgo: 24 * 34 },
    ],
    projects: [
      { ref: "BP-1", title: "Duplex, 2 lots — DA lodged", service: "property_developer", location: "Lambton, Newcastle NSW", postcode: "2299", stage: "Approval lodged", valueMinor: 65000000, observedDaysAgo: 3, permission: "permitted", source: "Council DA register" },
      { ref: "BP-2", title: "Townhouse package — tender", service: "home_builder", location: "Wallsend, Newcastle NSW", postcode: "2287", stage: "Tender", valueMinor: 140000000, observedDaysAgo: 6, permission: "unknown", source: "Licensed tender feed" },
    ],
  },
  {
    key: "electricians",
    industry: "Electricians",
    name: "Bright Spark Electric",
    tagline: "Residential and light commercial electrical across Greater Austin.",
    country: "US",
    state: "TX",
    county: "Travis County",
    city: "Austin",
    timezone: "America/Chicago",
    currency: "USD",
    services: ["electrician"],
    areas: [
      { suburb: "Mueller", city: "Austin", county: "Travis County", postcode: "78723" },
      { suburb: "South Congress", city: "Austin", county: "Travis County", postcode: "78704" },
      { city: "Round Rock", county: "Williamson County", postcode: "78664" },
      { city: "Cedar Park", county: "Williamson County", postcode: "78613" },
    ],
    leads: [
      { ref: "E-01", name: "Marcus Reed", phone: "(512) 555-0141", service: "electrician", title: "Level 2 EV charger install", suburb: "Mueller", city: "Austin", county: "Travis County", postcode: "78723", timing: "This week", answers: { work_type: "New install", property_type: "House", urgency: "This week" }, message: "Need a 240V charger in the garage before our new car arrives on Friday.", source: "landing_page", status: "unreviewed", stage: "new", fit: "Strong fit", hoursAgo: 0.3 },
      { ref: "E-02", name: "Elena Garcia", phone: "(512) 555-0142", service: "electrician", title: "200A panel upgrade", suburb: "South Congress", city: "Austin", county: "Travis County", postcode: "78704", timing: "This month", budget: "$10k–$50k", answers: { work_type: "Upgrade", property_type: "House", inspection_needed: "Yes", budget_range: "$10k–$50k" }, message: "1960s house, breakers keep tripping. Want the panel upgraded and permitted.", source: "visitor_chat", status: "qualified", stage: "appointment_booked", fit: "Strong fit", hoursAgo: 20, appointment: { type: "site_visit", inDays: 1, hour: 14, minutes: 45 } },
      { ref: "E-03", name: "Jordan Kim", phone: "(512) 555-0143", service: "electrician", title: "Whole-home rewire", suburb: "Old Town", city: "Round Rock", county: "Williamson County", postcode: "78664", timing: "1–3 months", answers: { work_type: "Upgrade", property_type: "House" }, message: "Buying an older home and want it rewired before we move in.", source: "landing_page", status: "qualifying", stage: "contact_attempted", fit: "Possible fit", hoursAgo: 52 },
      { ref: "E-04", name: "Aisha Brown", phone: "(512) 555-0144", service: "electrician", title: "Solar battery tie-in", suburb: "Brushy Creek", city: "Cedar Park", county: "Williamson County", postcode: "78613", timing: "Flexible", answers: { work_type: "New install", property_type: "House" }, message: "We have panels and want a home battery connected.", source: "landing_page", status: "unreviewed", stage: "reviewing", fit: "Possible fit", hoursAgo: 8 },
      { ref: "E-05", name: "Capital Dental Group", phone: "(512) 555-0145", service: "electrician", title: "Office fit-out lighting", suburb: "Downtown", city: "Austin", county: "Travis County", postcode: "78701", timing: "Within 1 month", answers: { work_type: "New install", sector: "Commercial" }, message: "New clinic fit-out, LED lighting and data points.", source: "manual", status: "qualified", stage: "won", fit: "Strong fit", valueMinor: 2840000, hoursAgo: 24 * 21 },
    ],
    projects: [{ ref: "EP-1", title: "Retail fit-out, 6 units — permit issued", service: "electrician", location: "Domain, Austin TX", postcode: "78758", stage: "Permit issued", valueMinor: 18000000, observedDaysAgo: 2, permission: "unknown", source: "City permit data" }],
  },
  {
    key: "plumbers",
    industry: "Plumbers",
    name: "Harbour Plumbing Co.",
    tagline: "Hot water, bathrooms, drains and gas across Auckland.",
    country: "NZ",
    state: "AUK",
    city: "Auckland",
    timezone: "Pacific/Auckland",
    currency: "NZD",
    services: ["plumber"],
    areas: [
      { suburb: "Ponsonby", city: "Auckland", postcode: "1011" },
      { suburb: "Remuera", city: "Auckland", postcode: "1050" },
      { suburb: "Mount Eden", city: "Auckland", postcode: "1024" },
      { suburb: "Takapuna", city: "Auckland", postcode: "0622" },
    ],
    leads: [
      { ref: "P-01", name: "Hana Walker", phone: "021 555 201", service: "plumber", title: "Hot water cylinder replacement", suburb: "Ponsonby", city: "Auckland", postcode: "1011", timing: "This week", answers: { work_type: "Installation", urgency: "This week", property_type: "House" }, message: "Cylinder is leaking. Need a replacement as soon as possible.", source: "visitor_chat", status: "unreviewed", stage: "new", fit: "Strong fit", hoursAgo: 0.5 },
      { ref: "P-02", name: "James O'Connor", phone: "021 555 202", service: "plumber", title: "Bathroom re-pipe", suburb: "Remuera", city: "Auckland", postcode: "1050", timing: "1–3 months", budget: "$10k–$50k", answers: { work_type: "Renovation", property_type: "House", budget_range: "$10k–$50k" }, message: "Renovating the main bathroom and want the old pipes replaced.", source: "landing_page", status: "qualified", stage: "appointment_booked", fit: "Strong fit", hoursAgo: 30, appointment: { type: "site_visit", inDays: 3, hour: 9, minutes: 45 } },
      { ref: "P-03", name: "Mei Tanaka", phone: "021 555 203", service: "plumber", title: "Blocked drain — urgent", suburb: "Mount Eden", city: "Auckland", postcode: "1024", timing: "Emergency", answers: { work_type: "Repair", urgency: "Emergency" }, message: "Water backing up in the laundry.", source: "landing_page", status: "qualified", stage: "won", fit: "Strong fit", valueMinor: 64000, hoursAgo: 24 * 6 },
      { ref: "P-04", name: "Daniel Fraser", phone: "021 555 204", service: "plumber", title: "Gas hob installation", suburb: "Takapuna", city: "Auckland", postcode: "0622", timing: "This month", answers: { work_type: "Installation", property_type: "Apartment / unit" }, message: "New gas hob going into our apartment kitchen.", source: "landing_page", status: "qualifying", stage: "connected", fit: "Possible fit", hoursAgo: 44 },
    ],
    projects: [{ ref: "PP-1", title: "Apartment block — plumbing package", service: "plumber", location: "Grey Lynn, Auckland", postcode: "1021", stage: "Tender", valueMinor: 42000000, observedDaysAgo: 4, permission: "unknown", source: "Licensed tender feed" }],
  },
  {
    key: "hvac",
    industry: "HVAC contractors",
    name: "Desert Air Heating & Cooling",
    tagline: "AC installs, replacements and servicing across the Valley.",
    country: "US",
    state: "AZ",
    county: "Maricopa County",
    city: "Phoenix",
    timezone: "America/Phoenix",
    currency: "USD",
    services: ["hvac"],
    areas: [
      { city: "Scottsdale", county: "Maricopa County", postcode: "85251" },
      { city: "Tempe", county: "Maricopa County", postcode: "85281" },
      { city: "Mesa", county: "Maricopa County", postcode: "85201" },
      { city: "Chandler", county: "Maricopa County", postcode: "85224" },
    ],
    leads: [
      { ref: "H-01", name: "Rachel Torres", phone: "(480) 555-0161", service: "hvac", title: "AC replacement, 4-ton", suburb: "Old Town", city: "Scottsdale", county: "Maricopa County", postcode: "85251", timing: "Emergency", answers: { work_type: "Replace", urgency: "Emergency", building_size: "2,400 sq ft house" }, message: "AC died, it's 112 outside. Need a replacement quote today.", source: "visitor_chat", status: "unreviewed", stage: "new", fit: "Strong fit", hoursAgo: 0.2 },
      { ref: "H-02", name: "Kevin Murphy", phone: "(480) 555-0162", service: "hvac", title: "Ducted system install", suburb: "Kyrene", city: "Tempe", county: "Maricopa County", postcode: "85281", timing: "1–3 months", budget: "$10k–$50k", answers: { work_type: "Install", building_size: "New addition, 600 sq ft", budget_range: "$10k–$50k" }, message: "New addition needs ducting tied into the existing system.", source: "landing_page", status: "qualified", stage: "proposal", fit: "Strong fit", valueMinor: 1450000, hoursAgo: 60 },
      { ref: "H-03", name: "Linda Park", phone: "(480) 555-0163", service: "hvac", title: "Pre-summer service", suburb: "Dobson Ranch", city: "Mesa", county: "Maricopa County", postcode: "85201", timing: "This month", answers: { work_type: "Service", existing_system: "8-year-old split" }, message: "Annual service before summer.", source: "landing_page", status: "qualified", stage: "appointment_booked", fit: "Strong fit", hoursAgo: 28, appointment: { type: "site_visit", inDays: 1, hour: 8, minutes: 60 } },
      { ref: "H-04", name: "Omar Haddad", phone: "(480) 555-0164", service: "hvac", title: "Heat pump conversion", suburb: "Ocotillo", city: "Chandler", county: "Maricopa County", postcode: "85224", timing: "3–6 months", answers: { work_type: "Replace" }, message: "Looking at switching to a heat pump.", source: "landing_page", status: "qualified", stage: "won", fit: "Possible fit", valueMinor: 1190000, hoursAgo: 24 * 15 },
    ],
    projects: [{ ref: "HP-1", title: "Medical office HVAC replacement — bid", service: "hvac", location: "Tempe AZ", postcode: "85282", stage: "Bidding", valueMinor: 22000000, observedDaysAgo: 5, permission: "unknown", source: "Public bid board" }],
  },
  {
    key: "renovation",
    industry: "Renovation & remodelling",
    name: "Northside Renovations",
    tagline: "Kitchens, bathrooms and extensions in Melbourne's inner north.",
    country: "AU",
    state: "VIC",
    city: "Melbourne",
    timezone: "Australia/Melbourne",
    currency: "AUD",
    services: ["renovation"],
    areas: [
      { suburb: "Fitzroy", city: "Melbourne", postcode: "3065" },
      { suburb: "Brunswick", city: "Melbourne", postcode: "3056" },
      { suburb: "Northcote", city: "Melbourne", postcode: "3070" },
      { suburb: "Coburg", city: "Melbourne", postcode: "3058" },
    ],
    leads: [
      { ref: "R-01", name: "Chloe Adams", phone: "0413 555 301", service: "renovation", title: "Kitchen renovation", suburb: "Fitzroy", city: "Melbourne", postcode: "3065", timing: "1–3 months", budget: "$50k–$150k", answers: { renovation_type: "Kitchen", budget_range: "$50k–$150k", start_timing: "1–3 months" }, message: "Terrace house kitchen, open up to the living area.", source: "landing_page", status: "unreviewed", stage: "new", fit: "Strong fit", hoursAgo: 1.5 },
      { ref: "R-02", name: "Ben Walsh", phone: "0413 555 302", service: "renovation", title: "Main bathroom", suburb: "Brunswick", city: "Melbourne", postcode: "3056", timing: "Within 1 month", budget: "$10k–$50k", answers: { renovation_type: "Bathroom", budget_range: "$10k–$50k" }, message: "Full strip-out and retile of a 1950s bathroom.", source: "visitor_chat", status: "qualified", stage: "appointment_booked", fit: "Strong fit", hoursAgo: 22, appointment: { type: "site_visit", inDays: 4, hour: 11, minutes: 60 } },
      { ref: "R-03", name: "Sofia Romano", phone: "0413 555 303", service: "renovation", title: "Whole-home renovation", suburb: "Northcote", city: "Melbourne", postcode: "3070", timing: "3–6 months", budget: "$150k–$500k", answers: { renovation_type: "Whole home", budget_range: "$150k–$500k" }, message: "Californian bungalow, full renovation and rear extension.", source: "landing_page", status: "qualifying", stage: "proposal", fit: "Strong fit", valueMinor: 38500000, hoursAgo: 24 * 4 },
      { ref: "R-04", name: "Nathan Price", phone: "0413 555 304", service: "renovation", title: "Laundry and powder room", suburb: "Coburg", city: "Melbourne", postcode: "3058", timing: "1–3 months", answers: { renovation_type: "Other" }, message: "Small laundry and powder room refresh.", source: "landing_page", status: "qualified", stage: "won", fit: "Possible fit", valueMinor: 2400000, hoursAgo: 24 * 18 },
    ],
    projects: [{ ref: "RP-1", title: "Heritage terrace — alterations permit", service: "renovation", location: "Carlton North VIC", postcode: "3054", stage: "Permit issued", valueMinor: 45000000, observedDaysAgo: 7, permission: "unknown", source: "Council planning register" }],
  },
  {
    key: "landscaping",
    industry: "Landscaping & lawn care",
    name: "Greenline Landscapes",
    tagline: "Garden design, hardscaping and lawn care in Christchurch.",
    country: "NZ",
    state: "CAN",
    city: "Christchurch",
    timezone: "Pacific/Auckland",
    currency: "NZD",
    services: ["landscaping", "lawn_care"],
    areas: [
      { suburb: "Riccarton", city: "Christchurch", postcode: "8011" },
      { suburb: "Cashmere", city: "Christchurch", postcode: "8022" },
      { suburb: "Fendalton", city: "Christchurch", postcode: "8041" },
      { suburb: "Sumner", city: "Christchurch", postcode: "8081" },
    ],
    leads: [
      { ref: "L-01", name: "Olivia Hart", phone: "022 555 401", service: "landscaping", title: "Back garden redesign", suburb: "Riccarton", city: "Christchurch", postcode: "8011", timing: "1–3 months", budget: "$10k–$50k", answers: { work_type: "Design", scape: "Both", budget_range: "$10k–$50k" }, message: "New lawn, deck edging and native planting.", source: "landing_page", status: "unreviewed", stage: "new", fit: "Strong fit", hoursAgo: 3 },
      { ref: "L-02", name: "George Bennett", phone: "022 555 402", service: "landscaping", title: "Retaining wall", suburb: "Cashmere", city: "Christchurch", postcode: "8022", timing: "Within 1 month", answers: { work_type: "Installation", scape: "Hardscape", site_size: "15 m of wall" }, message: "Sloping section, need a timber retaining wall.", source: "visitor_chat", status: "qualified", stage: "appointment_booked", fit: "Strong fit", hoursAgo: 40, appointment: { type: "site_visit", inDays: 2, hour: 15, minutes: 45 } },
      { ref: "L-03", name: "Emma Lawson", phone: "022 555 403", service: "lawn_care", title: "Fortnightly lawn care", suburb: "Fendalton", city: "Christchurch", postcode: "8041", timing: "As soon as possible", answers: { frequency: "Fortnightly", property_size: "600 m²" }, message: "Mowing and edging every two weeks.", source: "landing_page", status: "qualified", stage: "won", fit: "Strong fit", valueMinor: 180000, hoursAgo: 24 * 12 },
      { ref: "L-04", name: "Ryan Cole", phone: "022 555 404", service: "landscaping", title: "Paved courtyard", suburb: "Sumner", city: "Christchurch", postcode: "8081", timing: "3–6 months", answers: { work_type: "Installation", scape: "Hardscape" }, message: "Small paved courtyard with planters.", source: "landing_page", status: "qualifying", stage: "contact_attempted", fit: "Possible fit", hoursAgo: 70 },
    ],
    projects: [{ ref: "LP-1", title: "Subdivision landscaping — 12 lots", service: "landscaping", location: "Halswell, Christchurch", postcode: "8025", stage: "Tender", valueMinor: 9500000, observedDaysAgo: 3, permission: "unknown", source: "Licensed tender feed" }],
  },
  {
    key: "cleaning",
    industry: "Cleaning services",
    name: "Mile High Cleaning",
    tagline: "Homes, move-outs and offices across Denver.",
    country: "US",
    state: "CO",
    county: "Denver County",
    city: "Denver",
    timezone: "America/Denver",
    currency: "USD",
    services: ["cleaning"],
    areas: [
      { suburb: "Highlands", city: "Denver", county: "Denver County", postcode: "80211" },
      { suburb: "Capitol Hill", city: "Denver", county: "Denver County", postcode: "80203" },
      { suburb: "LoDo", city: "Denver", county: "Denver County", postcode: "80202" },
      { city: "Aurora", county: "Arapahoe County", postcode: "80012" },
    ],
    leads: [
      { ref: "C-01", name: "Hannah Lee", phone: "(303) 555-0181", service: "cleaning", title: "Weekly home clean", suburb: "Highlands", city: "Denver", county: "Denver County", postcode: "80211", timing: "As soon as possible", answers: { frequency: "Weekly", premises_size: "3 bed, 2 bath" }, message: "Weekly clean, we have a dog.", source: "landing_page", status: "unreviewed", stage: "new", fit: "Strong fit", hoursAgo: 0.9 },
      { ref: "C-02", name: "Chris Martin", phone: "(303) 555-0182", service: "cleaning", title: "Move-out deep clean", suburb: "Capitol Hill", city: "Denver", county: "Denver County", postcode: "80203", timing: "This week", answers: { frequency: "One-off", premises_size: "1 bed apartment" }, message: "Lease ends Friday, need a deep clean for the deposit.", source: "visitor_chat", status: "qualified", stage: "appointment_booked", fit: "Strong fit", hoursAgo: 18, appointment: { type: "site_visit", inDays: 3, hour: 9, minutes: 180 } },
      { ref: "C-03", name: "Union Street Studio", phone: "(303) 555-0183", service: "cleaning", title: "Office cleaning, 3x weekly", suburb: "LoDo", city: "Denver", county: "Denver County", postcode: "80202", timing: "Within 1 month", answers: { frequency: "3 times a week", premises_size: "4,000 sq ft office", sector: "Commercial" }, message: "Evening cleaning for our studio.", source: "manual", status: "qualified", stage: "won", fit: "Strong fit", valueMinor: 1560000, hoursAgo: 24 * 25 },
      { ref: "C-04", name: "Patricia Young", phone: "(303) 555-0184", service: "cleaning", title: "Post-construction clean", suburb: "Southlands", city: "Aurora", county: "Arapahoe County", postcode: "80012", timing: "This month", answers: { frequency: "One-off" }, message: "Builders finished our basement, need it cleaned.", source: "landing_page", status: "qualifying", stage: "connected", fit: "Possible fit", hoursAgo: 50 },
    ],
    projects: [{ ref: "CP-1", title: "New office tower — cleaning contract RFP", service: "cleaning", location: "Union Station, Denver CO", postcode: "80202", stage: "RFP open", valueMinor: 12000000, observedDaysAgo: 2, permission: "unknown", source: "Public bid board" }],
  },
  {
    key: "roofing",
    industry: "Roofing & painting",
    name: "Summit Roofing & Painting",
    tagline: "Roof restorations, repairs and repaints across Brisbane.",
    country: "AU",
    state: "QLD",
    city: "Brisbane",
    timezone: "Australia/Brisbane",
    currency: "AUD",
    services: ["roofing", "painting"],
    areas: [
      { suburb: "Paddington", city: "Brisbane", postcode: "4064" },
      { suburb: "New Farm", city: "Brisbane", postcode: "4005" },
      { suburb: "Chermside", city: "Brisbane", postcode: "4032" },
      { suburb: "Bulimba", city: "Brisbane", postcode: "4171" },
    ],
    leads: [
      { ref: "S-01", name: "Michael Ward", phone: "0414 555 501", service: "roofing", title: "Tile roof restoration", suburb: "Paddington", city: "Brisbane", postcode: "4064", timing: "1–3 months", budget: "$10k–$50k", answers: { work_type: "Replacement", roof_type: "Tile", condition: "Cracked tiles, faded" }, message: "Queenslander, roof needs a restoration before storm season.", source: "landing_page", status: "unreviewed", stage: "new", fit: "Strong fit", hoursAgo: 2 },
      { ref: "S-02", name: "Isla Morgan", phone: "0414 555 502", service: "painting", title: "Exterior repaint", suburb: "New Farm", city: "Brisbane", postcode: "4005", timing: "Within 1 month", budget: "$10k–$50k", answers: { work_type: "Repaint", surface: "Weatherboard" }, message: "Two-storey weatherboard, full exterior repaint.", source: "visitor_chat", status: "qualified", stage: "appointment_booked", fit: "Strong fit", hoursAgo: 30, appointment: { type: "site_visit", inDays: 1, hour: 13, minutes: 45 } },
      { ref: "S-03", name: "Henry Scott", phone: "0414 555 503", service: "roofing", title: "Leak repair", suburb: "Chermside", city: "Brisbane", postcode: "4032", timing: "Emergency", answers: { work_type: "Repair", roof_type: "Metal" }, message: "Leak over the kitchen after last night's storm.", source: "landing_page", status: "qualified", stage: "won", fit: "Strong fit", valueMinor: 120000, hoursAgo: 24 * 9 },
      { ref: "S-04", name: "Zoe Turner", phone: "0414 555 504", service: "painting", title: "Interior repaint, 4 rooms", suburb: "Bulimba", city: "Brisbane", postcode: "4171", timing: "3–6 months", answers: { work_type: "Repaint", surface: "Plasterboard" }, message: "Living areas and two bedrooms.", source: "landing_page", status: "disqualified", stage: "lost", fit: "Possible fit", lossReason: "timing", hoursAgo: 24 * 14 },
    ],
    projects: [{ ref: "SP-1", title: "School roof replacement — tender", service: "roofing", location: "Kedron QLD", postcode: "4031", stage: "Tender", valueMinor: 31000000, observedDaysAgo: 4, permission: "unknown", source: "Licensed tender feed" }],
  },
];

export const SAMPLE_BY_KEY = Object.fromEntries(SAMPLE_BUSINESSES.map((b) => [b.key, b])) as Record<SampleBusiness["key"], SampleBusiness>;

/** Which sample business best matches an organisation's services. */
export function sampleForServices(codes: string[]): SampleBusiness {
  return SAMPLE_BUSINESSES.find((b) => b.services.some((s) => codes.includes(s))) ?? SAMPLE_BUSINESSES[0]!;
}

export function sampleEmail(name: string) {
  return `${name.toLowerCase().replace(/[^a-z]+/g, ".").replace(/^\.|\.$/g, "")}@example.com`;
}

/** "4 min ago" style labels for the marketing mocks, computed from the sample's age. */
export function ago(hours: number): string {
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} min ago`;
  if (hours < 24) return `${Math.round(hours)}h ago`;
  const d = Math.round(hours / 24);
  return d === 1 ? "Yesterday" : `${d} days ago`;
}
