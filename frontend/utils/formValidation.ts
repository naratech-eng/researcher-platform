export interface ValidationRule {
  type: 'required' | 'email' | 'min' | 'max' | 'pattern' | 'custom';
  value?: any;
  message: string;
  validator?: (value: any) => boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateField(value: any, rules: ValidationRule[]): ValidationResult {
  const errors: string[] = [];

  for (const rule of rules) {
    switch (rule.type) {
      case 'required':
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          errors.push(rule.message);
        }
        break;

      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value && !emailRegex.test(value)) {
          errors.push(rule.message);
        }
        break;

      case 'min':
        if (typeof value === 'string' && value.length < rule.value) {
          errors.push(rule.message);
        } else if (typeof value === 'number' && value < rule.value) {
          errors.push(rule.message);
        }
        break;

      case 'max':
        if (typeof value === 'string' && value.length > rule.value) {
          errors.push(rule.message);
        } else if (typeof value === 'number' && value > rule.value) {
          errors.push(rule.message);
        }
        break;

      case 'pattern':
        if (value && !rule.value.test(value)) {
          errors.push(rule.message);
        }
        break;

      case 'custom':
        if (rule.validator && !rule.validator(value)) {
          errors.push(rule.message);
        }
        break;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export interface FormValidationSchema {
  [key: string]: ValidationRule[];
}

export function validateForm(
  values: Record<string, any>,
  schema: FormValidationSchema
): Record<string, ValidationResult> {
  const results: Record<string, ValidationResult> = {};

  for (const [field, rules] of Object.entries(schema)) {
    results[field] = validateField(values[field], rules);
  }

  return results;
}

export function isFormValid(results: Record<string, ValidationResult>): boolean {
  return Object.values(results).every((result) => result.isValid);
}
