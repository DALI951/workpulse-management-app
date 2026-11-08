import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding comprehensive small-company dataset...");

  const salt = await bcrypt.genSalt(10);
  const defaultPasswordHash = await bcrypt.hash("password123", salt);
  const adminPasswordHash = await bcrypt.hash("admin123", salt);

  // 1. Ensure Admin Account
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {
      username: "Administrator",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
    },
    create: {
      username: "Administrator",
      email: "admin@example.com",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
    },
  });
  console.log("✓ Admin ensured: admin@example.com / admin123");

  // Clear existing non-admin data to avoid duplicate collisions
  await prisma.task.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.user.deleteMany({
    where: { role: "COLLABORATOR" },
  });
  console.log("✓ Cleaned previous collaborator data for a fresh populate");

  // 2. Create Collaborators
  const teamMembers = [
    {
      username: "Sarah Jenkins",
      email: "sarah.jenkins@techvanguard.com",
      role: "COLLABORATOR",
    },
    {
      username: "Alexandre Dubois",
      email: "alex.dubois@techvanguard.com",
      role: "COLLABORATOR",
    },
    {
      username: "Tariq Al-Mansoor",
      email: "tariq.mansoor@techvanguard.com",
      role: "COLLABORATOR",
    },
    {
      username: "Elena Rostova",
      email: "elena.rostova@techvanguard.com",
      role: "COLLABORATOR",
    },
    {
      username: "Marcus Vance",
      email: "marcus.vance@techvanguard.com",
      role: "COLLABORATOR",
    },
    {
      username: "Leila Benali",
      email: "leila.benali@techvanguard.com",
      role: "COLLABORATOR",
    },
    {
      username: "Lucas Bernard",
      email: "lucas.bernard@techvanguard.com",
      role: "COLLABORATOR",
    },
    {
      username: "Chloe Martin",
      email: "chloe.martin@techvanguard.com",
      role: "COLLABORATOR",
    },
  ];

  const createdCollabs: Record<string, string> = {};

  for (const member of teamMembers) {
    const user = await prisma.user.create({
      data: {
        username: member.username,
        email: member.email,
        passwordHash: defaultPasswordHash,
        role: "COLLABORATOR",
      },
    });
    createdCollabs[member.username] = user.id;
    console.log(`✓ Created collaborator: ${member.username} (${member.email})`);
  }

  // 3. Define Projects & Tasks
  const companyProjects = [
    {
      name: "E-Commerce Checkout Revamp",
      description: "Overhaul the checkout funnel to support multi-currency, Apple Pay, and single-click checkout.",
      responsible: "Sarah Jenkins",
      tasks: [
        {
          title: "Implement Stripe & Apple Pay payment element",
          description: "Integrate Stripe Payment Request Button for seamless mobile checkout.",
          status: "COMPLETED",
          completedDaysAgo: 5,
        },
        {
          title: "Redesign address auto-complete and tax calculation",
          description: "Connect Google Places API and TaxJar for automatic rate calculation.",
          status: "COMPLETED",
          completedDaysAgo: 3,
        },
        {
          title: "Build multi-currency currency switcher and live exchange rates",
          description: "Cache live Forex rates via Redis and support EUR, USD, GBP, and AED.",
          status: "COMPLETED",
          completedDaysAgo: 1,
        },
        {
          title: "Optimize checkout page bundle size & initial load speed",
          description: "Lazy-load non-essential third-party analytics scripts to achieve sub-second LCP.",
          status: "IN_PROGRESS",
        },
        {
          title: "Cart abandonment automated email webhook integration",
          description: "Trigger Klaviyo event 30 minutes after checkout drop-off.",
          status: "IN_PROGRESS",
        },
        {
          title: "End-to-end Cypress test coverage for checkout edge cases",
          description: "Test failed transactions, expired cards, and 3D Secure challenges.",
          status: "PENDING",
        },
      ],
    },
    {
      name: "Design System 2.0 (Figma to Code)",
      description: "Unified token-based design library across web, iOS, and Android clients.",
      responsible: "Alexandre Dubois",
      tasks: [
        {
          title: "Establish color tokens, typography scales, and dark mode palette",
          description: "Standardize slate and indigo semantic tokens across all UI assets.",
          status: "COMPLETED",
          completedDaysAgo: 12,
        },
        {
          title: "Publish Figma component library v2.0 for engineering team",
          description: "Include variant auto-layouts, icon sets, and interaction states.",
          status: "COMPLETED",
          completedDaysAgo: 8,
        },
        {
          title: "Build accessible modal dialog & drawer components",
          description: "Add focus trapping, ARIA attributes, and smooth CSS transitions.",
          status: "COMPLETED",
          completedDaysAgo: 4,
        },
        {
          title: "Construct interactive data table component with column sorting",
          description: "Create responsive tables that collapse gracefully on mobile viewports.",
          status: "COMPLETED",
          completedDaysAgo: 2,
        },
        {
          title: "Design mobile bottom-sheet navigation and touch controls",
          description: "Prototype swipeable bottom drawer for smartphone screens.",
          status: "IN_PROGRESS",
        },
      ],
    },
    {
      name: "AWS Kubernetes Multi-Region Migration",
      description: "Deploy highly available EKS clusters across eu-west-1 and us-east-1 with automatic failover.",
      responsible: "Tariq Al-Mansoor",
      tasks: [
        {
          title: "Write Terraform modules for VPC peering and Route 53 latency routing",
          description: "Infrastructure as Code for all subnets, NAT gateways, and routing policies.",
          status: "COMPLETED",
          completedDaysAgo: 14,
        },
        {
          title: "Configure AWS EKS clusters with autoscaling node groups",
          description: "Setup Karpenter for automatic spot instance cost optimization.",
          status: "COMPLETED",
          completedDaysAgo: 7,
        },
        {
          title: "Deploy Prometheus, Grafana, and Loki monitoring stack",
          description: "Build alerting dashboards for CPU spikes, 5xx errors, and pod restarts.",
          status: "IN_PROGRESS",
        },
        {
          title: "Implement Istio Service Mesh for mTLS traffic encryption",
          description: "Enforce zero-trust security between microservices.",
          status: "IN_PROGRESS",
        },
        {
          title: "Disaster recovery failover simulation and chaos testing",
          description: "Simulate datacenter outage and verify sub-30s DNS failover.",
          status: "PENDING",
        },
        {
          title: "Automate daily cross-region database snapshot backups",
          description: "Configure AWS KMS encrypted replication to Frankfurt region.",
          status: "PENDING",
        },
      ],
    },
    {
      name: "Core API Microservices Refactoring",
      description: "Decompose monolithic backend into modular domain-driven microservices.",
      responsible: "Elena Rostova",
      tasks: [
        {
          title: "Design OpenAPI 3.1 schema and contracts for Users & Billing services",
          description: "Define strict JSON request and response validations.",
          status: "COMPLETED",
          completedDaysAgo: 10,
        },
        {
          title: "Implement distributed tracing with OpenTelemetry and Jaeger",
          description: "Trace request latency across API Gateway and backend services.",
          status: "COMPLETED",
          completedDaysAgo: 6,
        },
        {
          title: "Setup Apache Kafka event streams for asynchronous order processing",
          description: "Create topics for order_placed, invoice_generated, and user_notified.",
          status: "COMPLETED",
          completedDaysAgo: 3,
        },
        {
          title: "Migrate legacy SQL queries to optimized indexed queries",
          description: "Reduce database query latency on high-volume reporting endpoints.",
          status: "COMPLETED",
          completedDaysAgo: 1,
        },
        {
          title: "Implement distributed Redis rate limiter for public API endpoints",
          description: "Prevent scraping and abuse with a sliding window algorithm.",
          status: "IN_PROGRESS",
        },
        {
          title: "Implement GraphQL federation gateway for mobile clients",
          description: "Consolidate multiple REST endpoints into a unified graph schema.",
          status: "PENDING",
        },
        {
          title: "Automate API documentation generation via Swagger UI",
          description: "Publish interactive developer documentation portal.",
          status: "PENDING",
        },
      ],
    },
    {
      name: "Cross-Platform Mobile App v3.0",
      description: "Build next-generation React Native mobile application for iOS and Android.",
      responsible: "Marcus Vance",
      tasks: [
        {
          title: "Setup React Native 0.74 architecture with Hermes engine",
          description: "Configure new architecture with TurboModules for high performance.",
          status: "COMPLETED",
          completedDaysAgo: 11,
        },
        {
          title: "Implement biometric authentication (FaceID & Fingerprint)",
          description: "Support secure keychain storage and biometric lock screens.",
          status: "COMPLETED",
          completedDaysAgo: 4,
        },
        {
          title: "Offline-first data sync using WatermelonDB and SQLite",
          description: "Allow users to view projects and complete tasks while offline.",
          status: "IN_PROGRESS",
        },
        {
          title: "Build interactive push notification deep-linking handler",
          description: "Direct user immediately to specific task when tapping notification.",
          status: "IN_PROGRESS",
        },
        {
          title: "Optimize Android cold start launch time below 800ms",
          description: "Profile startup trace and defer non-critical module initializations.",
          status: "PENDING",
        },
        {
          title: "Submit builds to Apple TestFlight and Google Play Internal Track",
          description: "Coordinate QA alpha release and gather preliminary feedback.",
          status: "PENDING",
        },
      ],
    },
    {
      name: "Customer Onboarding & Retention Portal",
      description: "Interactive onboarding workflow to guide new enterprise clients through setup.",
      responsible: "Leila Benali",
      tasks: [
        {
          title: "Map customer onboarding journey and critical conversion milestones",
          description: "Identify drop-off bottlenecks in the 14-day trial period.",
          status: "COMPLETED",
          completedDaysAgo: 9,
        },
        {
          title: "Create interactive checklist widget for first-time administrators",
          description: "Guide users to invite team members and create their first project.",
          status: "COMPLETED",
          completedDaysAgo: 5,
        },
        {
          title: "Implement in-app tooltip tours using driver.js",
          description: "Highlight key navigation buttons, dark mode switch, and language options.",
          status: "COMPLETED",
          completedDaysAgo: 2,
        },
        {
          title: "Build automated NPS satisfaction survey modal after 30 days of usage",
          description: "Collect user feedback and feature requests directly in-app.",
          status: "IN_PROGRESS",
        },
        {
          title: "Analyze cohort retention data and export monthly churn reports",
          description: "Identify high-value client usage patterns to reduce account churn.",
          status: "PENDING",
        },
      ],
    },
    {
      name: "Automated End-to-End Testing Suite",
      description: "Continuous integration testing pipeline running Playwright and security scans on every PR.",
      responsible: "Lucas Bernard",
      tasks: [
        {
          title: "Setup Playwright test framework with parallel CI execution",
          description: "Configure GitHub Actions matrix to test Chrome, Firefox, and Safari.",
          status: "COMPLETED",
          completedDaysAgo: 13,
        },
        {
          title: "Write automated tests for Admin RBAC and collaborator permissions",
          description: "Verify that collaborators cannot access administrative routes.",
          status: "COMPLETED",
          completedDaysAgo: 7,
        },
        {
          title: "Integrate Snyk and OWASP dependency vulnerability scanners",
          description: "Block pull requests containing high or critical CVE vulnerabilities.",
          status: "COMPLETED",
          completedDaysAgo: 2,
        },
        {
          title: "Conduct penetration testing on JWT cookie sessions and CSRF protections",
          description: "Verify SameSite, HTTP-only, and token expiration behavior.",
          status: "IN_PROGRESS",
        },
        {
          title: "Implement visual regression testing using Playwright screenshot snapshots",
          description: "Catch unintended CSS and layout shifts on responsive breakpoints.",
          status: "PENDING",
        },
      ],
    },
    {
      name: "Q4 Brand Identity & Global Launch",
      description: "Coordinated digital marketing campaign, landing pages, and international PR announcements.",
      responsible: "Chloe Martin",
      tasks: [
        {
          title: "Design modern responsive product landing page and interactive demo",
          description: "Feature animated workflow illustrations and customer testimonials.",
          status: "COMPLETED",
          completedDaysAgo: 15,
        },
        {
          title: "Produce product explainer video and UI walkthrough animations",
          description: "Highlight speed, collaboration tools, and dark mode interface.",
          status: "COMPLETED",
          completedDaysAgo: 8,
        },
        {
          title: "Write press release in English, French, and Arabic",
          description: "Distribute announcement to tech publications and regional media.",
          status: "COMPLETED",
          completedDaysAgo: 4,
        },
        {
          title: "Launch Google Ads and LinkedIn sponsored campaign",
          description: "Target enterprise project managers and technical team leads.",
          status: "COMPLETED",
          completedDaysAgo: 1,
        },
        {
          title: "Prepare Product Hunt launch assets and maker commentary",
          description: "Coordinate community support for #1 Product of the Day launch.",
          status: "IN_PROGRESS",
        },
        {
          title: "Track conversion rate optimization (CRO) on sign-up CTA buttons",
          description: "A/B test button copy and hero headlines to maximize click-throughs.",
          status: "PENDING",
        },
      ],
    },
    {
      name: "AI Semantic Search & Chatbot R&D",
      description: "Integrate vector embeddings to allow intelligent search across all team projects and tasks.",
      responsible: "Elena Rostova",
      tasks: [
        {
          title: "Benchmark text embedding models for technical documentation search",
          description: "Evaluate OpenAI text-embedding-3 and Google Gemini embeddings.",
          status: "COMPLETED",
          completedDaysAgo: 3,
        },
        {
          title: "Build PostgreSQL pgvector storage schema for task summaries",
          description: "Store high-dimensional vector representations of tasks and notes.",
          status: "IN_PROGRESS",
        },
        {
          title: "Implement natural language search query parser",
          description: "Translate 'show me pending tasks for mobile' into structured queries.",
          status: "IN_PROGRESS",
        },
        {
          title: "Prototype AI assistant to summarize weekly project accomplishments",
          description: "Generate executive bullet-point progress summaries for administrators.",
          status: "PENDING",
        },
        {
          title: "Benchmark API response latency and implement vector caching",
          description: "Ensure semantic search queries return within 200ms.",
          status: "PENDING",
        },
      ],
    },
    {
      name: "SOC2 Type II Security Compliance",
      description: "Establish audit trails, access controls, and policy documentation for enterprise security.",
      responsible: "Tariq Al-Mansoor",
      tasks: [
        {
          title: "Implement centralized audit logging for all administrative actions",
          description: "Log user creation, role modifications, and project deletions.",
          status: "COMPLETED",
          completedDaysAgo: 9,
        },
        {
          title: "Enforce multi-factor authentication (MFA) policy across team accounts",
          description: "Require TOTP authenticator app verification on login.",
          status: "COMPLETED",
          completedDaysAgo: 4,
        },
        {
          title: "Draft information security policy and incident response runbook",
          description: "Document step-by-step procedures for security incident remediation.",
          status: "IN_PROGRESS",
        },
        {
          title: "Engage external auditor for SOC2 Type II observation period",
          description: "Submit evidence artifacts and configuration screenshots.",
          status: "PENDING",
        },
      ],
    },
  ];

  let totalTasksCreated = 0;
  let totalProjectsCreated = 0;

  for (const proj of companyProjects) {
    const responsibleId = createdCollabs[proj.responsible];
    if (!responsibleId) {
      console.warn(`Collaborator ${proj.responsible} not found, skipping project ${proj.name}`);
      continue;
    }

    const createdProject = await prisma.project.create({
      data: {
        name: proj.name,
        description: proj.description,
        responsibleId,
      },
    });
    totalProjectsCreated++;

    for (const t of proj.tasks) {
      let completedAt: Date | null = null;
      if (t.status === "COMPLETED") {
        const daysAgo = (t as any).completedDaysAgo || 2;
        completedAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      }

      await prisma.task.create({
        data: {
          title: t.title,
          description: t.description,
          status: t.status,
          projectId: createdProject.id,
          completedAt,
        },
      });
      totalTasksCreated++;
    }
  }

  console.log("\n=======================================================");
  console.log("🎉 COMPANY TEST DATA SEEDED SUCCESSFULLY!");
  console.log(`✓ 8 Team Collaborators created (Password: password123)`);
  console.log(`✓ ${totalProjectsCreated} Projects created across departments`);
  console.log(`✓ ${totalTasksCreated} Tasks populated (Completed, In Progress, Pending)`);
  console.log("=======================================================");
}

main()
  .catch((e) => {
    console.error("Error seeding company data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
