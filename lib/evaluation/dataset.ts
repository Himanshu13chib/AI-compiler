export interface EvalPrompt {
  id: string;
  category: "real" | "edge";
  label: string;
  prompt: string;
  expectedComplexity?: number;
  expectedIssues?: string[];
}

export const EVAL_DATASET: EvalPrompt[] = [
  // ── 10 Real Product Prompts ──────────────────────────────────────────────
  {
    id: "real-01",
    category: "real",
    label: "CRM Platform",
    prompt: "Build a CRM with contacts, deals pipeline, email integration, role-based access for sales reps and managers, and analytics dashboard",
    expectedComplexity: 7,
  },
  {
    id: "real-02",
    category: "real",
    label: "E-commerce Platform",
    prompt: "E-commerce platform with product catalog, cart, Stripe payments, order tracking, vendor dashboard, and admin panel",
    expectedComplexity: 8,
  },
  {
    id: "real-03",
    category: "real",
    label: "Project Management Tool",
    prompt: "Project management tool like Linear — teams, sprints, issues, priorities, comments, file attachments, and time tracking",
    expectedComplexity: 7,
  },
  {
    id: "real-04",
    category: "real",
    label: "Healthcare Booking",
    prompt: "Healthcare appointment booking — patients, doctors, specialties, slots, video consultation, prescriptions, insurance billing",
    expectedComplexity: 9,
  },
  {
    id: "real-05",
    category: "real",
    label: "Social Learning Platform",
    prompt: "Social learning platform — courses, instructors, students, video lessons, quizzes, certificates, and subscription plans",
    expectedComplexity: 8,
  },
  {
    id: "real-06",
    category: "real",
    label: "Restaurant Management",
    prompt: "Restaurant management — menu builder, table reservations, POS, kitchen display, inventory, staff scheduling, and analytics",
    expectedComplexity: 8,
  },
  {
    id: "real-07",
    category: "real",
    label: "Real Estate Platform",
    prompt: "Real estate platform — property listings, agents, virtual tours, mortgage calculator, lead management, and CMS",
    expectedComplexity: 7,
  },
  {
    id: "real-08",
    category: "real",
    label: "HR Management System",
    prompt: "HR management system — employees, departments, leave management, payroll, performance reviews, org chart",
    expectedComplexity: 8,
  },
  {
    id: "real-09",
    category: "real",
    label: "Multi-tenant SaaS",
    prompt: "Multi-tenant SaaS boilerplate — workspaces, billing, team invites, SSO, feature flags, usage limits per plan",
    expectedComplexity: 9,
  },
  {
    id: "real-10",
    category: "real",
    label: "Delivery Platform",
    prompt: "Delivery platform like DoorDash — customers, restaurants, drivers, live tracking, ratings, surge pricing, payouts",
    expectedComplexity: 10,
  },

  // ── 10 Edge Cases ────────────────────────────────────────────────────────
  {
    id: "edge-01",
    category: "edge",
    label: "Maximally Vague",
    prompt: "Build an app",
    expectedIssues: ["vague input", "clarifying questions"],
  },
  {
    id: "edge-02",
    category: "edge",
    label: "No Domain",
    prompt: "Make something for my business",
    expectedIssues: ["no domain context"],
  },
  {
    id: "edge-03",
    category: "edge",
    label: "Feature Explosion",
    prompt: "CRM but also social media and also e-commerce and also AI and also blockchain",
    expectedIssues: ["feature overload", "scope creep"],
  },
  {
    id: "edge-04",
    category: "edge",
    label: "Direct Contradiction",
    prompt: "Admins can't see anything but also admins control everything",
    expectedIssues: ["role contradiction"],
  },
  {
    id: "edge-05",
    category: "edge",
    label: "Logical Conflict",
    prompt: "Free app with premium features that everyone can access",
    expectedIssues: ["business model conflict"],
  },
  {
    id: "edge-06",
    category: "edge",
    label: "Single Word Clone",
    prompt: "Build Twitter",
    expectedIssues: ["underspecified"],
  },
  {
    id: "edge-07",
    category: "edge",
    label: "Zero Signal",
    prompt: "App for managing things with people and stuff",
    expectedIssues: ["zero domain signal"],
  },
  {
    id: "edge-08",
    category: "edge",
    label: "Role Conflict",
    prompt: "All users are admins and no one is an admin",
    expectedIssues: ["role conflict"],
  },
  {
    id: "edge-09",
    category: "edge",
    label: "Technical Impossibility",
    prompt: "Real-time app that doesn't need a backend",
    expectedIssues: ["technical impossibility"],
  },
  {
    id: "edge-10",
    category: "edge",
    label: "Overspecified Chaos",
    prompt: "Build a platform that handles user authentication with JWT and OAuth2, has a microservices architecture with 15 services, uses GraphQL and REST simultaneously, has real-time features via WebSockets and SSE, supports 50 user roles with granular permissions, integrates with 20 third-party APIs, has AI-powered recommendations, blockchain-based audit logs, AR/VR interfaces, voice commands, offline-first PWA, native mobile apps, desktop apps, CLI tools, and must be deployed on AWS, GCP, and Azure simultaneously with zero downtime and 99.999% uptime SLA while being completely free to use and generating $10M ARR from day one",
    expectedIssues: ["overspecified", "contradictions", "impossible requirements"],
  },
];
