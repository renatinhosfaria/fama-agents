import { describe, it, expect } from "vitest";
import { extractFrontmatter, stripFrontmatter } from "../../src/utils/frontmatter.js";
import type { SkillFrontmatter } from "../../src/utils/frontmatter.js";

describe("extractFrontmatter", () => {
  it("should parse valid YAML frontmatter", () => {
    const content = `---
name: test-skill
description: A test skill
phases: [E, V]
---

# Body content here`;

    const result = extractFrontmatter<SkillFrontmatter>(content);
    expect(result.frontmatter.name).toBe("test-skill");
    expect(result.frontmatter.description).toBe("A test skill");
    expect(result.frontmatter.phases).toEqual(["E", "V"]);
    expect(result.body).toContain("# Body content here");
  });

  it("should return empty frontmatter when no --- delimiters", () => {
    const content = "# Just a markdown file\nNo frontmatter here.";
    const result = extractFrontmatter<SkillFrontmatter>(content);
    expect(result.frontmatter).toEqual({});
    expect(result.body).toBe(content);
  });

  it("should return empty frontmatter when only opening ---", () => {
    const content = "---\nname: test\nNo closing delimiter";
    const result = extractFrontmatter<SkillFrontmatter>(content);
    expect(result.frontmatter).toEqual({});
    expect(result.body).toBe(content);
  });

  it("should handle empty frontmatter block", () => {
    const content = "---\n---\n# Body";
    const result = extractFrontmatter<SkillFrontmatter>(content);
    expect(result.body).toContain("# Body");
  });

  it("should handle YAML list syntax for phases", () => {
    const content = `---
name: test
phases:
  - E
  - V
  - C
---

Body`;

    const result = extractFrontmatter<SkillFrontmatter>(content);
    expect(result.frontmatter.phases).toEqual(["E", "V", "C"]);
  });

  it("should handle malformed YAML gracefully", () => {
    const content = "---\n: invalid: yaml: here:\n---\nBody";
    const result = extractFrontmatter<SkillFrontmatter>(content);
    // Should not throw, returns empty or parsed result
    expect(result.body).toContain("Body");
  });
});

describe("stripFrontmatter", () => {
  it("should return only the body", () => {
    const content = "---\nname: test\n---\n# Body content";
    const body = stripFrontmatter(content);
    expect(body).toContain("# Body content");
    expect(body).not.toContain("name: test");
  });

  it("should return full content when no frontmatter", () => {
    const content = "# Just markdown";
    expect(stripFrontmatter(content)).toBe(content);
  });
});

describe("extractFrontmatter — Agent Skills Specification fields", () => {
  it("should extract license, compatibility, metadata, and allowed-tools", () => {
    const content = `---
name: test-skill
description: A test
phases: [E]
license: MIT
compatibility: ">=1.0.0"
metadata:
  author: test
  version: "2.0"
allowed-tools:
  - Read
  - Write
---

# Body`;

    const result = extractFrontmatter<SkillFrontmatter>(content);
    expect(result.frontmatter.license).toBe("MIT");
    expect(result.frontmatter.compatibility).toBe(">=1.0.0");
    expect(result.frontmatter.metadata).toEqual({ author: "test", version: "2.0" });
    expect(result.frontmatter["allowed-tools"]).toEqual(["Read", "Write"]);
  });

  it("should handle frontmatter without optional spec fields", () => {
    const content = `---
name: simple
description: Simple skill
phases: [P]
---

Body`;

    const result = extractFrontmatter<SkillFrontmatter>(content);
    expect(result.frontmatter.name).toBe("simple");
    expect(result.frontmatter.license).toBeUndefined();
    expect(result.frontmatter.metadata).toBeUndefined();
    expect(result.frontmatter["allowed-tools"]).toBeUndefined();
  });
});

describe("extractFrontmatter — edge cases", () => {
  it("should handle content with only frontmatter and no body", () => {
    const content = "---\nname: test\n---\n";
    const result = extractFrontmatter<SkillFrontmatter>(content);
    expect(result.frontmatter.name).toBe("test");
    expect(result.body).toBe("");
  });

  it("should handle Windows-style line endings gracefully", () => {
    // Note: The parser splits on \n, so \r may remain in parsed values.
    // This tests that it doesn't crash and the body is accessible.
    const content = "---\r\nname: test\r\n---\r\n# Body";
    const result = extractFrontmatter<SkillFrontmatter>(content);
    // The YAML parser may include trailing \r in values
    expect(result.frontmatter.name).toBeTruthy();
    expect(result.body).toContain("Body");
  });

  it("should handle multiple --- in body content", () => {
    const content = "---\nname: test\n---\n# Body\n---\nMore content after hr";
    const result = extractFrontmatter<SkillFrontmatter>(content);
    expect(result.frontmatter.name).toBe("test");
    expect(result.body).toContain("More content after hr");
  });
});
