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
        not_started: { label: 'Not Started', class: 'bg-gray-100 text-gray-800 ring-gray-500/10' },
        in_progress: { label: 'In Progress', class: 'bg-blue-100 text-blue-800 ring-blue-500/10' },
        completed: { label: 'Completed', class: 'bg-green-100 text-green-800 ring-green-500/10' },
        cancelled: { label: 'Cancelled', class: 'bg-red-100 text-red-800 ring-red-500/10' },
    };

    const lightModePaymentConfig = {
        paid: { label: 'Paid', class: 'bg-green-100 text-green-800 ring-green-500/10' },
        unpaid: { label: 'Unpaid', class: 'bg-red-100 text-red-800 ring-red-500/10' },
        partial: { label: 'Partial', class: 'bg-yellow-100 text-yellow-800 ring-yellow-500/10' },
    };

    // Enhanced dark mode config with better differentiation
    const darkModeStatusConfig = {
        not_started: { label: 'Not Started', class: 'bg-slate-600/90 text-slate-100 ring-slate-500/30' },
        in_progress: { label: 'In Progress', class: 'bg-blue-900/70 text-blue-100 ring-blue-700/40' },
        completed: { label: 'Completed', class: 'bg-emerald-900/70 text-emerald-100 ring-emerald-700/40' },
        cancelled: { label: 'Cancelled', class: 'bg-purple-900/70 text-purple-100 ring-purple-700/40' },
    };

    const darkModePaymentConfig = {
        paid: { label: 'Paid', class: 'bg-emerald-900/80 text-emerald-100 ring-emerald-700/40' },
        unpaid: { label: 'Unpaid', class: 'bg-rose-800/70 text-rose-100 ring-rose-700/40' },
        partial: { label: 'Partial', class: 'bg-amber-900/70 text-amber-100 ring-amber-700/40' },
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