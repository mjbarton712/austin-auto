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
  
  // Card gradients - using warm orange tones
  cardPrimaryDark: "bg-gradient-to-br from-orange-950/60 via-orange-900/50 to-orange-800/60 text-white",
  cardPrimaryLight: "bg-gradient-to-br from-orange-200 to-orange-300 text-foreground",
  
  cardSecondaryDark: "bg-gradient-to-br from-amber-900/50 to-orange-900/60 text-white",
  cardSecondaryLight: "bg-gradient-to-br from-orange-200 to-orange-300 text-foreground",
  
  // Header gradients - matching the header component
  headerDark: "bg-gradient-to-r from-orange-800 to-orange-600 text-foreground",
  headerLight: "bg-gradient-to-r from-orange-200 to-orange-400 text-foreground",
  
  // Button styles
  buttonDark: "bg-white/10 hover:bg-white/20",
  buttonLight: "bg-primary/10 hover:bg-primary/20",
  
  // Hover styles
  hoverDark: "hover:bg-white/10",
  hoverLight: "hover:bg-black/10",
  
  // Modal background styles
  modalDark: "bg-orange-950/50",
  modalLight: "bg-orange-100/30",
};

// Function to get theme-specific class
export function getThemeClass(type: keyof typeof themeClasses, theme: 'light' | 'dark') {
  const suffix = theme === 'dark' ? 'Dark' : 'Light';
  const key = `${type}${suffix}` as keyof typeof themeClasses;
  return themeClasses[key];
}