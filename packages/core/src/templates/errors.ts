import type { ZodIssue } from 'zod';
import { AppError } from '../errors.js';

/**
 * Error thrown when a template is not found
 */
export class TemplateNotFoundError extends AppError {
  constructor(templateId: string) {
    super(`Template not found: ${templateId}`, 404, 'TEMPLATE_NOT_FOUND');
    this.name = 'TemplateNotFoundError';
  }
}

/**
 * Error thrown when template validation fails
 */
export class TemplateValidationError extends AppError {
  public readonly issues: ZodIssue[];

  constructor(message: string, issues: ZodIssue[]) {
    super(message, 400, 'TEMPLATE_VALIDATION_ERROR');
    this.name = 'TemplateValidationError';
    this.issues = issues;
  }
}
