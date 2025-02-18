import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
    status: 'not_started' | 'in_progress' | 'completed' | 'cancelled';
    payment: 'unpaid' | 'partial' | 'paid';
}

const statusConfig = {
    not_started: { label: 'Not Started', class: 'bg-gray-100 text-gray-800 ring-gray-500/10' },
    in_progress: { label: 'In Progress', class: 'bg-blue-100 text-blue-800 ring-blue-500/10' },
    completed: { label: 'Completed', class: 'bg-green-100 text-green-800 ring-green-500/10' },
    cancelled: { label: 'Cancelled', class: 'bg-red-100 text-red-800 ring-red-500/10' },
};

const paymentConfig = {
    paid: { label: 'Paid', class: 'bg-green-100 text-green-800 ring-green-500/10' },
    unpaid: { label: 'Unpaid', class: 'bg-red-100 text-red-800 ring-red-500/10' },
    partial: { label: 'Partial', class: 'bg-yellow-100 text-yellow-800 ring-yellow-500/10' },
};

export function StatusBadge({ status, payment }: StatusBadgeProps) {
    return (
        <div className="flex gap-2">
            <Badge className={statusConfig[status].class}>
                {statusConfig[status].label}
            </Badge>
            <Badge className={paymentConfig[payment].class}>
                {paymentConfig[payment].label}
            </Badge>
        </div>
    );
} 