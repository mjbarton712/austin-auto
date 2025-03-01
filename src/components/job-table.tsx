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
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
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
    const [currentPage, setCurrentPage] = useState<number>(1);
    const itemsPerPage = 5;

    // Filter jobs based on search term
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

    // Calculate pagination
    const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedJobs = filteredJobs.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            {showSearch && (
                <div className="sticky top-0 z-10 bg-gray-900 pb-4">
                    <div className="flex items-center space-x-2">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search by engine code, description, or car details..."
                                className="pl-8 text-white bg-gray-800 border-gray-700 focus:border-blue-500 focus:ring-blue-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="rounded-lg bg-gray-800 bg-opacity-90 backdrop-blur-sm overflow-hidden border border-gray-700">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-900">
                            <TableHead className="text-white">Car</TableHead>
                            <TableHead className="text-white">Description</TableHead>
                            <TableHead className="text-white">Status</TableHead>
                            <TableHead className="text-white">Engine Code</TableHead>
                            <TableHead className="text-white">Mileage</TableHead>
                            <TableHead className="text-white">Payment</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedJobs.map((job) => (
                            <TableRow 
                                key={job.id} 
                                onClick={() => onJobSelect(job.id)}
                                className="cursor-pointer transition-colors hover:bg-gray-700 text-white border-gray-600"
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

            {/* Pagination Controls */}
            <div className="flex items-center justify-between">
                <div className="text-sm text-gray-400">
                    Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredJobs.length)} of {filteredJobs.length}
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
                        onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                        disabled={currentPage === 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-sm text-gray-400">
                        Page {currentPage} of {totalPages || 1}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700"
                        onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                        disabled={currentPage === totalPages}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}