'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CarIcon, WrenchIcon, UsersIcon } from "lucide-react"
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import Header from "@/components/ui/header"
import { useEffect, useState } from 'react';
import CarTable from "./car-table"
import { ClaudeCard, ClaudeModal } from "./claude-modal"
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'

const anthropicKey = import.meta.env.VITE_CLAUDE_API_KEY;

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  console.log('Current user:', user);

  interface Car {
    id: string;
    make: string;
    model: string;
    owner_name: string;
    repair_status: string;
    description: string;
    payment_status: string;
  }

  interface Verse {
    id: string;
    reference: string;
    content: string;
  }
  // Define state with the Car type
  const [carsInProgress, setCarsInProgress] = useState<Car[]>([]);
  const [carsComingSoon, setCarsComingSoon] = useState<Car[]>([]);
  const [dailyVerse, setDailyVerse] = useState<Verse[]>([]);

  // Claude AI search state
  const [isClaudeModalOpen, setIsClaudeModalOpen] = useState(false);

  const handleRowClick = (uuid: string) => {
    navigate(`/car-details/${uuid}`);
  };

  useEffect(() => {
    const fetchCars = async () => {
      if (!user) return;

      // Fetch cars that are in progress
      const { data: inProgressCars, error: inProgressError } = await supabase
        .from('cars')
        .select('*')
        .eq('repair_status', 'in_progress')
        .eq('user_id', user.id);

      if (inProgressError) {
        console.error('Error fetching in-progress cars:', inProgressError);
        return;
      }
      setCarsInProgress(inProgressCars as Car[]);

      // Fetch cars that are not started
      const { data: notStartedCars, error: notStartedError } = await supabase
        .from('cars')
        .select('*')
        .eq('repair_status', 'not_started')
        .eq('user_id', user.id);

      if (notStartedError) {
        console.error('Error fetching not started cars:', notStartedError);
        return;
      }
      setCarsComingSoon(notStartedCars as Car[]);
    };

    fetchCars();
  }, [user]);

  useEffect(() => {
    const fetchVerse = async () => {
      const today = new Date();
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
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 w-full">
      <Header />
      <main className="flex-1 p-6 md:p-8 lg:px-[12%]">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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

          {/* Car Graphic */}
          <Card className="bg-slate-900 text-white h-full">
            <div className="h-full flex items-center justify-center">
              <img
                src="./austins_auto.png"
                className="object-contain w-full h-full max-h-[150px]"
              />
            </div>
          </Card>
        </div>

        {/* Cars Currently in Shop */}
        <h2 className="mt-10 mb-4 text-2xl font-bold text-white">Cars Currently in Shop</h2>
        {carsInProgress.length > 0 ? (
          <CarTable carsInProgress={carsInProgress} handleRowClick={handleRowClick} />
        ) : (
          <div className="text-center py-8 bg-gray-800 rounded-lg">
            <p className="text-gray-400">No cars currently in the shop</p>
            <Link
              to="/car-details"
              className="text-blue-400 hover:text-blue-300 mt-2 inline-block"
            >
              Add a new car
            </Link>
          </div>
        )}

        {/* Cars Coming Soon */}
        <h2 className="mt-10 mb-4 text-2xl font-bold text-white">Cars Coming Soon</h2>
        {carsComingSoon.length > 0 ? (
          <CarTable carsInProgress={carsComingSoon} handleRowClick={handleRowClick} />
        ) : (
          <div className="text-center py-8 bg-gray-800 rounded-lg">
            <p className="text-gray-400">No upcoming cars scheduled</p>
            <Link
              to="/car-details"
              className="text-blue-400 hover:text-blue-300 mt-2 inline-block"
            >
              Add a new car
            </Link>
          </div>
        )}
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