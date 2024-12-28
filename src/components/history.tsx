'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CarIcon, DollarSignIcon, WrenchIcon, UsersIcon } from "lucide-react"
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import Header from "@/components/ui/header"
import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import CarTable from "./car-table"
import { ClaudeCard, ClaudeModal } from "./claude-modal"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;
const anthropicKey = import.meta.env.VITE_CLAUDE_API_KEY;

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

  interface Verse {
    id: string;
    reference: string;
    content: string;
  }

  const [carsDone, setCarsDone] = useState<Car[]>([]);
  const [dailyVerse, setDailyVerse] = useState<Verse[]>([]);
  const [isClaudeModalOpen, setIsClaudeModalOpen] = useState(false);

  const handleRowClick = (uuid: string) => {
    navigate(`/car-details/${uuid}`);
  };

  useEffect(() => {
    const fetchCars = async () => {
      // Fetch cars that are completed or cancelled
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

    const fetchVerse = async () => {
      const today = new Date();
      // Fetch verse of the day
      const { data: dailyVerse, error: dailyVerseError } = await supabase
        .from('verses')
        .select('*')
        .eq('id', (today.getDay() + 1));

      if (dailyVerseError) {
        console.error('Error fetching verse of the day:', dailyVerseError);
        return;
      }
      setDailyVerse(dailyVerse as Verse[]);
    }

    fetchVerse();
    fetchCars();
  }, []);

  return (
    <div className="flex flex-col min-h-screen w-full bg-[radial-gradient(circle_at_top,rgba(20,80,160,0.9),rgba(0,5,10,1))]">
      <Header />
      <main className="flex-1 p-4 md:p-6">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-600 to-indigo-800 text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Cars Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between">
                {/* Cars Completed Section */}
                <div className="flex-1 pr-4 border-r border-gray-500">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Total</h3>
                    <CarIcon className="w-4 h-4 text-gray-300" />
                  </div>
                  <div className="text-2xl font-bold">{carsDone.length}</div>
                  <p className="text-xs text-gray-300">🛠️ Way to go!</p>
                </div>

                {/* Cars Completed 2024 */}
                <div className="flex-1 pl-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Current year</h3>
                    <WrenchIcon className="w-4 h-4 text-gray-300" />
                  </div>
                  <div className="text-2xl font-bold">{carsDone.length}</div>
                  <p className="text-xs text-gray-300">TODO</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daily Bible Verse */}
          <Card className="bg-gradient-to-br from-blue-600 to-indigo-800 text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">The Word of God</CardTitle>
              <UsersIcon className="w-4 h-4 text-gray-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dailyVerse?.at(0)?.reference || "Loading..."}</div>
              <br />
              <p className="text-xs text-gray-300">{dailyVerse?.at(0)?.content || "Loading..."}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-600 to-indigo-800 text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Profits This Year</CardTitle>
              <DollarSignIcon className="w-4 h-4 text-gray-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{carsDone.length}</div>
              <p className="text-xs text-gray-300">TODO</p>
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