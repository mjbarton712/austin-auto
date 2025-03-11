import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/theme-context';

interface FormToggleProps {
  options: { value: string; label: string; disabled?: boolean }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function FormToggle({ options, value, onChange, className }: FormToggleProps) {
  const { theme } = useTheme();
  
  return (
    <div className={cn(
      "flex rounded-md bg-muted p-1", 
      theme === 'dark' ? 'bg-muted/80' : '',
      className
    )}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={option.disabled}
          className={cn(
            "flex-1 text-sm font-medium rounded-sm px-3 py-1.5 transition-all",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            value === option.value 
              ? cn("bg-primary shadow-sm", 
                   theme === 'dark' ? "text-white" : "text-primary-foreground") 
              : cn("hover:bg-muted-foreground/10",
                   theme === 'dark' ? "text-gray-200" : "text-muted-foreground"),
            option.disabled && "opacity-50 cursor-not-allowed"
          )}
          onClick={() => !option.disabled && onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
} 