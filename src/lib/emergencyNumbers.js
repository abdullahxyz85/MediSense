const EMERGENCY_NUMBER_BY_COUNTRY = [
  { match: ["united states", "usa", "us", "america"], number: "911" },
  { match: ["canada", "ca"], number: "911" },
  {
    match: [
      "united kingdom",
      "uk",
      "great britain",
      "gb",
      "england",
      "scotland",
      "wales",
    ],
    number: "999",
  },
  { match: ["australia", "au"], number: "000" },
  { match: ["new zealand", "nz"], number: "111" },
  { match: ["india", "in"], number: "112" },
  { match: ["ireland", "ie"], number: "112" },
  { match: ["singapore", "sg"], number: "995" },
  { match: ["japan", "jp"], number: "119" },
  { match: ["south africa", "za"], number: "112" },
  { match: ["united arab emirates", "uae", "ae"], number: "999" },
  { match: ["saudi arabia", "ksa", "sa"], number: "999" },
  { match: ["malaysia", "my"], number: "999" },
  { match: ["philippines", "ph"], number: "911" },
  { match: ["nigeria", "ng"], number: "112" },
  {
    match: [
      "europe",
      "eu",
      "france",
      "germany",
      "spain",
      "italy",
      "netherlands",
      "belgium",
    ],
    number: "112",
  },
];

export function getEmergencyNumber(countryInput) {
  if (!countryInput) return "112";

  const normalized = String(countryInput).trim().toLowerCase();

  for (const entry of EMERGENCY_NUMBER_BY_COUNTRY) {
    if (
      entry.match.some((match) => {
        if (match.length <= 2) {
          return new RegExp(`(^|\\W)${match}(\\W|$)`, "i").test(normalized);
        }

        return normalized.includes(match);
      })
    ) {
      return entry.number;
    }
  }

  return "112";
}
