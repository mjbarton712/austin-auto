'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CarIcon, DollarSignIcon } from "lucide-react"
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import Header from "@/components/ui/header"
import { useEffect, useState } from 'react';
import JobTable from "./job-table"
import { ClaudeCard, ClaudeModal } from "./claude-modal"
import { supabase } from '@/lib/supabase'
import { Car, Job } from '@/types'

interface JobWithCar extends Job {
  car: Car;
}

const anthropicKey = import.meta.env.VITE_CLAUDE_API_KEY;

export function History() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const [completedJobs, setCompletedJobs] = useState<JobWithCar[]>([]);
  const [isClaudeModalOpen, setIsClaudeModalOpen] = useState(false);

  const handleJobClick = (jobId: string) => {
    const job = completedJobs.find(j => j.id === jobId);
    if (job) {
      navigate(`/car-details/${job.car_id}`);
    }
  };

  const getJobsCompletedThisYear = () => {
    return completedJobs.filter(job => {
      if (!job.completion_date) return false;
      const jobDate = new Date(job.completion_date);
      return jobDate.getFullYear() === currentYear;
    }).length;
  };

  const getProfitsByYear = (year: number) => {
    const jobsInYear = completedJobs.filter(job => {
      if (!job.completion_date) return false;
      const jobDate = new Date(job.completion_date);
      return jobDate.getFullYear() === year;
    });

    const totalCharges = jobsInYear.reduce((sum, job) => sum + (job.amount_charged || 0), 0);
    const totalCosts = jobsInYear.reduce((sum, job) => sum + (job.cost_to_fix || 0), 0);
    
    return totalCharges - totalCosts;
  };

  const getTotalProfits = () => {
    const totalCharges = completedJobs.reduce((sum, job) => sum + (job.amount_charged || 0), 0);
    const totalCosts = completedJobs.reduce((sum, job) => sum + (job.cost_to_fix || 0), 0);
    
    return totalCharges - totalCosts;
  };

  useEffect(() => {
    const fetchJobs = async () => {
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select(`
          *,
          car:car_id(*)
        `)
        .in('status', ['completed', 'cancelled']);

      if (jobsError) {
        console.error('Error fetching completed jobs:', jobsError);
        return;
      }

      setCompletedJobs(jobsData || []);
    };

    fetchJobs();
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
                  <div className="text-2xl font-bold">{getJobsCompletedThisYear()}</div>
                  <p className="text-xs text-gray-300">This year's progress</p>
                </div>

                {/* Cars Completed Total Section */}
                <div className="pl-4">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-medium">Total</div>
                  </div>
                  <div className="text-2xl font-bold">{completedJobs.length}</div>
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

        {/* Completed Jobs */}
        <h2 className="mt-10 mb-4 text-2xl font-bold text-white">Completed Jobs</h2>
        <JobTable 
          jobs={completedJobs} 
          onJobSelect={handleJobClick} 
          showSearch={true} // Enable search for history view
        />

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