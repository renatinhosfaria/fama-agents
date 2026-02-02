import type { DetectionRule } from "./types.js";

export const DETECTION_RULES: DetectionRule[] = [
  // Languages
  {
    name: "typescript",
    category: "language",
    markers: ["tsconfig.json"],
    packageDeps: ["typescript"],
  },
  { name: "javascript", category: "language", markers: ["package.json"] },
  {
    name: "python",
    category: "language",
    markers: ["pyproject.toml", "setup.py", "requirements.txt", "Pipfile"],
  },
  { name: "go", category: "language", markers: ["go.mod"] },
  { name: "rust", category: "language", markers: ["Cargo.toml"] },
  { name: "java", category: "language", markers: ["pom.xml", "build.gradle", "build.gradle.kts"] },
  { name: "ruby", category: "language", markers: ["Gemfile"] },
  { name: "php", category: "language", markers: ["composer.json"] },
  { name: "csharp", category: "language", markers: ["*.csproj", "*.sln"] },
  { name: "swift", category: "language", markers: ["Package.swift"] },
  { name: "kotlin", category: "language", markers: ["build.gradle.kts"] },
  { name: "elixir", category: "language", markers: ["mix.exs"] },

  // Frameworks
  {
    name: "next.js",
    category: "framework",
    markers: ["next.config.js", "next.config.ts", "next.config.mjs"],
    packageDeps: ["next"],
  },
  { name: "react", category: "framework", markers: [], packageDeps: ["react"] },
  { name: "vue", category: "framework", markers: ["vue.config.js"], packageDeps: ["vue"] },
  {
    name: "angular",
    category: "framework",
    markers: ["angular.json"],
    packageDeps: ["@angular/core"],
  },
  { name: "svelte", category: "framework", markers: ["svelte.config.js"], packageDeps: ["svelte"] },
  { name: "nestjs", category: "framework", markers: [], packageDeps: ["@nestjs/core"] },
  { name: "express", category: "framework", markers: [], packageDeps: ["express"] },
  { name: "fastify", category: "framework", markers: [], packageDeps: ["fastify"] },
  { name: "django", category: "framework", markers: ["manage.py"] },
  { name: "flask", category: "framework", markers: [], packageDeps: ["flask"] },
  { name: "rails", category: "framework", markers: ["Gemfile"], packageDeps: ["rails"] },
  { name: "spring-boot", category: "framework", markers: [], packageDeps: ["spring-boot-starter"] },
  {
    name: "nuxt",
    category: "framework",
    markers: ["nuxt.config.ts", "nuxt.config.js"],
    packageDeps: ["nuxt"],
  },
  { name: "remix", category: "framework", markers: [], packageDeps: ["@remix-run/node"] },
  { name: "astro", category: "framework", markers: ["astro.config.mjs"], packageDeps: ["astro"] },
  { name: "hono", category: "framework", markers: [], packageDeps: ["hono"] },
  {
    name: "drizzle",
    category: "framework",
    markers: ["drizzle.config.ts"],
    packageDeps: ["drizzle-orm"],
  },
  {
    name: "prisma",
    category: "framework",
    markers: ["prisma/schema.prisma"],
    packageDeps: ["prisma"],
  },
  {
    name: "tailwindcss",
    category: "framework",
    markers: ["tailwind.config.js", "tailwind.config.ts"],
    packageDeps: ["tailwindcss"],
  },

  // Build tools
  {
    name: "vite",
    category: "build",
    markers: ["vite.config.ts", "vite.config.js"],
    packageDeps: ["vite"],
  },
  {
    name: "webpack",
    category: "build",
    markers: ["webpack.config.js", "webpack.config.ts"],
    packageDeps: ["webpack"],
  },
  { name: "esbuild", category: "build", markers: [], packageDeps: ["esbuild"] },
  { name: "rollup", category: "build", markers: ["rollup.config.js"], packageDeps: ["rollup"] },
  { name: "turbo", category: "build", markers: ["turbo.json"], packageDeps: ["turbo"] },
  { name: "tsup", category: "build", markers: ["tsup.config.ts"], packageDeps: ["tsup"] },
  { name: "swc", category: "build", markers: [".swcrc"], packageDeps: ["@swc/core"] },

  // Test frameworks
  {
    name: "vitest",
    category: "test",
    markers: ["vitest.config.ts", "vitest.config.js"],
    packageDeps: ["vitest"],
  },
  {
    name: "jest",
    category: "test",
    markers: ["jest.config.js", "jest.config.ts"],
    packageDeps: ["jest"],
  },
  {
    name: "playwright",
    category: "test",
    markers: ["playwright.config.ts"],
    packageDeps: ["@playwright/test"],
  },
  {
    name: "cypress",
    category: "test",
    markers: ["cypress.config.ts", "cypress.config.js"],
    packageDeps: ["cypress"],
  },
  { name: "mocha", category: "test", markers: [".mocharc.yml"], packageDeps: ["mocha"] },
  { name: "pytest", category: "test", markers: ["pytest.ini", "conftest.py"] },
  { name: "rspec", category: "test", markers: [".rspec"] },

  // Package managers
  { name: "pnpm", category: "package", markers: ["pnpm-lock.yaml", "pnpm-workspace.yaml"] },
  { name: "npm", category: "package", markers: ["package-lock.json"] },
  { name: "yarn", category: "package", markers: ["yarn.lock"] },
  { name: "bun", category: "package", markers: ["bun.lockb", "bunfig.toml"] },
  { name: "pip", category: "package", markers: ["requirements.txt"] },
  { name: "poetry", category: "package", markers: ["poetry.lock"] },
  { name: "cargo", category: "package", markers: ["Cargo.lock"] },

  // Databases
  {
    name: "postgresql",
    category: "database",
    markers: [],
    packageDeps: ["pg", "postgres", "drizzle-orm"],
  },
  { name: "mysql", category: "database", markers: [], packageDeps: ["mysql2", "mysql"] },
  { name: "mongodb", category: "database", markers: [], packageDeps: ["mongodb", "mongoose"] },
  { name: "redis", category: "database", markers: [], packageDeps: ["redis", "ioredis"] },
  { name: "sqlite", category: "database", markers: [], packageDeps: ["better-sqlite3", "sqlite3"] },

  // CI/CD
  { name: "github-actions", category: "ci", markers: [".github/workflows"] },
  { name: "gitlab-ci", category: "ci", markers: [".gitlab-ci.yml"] },
  { name: "circleci", category: "ci", markers: [".circleci/config.yml"] },

  // Monorepo
  { name: "turborepo", category: "monorepo", markers: ["turbo.json"], packageDeps: ["turbo"] },
  { name: "nx", category: "monorepo", markers: ["nx.json"], packageDeps: ["nx"] },
  { name: "lerna", category: "monorepo", markers: ["lerna.json"], packageDeps: ["lerna"] },
  { name: "pnpm-workspaces", category: "monorepo", markers: ["pnpm-workspace.yaml"] },
];
