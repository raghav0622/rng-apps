import { all, create, MathJsStatic } from 'mathjs';

// Create a mathjs instance with just the functions we want (or 'all' for everything)
// We use 'all' to support standard Excel-like functions: sin, cos, log, max, min, sqrt, etc.
const math = create(all, {
  number: 'number', // Default to standard JS numbers (not BigNumber) to simplify compatibility
}) as MathJsStatic;

/**
 * Safely evaluates a complex mathematical expression using mathjs.
 * Supports:
 * - Arithmetic: 10 + 5 * 2
 * - Functions: sqrt(16), max(10, 20), sin(90 deg)
 * - Constants: pi, e
 */
export function evaluateMathExpression(expression: string): number | null {
  if (!expression || typeof expression !== 'string') return null;

  // 1. Excel Compatibility: Remove leading '=' if present
  const cleanExpr = expression.trim().replace(/^=/, '');

  if (!cleanExpr) return null;

  try {
    // 2. Evaluate using mathjs
    // We pass an empty scope {} so variables aren't persisted between calls
    const result = math.evaluate(cleanExpr, {});

    // 3. Normalize Result
    // mathjs can return Numbers, BigNumbers, Complex numbers, Units, or Matrices.
    // We strictly want a finite primitive number for the form input.

    if (typeof result === 'number') {
      return isFinite(result) ? result : null;
    }

    // Handle BigNumber (if configured to use them)
    if (result && typeof result.toNumber === 'function') {
      const num = result.toNumber();
      return isFinite(num) ? num : null;
    }

    // Handle Units (e.g., if user typed "5 cm").
    // For a generic number input, we usually just want the magnitude,
    // or we reject it. Here we convert to number if it has no unit or reject.
    // For now, let's treat non-numbers as invalid for a standard Number Input.
    return null;
  } catch (error) {
    // Evaluation failed (syntax error, unknown function, etc.)
    return null;
  }
}
