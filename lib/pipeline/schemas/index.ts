import { z } from "zod";

// ─── Stage 1: Intent Schema ───────────────────────────────────────────────────
export const AppTypeEnum = z.enum([
  "CRM", "SaaS", "Marketplace", "Social", "Tool", "E-commerce", "Healthcare",
  "FinTech", "EdTech", "HRTech", "LegalTech", "PropTech", "FoodTech", "LogisticsTech",
  "GamePlatform", "MediaPlatform", "DevTool", "Analytics", "IoT", "Blockchain"
]);

export const FeatureSchema = z.object({
  name: z.string(),
  description: z.string(),
  priority: z.enum(["core", "secondary", "nice-to-have"]),
});

export const UserRoleSchema = z.object({
  name: z.string(),
  description: z.string(),
  accessLevel: z.number().int().min(1).max(5),
});

export const Stage1OutputSchema = z.object({
  appName: z.string(),
  appType: AppTypeEnum,
  tagline: z.string(),
  features: z.array(FeatureSchema),
  userRoles: z.array(UserRoleSchema),
  hasPayments: z.boolean(),
  hasAuth: z.boolean(),
  hasRealtime: z.boolean(),
  hasFileUpload: z.boolean(),
  hasNotifications: z.boolean(),
  hasAnalytics: z.boolean(),
  complexityScore: z.number().min(1).max(10),
  complexityReasoning: z.string(),
  ambiguities: z.array(z.string()),
  clarifyingQuestions: z.array(z.string()),
  inferredFeatures: z.array(z.string()),
  assumptions: z.array(z.string()),
});

export type Stage1Output = z.infer<typeof Stage1OutputSchema>;

// ─── Stage 2: Architect Schema ────────────────────────────────────────────────
export const FieldSchema = z.object({
  name: z.string(),
  type: z.string(),
  nullable: z.boolean(),
  unique: z.boolean(),
  indexed: z.boolean(),
  default: z.string().nullable(),
  validation: z.string().nullable(),
});

export const RelationSchema = z.object({
  type: z.enum(["hasMany", "belongsTo", "manyToMany"]),
  target: z.string(),
  through: z.string().optional(),
});

export const EntitySchema = z.object({
  name: z.string(),
  description: z.string(),
  fields: z.array(FieldSchema),
  relations: z.array(RelationSchema),
  businessRules: z.array(z.string()),
});

export const FlowStepSchema = z.object({
  order: z.number(),
  action: z.string(),
  actor: z.string(),
  condition: z.string().optional(),
  errorState: z.string().optional(),
});

export const FlowSchema = z.object({
  name: z.string(),
  trigger: z.string(),
  actors: z.array(z.string()),
  steps: z.array(FlowStepSchema),
  successOutcome: z.string(),
  failureOutcome: z.string(),
});

export const PermissionSchema = z.object({
  entity: z.string(),
  actions: z.array(z.enum(["create", "read", "update", "delete", "export"])),
});

export const RolePermissionSchema = z.object({
  role: z.string(),
  permissions: z.array(PermissionSchema),
});

export const CrossCuttingSchema = z.object({
  caching: z.object({
    strategy: z.string(),
    ttl: z.string(),
    invalidationRules: z.array(z.string()),
  }),
  rateLimiting: z.object({
    endpoints: z.array(z.string()),
    limits: z.array(z.string()),
  }),
  auditLogging: z.object({
    events: z.array(z.string()),
  }),
});

export const Stage2OutputSchema = z.object({
  entities: z.array(EntitySchema),
  flows: z.array(FlowSchema),
  rolePermissionMatrix: z.array(RolePermissionSchema),
  crossCuttingConcerns: CrossCuttingSchema,
  architectureNotes: z.array(z.string()),
});

export type Stage2Output = z.infer<typeof Stage2OutputSchema>;

// ─── Stage 3: Schema Output ───────────────────────────────────────────────────
export const ComponentSchema = z.object({
  id: z.string(),
  type: z.string(),
  label: z.string(),
  dataSource: z.string().optional(),
  props: z.record(z.string(), z.unknown()),
  children: z.array(z.union([z.string(), z.record(z.string(), z.unknown())])).optional().transform(
    arr => arr?.map(c => (typeof c === "string" ? c : (c as Record<string, unknown>).id as string || (c as Record<string, unknown>).label as string || JSON.stringify(c)))
  ),
  validations: z.array(z.string()).optional(),
});

export const PageSchema = z.object({
  name: z.string(),
  route: z.string(),
  title: z.string(),
  description: z.string(),
  layout: z.enum(["dashboard", "auth", "landing", "settings", "detail"]),
  requiredRoles: z.array(z.string()),
  components: z.array(ComponentSchema),
  seoMeta: z.object({ title: z.string(), description: z.string() }),
});

export const UISchemaOutput = z.object({
  pages: z.array(PageSchema),
  globalComponents: z.object({
    navbar: z.record(z.string(), z.unknown()),
    sidebar: z.record(z.string(), z.unknown()),
    footer: z.record(z.string(), z.unknown()),
  }),
  designTokens: z.object({
    primaryColor: z.string(),
    theme: z.enum(["light", "dark", "both"]),
  }),
  navigationStructure: z.object({
    main: z.array(z.string()),
    secondary: z.array(z.string()),
  }),
});

export const EndpointFieldSchema = z.object({
  name: z.string(),
  type: z.string(),
  required: z.boolean(),
  validation: z.string().optional(),
});

