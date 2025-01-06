'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CarIcon, DollarSignIcon } from "lucide-react"
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import Header from "@/components/ui/header"
import { useEffect, useState } from 'react';
import CarTable from "./car-table"
import { ClaudeCard, ClaudeModal } from "./claude-modal"
import { supabase } from '@/lib/supabase'

const anthropicKey = import.meta.env.VITE_CLAUDE_API_KEY;

export function History() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  interface Car {
    id: string;
    make: string;
    model: string;
    owner_name: string;
    repair_status: string;
    payment_status: string;
    description: string;
    estimated_completion_date: string;
    cost_to_fix: number;
    amount_charged: number;
  }

  const [carsDone, setCarsDone] = useState<Car[]>([]);
  const [isClaudeModalOpen, setIsClaudeModalOpen] = useState(false);

  const handleRowClick = (uuid: string) => {
    navigate(`/car-details/${uuid}`);
  };

  const getCarsCompletedThisYear = () => {
    return carsDone.filter(car => {
      if (!car.estimated_completion_date) return false;  // Skip if no completion date
      const carDate = new Date(car.estimated_completion_date);
      return carDate.getFullYear() === currentYear;
    }).length;
  };

  const getProfitsByYear = (year: number) => {
    const carsInYear = carsDone.filter(car => {
      if (!car.estimated_completion_date) return false;
      const carDate = new Date(car.estimated_completion_date);
      return carDate.getFullYear() === year;
    });

    const totalCharges = carsInYear.reduce((sum, car) => sum + (car.amount_charged || 0), 0);
    const totalCosts = carsInYear.reduce((sum, car) => sum + (car.cost_to_fix || 0), 0);
    
    return totalCharges - totalCosts;
  };

  const getTotalProfits = () => {
    const totalCharges = carsDone.reduce((sum, car) => sum + (car.amount_charged || 0), 0);
    const totalCosts = carsDone.reduce((sum, car) => sum + (car.cost_to_fix || 0), 0);
    
    return totalCharges - totalCosts;
  };

  useEffect(() => {
    const fetchCars = async () => {
      const { data: doneCars, error: doneCarsError } = await supabase
        .from('cars')
        .select('*')
        .in('repair_status', ['completed', 'cancelled']);

      if (doneCarsError) {
        console.error('Error fetching completed cars:', doneCarsError);
        return;
      }
      setCarsDone(doneCars as Car[]);
    };

    fetchCars();
  }, []);

  return (
    <div className="flex flex-col min-h-screen w-full bg-[radial-gradient(circle_at_top,rgba(20,80,160,0.9),rgba(0,5,10,1))]">
      <Header />
      <main className="flex-1 p-6 md:p-8 lg:px-[12%]">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-gradient-to-br from-blue-600 to-indigo-800 text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Cars Completed</CardTitle>
              <CarIcon className="w-4 h-4 text-gray-300 ml-2" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {/* Cars Completed This Year */}
                <div className="border-r border-gray-500">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-medium">{currentYear}</div>
                  </div>
                  <div className="text-2xl font-bold">{getCarsCompletedThisYear()}</div>
                  <p className="text-xs text-gray-300">This year's progress</p>
                </div>

                {/* Cars Completed Total Section */}
                <div className="pl-4">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-medium">Total</div>
                  </div>
                  <div className="text-2xl font-bold">{carsDone.length}</div>
                  <p className="text-xs text-gray-300">🛠️ Way to go!</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-600 to-indigo-800 text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Profits</CardTitle>
              <DollarSignIcon className="w-4 h-4 text-gray-300" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {/* Current Year */}
                <div className="border-r border-gray-500">
                  <div className="text-sm font-medium">{currentYear}</div>
                  <div className="text-lg font-bold truncate">
                    ${Math.floor(getProfitsByYear(currentYear)).toLocaleString('en-US')}
                  </div>
                  <p className="text-xs text-gray-300">Current</p>
                </div>

                {/* Previous Year */}
                <div className="border-r border-gray-500">
                  <div className="text-sm font-medium">{currentYear - 1}</div>
                  <div className="text-lg font-bold truncate">
                    ${Math.floor(getProfitsByYear(currentYear - 1)).toLocaleString('en-US')}
                  </div>
                  <p className="text-xs text-gray-300">Previous</p>
                </div>

                {/* Total Profits */}
                <div>
                  <div className="text-sm font-medium">Total</div>
                  <div className="text-lg font-bold truncate">
                    ${Math.floor(getTotalProfits()).toLocaleString('en-US')}
                  </div>
                  <p className="text-xs text-gray-300">All time</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Claude AI Search Card and Modal*/}
          <ClaudeCard
            anthropicKey={anthropicKey}
            onOpenModal={() => setIsClaudeModalOpen(true)}
          />
          <ClaudeModal
            isOpen={isClaudeModalOpen}
            onClose={() => setIsClaudeModalOpen(false)}
            anthropicKey={anthropicKey}
          />
        </div>

        {/* Cars Completed or Cancelled */}
        <h2 className="mt-10 mb-4 text-2xl font-bold text-white">Cars Done</h2>
        <CarTable carsInProgress={carsDone} handleRowClick={handleRowClick} />

        {/* Logo Section */}
        <div className="mt-10 flex justify-center">
          <img
            src="./austins_auto.png"
            alt="Austin's Auto Logo"
            className="max-w-sm w-full object-contain"
          />
        </div>
      </main>

      <footer className="py-4 sm:py-6 px-4 lg:px-6 bg-black bg-opacity-100 backdrop-blur-sm">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between">
          <p className="text-sm text-gray-400 text-center sm:text-left">© 2024 Austin's Auto. All rights reserved.</p>
          <nav className="flex gap-4 sm:gap-6 mt-2 sm:mt-0">
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