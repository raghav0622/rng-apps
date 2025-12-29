import { Task, TaskEconomics, TimeLog } from '@/app-features/tasks/task.model';

/**
 * Calculate economics (cost, revenue, profitability) for a task
 * 
 * @param task - Task object with time logs and rates
 * @returns TaskEconomics object with calculated values
 * 
 * @example
 * ```ts
 * const economics = calculateTaskEconomics(task);
 * console.log(economics.profitability); // 500
 * console.log(economics.totalCost); // 250
 * console.log(economics.totalRevenue); // 750
 * ```
 */
export function calculateTaskEconomics(task: Task): TaskEconomics {
  const totalActualMinutes = task.timeLogs.reduce(
    (sum: number, log: TimeLog) => sum + log.durationMinutes,
    0
  );

  const totalHours = totalActualMinutes / 60;
  const totalCost = totalHours * task.costRate;
  const totalRevenue = totalHours * task.billableRate;
  const profitability = totalRevenue - totalCost;

  return {
    totalActualMinutes,
    totalCost,
    totalRevenue,
    profitability,
  };
}

/**
 * Calculate profit margin as a percentage
 * 
 * @param totalRevenue - Total revenue generated
 * @param totalCost - Total cost incurred
 * @returns Profit margin as decimal (0.25 = 25%)
 * 
 * @example
 * ```ts
 * calculateProfitMargin(1000, 750) // 0.25 (25%)
 * calculateProfitMargin(1000, 1000) // 0 (0%)
 * ```
 */
export function calculateProfitMargin(totalRevenue: number, totalCost: number): number {
  if (totalRevenue === 0) return 0;
  return (totalRevenue - totalCost) / totalRevenue;
}

/**
 * Calculate estimated cost based on time and rate
 * 
 * @param estimatedMinutes - Estimated time in minutes
 * @param costRate - Cost rate per hour
 * @returns Estimated cost
 * 
 * @example
 * ```ts
 * calculateEstimatedCost(120, 50) // 100 (2 hours * $50/hour)
 * ```
 */
export function calculateEstimatedCost(estimatedMinutes: number, costRate: number): number {
  return (estimatedMinutes / 60) * costRate;
}

/**
 * Calculate estimated revenue based on time and rate
 * 
 * @param estimatedMinutes - Estimated time in minutes
 * @param billableRate - Billable rate per hour
 * @returns Estimated revenue
 * 
 * @example
 * ```ts
 * calculateEstimatedRevenue(120, 150) // 300 (2 hours * $150/hour)
 * ```
 */
export function calculateEstimatedRevenue(estimatedMinutes: number, billableRate: number): number {
  return (estimatedMinutes / 60) * billableRate;
}

/**
 * Calculate progress percentage based on time logged vs estimated
 * 
 * @param actualMinutes - Actual minutes logged
 * @param estimatedMinutes - Estimated minutes
 * @returns Progress as decimal (0.5 = 50%)
 * 
 * @example
 * ```ts
 * calculateProgress(60, 120) // 0.5 (50% complete)
 * calculateProgress(150, 120) // 1.25 (125% - over budget)
 * ```
 */
export function calculateProgress(actualMinutes: number, estimatedMinutes: number): number {
  if (estimatedMinutes === 0) return 0;
  return actualMinutes / estimatedMinutes;
}
