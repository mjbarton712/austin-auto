import { Job, Car } from '@/types';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import { useState } from 'react';

interface JobWithCar extends Job {
    car: Car;  // Add car details when displaying
}

interface JobTableProps {
    jobs: JobWithCar[];  // We expect jobs with populated car data
    onJobSelect: (jobId: string) => void;
    showSearch?: boolean;
}

export default function JobTable({ jobs, onJobSelect, showSearch = false }: JobTableProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredJobs = jobs.filter(job => {
        if (!searchTerm) return true;
        
        const searchLower = searchTerm.toLowerCase();
        return (
            job.engine_code?.toLowerCase().includes(searchLower) ||
            job.description.toLowerCase().includes(searchLower) ||
            job.car.make.toLowerCase().includes(searchLower) ||
            job.car.model.toLowerCase().includes(searchLower) ||
            job.car.owner_name.toLowerCase().includes(searchLower)
        );
    });

    return (
        <div className="space-y-4">
            {showSearch && (
                <Input
                    placeholder="Search by engine code, description, or car details..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-gray-800 text-white"
                />
            )}
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Car</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Engine Code</TableHead>
                        <TableHead>Mileage</TableHead>
                        <TableHead>Payment</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredJobs.map((job) => (
                        <TableRow 
                            key={job.id} 
                            onClick={() => onJobSelect(job.id)}
                            className="cursor-pointer hover:bg-gray-800"
                        >
                            <TableCell>
                                {job.car.year} {job.car.make} {job.car.model}
                                <br />
                                <span className="text-sm text-gray-400">
                                    {job.car.owner_name}
                                </span>
                            </TableCell>
                            <TableCell>{job.description}</TableCell>
                            <TableCell>
                                <StatusBadge status={job.status} payment={job.payment_status} />
                            </TableCell>
                            <TableCell>{job.engine_code || '-'}</TableCell>
                            <TableCell>{job.mileage.toLocaleString()}</TableCell>
                            <TableCell>${job.amount_charged || 0}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}