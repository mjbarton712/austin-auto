import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Car } from '@/types'

interface GarageTableProps {
    cars: Car[];
    onCarSelect: (carId: string) => void;
}

export function GarageTable({ cars, onCarSelect }: GarageTableProps) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Year</TableHead>
                    <TableHead>Make/Model</TableHead>
                    <TableHead>Trim</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>VIN</TableHead>
                    <TableHead>Owner</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {cars.map((car) => (
                    <TableRow 
                        key={car.id} 
                        onClick={() => onCarSelect(car.id)}
                        className="cursor-pointer hover:bg-gray-800"
                    >
                        <TableCell>{car.year}</TableCell>
                        <TableCell>{car.make} {car.model}</TableCell>
                        <TableCell>{car.trim || '-'}</TableCell>
                        <TableCell>{car.color || '-'}</TableCell>
                        <TableCell>{car.vin || '-'}</TableCell>
                        <TableCell>{car.owner_name}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
} 