import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/contexts/theme-context"; // Update the import path to match your project structure

interface StatusBadgeProps {
    status: 'not_started' | 'in_progress' | 'completed' | 'cancelled';
    payment: 'unpaid' | 'partial' | 'paid';
}

export function StatusBadge({ status, payment }: StatusBadgeProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Light mode config stays the same as your original
    const lightModeStatusConfig = {
        not_started: { label: 'Not Started', class: 'bg-orange-100 text-orange-800 ring-orange-500/10' },
        in_progress: { label: 'In Progress', class: 'bg-yellow-100 text-yellow-800 ring-yellow-500/10' },
        completed: { label: 'Completed', class: 'bg-amber-100 text-amber-800 ring-amber-500/10' },
        cancelled: { label: 'Cancelled', class: 'bg-red-100 text-red-800 ring-red-500/10' },
    };

    const lightModePaymentConfig = {
        paid: { label: 'Paid', class: 'bg-amber-100 text-amber-800 ring-amber-500/10' },
        unpaid: { label: 'Unpaid', class: 'bg-red-100 text-red-800 ring-red-500/10' },
        partial: { label: 'Partial', class: 'bg-orange-100 text-orange-800 ring-orange-500/10' },
    };

    // Enhanced dark mode config with better differentiation
    const darkModeStatusConfig = {
        not_started: { label: 'Not Started', class: 'bg-orange-900/80 text-orange-100 ring-orange-700/40' },
        in_progress: { label: 'In Progress', class: 'bg-yellow-900/70 text-yellow-100 ring-yellow-700/40' },
        completed: { label: 'Completed', class: 'bg-amber-900/70 text-amber-100 ring-amber-700/40' },
        cancelled: { label: 'Cancelled', class: 'bg-red-900/70 text-red-100 ring-red-700/40' },
    };

    const darkModePaymentConfig = {
        paid: { label: 'Paid', class: 'bg-amber-900/80 text-amber-100 ring-amber-700/40' },
        unpaid: { label: 'Unpaid', class: 'bg-red-900/70 text-red-100 ring-red-700/40' },
        partial: { label: 'Partial', class: 'bg-orange-900/70 text-orange-100 ring-orange-700/40' },
    };

    // Select the appropriate config based on the theme
    const statusConfig = isDark ? darkModeStatusConfig : lightModeStatusConfig;
    const paymentConfig = isDark ? darkModePaymentConfig : lightModePaymentConfig;

    return (
        <div className="flex flex-col sm:flex-row gap-2">
            <Badge className={statusConfig[status].class}>
                {statusConfig[status].label}
            </Badge>
            <Badge className={paymentConfig[payment].class}>
                {paymentConfig[payment].label}
            </Badge>
        </div>
    );
}