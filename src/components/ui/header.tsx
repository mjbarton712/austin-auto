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
        <header className={`
            px-3 sm:px-4 lg:px-6 h-16 flex items-center relative border-b border-border
            ${theme === 'dark' 
                ? 'bg-gradient-to-r from-blue-800 to-indigo-600 text-foreground'
                : 'bg-gradient-to-r from-teal-100 to-indigo-300 text-foreground'}
        `}>
            <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-2">
                {/* Logo and brand */}
                <Link 
                    className="flex items-center h-16 shrink-0 text-foreground" 
                    to="/"
                >
                    <CarIcon className="h-5 w-5 text-muted-foreground" />
                    <span className="ml-2 text-foreground font-medium racing-sans-one-regular"><i><strong>RUNEW</strong></i></span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="flex items-center">
                    <div className="hidden sm:flex items-center">
                        <Link 
                            className="h-16 px-3 inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors" 
                            to="/"
                        >
                            Dashboard
                        </Link>
                        <Link 
                            className="h-16 px-3 inline-flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors" 
                            to="/history"
                        >
                            History
                        </Link>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-1 sm:gap-2 ml-1 sm:ml-2">
                        <Button
                            onClick={handleAddCar}
                            className={`h-9 text-foreground transition-colors px-2 sm:px-3
                                ${theme === 'dark' 
                                    ? 'bg-white/10 hover:bg-white/20' 
                                    : 'bg-primary/10 hover:bg-primary/20'}
                            `}
                            size="sm"
                        >
                            <PlusIcon className="h-4 w-4 sm:mr-2 text-muted-foreground" />
                            <span className="hidden sm:inline">Add car</span>
                        </Button>
                        
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleTheme}
                            className={`h-9 w-9 text-foreground 
                                ${theme === 'dark' 
                                    ? 'hover:bg-white/10' 
                                    : 'hover:bg-black/10'}
                            `}
                        >
                            {theme === 'dark' ? (
                                <SunIcon className="h-4 w-4 text-muted-foreground" />
                            ) : (
                                <MoonIcon className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="sr-only">Toggle theme</span>
                        </Button>
                        
                        {/* Desktop Sign Out */}
                        <Button 
                            onClick={handleSignOut} 
                            variant="ghost" 
                            size="sm"
                            className={`hidden sm:flex h-9 text-foreground px-3
                                ${theme === 'dark' 
                                    ? 'hover:bg-white/10' 
                                    : 'hover:bg-black/10'}
                            `}
                        >
                            Sign Out
                        </Button>

                        {/* Mobile Menu Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className={`h-9 w-9 text-foreground sm:hidden
                                ${theme === 'dark' 
                                    ? 'hover:bg-white/10' 
                                    : 'hover:bg-black/10'}
                            `}
                        >
                            {isMenuOpen ? (
                                <X className="h-4 w-4 text-muted-foreground" />
                            ) : (
                                <MenuIcon className="h-4 w-4 text-muted-foreground" />
                            )}
                        </Button>
                    </div>
                </nav>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className={`absolute top-16 right-0 w-48 shadow-lg rounded-bl-lg sm:hidden z-50
                    ${theme === 'dark' 
                        ? 'bg-blue-900' 
                        : 'bg-blue-50'}
                `}>
                    <div className="py-2">
                        <Link 
                            to="/"
                            onClick={() => setIsMenuOpen(false)}
                            className={`block px-4 py-2 text-sm text-foreground 
                                ${theme === 'dark' 
                                    ? 'hover:bg-white/10' 
                                    : 'hover:bg-black/10'}
                            `}
                        >
                            Dashboard
                        </Link>
                        <Link 
                            to="/history"
                            onClick={() => setIsMenuOpen(false)}
                            className={`block px-4 py-2 text-sm text-foreground 
                                ${theme === 'dark' 
                                    ? 'hover:bg-white/10' 
                                    : 'hover:bg-black/10'}
                            `}
                        >
                            History
                        </Link>
                        <button
                            onClick={handleSignOut}
                            className={`block w-full text-left px-4 py-2 text-sm text-foreground 
                                ${theme === 'dark' 
                                    ? 'hover:bg-white/10' 
                                    : 'hover:bg-black/10'}
                            `}
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