export const EndpointSchema = z.object({
  id: z.string(),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  path: z.string(),
  summary: z.string(),
  description: z.string(),
  requiredRoles: z.array(z.string()),
  requestBody: z.object({ fields: z.array(EndpointFieldSchema) }).optional(),
  queryParams: z.array(z.object({
    name: z.string(),
    type: z.string(),
    required: z.boolean(),
    description: z.string(),
  })).optional(),
  responseBody: z.object({
    successSchema: z.record(z.string(), z.unknown()),
    errorSchema: z.record(z.string(), z.unknown()),
  }),
  rateLimit: z.string().optional(),
  cacheable: z.boolean(),
  webhookTriggers: z.array(z.string()).optional(),
});

export const APISchemaOutput = z.object({
  baseUrl: z.string(),
  version: z.literal("v1"),
  endpoints: z.array(EndpointSchema),
});

export const DBColumnSchema = z.object({
  name: z.string(),
  type: z.string(),
  nullable: z.boolean(),
  unique: z.boolean(),
  primaryKey: z.boolean(),
  default: z.string().nullable(),
  foreignKey: z.object({ table: z.string(), column: z.string() }).optional(),
});

export const DBTableSchema = z.object({
  name: z.string(),
  description: z.string(),
  columns: z.array(DBColumnSchema),
  indexes: z.array(z.object({
    name: z.string(),
    columns: z.array(z.string()),
    unique: z.boolean(),
  })),
  triggers: z.array(z.string()).optional(),
});

export const MigrationSchema = z.object({
  order: z.number(),
  description: z.string(),
  sql: z.string(),
});

export const DatabaseSchemaOutput = z.object({
  dialect: z.literal("postgresql"),
  tables: z.array(DBTableSchema),
  migrations: z.array(MigrationSchema),
  seedData: z.array(z.object({
    table: z.string(),
    rows: z.array(z.record(z.string(), z.unknown())),
  })).optional(),
});

export const AuthRuleSchema = z.object({
  resource: z.string(),
  action: z.string(),
  condition: z.enum(["owner_only", "role_based", "public", "admin_only"]),
});

export const AuthSchemaOutput = z.object({
  provider: z.enum(["JWT", "OAuth", "both"]),
  strategies: z.array(z.string()),
  tokenConfig: z.object({
    accessExpiry: z.string(),
    refreshExpiry: z.string(),
  }),
  roles: z.array(z.object({
    name: z.string(),
    inheritsFrom: z.string().optional(),
    description: z.string(),
  })),
  rules: z.array(AuthRuleSchema),
  premiumGating: z.array(z.object({
    features: z.array(z.string()),
    planRequired: z.string(),
  })).optional(),
});

export const Stage3OutputSchema = z.object({
  uiSchema: UISchemaOutput,
  apiSchema: APISchemaOutput,
  dbSchema: DatabaseSchemaOutput,
  authSchema: AuthSchemaOutput,
});

export type Stage3Output = z.infer<typeof Stage3OutputSchema>;

// ─── Stage 4: Validation Schema ───────────────────────────────────────────────
export const IssueSchema = z.object({
  id: z.string(),
  type: z.enum(["critical", "warning", "suggestion"]),
  layer: z.enum(["ui", "api", "db", "auth", "cross"]),
  description: z.string(),
  affectedItems: z.array(z.string()),
  suggestedFix: z.string().optional(),
});

export const Stage4OutputSchema = z.object({
  passed: z.boolean(),
  totalIssues: z.number(),
  criticalIssues: z.array(IssueSchema),
  warnings: z.array(IssueSchema),
  suggestions: z.array(IssueSchema),
  autoFixed: z.array(z.object({ description: z.string(), layer: z.string() })),
  aiRepaired: z.array(z.object({
    issue: z.string(),
    layer: z.string(),
    attempts: z.number(),
    success: z.boolean(),
  })),
  unresolvedIssues: z.array(IssueSchema),
  consistencyScore: z.number().min(0).max(100),
});

export type Stage4Output = z.infer<typeof Stage4OutputSchema>;
export type Issue = z.infer<typeof IssueSchema>;

// ─── Stage 5: Assembly Schema ─────────────────────────────────────────────────
export const SimStepSchema = z.object({
  action: z.string(),
  apiEndpoint: z.string(),
  dbOperation: z.string(),
  roleCheck: z.string(),
  status: z.enum(["pass", "fail"]),
  reason: z.string().optional(),
});

export const SimResultSchema = z.object({
  flow: z.string(),
  steps: z.array(SimStepSchema),
  overallStatus: z.enum(["pass", "fail", "partial"]),
});

export const Stage5OutputSchema = z.object({
  masterConfig: z.object({
    intent: Stage1OutputSchema,
    architecture: Stage2OutputSchema,
    schemas: Stage3OutputSchema,
    validation: Stage4OutputSchema,
  }),
  readme: z.string(),
  metadata: z.object({
    generatedAt: z.string(),
    pipelineVersion: z.string(),
    totalTokensUsed: z.number(),
    totalTimeMs: z.number(),
    stageTimings: z.record(z.string(), z.number()),
  }),
  simulationResults: z.array(SimResultSchema),
  executabilityScore: z.number().min(0).max(100),
});

export type Stage5Output = z.infer<typeof Stage5OutputSchema>;
