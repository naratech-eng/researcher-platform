export interface ReadabilityIssue {
  type: 'heading' | 'contrast' | 'spacing' | 'font-size' | 'line-height' | 'dyslexia';
  severity: 'error' | 'warning' | 'info';
  message: string;
  element?: HTMLElement;
  recommendation: string;
}

export interface ReadabilityReport {
  score: number;
  issues: ReadabilityIssue[];
  summary: {
    errors: number;
    warnings: number;
    info: number;
  };
}

export function analyzeHeadingHierarchy(container: HTMLElement): ReadabilityIssue[] {
  const issues: ReadabilityIssue[] = [];
  const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');

  if (headings.length === 0) {
    issues.push({
      type: 'heading',
      severity: 'warning',
      message: 'No headings found',
      recommendation: 'Add heading structure to improve content organization and navigation.',
    });
    return issues;
  }

  const h1Count = container.querySelectorAll('h1').length;
  if (h1Count === 0) {
    issues.push({
      type: 'heading',
      severity: 'error',
      message: 'Missing main heading (h1)',
      recommendation: 'Add a single h1 element as the main page heading.',
    });
  } else if (h1Count > 1) {
    issues.push({
      type: 'heading',
      severity: 'warning',
      message: `Multiple h1 elements found (${h1Count})`,
      recommendation: 'Use only one h1 per page for better semantic structure.',
    });
  }

  let previousLevel = 0;
  headings.forEach((heading) => {
    const level = parseInt(heading.tagName.charAt(1));
    if (previousLevel > 0 && level > previousLevel + 1) {
      issues.push({
        type: 'heading',
        severity: 'warning',
        message: `Heading level skipped: ${heading.tagName} after h${previousLevel}`,
        element: heading as HTMLElement,
        recommendation: 'Maintain sequential heading hierarchy without skipping levels.',
      });
    }
    previousLevel = level;
  });

  return issues;
}

export function analyzeColorContrast(element: HTMLElement): ReadabilityIssue[] {
  const issues: ReadabilityIssue[] = [];
  const computedStyle = window.getComputedStyle(element);
  const color = computedStyle.color;
  const backgroundColor = computedStyle.backgroundColor;

  const textLuminance = getLuminance(color);
  const bgLuminance = getLuminance(backgroundColor);

  const contrast = calculateContrast(textLuminance, bgLuminance);
  const fontSize = parseFloat(computedStyle.fontSize);
  const fontWeight = computedStyle.fontWeight;

  const isLargeText = fontSize >= 18 || (fontSize >= 14 && parseInt(fontWeight) >= 700);
  const requiredRatio = isLargeText ? 3 : 4.5;

  if (contrast < requiredRatio) {
    issues.push({
      type: 'contrast',
      severity: contrast < 3 ? 'error' : 'warning',
      message: `Low contrast ratio: ${contrast.toFixed(2)}:1 (${
        isLargeText ? 'large text' : 'normal text'
      })`,
      element,
      recommendation: `Increase contrast to at least ${requiredRatio}:1 for WCAG AA compliance.`,
    });
  }

  return issues;
}

export function analyzeSpacing(element: HTMLElement): ReadabilityIssue[] {
  const issues: ReadabilityIssue[] = [];
  const computedStyle = window.getComputedStyle(element);

  const lineHeight = parseFloat(computedStyle.lineHeight);
  const fontSize = parseFloat(computedStyle.fontSize);
  const lineHeightRatio = lineHeight / fontSize;

  if (element.tagName.match(/^(P|LI|DIV)$/)) {
    if (lineHeightRatio < 1.5) {
      issues.push({
        type: 'line-height',
        severity: 'warning',
        message: `Line height too tight: ${lineHeightRatio.toFixed(2)}`,
        element,
        recommendation: 'Use line-height of at least 1.5 (150%) for body text.',
      });
    }
  } else if (element.tagName.match(/^H[1-6]$/)) {
    if (lineHeightRatio < 1.2) {
      issues.push({
        type: 'line-height',
        severity: 'info',
        message: `Heading line height: ${lineHeightRatio.toFixed(2)}`,
        element,
        recommendation: 'Consider using line-height of at least 1.2 (120%) for headings.',
      });
    }
  }

  return issues;
}

export function analyzeDyslexiaFriendliness(element: HTMLElement): ReadabilityIssue[] {
  const issues: ReadabilityIssue[] = [];
  const computedStyle = window.getComputedStyle(element);

  const fontFamily = computedStyle.fontFamily.toLowerCase();
  const dyslexiaFriendlyFonts = [
    'opendyslexic',
    'comic sans',
    'verdana',
    'arial',
    'tahoma',
    'century gothic',
  ];

  const hasDyslexiaFriendlyFont = dyslexiaFriendlyFonts.some((font) =>
    fontFamily.includes(font)
  );

  if (!hasDyslexiaFriendlyFont) {
    issues.push({
      type: 'dyslexia',
      severity: 'info',
      message: 'Font may not be dyslexia-friendly',
      element,
      recommendation:
        'Consider using fonts like OpenDyslexic, Comic Sans, Verdana, or Arial for better readability.',
    });
  }

  const textAlign = computedStyle.textAlign;
  if (textAlign === 'justify') {
    issues.push({
      type: 'dyslexia',
      severity: 'warning',
      message: 'Justified text can be difficult to read',
      element,
      recommendation: 'Use left-aligned text for better readability, especially for dyslexic users.',
    });
  }

  return issues;
}

export function analyzeReadability(container: HTMLElement): ReadabilityReport {
  const issues: ReadabilityIssue[] = [];

  issues.push(...analyzeHeadingHierarchy(container));

  const textElements = container.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, span, div');
  textElements.forEach((element) => {
    if (element.textContent && element.textContent.trim().length > 0) {
      issues.push(...analyzeColorContrast(element as HTMLElement));
      issues.push(...analyzeSpacing(element as HTMLElement));
      issues.push(...analyzeDyslexiaFriendliness(element as HTMLElement));
    }
  });

  const errors = issues.filter((i) => i.severity === 'error').length;
  const warnings = issues.filter((i) => i.severity === 'warning').length;
  const info = issues.filter((i) => i.severity === 'info').length;

  const totalChecks = textElements.length + 1;
  const score = Math.max(0, 100 - (errors * 10 + warnings * 5 + info * 1));

  return {
    score: Math.round(score),
    issues,
    summary: { errors, warnings, info },
  };
}

function getLuminance(color: string): number {
  const rgb = color.match(/\d+/g);
  if (!rgb || rgb.length < 3) return 0;

  const [r, g, b] = rgb.map((c) => {
    const val = parseInt(c) / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function calculateContrast(lum1: number, lum2: number): number {
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}
