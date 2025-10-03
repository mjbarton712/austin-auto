import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/contexts/theme-context"; // Update the import path to match your project structure

interface StatusBadgeProps {
    status: 'not_started' | 'in_progress' | 'completed' | 'cancelled';
    payment: 'unpaid' | 'partial' | 'paid';
}

export function StatusBadge({ status, payment }: StatusBadgeProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Light mode config with consistent orange palette
    const lightModeStatusConfig = {
        not_started: { label: 'Not Started', class: 'bg-orange-100 text-orange-900 ring-orange-500/20' },
        in_progress: { label: 'In Progress', class: 'bg-amber-100 text-amber-900 ring-amber-500/20' },
        completed: { label: 'Completed', class: 'bg-orange-200 text-orange-900 ring-orange-600/20' },
        cancelled: { label: 'Cancelled', class: 'bg-red-100 text-red-900 ring-red-500/20' },
    };

    const lightModePaymentConfig = {
        paid: { label: 'Paid', class: 'bg-orange-200 text-orange-900 ring-orange-600/20' },
        unpaid: { label: 'Unpaid', class: 'bg-red-100 text-red-900 ring-red-500/20' },
        partial: { label: 'Partial', class: 'bg-amber-100 text-amber-900 ring-amber-500/20' },
    };

    // Enhanced dark mode config with better contrast
    const darkModeStatusConfig = {
        not_started: { label: 'Not Started', class: 'bg-orange-950/80 text-orange-200 ring-orange-700/40' },
        in_progress: { label: 'In Progress', class: 'bg-amber-950/70 text-amber-200 ring-amber-700/40' },
        completed: { label: 'Completed', class: 'bg-orange-900/80 text-orange-100 ring-orange-600/40' },
        cancelled: { label: 'Cancelled', class: 'bg-red-950/70 text-red-200 ring-red-700/40' },
    };

    const darkModePaymentConfig = {
        paid: { label: 'Paid', class: 'bg-orange-900/80 text-orange-100 ring-orange-600/40' },
        unpaid: { label: 'Unpaid', class: 'bg-red-950/70 text-red-200 ring-red-700/40' },
        partial: { label: 'Partial', class: 'bg-amber-950/70 text-amber-200 ring-amber-700/40' },
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