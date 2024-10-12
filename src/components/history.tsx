'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TableHead, TableRow, TableHeader, TableCell, TableBody, Table } from "@/components/ui/table"
import { CarIcon, DollarSignIcon, WrenchIcon, UsersIcon, SearchIcon } from "lucide-react"
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input"
import { cars_in_shop, cars_coming_soon } from "./testdata";

export function History() {
  const navigate = useNavigate();

  const handleRowClick = (licensePlate: string) => {
    navigate(`/car-detail/${licensePlate}`);
  };
  

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-purple-100 via-blue-200 to-orange-100">
      <header className="px-4 lg:px-6 h-20 flex items-center bg-black text-white">
        <Link className="flex items-center justify-center" to="/">
          <CarIcon className="h-6 w-6 text-white" />
          <span className="sr-only">Auto Shop Dashboard</span>
        </Link>
        <nav className="ml-auto flex items-center gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:text-gray-300 hover:underline underline-offset-4" to="/">
            Dashboard
          </Link>
          <Link className="text-sm font-medium hover:text-gray-300 hover:underline underline-offset-4" to="/history">
            History
          </Link>
          <Link className="ml-4 text-sm font-medium hover:text-gray-300 hover:underline underline-offset-4" to="/car-details">
            + Add car
          </Link>
          <div className="relative">
            <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="search"
              placeholder="Search cars..."
              className="pl-8 pr-4 py-2 rounded-full bg-gray-800 text-white placeholder-gray-400 focus:bg-gray-700 focus:ring-2 focus:ring-blue-300"
            />
          </div>
        </nav>
      </header>
      <main className="flex-1 p-4 md:p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-gray-700 to-gray-900 text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Total Cars in Shop</CardTitle>
              <CarIcon className="w-4 h-4 text-gray-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-gray-300">+2 from yesterday</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-gray-600 to-gray-800 text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Active Mechanics</CardTitle>
              <WrenchIcon className="w-4 h-4 text-gray-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-gray-300">2 on break</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-gray-500 to-gray-700 text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
              <DollarSignIcon className="w-4 h-4 text-gray-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$3,429</div>
              <p className="text-xs text-gray-300">+20.1% from last week</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-gray-400 to-gray-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Customers Waiting</CardTitle>
              <UsersIcon className="w-4 h-4 text-gray-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4</div>
              <p className="text-xs text-gray-300">2 in lounge, 2 remote</p>
            </CardContent>
          </Card>
        </div>
        <h2 className="mt-10 mb-4 text-2xl font-bold text-gray-800">Cars Currently in Shop</h2>
        <div className="border rounded-lg bg-white bg-opacity-80 backdrop-blur-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="bg-gray-200 text-gray-700">License Plate</TableHead>
                <TableHead className="bg-gray-200 text-gray-700">Make/Model</TableHead>
                <TableHead className="bg-gray-200 text-gray-700">Owner</TableHead>
                <TableHead className="bg-gray-200 text-gray-700">Status</TableHead>
                <TableHead className="bg-gray-200 text-gray-700">Estimated Completion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cars_in_shop.map((car) => (
                <TableRow 
                  key={car.licensePlate}
                  className="cursor-pointer transition-colors hover:bg-gray-100" 
                  onClick={() => handleRowClick(car.licensePlate)}
                >
                  <TableCell>{car.licensePlate}</TableCell>
                  <TableCell>{car.makeModel}</TableCell>
                  <TableCell>{car.owner}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${car.status === 'in progress' ? 'bg-yellow-100 text-yellow-800' : car.status === 'done' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {car.status.replace('_', ' ')}
                    </span>
                  </TableCell>
                  <TableCell>{new Date(car.estimatedCompletion).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <h2 className="mt-10 mb-4 text-2xl font-bold text-gray-800">Cars Coming Soon</h2>
        <div className="border rounded-lg bg-white bg-opacity-80 backdrop-blur-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="bg-gray-200 text-gray-700">License Plate</TableHead>
                <TableHead className="bg-gray-200 text-gray-700">Make/Model</TableHead>
                <TableHead className="bg-gray-200 text-gray-700">Owner</TableHead>
                <TableHead className="bg-gray-200 text-gray-700">Status</TableHead>
                <TableHead className="bg-gray-200 text-gray-700">Estimated Completion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cars_coming_soon.map((car) => (
                <TableRow 
                  key={car.licensePlate}
                  className="cursor-pointer transition-colors hover:bg-gray-100"
                >
                  <TableCell>{car.licensePlate}</TableCell>
                  <TableCell>{car.makeModel}</TableCell>
                  <TableCell>{car.owner}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                      {car.status || 'Not Started'}
                    </span>
                  </TableCell>
                  <TableCell>{car.estimatedCompletion ? new Date(car.estimatedCompletion).toLocaleString() : 'TBD'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>
      <footer className="py-6 px-4 lg:px-6 bg-white bg-opacity-80 backdrop-blur-sm">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between">
          <p className="text-sm text-gray-600">© 2023 Auto Shop Dashboard. All rights reserved.</p>
          <nav className="flex gap-4 sm:gap-6 mt-4 md:mt-0">
            <Link className="text-sm text-gray-600 hover:text-blue-600 hover:underline underline-offset-4" to="/">
              Terms of Service
            </Link>
            <Link className="text-sm text-gray-600 hover:text-blue-600 hover:underline underline-offset-4" to="/">
              Privacy
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}