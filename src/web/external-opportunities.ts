export interface ExternalOpportunity {
  id: string;
  title: string;
  employer: string;
  location: string;
  category: string;
  experience: string;
  requirements: string;
  sourceUrl: string;
  checkedOn: string;
  reviewBy: string;
}

// Short, manually checked summaries, not an automated feed or employer partnership.
// Recheck the source and Apply link before extending reviewBy.
export const externalOpportunities: readonly ExternalOpportunity[] = [
  {
    id: "mimecast-r6649",
    title: "Associate Systems Administrator",
    employer: "Mimecast",
    location: "Johannesburg",
    category: "IT support & systems",
    experience: "2–3 years",
    requirements:
      "Business-platform administration, scripting and IT support experience. See the employer’s full requirements.",
    sourceUrl:
      "https://careers.mimecast.com/en/jobs/r6649/associate-systems-administrator/",
    checkedOn: "2026-10-25",
    reviewBy: "2026-11-01",
  },
  {
    id: "mimecast-r6824",
    title: "Senior Commission Analyst",
    employer: "Mimecast",
    location: "Johannesburg",
    category: "Sales operations & finance",
    experience: "5+ years",
    requirements:
      "Five or more years of experience, including three in sales compensation or operational analytics; advanced Excel and commissions systems.",
    sourceUrl:
      "https://careers.mimecast.com/en/jobs/r6824/senior-commission-analyst/",
    checkedOn: "2026-10-25",
    reviewBy: "2026-11-01",
  },
];

export function currentExternalOpportunities(
  now = new Date(),
  items: readonly ExternalOpportunity[] = externalOpportunities,
): readonly ExternalOpportunity[] {
  const time = now.getTime();
  return items.filter((item) => {
    const checked = Date.parse(`${item.checkedOn}T00:00:00Z`);
    const review = Date.parse(`${item.reviewBy}T00:00:00Z`);
    return Number.isFinite(time) && checked <= time && time < review;
  });
}
