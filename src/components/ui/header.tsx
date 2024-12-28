import React from 'react';
import { Link } from 'react-router-dom';
import { CarIcon, PlusIcon } from "lucide-react"
import { useAuth } from '@/contexts/auth-context'
import { Button } from "@/components/ui/button"

const Header: React.FC = () => {
    const { signOut } = useAuth()

    const handleSignOut = async () => {
        await signOut()
    }

    return (
        <header className="px-4 lg:px-6 h-16 flex items-center bg-black text-white">
            <Link className="flex items-center justify-center" to="/">
                <CarIcon className="h-6 w-6 text-white" />
                <span className="px-2 sm:px-4">Austin's Auto</span>
            </Link>
            <nav className="ml-auto flex items-center gap-2 sm:gap-6">
                <Link 
                    className="text-sm font-medium hover:text-gray-300 hover:underline underline-offset-4" 
                    to="/"
                >
                    Dashboard
                </Link>
                <Link 
                    className="text-sm font-medium hover:text-gray-300 hover:underline underline-offset-4" 
                    to="/history"
                >
                    History
                </Link>
                <Link 
                    className="inline-flex items-center justify-center text-sm font-medium bg-slate-600 text-white hover:bg-slate-500 hover:text-white rounded-lg px-2 sm:px-4 py-2 transition-colors duration-300 no-underline" 
                    to="/car-details"
                >
                    <PlusIcon className="h-4 w-4 sm:hidden" />
                    <span className="hidden sm:inline">Add car</span>
                </Link>
                <Button 
                    onClick={handleSignOut} 
                    variant="ghost" 
                    className="px-2 sm:px-4"
                >
                    Sign Out
                </Button>
            </nav>
        </header>
    );
};

export default Header;