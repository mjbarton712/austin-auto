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

export function History() {
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
  
  const [carsCompleted, setCarsCompleted] = useState<Car[]>([]);
  const [carsCancelled, setCarsCancelled] = useState<Car[]>([]);

  const handleRowClick = (uuid: string) => {
    navigate(`/car-details/${uuid}`);
  };
  
  useEffect(() => {
    const fetchCars = async () => {
      // Fetch cars that are completed
      const { data: completedCars, error: completedError } = await supabase
        .from('cars') 
        .select('*')
        .eq('repair_status', 'completed'); // Only fetch cars with 'completed' status
  
      if (completedError) {
        console.error('Error fetching completed cars:', completedError);
        return;
      }
      setCarsCompleted(completedCars as Car[]);
  
      // Fetch cars that are cancelled
      const { data: cancelledCars, error: cancelledError } = await supabase
        .from('cars') 
        .select('*')
        .eq('repair_status', 'cancelled'); // Only fetch cars with 'cancelled' status
  
      if (cancelledError) {
        console.error('Error fetching cancelled cars:', cancelledError);
        return;
      }
      setCarsCancelled(cancelledCars as Car[]);
    };
  
    fetchCars();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[radial-gradient(circle_at_top,rgba(20,65,130,0.9),rgba(12,18,30,1))]">
      <Header />
      <main className="flex-1 p-4 md:p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-600 to-indigo-800 text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Auto Shop Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between">
                {/* Cars Completed Section */}
                <div className="flex-1 pr-4 border-r border-gray-500">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Cars Completed Total</h3>
                    <CarIcon className="w-4 h-4 text-gray-300" />
                  </div>
                  <div className="text-2xl font-bold">{carsCompleted.length}</div>
                  <p className="text-xs text-gray-300">🛠️ You are doing great!</p>
                </div>

                {/* Cars Completed 2024 */}
                <div className="flex-1 pl-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Cars Completed This Year</h3>
                    <WrenchIcon className="w-4 h-4 text-gray-300" />
                  </div>
                  <div className="text-2xl font-bold">{carsCompleted.length}</div> TODO check year
                  <p className="text-xs text-gray-300">🚗 Opportunities for restoration!</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-600 to-indigo-800 text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Profits This Year</CardTitle>
              <WrenchIcon className="w-4 h-4 text-gray-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{carsCancelled.length}</div>
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

        {/* Cars Completed */}
        <h2 className="mt-10 mb-4 text-2xl font-bold text-white">Cars Completed</h2>
        <div className="rounded-lg bg-gray-700 bg-opacity-80 backdrop-blur-sm overflow-hidden border-none">
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
              {carsCompleted.map((car) => (
                <TableRow 
                  key={car.id}
                  className="cursor-pointer transition-colors hover:bg-slate-800 text-white border-slate-400" 
                  onClick={() => handleRowClick(car.id)}
                >
                  <TableCell>{car.make + ' ' + car.model}</TableCell>
                  <TableCell>{car.owner_name}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium 
                        ${car.repair_status === 'completed' ? 'bg-gradient-to-br from-lime-400 via-green-400 to-emerald-400 text-slate-900' :
                        'bg-red-100 text-red-800'}`}>
                      {car.repair_status === 'completed' ? 'done' : 'done'}
                    </span>
                  </TableCell>
                  <TableCell>{car.description}</TableCell>
                  {/* <TableCell>{new Date(car.estimated_completion).toLocaleString()}</TableCell> */}
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