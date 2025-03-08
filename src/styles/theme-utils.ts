import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// This is a utility function to merge class names, similar to the cn function
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Theme gradient classes
export const themeClasses = {
  // Card gradients
  cardPrimaryDark: "bg-gradient-to-br from-blue-600 to-indigo-800 text-white",
  cardPrimaryLight: "bg-gradient-to-br from-blue-100 to-indigo-200 text-foreground",
  
  cardSecondaryDark: "bg-gradient-to-br from-indigo-700 to-purple-800 text-white",
  cardSecondaryLight: "bg-gradient-to-br from-indigo-50 to-purple-100 text-foreground",
  
  // Header gradients
  headerDark: "bg-gradient-to-r from-blue-800 to-indigo-600 text-foreground",
  headerLight: "bg-gradient-to-r from-blue-50 to-indigo-100 text-foreground",
  
  // Button styles
  buttonDark: "bg-white/10 hover:bg-white/20",
  buttonLight: "bg-primary/10 hover:bg-primary/20",
  
  // Hover styles
  hoverDark: "hover:bg-white/10",
  hoverLight: "hover:bg-black/10",
  
  // Modal background styles
  modalDark: "bg-gray-800/50",
  modalLight: "bg-black/5",
};

// Function to get theme-specific class
export function getThemeClass(type: keyof typeof themeClasses, theme: 'light' | 'dark') {
  const suffix = theme === 'dark' ? 'Dark' : 'Light';
  const key = `${type}${suffix}` as keyof typeof themeClasses;
  return themeClasses[key];
} 