'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CarIcon, WrenchIcon, UsersIcon } from "lucide-react"
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import Header from "@/components/ui/header"
import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import CarTable from "./car-table"
import { ClaudeAICard, ClaudeAIModal } from "./claude-ai-modal"
import { ClaudeClient } from "./claude-client";

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
  const [claudeQuery, setClaudeQuery] = useState<string>("");
  const [claudeResponse, setClaudeResponse] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);


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

    fetchCars();
    fetchVerse();
  }, []);

  // Claude section
  const claude = new ClaudeClient(import.meta.env.VITE_CLAUDE_API_KEY || '');
  
  const handleClaudeSearch = async () => {
      if (!claudeQuery.trim() || isLoading) return;
  
      setIsLoading(true);
      try {
          const result = await claude.createMessage(claudeQuery, {
              maxTokens: 1024,
              temperature: 0.7
          });
          setClaudeResponse(result);
      } catch (error) {
          console.error("Error during Claude AI search:", error);
          setClaudeResponse("An error occurred during the search. Please try again.");
      } finally {
          setIsLoading(false);
      }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-900">
      <Header />
      <main className="flex-1 py-4 md:py-6 lg:py-8 px-8 md:px-12 lg:px-16">
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

          {/* Claude AI Search Card */}
          <ClaudeAICard
            query={claudeQuery}
            setQuery={setClaudeQuery}
            isModalOpen={isModalOpen}
            setIsModalOpen={setIsModalOpen}
          />
          <ClaudeAIModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            query={claudeQuery}
            onQueryChange={setClaudeQuery}
            onSearch={handleClaudeSearch}
            response={claudeResponse}
          />

          {/* Daily Bible Verse */}
          <Card className="bg-gradient-to-br from-blue-600 to-indigo-800 text-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">The Word of God</CardTitle>
              <UsersIcon className="w-4 h-4 text-gray-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dailyVerse?.at(0)?.reference || "Loading..."}</div>
              <br/>
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
        <CarTable carsInProgress={carsInProgress} handleRowClick={handleRowClick} />

        {/* Cars Coming Soon */}
        <h2 className="mt-10 mb-4 text-2xl font-bold text-white">Cars Coming Soon</h2>
        <CarTable carsInProgress={carsComingSoon} handleRowClick={handleRowClick} />
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