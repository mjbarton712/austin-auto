import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
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

export function GarageTable({ cars, onCarSelect }: GarageTableProps) {
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [searchTerm, setSearchTerm] = useState<string>('');
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

    // Calculate pagination
    const totalPages = Math.ceil(filteredCars.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedCars = filteredCars.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="sticky top-0 z-10 bg-gray-900 pb-4">
                <div className="flex items-center space-x-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search cars..."
                            className="pl-8 text-white bg-gray-800 border-gray-700 focus:border-blue-500 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-lg bg-gray-800 bg-opacity-90 backdrop-blur-sm overflow-hidden border border-gray-700">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-900">
                            <TableHead className="text-white">Year</TableHead>
                            <TableHead className="text-white">Make/Model</TableHead>
                            <TableHead className="text-white">Trim</TableHead>
                            <TableHead className="text-white">Color</TableHead>
                            <TableHead className="text-white">Owner</TableHead>
                            <TableHead className="text-white">VIN</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedCars.map((car) => (
                            <TableRow 
                                key={car.id} 
                                onClick={() => onCarSelect(car.id)}
                                className="cursor-pointer transition-colors hover:bg-gray-700 text-white border-gray-600"
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
                <div className="text-sm text-gray-400">
                    Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredCars.length)} of {filteredCars.length}
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