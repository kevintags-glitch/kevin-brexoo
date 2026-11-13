/**
 * Target cities for Brexoo's location pages (/leads/<trade>/<country>/<state>/<city>): the larger
 * metros in each launch market, with real counties (US) and well-known suburbs/neighbourhoods and
 * their ZIP or postcodes. Each page combines this with the trade's templates and sample data, so
 * every page carries local, specific content rather than a swapped city name.
 */
import { COUNTRIES, findRegion, slugify, type CountryCode } from "./locations";

export type SeoCity = {
  slug: string;
  name: string;
  country: CountryCode;
  state: string;
  counties?: string[];
  areas: { name: string; postcode: string }[];
};

const c = (name: string, country: CountryCode, state: string, areas: [string, string][], counties?: string[]): SeoCity => ({
  slug: slugify(name),
  name,
  country,
  state,
  counties,
  areas: areas.map(([n, p]) => ({ name: n, postcode: p })),
});

export const SEO_CITIES: SeoCity[] = [
  // United States
  c("Austin", "US", "TX", [["Downtown", "78701"], ["East Austin", "78702"], ["South Congress", "78704"], ["Mueller", "78723"], ["Hyde Park", "78751"], ["Circle C", "78739"]], ["Travis County", "Williamson County", "Hays County"]),
  c("Houston", "US", "TX", [["Montrose", "77006"], ["Midtown", "77004"], ["The Heights", "77008"], ["River Oaks", "77019"], ["Memorial", "77024"], ["Bellaire", "77401"]], ["Harris County", "Fort Bend County", "Montgomery County"]),
  c("Dallas", "US", "TX", [["Uptown", "75204"], ["Bishop Arts", "75208"], ["Lakewood", "75214"], ["Oak Lawn", "75219"], ["Deep Ellum", "75226"], ["Preston Hollow", "75225"]], ["Dallas County", "Collin County", "Denton County"]),
  c("Phoenix", "US", "AZ", [["Downtown", "85004"], ["Arcadia", "85018"], ["North Central", "85020"], ["Ahwatukee", "85044"], ["Laveen", "85339"], ["Paradise Valley", "85253"]], ["Maricopa County"]),
  c("Denver", "US", "CO", [["LoDo", "80202"], ["Capitol Hill", "80203"], ["Cherry Creek", "80206"], ["Washington Park", "80209"], ["Highlands", "80211"], ["Central Park", "80238"]], ["Denver County", "Arapahoe County", "Jefferson County"]),
  c("Atlanta", "US", "GA", [["Buckhead", "30305"], ["Virginia-Highland", "30306"], ["Inman Park", "30307"], ["Midtown", "30308"], ["West End", "30310"], ["Grant Park", "30312"]], ["Fulton County", "DeKalb County", "Cobb County"]),
  c("Charlotte", "US", "NC", [["Dilworth", "28203"], ["South End", "28203"], ["NoDa", "28205"], ["Plaza Midwood", "28205"], ["Myers Park", "28207"], ["Ballantyne", "28277"]], ["Mecklenburg County"]),
  c("Nashville", "US", "TN", [["The Gulch", "37203"], ["12South", "37204"], ["East Nashville", "37206"], ["Germantown", "37208"], ["Sylvan Park", "37209"], ["Green Hills", "37215"]], ["Davidson County", "Williamson County"]),
  c("Tampa", "US", "FL", [["Channelside", "33602"], ["Seminole Heights", "33603"], ["Hyde Park", "33606"], ["Davis Islands", "33606"], ["Westchase", "33626"], ["New Tampa", "33647"]], ["Hillsborough County"]),
  c("Seattle", "US", "WA", [["Capitol Hill", "98102"], ["Fremont", "98103"], ["Wallingford", "98103"], ["Ballard", "98107"], ["Queen Anne", "98109"], ["West Seattle", "98116"]], ["King County"]),
  c("San Diego", "US", "CA", [["La Jolla", "92037"], ["Hillcrest", "92103"], ["Mission Hills", "92103"], ["North Park", "92104"], ["Pacific Beach", "92109"], ["Carmel Valley", "92130"]], ["San Diego County"]),
  c("Raleigh", "US", "NC", [["Downtown", "27601"], ["Oakwood", "27601"], ["Cameron Village", "27605"], ["Five Points", "27608"], ["North Hills", "27609"], ["Brier Creek", "27617"]], ["Wake County"]),
  // Australia
  c("Sydney", "AU", "NSW", [["Surry Hills", "2010"], ["Bondi", "2026"], ["Chatswood", "2067"], ["Manly", "2095"], ["Parramatta", "2150"], ["Penrith", "2750"]]),
  c("Melbourne", "AU", "VIC", [["Werribee", "3030"], ["Brunswick", "3056"], ["Fitzroy", "3065"], ["Richmond", "3121"], ["Box Hill", "3128"], ["St Kilda", "3182"]]),
  c("Brisbane", "AU", "QLD", [["New Farm", "4005"], ["Chermside", "4032"], ["Paddington", "4064"], ["Indooroopilly", "4068"], ["Carindale", "4152"], ["Bulimba", "4171"]]),
  c("Perth", "AU", "WA", [["Subiaco", "6008"], ["Scarborough", "6019"], ["Joondalup", "6027"], ["Mount Lawley", "6050"], ["Victoria Park", "6100"], ["Fremantle", "6160"]]),
  c("Adelaide", "AU", "SA", [["Henley Beach", "5022"], ["Glenelg", "5045"], ["Unley", "5061"], ["Norwood", "5067"], ["Prospect", "5082"], ["Mawson Lakes", "5095"]]),
  c("Newcastle", "AU", "NSW", [["Wallsend", "2287"], ["Adamstown", "2289"], ["Merewether", "2291"], ["Lambton", "2299"], ["Cooks Hill", "2300"], ["Hamilton", "2303"]]),
  c("Gold Coast", "AU", "QLD", [["Helensvale", "4212"], ["Southport", "4215"], ["Surfers Paradise", "4217"], ["Burleigh Heads", "4220"], ["Coolangatta", "4225"], ["Robina", "4226"]]),
  c("Canberra", "AU", "ACT", [["Kingston", "2604"], ["Woden", "2606"], ["Braddon", "2612"], ["Belconnen", "2617"], ["Tuggeranong", "2900"], ["Gungahlin", "2912"]]),
  // New Zealand
  c("Auckland", "NZ", "AUK", [["Takapuna", "0622"], ["Albany", "0632"], ["Ponsonby", "1011"], ["Mount Eden", "1024"], ["Remuera", "1050"], ["Howick", "2014"]]),
  c("Wellington", "NZ", "WGN", [["Karori", "6012"], ["Kelburn", "6012"], ["Newtown", "6021"], ["Miramar", "6022"], ["Island Bay", "6023"], ["Johnsonville", "6037"]]),
  c("Christchurch", "NZ", "CAN", [["Riccarton", "8011"], ["Cashmere", "8022"], ["Halswell", "8025"], ["Fendalton", "8041"], ["Papanui", "8053"], ["Sumner", "8081"]]),
  c("Hamilton", "NZ", "WKO", [["Frankton", "3204"], ["Rototuna", "3210"], ["Chartwell", "3210"], ["Flagstaff", "3210"], ["Hamilton East", "3216"], ["Hillcrest", "3216"]]),
  c("Tauranga", "NZ", "BOP", [["Bethlehem", "3110"], ["Otumoetai", "3110"], ["Greerton", "3112"], ["Pyes Pa", "3112"], ["Mount Maunganui", "3116"], ["Papamoa", "3118"]]),
];

export function cityRegion(city: SeoCity) {
  return findRegion(city.country, city.state)!;
}

export function countrySlug(code: CountryCode) {
  return COUNTRIES[code].slug;
}

export function findCity(country: string, state: string, city: string) {
  return SEO_CITIES.find((x) => countrySlug(x.country) === country && cityRegion(x).slug === state && x.slug === city);
}

export function citiesIn(country: CountryCode) {
  return SEO_CITIES.filter((x) => x.country === country);
}

export function countryFromSlug(slug: string): CountryCode | undefined {
  return (Object.keys(COUNTRIES) as CountryCode[]).find((k) => COUNTRIES[k].slug === slug);
}
