'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TableHead, TableRow, TableHeader, TableCell, TableBody, Table } from "@/components/ui/table"
import { CarIcon, DollarSignIcon, WrenchIcon, UsersIcon } from "lucide-react"
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import Header from "@/components/ui/header"
import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';


const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export function Dashboard() {
  const navigate = useNavigate();

  interface Car {
    id: string;
    make: string;
    model: string;
    owner_name: string;
    repair_status: string;
    description: string;
  }

  // Define state with the Car type
  
  const [carsInProgress, setCarsInProgress] = useState<Car[]>([]);
  const [carsComingSoon, setCarsComingSoon] = useState<Car[]>([]);

  const handleRowClick = (uuid: string) => {
    navigate(`/car-details/${uuid}`);
  };
  
  useEffect(() => {
    const fetchCars = async () => {
      // Fetch cars that are in progress
      const { data: inProgressCars, error: inProgressError } = await supabase
        .from('cars') 
        .select('*')
        .eq('repair_status', 'in_progress'); // Only fetch cars with 'in_progress' status
  
      if (inProgressError) {
        console.error('Error fetching in-progress cars:', inProgressError);
        return;
      }
      setCarsInProgress(inProgressCars as Car[]);
  
      // Fetch cars that are not started
      const { data: notStartedCars, error: notStartedError } = await supabase
        .from('cars') 
        .select('*')
        .eq('repair_status', 'not_started'); // Only fetch cars with 'not_started' status
  
      if (notStartedError) {
        console.error('Error fetching not started cars:', notStartedError);
        return;
      }
      setCarsComingSoon(notStartedCars as Car[]);
    };
  
    fetchCars();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-slate-900">
      <Header />
      <main className="flex-1 p-4 md:p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-600 to-indigo-800 text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Auto Shop Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between">
                {/* Cars in Shop Section */}
                <div className="flex-1 pr-4 border-r border-gray-500">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Cars in Shop</h3>
                    <CarIcon className="w-4 h-4 text-gray-300" />
                  </div>
                  <div className="text-2xl font-bold">{carsInProgress.length}</div>
                  <p className="text-xs text-gray-300">🛠️ You are doing great!</p>
                </div>

                {/* Cars Coming Soon Section */}
                <div className="flex-1 pl-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Cars Coming Soon</h3>
                    <WrenchIcon className="w-4 h-4 text-gray-300" />
                  </div>
                  <div className="text-2xl font-bold">{carsComingSoon.length}</div>
                  <p className="text-xs text-gray-300">🚗 Opportunities for restoration!</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-600 to-indigo-800 text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Cars Coming Soon</CardTitle>
              <WrenchIcon className="w-4 h-4 text-gray-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{carsComingSoon.length}</div>
              <p className="text-xs text-gray-300">🚗 Opportunities for restoration!</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-600 to-indigo-800 text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Cars Completed This Year</CardTitle>
              <DollarSignIcon className="w-4 h-4 text-gray-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">TODO - query for this</div>
              <p className="text-xs text-gray-300">+20.1% from last year</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-600 to-indigo-800 text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Today's Verse</CardTitle>
              <UsersIcon className="w-4 h-4 text-gray-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Colossians 3:23</div>
              <p className="text-xs text-gray-300">"Whatever you do, work heartily, as for the Lord and not for men"</p>
            </CardContent>
          </Card>
        </div>

        {/* Cars Currently in Shop */}
        <h2 className="mt-10 mb-4 text-2xl font-bold text-white">Cars Currently in Shop</h2>
        <div className="border rounded-lg bg-gray-700 bg-opacity-80 backdrop-blur-sm overflow-hidden border-none">
          <Table>
            <TableHeader>
              <TableRow >
                <TableHead className="bg-gray-800 text-white">Make + Model</TableHead>
                <TableHead className="bg-gray-800 text-white">Owner</TableHead>
                <TableHead className="bg-gray-800 text-white">Status</TableHead>
                <TableHead className="bg-gray-800 text-white">Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {carsInProgress.map((car) => (
                <TableRow 
                  key={car.id}
                  className="cursor-pointer transition-colors hover:bg-slate-800 text-white border-slate-400" 
                  onClick={() => handleRowClick(car.id)}
                >
                  <TableCell>{car.make + ' ' + car.model}</TableCell>
                  <TableCell>{car.owner_name}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium 
                        ${car.repair_status === 'in_progress' ? 'bg-gradient-to-br from-cyan-200 to-blue-300 text-slate-950' : 
                        car.repair_status === 'done' ? 'bg-green-100 text-green-800' : 
                        'bg-red-100 text-red-800'}`}>
                      {car.repair_status === 'in_progress' ? 'in_prog' : 'done'}
                    </span>
                  </TableCell>
                  <TableCell>{car.description}</TableCell>
                  {/* <TableCell>{new Date(car.estimated_completion).toLocaleString()}</TableCell> */}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Cars Coming Soon */}
        <h2 className="mt-10 mb-4 text-2xl font-bold text-white">Cars Coming Soon</h2>
        <div className="border rounded-lg bg-gray-700 text-white bg-opacity-80 backdrop-blur-sm overflow-hidden border-none">
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
              {carsComingSoon.map((car) => (
                <TableRow 
                  key={car.id}
                  className="cursor-pointer transition-colors hover:bg-slate-800 border-slate-400"
                  onClick={() => handleRowClick(car.id)}
                >
                  <TableCell>{car.make + ' ' + car.model}</TableCell>
                  <TableCell>{car.owner_name}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200 px-2.5 py-0.5 text-xs font-medium text-black">
                      {car.repair_status || 'Not Started'}
                    </span>
                  </TableCell>
                  <TableCell>{car.description}</TableCell>
                  {/* <TableCell>{car.estimatedCompletion ? new Date(car.estimatedCompletion).toLocaleString() : 'TBD'}</TableCell> */}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>
      <footer className="py-6 px-4 lg:px-6 bg-black bg-opacity-100 backdrop-blur-sm">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between">
          <p className="text-sm text-gray-400">© 2024 Austin's Auto. All rights reserved.</p>
          <nav className="flex gap-4 sm:gap-6 mt-4 md:mt-0">
            <Link className="text-sm text-gray-400 hover:text-blue-400 hover:underline underline-offset-4" to="/">
              Terms of Service
            </Link>
            <Link className="text-sm text-gray-400 hover:text-blue-400 hover:underline underline-offset-4" to="/">
              Privacy
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}