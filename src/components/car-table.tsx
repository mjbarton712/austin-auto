import React, { useState } from 'react';
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Search } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Car {
    id: string;
    make: string;
    model: string;
    owner_name: string;
    repair_status: string;
    payment_status: string;
    description: string;
}

interface CarTableProps {
    carsInProgress: Car[];
    handleRowClick: (id: string) => void;
}

export default function CarTable({ carsInProgress, handleRowClick }: CarTableProps) {
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const itemsPerPage = 5;

    // Filter cars based on search term
    const filteredCars = carsInProgress.filter((car: Car) =>
        car.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.owner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate pagination
    const totalPages = Math.ceil(filteredCars.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedCars = filteredCars.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex items-center space-x-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search cars..."
                        className="pl-8 text-white"
                        value={searchTerm}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="rounded-lg bg-gray-700 bg-opacity-80 backdrop-blur-sm overflow-hidden border-none">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="bg-gray-800 text-white">Make + Model</TableHead>
                            <TableHead className="bg-gray-800 text-white">Owner</TableHead>
                            <TableHead className="bg-gray-800 text-white">Status</TableHead>
                            <TableHead className="bg-gray-800 text-white">Description</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedCars.map((car: Car) => (
                            <TableRow
                                key={car.id}
                                className="cursor-pointer transition-colors hover:bg-slate-800 text-white border-slate-400"
                                onClick={() => handleRowClick(car.id)}
                            >
                                <TableCell>{car.make + ' ' + car.model}</TableCell>
                                <TableCell>{car.owner_name}</TableCell>
                                <TableCell>
                                    <div className="flex gap-2">
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                                            ${car.repair_status === 'in_progress'
                                                ? 'bg-gradient-to-br from-cyan-300 to-blue-400 text-slate-950'
                                                : car.repair_status === 'not_started'
                                                    ? 'bg-orange-300 text-orange-950'
                                                : car.repair_status === 'completed' && car.payment_status === 'paid'
                                                    ? 'bg-gradient-to-br from-green-400 via-emerald-300 to-green-400 text-green-950'
                                                : car.repair_status === 'completed' && car.payment_status !== 'paid'
                                                    ? 'bg-yellow-300 text-yellow-950'
                                                : 'bg-red-300 text-red-800'
                                            }`}
                                        >
                                            {car.repair_status === 'in_progress' ? 'in_prog' : 
                                             car.repair_status === 'not_started' ? 'not_start' : 
                                             car.repair_status === 'completed' && car.payment_status === 'paid' ? 'done' :
                                             car.repair_status === 'completed' && car.payment_status !== 'paid' ? 'pending' :
                                             'cancelled'}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>{car.description}</TableCell>
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