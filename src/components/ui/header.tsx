import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CarIcon, PlusIcon, SunIcon, MoonIcon, MenuIcon, X } from "lucide-react"
import { useAuth } from '@/contexts/auth-context'
import { useTheme } from '@/contexts/theme-context'
import { Button } from "@/components/ui/button"

const Header: React.FC = () => {
    const { signOut } = useAuth()
    const { theme, toggleTheme } = useTheme()
    const navigate = useNavigate()
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    const handleSignOut = async () => {
        setIsMenuOpen(false)
        await signOut()
    }

    const handleAddCar = () => {
        setIsMenuOpen(false)
        navigate('/car-details')
    }

    return (
        <header className="px-3 sm:px-4 lg:px-6 h-16 flex items-center bg-gradient-to-r from-blue-800 to-indigo-600 relative">
            <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-2">
                {/* Logo and brand */}
                <Link 
                    className="flex items-center h-16 shrink-0" 
                    to="/"
                >
                    <CarIcon className="h-5 w-5 text-white" />
                    <span className="ml-2 text-white font-medium">RUNEW</span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="flex items-center">
                    <div className="hidden sm:flex items-center">
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
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-1 sm:gap-2 ml-1 sm:ml-2">
                        <Button
                            onClick={handleAddCar}
                            className="h-9 bg-white/10 text-white hover:bg-white/20 transition-colors px-2 sm:px-3"
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
                        
                        {/* Desktop Sign Out */}
                        <Button 
                            onClick={handleSignOut} 
                            variant="ghost" 
                            size="sm"
                            className="hidden sm:flex h-9 text-white hover:bg-white/10 px-3"
                        >
                            Sign Out
                        </Button>

                        {/* Mobile Menu Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="h-9 w-9 text-white hover:bg-white/10 sm:hidden"
                        >
                            {isMenuOpen ? (
                                <X className="h-4 w-4" />
                            ) : (
                                <MenuIcon className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                </nav>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="absolute top-16 right-0 w-48 bg-blue-900 shadow-lg rounded-bl-lg sm:hidden">
                    <div className="py-2">
                        <Link 
                            to="/"
                            onClick={() => setIsMenuOpen(false)}
                            className="block px-4 py-2 text-sm text-white hover:bg-white/10"
                        >
                            Dashboard
                        </Link>
                        <Link 
                            to="/history"
                            onClick={() => setIsMenuOpen(false)}
                            className="block px-4 py-2 text-sm text-white hover:bg-white/10"
                        >
                            History
                        </Link>
                        <button
                            onClick={handleSignOut}
                            className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;
