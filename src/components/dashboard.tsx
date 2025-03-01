'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CarIcon, WrenchIcon, UsersIcon } from "lucide-react"
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import Header from "@/components/ui/header"
import { useEffect, useState } from 'react';
import JobTable from "./job-table"
import { GarageTable } from "./garage-table"
import { ClaudeCard, ClaudeModal } from "./claude-modal"
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { Car, Job } from '@/types'

interface JobWithCar extends Job {
  car: Car;
}

interface Verse {
  id: string;
  reference: string;
  content: string;
}

const anthropicKey = import.meta.env.VITE_CLAUDE_API_KEY;

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [jobsInProgress, setJobsInProgress] = useState<JobWithCar[]>([]);
  const [jobsComingSoon, setJobsComingSoon] = useState<JobWithCar[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [isClaudeModalOpen, setIsClaudeModalOpen] = useState(false);
  const [dailyVerse, setDailyVerse] = useState<Verse[]>([]);

  const handleJobClick = (jobId: string) => {
    const job = [...jobsInProgress, ...jobsComingSoon].find(j => j.id === jobId);
    if (job) {
      navigate(`/car-details/${job.car_id}`);
    }
  };

  const handleCarSelect = (carId: string) => {
    navigate(`/car-details/${carId}`);
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      // Fetch all cars
      const { data: carsData } = await supabase
        .from('cars_new')
        .select('*')
        .eq('user_id', user.id);

      if (carsData) {
        setCars(carsData);
      }

      // Fetch jobs with car details
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select(`
          *,
          car:cars_new!fk_car(*)
        `)
        .eq('user_id', user.id);

      if (jobsError) {
        console.error('Error fetching jobs:', jobsError);
        return;
      }

      if (jobsData) {
        const inProgress = jobsData.filter(job => job.status === 'in_progress');
        const notStarted = jobsData.filter(job => job.status === 'not_started');
        
        setJobsInProgress(inProgress);
        setJobsComingSoon(notStarted);
      }
    };

    fetchData();
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
    <div className="flex flex-col min-h-screen bg-gray-900">
      <Header />
      <main className="flex-1 p-6 md:p-8 lg:px-[12%]">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
                  <div className="text-2xl font-bold">{jobsInProgress.length}</div>
                  <p className="text-xs text-gray-300">🛠️ You are doing great!</p>
                </div>

                {/* Cars Coming Soon Section */}
                <div className="flex-1 pl-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Cars Coming Soon</h3>
                    <WrenchIcon className="w-4 h-4 text-gray-300" />
                  </div>
                  <div className="text-2xl font-bold">{jobsComingSoon.length}</div>
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
        </div>

        {/* My Garage Section */}
        <h2 className="mt-10 mb-4 text-2xl font-bold text-white">My Garage</h2>
        {cars.length > 0 ? (
          <GarageTable cars={cars} onCarSelect={handleCarSelect} />
        ) : (
          <div className="text-center py-8 bg-gray-800 rounded-lg">
            <p className="text-gray-400">No cars in your garage</p>
            <Link
              to="/car-details"
              className="text-blue-400 hover:text-blue-300 mt-2 inline-block"
            >
              Add a new car
            </Link>
          </div>
        )}

        {/* Cars Currently in Shop */}
        <h2 className="mt-10 mb-4 text-2xl font-bold text-white">Cars Currently in Shop</h2>
        {jobsInProgress.length > 0 ? (
          <JobTable jobs={jobsInProgress} onJobSelect={handleJobClick} />
        ) : (
          <div className="text-center py-8 bg-gray-800 rounded-lg">
            <p className="text-gray-400">No cars currently in the shop</p>
            <Link
              to="/car-details"
              className="text-blue-400 hover:text-blue-300 mt-2 inline-block"
            >
              Add a new job
            </Link>
          </div>
        )}

        {/* Cars Coming Soon */}
        <h2 className="mt-10 mb-4 text-2xl font-bold text-white">Cars Coming Soon</h2>
        {jobsComingSoon.length > 0 ? (
          <JobTable jobs={jobsComingSoon} onJobSelect={handleJobClick} />
        ) : (
          <div className="text-center py-8 bg-gray-800 rounded-lg">
            <p className="text-gray-400">No upcoming jobs scheduled</p>
            <Link
              to="/car-details"
              className="text-blue-400 hover:text-blue-300 mt-2 inline-block"
            >
              Add a new job
            </Link>
          </div>
        )}

        {/* Logo Section */}
        <div className="mt-10 flex justify-center">
          <img
            src="./austins_auto.png"
            alt="RUNEW Logo"
            className="max-w-sm w-full object-contain"
          />
        </div>
      </main>
      <footer className="py-4 sm:py-6 px-4 lg:px-6 bg-black bg-opacity-100 backdrop-blur-sm">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between">
          <p className="text-sm text-gray-400 text-center sm:text-left">© 2024 RUNEW. All rights reserved.</p>
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