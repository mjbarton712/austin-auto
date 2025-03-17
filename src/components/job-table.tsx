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
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Search } from "lucide-react";
import { useState } from 'react';
// import { useDebounce } from '@/hooks/use-debounce';

// const [searchTerm, setSearchTerm] = useState('');
// const debouncedSearchTerm = useDebounce(searchTerm, 300);
interface JobWithCar extends Job {
    car: Car;  // Add car details when displaying
}

interface JobTableProps {
    jobs: JobWithCar[];  // We expect jobs with populated car data
    onJobSelect: (jobId: string) => void;
    showSearch?: boolean;
}

type SortColumn = 'car' | 'description' | 'status' | 'engine_code' | 'mileage' | 'payment';
type SortDirection = 'asc' | 'desc';

export default function JobTable({ jobs, onJobSelect, showSearch = false }: JobTableProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [sortColumn, setSortColumn] = useState<SortColumn>('car');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
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
            job.car.owner_name.toLowerCase().includes(searchLower) ||
            job.car.year.toString().toLowerCase().includes(searchLower)
        );
    });

    // Sort the filtered jobs
    const sortedJobs = [...filteredJobs].sort((a, b) => {
        let comparison = 0;
        
        switch (sortColumn) {
            case 'car':
                // Sort by make, then model, then year
                comparison = `${a.car.make} ${a.car.model}`.localeCompare(`${b.car.make} ${b.car.model}`);
                if (comparison === 0) {
                    comparison = a.car.year - b.car.year;
                }
                break;
            case 'description':
                comparison = a.description.localeCompare(b.description);
                break;
            case 'status':
                comparison = a.status.localeCompare(b.status);
                break;
            case 'engine_code':
                comparison = (a.engine_code || '').localeCompare(b.engine_code || '');
                break;
            case 'mileage':
                comparison = a.mileage - b.mileage;
                break;
            case 'payment':
                comparison = (a.amount_charged || 0) - (b.amount_charged || 0);
                break;
        }
        
        return sortDirection === 'asc' ? comparison : -comparison;
    });

    // Calculate pagination
    const totalPages = Math.max(Math.ceil(sortedJobs.length / itemsPerPage), 1);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedJobs = sortedJobs.slice(startIndex, startIndex + itemsPerPage);

    // Handle column header click for sorting
    const handleSort = (column: SortColumn) => {
        if (sortColumn === column) {
            // If clicking the same column, toggle direction
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            // If clicking a new column, set it as the sort column with asc direction
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    // Get sort icon for column header
    const getSortIcon = (column: SortColumn) => {
        if (sortColumn !== column) return null;
        return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />;
    };

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            {showSearch && (
                <div className="sticky top-0 z-10 bg-background pb-4">
                    <div className="flex items-center space-x-2">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by engine code, and more..."
                                className="pl-8 text-foreground bg-card border-border focus:border-primary focus:ring-primary"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Table with improved styling */}
            <div className="rounded-lg overflow-hidden border border-border bg-card shadow-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead 
                                className="bg-primary/10 text-primary font-medium cursor-pointer" 
                                onClick={() => handleSort('car')}
                            >
                                <div className="flex items-center">
                                    Car {getSortIcon('car')}
                                </div>
                            </TableHead>
                            <TableHead 
                                className="bg-primary/10 text-primary font-medium cursor-pointer" 
                                onClick={() => handleSort('description')}
                            >
                                <div className="flex items-center">
                                    Description {getSortIcon('description')}
                                </div>
                            </TableHead>
                            <TableHead 
                                className="bg-primary/10 text-primary font-medium cursor-pointer" 
                                onClick={() => handleSort('status')}
                            >
                                <div className="flex items-center">
                                    Status {getSortIcon('status')}
                                </div>
                            </TableHead>
                            <TableHead 
                                className="bg-primary/10 text-primary font-medium cursor-pointer" 
                                onClick={() => handleSort('engine_code')}
                            >
                                <div className="flex items-center">
                                    Engine Code {getSortIcon('engine_code')}
                                </div>
                            </TableHead>
                            <TableHead 
                                className="bg-primary/10 text-primary font-medium cursor-pointer" 
                                onClick={() => handleSort('mileage')}
                            >
                                <div className="flex items-center">
                                    Mileage {getSortIcon('mileage')}
                                </div>
                            </TableHead>
                            <TableHead 
                                className="bg-primary/10 text-primary font-medium cursor-pointer" 
                                onClick={() => handleSort('payment')}
                            >
                                <div className="flex items-center">
                                    Payment {getSortIcon('payment')}
                                </div>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedJobs.map((job) => (
                            <TableRow 
                                key={job.id} 
                                onClick={() => onJobSelect(job.id)}
                                className="cursor-pointer transition-colors hover:bg-muted text-foreground border-border"
                            >
                                <TableCell>
                                    {job.car.year} {job.car.make} {job.car.model}
                                    <br />
                                    <span className="text-sm text-muted-foreground">
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
                <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedJobs.length)} of {sortedJobs.length}
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="bg-card text-foreground border-border hover:bg-muted"
                        onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                        disabled={currentPage === 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages || 1}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="bg-card text-foreground border-border hover:bg-muted"
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