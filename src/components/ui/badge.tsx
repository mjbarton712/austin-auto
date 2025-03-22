import { cn } from "@/lib/utils";

interface BadgeProps {
    children: React.ReactNode;
    className?: string;
}

export function Badge({ children, className }: BadgeProps) {
    return (
        <span className={cn(
            "inline-flex items-center rounded-lg px-2 py-1 text-xs font-medium ring-1 ring-inset",
            className
        )}>
            {children}
        </span>
    );
} 