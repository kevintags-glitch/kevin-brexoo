/** Common time zones for the launch markets first, then everything the runtime knows. */
export const COMMON_TIMEZONES = [
  "Australia/Sydney",
  "Australia/Melbourne",
  "Australia/Brisbane",
  "Australia/Adelaide",
  "Australia/Perth",
  "Australia/Hobart",
  "Australia/Darwin",
  "Pacific/Auckland",
  "Europe/London",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Asia/Singapore",
];

export function allTimezones(): string[] {
  try {
    const all = Intl.supportedValuesOf("timeZone");
    return [...COMMON_TIMEZONES, ...all.filter((z) => !COMMON_TIMEZONES.includes(z))];
  } catch {
    return COMMON_TIMEZONES;
  }
}

export const COUNTRIES = [
  { code: "AU", name: "Australia", currency: "AUD" },
  { code: "NZ", name: "New Zealand", currency: "NZD" },
  { code: "GB", name: "United Kingdom", currency: "GBP" },
  { code: "US", name: "United States", currency: "USD" },
  { code: "CA", name: "Canada", currency: "CAD" },
  { code: "SG", name: "Singapore", currency: "SGD" },
];
