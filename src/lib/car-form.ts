import type { Car } from '@/types'

// Utility function to calculate job numbers based on intake date
export const calculateJobNumbers = (jobs: { intake_date?: Date | string | null }[]): Map<number, number> => {
  // Create array of jobs with their original indices
  const jobsWithIndices = jobs.map((job, index) => ({ job, index }));
  
  // Sort by intake_date (earliest first)
  const sorted = [...jobsWithIndices].sort((a, b) => {
    const dateA = a.job.intake_date ? new Date(a.job.intake_date).getTime() : 0;
    const dateB = b.job.intake_date ? new Date(b.job.intake_date).getTime() : 0;
    return dateA - dateB;
  });
  
  // Create a map from original index to job number
  const jobNumberMap = new Map<number, number>();
  sorted.forEach((item, sortedIndex) => {
    jobNumberMap.set(item.index, sortedIndex + 1);
  });
  
  return jobNumberMap;
};

// Store dates as YYYY-MM-DD strings in the database and handle them consistently
export const formatDateForServer = (date: Date | undefined | null): string | null => {
  if (!date) return null;
  
  // Format date as YYYY-MM-DD string (timezone independent)
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

// Convert database date strings back to local Date objects for the UI
export const normalizeDate = (dateString: string | Date | null | undefined): Date | undefined => {
  if (!dateString) return undefined;
  
  // If it's already a Date object, use it directly
  if (dateString instanceof Date) return dateString;
  
  // Parse date string (expected format: YYYY-MM-DD or ISO string)
  // Extract just the YYYY-MM-DD part if it's an ISO string
  const datePart = typeof dateString === 'string' 
    ? dateString.split('T')[0] 
    : dateString;
    
  // Split the date string into components
  const [year, month, day] = datePart.split('-').map(Number);
  
  // Create a date at noon to avoid any timezone issues
  return new Date(year, month - 1, day, 12, 0, 0);
};

// Add this helper function near the top of the file
export const sanitizeCarData = (data: Record<string, unknown>): Partial<Car> => {
  const result: Record<string, unknown> = { ...data };
  
  // Convert any null values to undefined to make TypeScript happy
  for (const key in result) {
    if (result[key] === null) {
      result[key] = undefined;
    }
  }
  
  return result as Partial<Car>;
};

/** Coerces a form value to a whole number; blank/invalid becomes 0. */
const ensureNumber = (value: unknown): number => {
  if (value === null || value === undefined || value === '') return 0;
  const num = typeof value === 'string' ? parseInt(value, 10) : Number(value);
  return isNaN(num) ? 0 : Math.round(num);
};

/** Normalizes the numeric job/car fields before they are sent to the database. */
export const cleanNumberFields = (data: Record<string, unknown>) => {
  const result: Record<string, unknown> = { ...data };
  for (const key of ['mileage', 'cost_to_fix', 'amount_charged', 'hours_spent']) {
    if (key in result) result[key] = ensureNumber(result[key]);
  }
  if ('year' in result) result.year = result.year ? ensureNumber(result.year) : undefined;
  return result;
};
