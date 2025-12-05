/**
 * Validation Services Index
 * Central export for all GetEducated validation utilities
 */

// Link Validation
export {
  validateLink,
  validateContent,
  extractLinks,
  isGetEducatedSchoolPage,
  isGetEducatedDegreePage,
  isGetEducatedRankingReport,
  getSchoolPageUrl,
  canPublish,
  BLOCKED_COMPETITORS,
  ALLOWED_EXTERNAL_DOMAINS,
} from './linkValidator'

// Risk Assessment
export {
  assessRisk,
  getRiskLevelColors,
  getRiskLevelIcon,
  checkAutoPublishEligibility,
  RISK_THRESHOLDS,
  ISSUE_WEIGHTS,
} from './riskAssessment'

// Pre-Publish Validation
export {
  validateForPublish,
  getValidationSummary,
  canAutoPublish,
} from './prePublishValidation'
