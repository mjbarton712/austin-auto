import React from 'react';
import { Link } from 'react-router-dom';
import { CarIcon, SearchIcon } from "lucide-react"
import { Input } from './input'; // Adjust the import based on your file structure
import { useAuth } from '@/contexts/auth-context'
import { Button } from "@/components/ui/button"

const Header: React.FC = () => {
    const { signOut } = useAuth()

    const handleSignOut = async () => {
        await signOut()
    }

    return (
        <header className="px-4 lg:px-6 h-20 flex items-center bg-black text-white">
            <Link className="flex items-center justify-center" to="/">
                <CarIcon className="h-6 w-6 text-white" />
                <span className="px-4">Austin's Auto</span>
            </Link>
            <nav className="ml-auto flex items-center gap-4 sm:gap-6">
                <Link className="text-sm font-medium hover:text-gray-300 hover:underline underline-offset-4" to="/">
                    Dashboard
                </Link>
                <Link className="text-sm font-medium hover:text-gray-300 hover:underline underline-offset-4" to="/history">
                    History
                </Link>
                <Link className="text-sm font-medium bg-slate-600 text-white hover:bg-slate-500 hover:text-white rounded-lg px-4 py-2 transition-colors duration-300 no-underline" to="/car-details">
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
                <Button onClick={handleSignOut} variant="ghost">
                    Sign Out
                </Button>
            </nav>
        </header>
    );
};

export default Header;