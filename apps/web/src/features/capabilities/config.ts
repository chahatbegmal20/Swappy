export type CapabilityStatus = "available" | "in_development" | "coming_soon";

export interface Capability {
  id: string;
  title: string;
  description: string;
  status: CapabilityStatus;
  href?: string;
}

export const STATUS_LABEL: Record<CapabilityStatus, string> = {
  available: "Available",
  in_development: "In development",
  coming_soon: "Coming soon",
};

/** Honest inventory — only mark available what the product ships today. */
export const CAPABILITIES: Capability[] = [
  {
    id: "intelligence",
    title: "Creator market intelligence",
    description:
      "Score drafts for virality, audience fit, trend alignment, and launch timing before you publish.",
    status: "available",
    href: "/upload",
  },
  {
    id: "trends",
    title: "Live trend radar",
    description:
      "Track emerging topics across platforms so your next piece rides demand, not noise.",
    status: "available",
    href: "/trends",
  },
  {
    id: "multimodal",
    title: "Multimodal draft analysis",
    description:
      "Bring video, audio, thumbnails, and scripts into one intelligence pass.",
    status: "available",
    href: "/upload",
  },
  {
    id: "studio",
    title: "Creator studio workspace",
    description:
      "Projects, uploads, and scores in one dark workspace built for shipping content.",
    status: "available",
    href: "/dashboard",
  },
  {
    id: "agents",
    title: "AI creative agents",
    description:
      "Agent workflows for strategy, scripting, visuals, and edits — wired through MCP and model tooling.",
    status: "coming_soon",
  },
  {
    id: "generate",
    title: "AI content generation",
    description:
      "Generate and refine assets inside Swappy with models you control, not a black box demo.",
    status: "coming_soon",
  },
  {
    id: "mcp-edit",
    title: "MCP-powered content editing",
    description:
      "Update drafts through connected tools and agent loops without leaving the studio.",
    status: "in_development",
  },
  {
    id: "campaigns",
    title: "Brand campaign automation",
    description:
      "Repurpose one idea across formats and channels with agent-assisted pipelines.",
    status: "coming_soon",
  },
];
