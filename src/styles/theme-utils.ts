import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// This is a utility function to merge class names, similar to the cn function
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Theme gradient classes
export const themeClasses = {
  cardPrimary: "",
  cardSecondary: "",
  
  // Card gradients
  cardPrimaryDark: "bg-gradient-to-br from-orange-600 to-orange-800 text-white",
  cardPrimaryLight: "bg-gradient-to-br from-orange-100 to-yellow-200 text-foreground",
  
  cardSecondaryDark: "bg-gradient-to-br from-yellow-700 to-orange-800 text-white",
  cardSecondaryLight: "bg-gradient-to-br from-yellow-50 to-orange-100 text-foreground",
  
  // Header gradients
  headerDark: "bg-gradient-to-r from-orange-800 to-orange-600 text-foreground",
  headerLight: "bg-gradient-to-r from-yellow-50 to-orange-100 text-foreground",
  
  // Button styles
  buttonDark: "bg-white/10 hover:bg-white/20",
  buttonLight: "bg-primary/10 hover:bg-primary/20",
  
  // Hover styles
  hoverDark: "hover:bg-white/10",
  hoverLight: "hover:bg-black/10",
  
  // Modal background styles
  modalDark: "bg-orange-900/50",
  modalLight: "bg-orange-100/5",
};

// Function to get theme-specific class
export function getThemeClass(type: keyof typeof themeClasses, theme: 'light' | 'dark') {
  const suffix = theme === 'dark' ? 'Dark' : 'Light';
  const key = `${type}${suffix}` as keyof typeof themeClasses;
  return themeClasses[key];
}