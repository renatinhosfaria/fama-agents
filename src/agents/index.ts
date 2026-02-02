import type { AgentFactory } from "../core/types.js";
import { codeReviewerFactory } from "./code-reviewer.js";
import { featureDeveloperFactory } from "./feature-developer.js";
import { bugFixerFactory } from "./bug-fixer.js";
import { testWriterFactory } from "./test-writer.js";
import { refactoringSpecialistFactory } from "./refactoring-specialist.js";
import { securityAuditorFactory } from "./security-auditor.js";
import { architectFactory } from "./architect.js";
import { documentationWriterFactory } from "./documentation-writer.js";
import { performanceOptimizerFactory } from "./performance-optimizer.js";
import { devopsSpecialistFactory } from "./devops-specialist.js";

export const agentFactories: AgentFactory[] = [
  codeReviewerFactory,
  featureDeveloperFactory,
  bugFixerFactory,
  testWriterFactory,
  refactoringSpecialistFactory,
  securityAuditorFactory,
  architectFactory,
  documentationWriterFactory,
  performanceOptimizerFactory,
  devopsSpecialistFactory,
];
