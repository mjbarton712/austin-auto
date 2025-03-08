import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CarIcon, PlusIcon, SunIcon, MoonIcon } from "lucide-react"
import { useAuth } from '@/contexts/auth-context'
import { useTheme } from '@/contexts/theme-context'
import { Button } from "@/components/ui/button"

const Header: React.FC = () => {
    const { signOut } = useAuth()
    const { theme, toggleTheme } = useTheme()
    const navigate = useNavigate()

    const handleSignOut = async () => {
        await signOut()
    }

    const handleAddCar = () => {
        navigate('/car-details')
    }

    return (
        <header className="px-4 lg:px-6 h-16 flex items-center bg-gradient-to-r from-blue-800 to-indigo-600">
            <div className="w-full max-w-7xl mx-auto flex items-center justify-between">
                {/* Logo and brand */}
                <Link 
                    className="flex items-center h-16" 
                    to="/"
                >
                    <CarIcon className="h-5 w-5 text-white" />
                    <span className="ml-2 text-white font-medium">RUNEW</span>
                </Link>

                {/* Navigation */}
                <nav className="flex items-center gap-1 sm:gap-2">
                    <Link 
                        className="h-16 px-3 inline-flex items-center text-sm font-medium text-white hover:text-gray-200 hover:bg-white/10 transition-colors" 
                        to="/"
                    >
                        Dashboard
                    </Link>
                    <Link 
                        className="h-16 px-3 inline-flex items-center text-sm font-medium text-white hover:text-gray-200 hover:bg-white/10 transition-colors" 
                        to="/history"
                    >
                        History
                    </Link>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-1 sm:gap-2 ml-2">
                        <Button
                            onClick={handleAddCar}
                            className="h-9 bg-white/10 text-white hover:bg-white/20 transition-colors"
                            size="sm"
                        >
                            <PlusIcon className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Add car</span>
                        </Button>
                        
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleTheme}
                            className="h-9 w-9 text-white hover:bg-white/10"
                        >
                            {theme === 'dark' ? (
                                <SunIcon className="h-4 w-4" />
                            ) : (
                                <MoonIcon className="h-4 w-4" />
                            )}
                            <span className="sr-only">Toggle theme</span>
                        </Button>
                        
                        <Button 
                            onClick={handleSignOut} 
                            variant="ghost" 
                            size="sm"
                            className="h-9 text-white hover:bg-white/10"
                        >
                            Sign Out
                        </Button>
                    </div>
                </nav>
            </div>
        </header>
    );
};

export default Header;
