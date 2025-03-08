import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Search } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Car } from '@/types';

interface GarageTableProps {
    cars: Car[];
    onCarSelect: (carId: string) => void;
}

type SortColumn = 'year' | 'make_model' | 'trim' | 'color' | 'owner' | 'vin';
type SortDirection = 'asc' | 'desc';

export function GarageTable({ cars, onCarSelect }: GarageTableProps) {
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [sortColumn, setSortColumn] = useState<SortColumn>('year');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const itemsPerPage = 5;

    // Filter cars based on search term
    const filteredCars = cars.filter((car: Car) =>
        car.year.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.trim?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.color?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.vin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.owner_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort the filtered cars
    const sortedCars = [...filteredCars].sort((a, b) => {
        let comparison = 0;
        
        switch (sortColumn) {
            case 'year':
                comparison = a.year - b.year;
                break;
            case 'make_model':
                comparison = `${a.make} ${a.model}`.localeCompare(`${b.make} ${b.model}`);
                break;
            case 'trim':
                comparison = (a.trim || '').localeCompare(b.trim || '');
                break;
            case 'color':
                comparison = (a.color || '').localeCompare(b.color || '');
                break;
            case 'owner':
                comparison = a.owner_name.localeCompare(b.owner_name);
                break;
            case 'vin':
                comparison = (a.vin || '').localeCompare(b.vin || '');
                break;
        }
        
        return sortDirection === 'asc' ? comparison : -comparison;
    });

    // Calculate pagination
    const totalPages = Math.ceil(sortedCars.length / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedCars = sortedCars.slice(startIndex, startIndex + itemsPerPage);

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
            <div className="sticky top-0 z-10 bg-background pb-4">
                <div className="flex items-center space-x-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search cars..."
                            className="pl-8 text-foreground bg-card border-border focus:border-primary focus:ring-primary"
                            value={searchTerm}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-lg bg-card backdrop-blur-sm overflow-hidden border border-border">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted">
                            <TableHead 
                                className="text-foreground cursor-pointer" 
                                onClick={() => handleSort('year')}
                            >
                                <div className="flex items-center">
                                    Year {getSortIcon('year')}
                                </div>
                            </TableHead>
                            <TableHead 
                                className="text-foreground cursor-pointer" 
                                onClick={() => handleSort('make_model')}
                            >
                                <div className="flex items-center">
                                    Make/Model {getSortIcon('make_model')}
                                </div>
                            </TableHead>
                            <TableHead 
                                className="text-foreground cursor-pointer" 
                                onClick={() => handleSort('trim')}
                            >
                                <div className="flex items-center">
                                    Trim {getSortIcon('trim')}
                                </div>
                            </TableHead>
                            <TableHead 
                                className="text-foreground cursor-pointer" 
                                onClick={() => handleSort('color')}
                            >
                                <div className="flex items-center">
                                    Color {getSortIcon('color')}
                                </div>
                            </TableHead>
                            <TableHead 
                                className="text-foreground cursor-pointer" 
                                onClick={() => handleSort('owner')}
                            >
                                <div className="flex items-center">
                                    Owner {getSortIcon('owner')}
                                </div>
                            </TableHead>
                            <TableHead 
                                className="text-foreground cursor-pointer" 
                                onClick={() => handleSort('vin')}
                            >
                                <div className="flex items-center">
                                    VIN {getSortIcon('vin')}
                                </div>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedCars.map((car) => (
                            <TableRow 
                                key={car.id} 
                                onClick={() => onCarSelect(car.id)}
                                className="cursor-pointer transition-colors hover:bg-muted text-foreground border-border"
                            >
                                <TableCell>{car.year}</TableCell>
                                <TableCell>{car.make} {car.model}</TableCell>
                                <TableCell>{car.trim || '-'}</TableCell>
                                <TableCell>{car.color || '-'}</TableCell>
                                <TableCell>{car.owner_name}</TableCell>
                                <TableCell>{car.vin || '-'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedCars.length)} of {sortedCars.length}
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
                        Page {currentPage} of {totalPages}
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