import React, { useState } from 'react';
import { X, BrainCircuit } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TypewriterText } from './typewriter-text';

interface ClaudeAIModalProps {
    isOpen: boolean;
    onClose: () => void;
    query: string;
    onQueryChange: (value: string) => void;
    onSearch: () => void;
    response: string | null;
    isLoading?: boolean;
}

export const ClaudeAIModal: React.FC<ClaudeAIModalProps> = ({
    isOpen,
    onClose,
    query,
    onQueryChange,
    onSearch,
    response,
    isLoading = false
}) => {
    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch();
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center
                        animate-in fade-in duration-300"
            onClick={handleBackdropClick}
        >
            <div
                className="bg-gradient-to-br from-blue-600 to-indigo-800 text-white p-6 rounded-lg w-full max-w-2xl mx-4 
                            transform transition-all duration-500 animate-in fade-in slide-in-from-bottom-8
                            hover:shadow-xl hover:shadow-blue-700/20"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4 animate-in fade-in slide-in-from-top duration-500">
                    <div className="flex items-center gap-2">
                        <BrainCircuit className="w-6 h-6 text-gray-300 animate-pulse" />
                        <h2 className="text-xl font-bold">Ask Claude AI</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-300 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full
                                    transform hover:rotate-90 transition-all duration-300"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative animate-in fade-in slide-in-from-left duration-500 delay-150">
                        <Input
                            placeholder="Ask me anything..."
                            value={query}
                            onChange={(e) => onQueryChange(e.target.value)}
                            className="w-full bg-gray-800/50 text-white p-3 rounded-lg border-gray-700 
                                        focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-300
                                        hover:bg-gray-800/70"
                            autoFocus
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-indigo-700 hover:bg-indigo-600 px-4 py-2 rounded-lg 
                                    transition-all duration-300 font-medium focus:outline-none 
                                    focus:ring-2 focus:ring-blue-400/20 disabled:opacity-50 disabled:cursor-not-allowed
                                    animate-in fade-in slide-in-from-right duration-500 delay-300
                                    hover:shadow-lg hover:scale-[1.02]"
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
                                Thinking...
                            </span>
                        ) : (
                            'Search'
                        )}
                    </button>

                    {response && (
                        <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700
                                        animate-in fade-in slide-in-from-bottom duration-700 delay-200">
                            <TypewriterText text={response} speed={20} />
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export const ClaudeAICard: React.FC<{
    query: string;
    setQuery: (value: string) => void;
    isModalOpen: boolean;
    setIsModalOpen: (value: boolean) => void;
}> = ({ query, setQuery, isModalOpen, setIsModalOpen }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <Card
            className="bg-gradient-to-br from-blue-600 to-indigo-800 text-white cursor-pointer 
                        transition-all duration-500 hover:scale-105 hover:shadow-xl hover:shadow-blue-700/20"
            onClick={() => setIsModalOpen(true)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Ask Claude AI anything...</CardTitle>
                <BrainCircuit
                    className={`w-4 h-4 text-gray-300 transition-all duration-500 ${isHovered ? 'animate-pulse scale-110' : ''
                        }`}
                />
            </CardHeader>
            <CardContent>
                <div className="transform transition-all duration-300">
                    <Input
                        placeholder="Click to ask a question..."
                        value={query}
                        readOnly
                        className="bg-gray-800/50 text-white cursor-pointer hover:bg-gray-800/70
                                    transition-all duration-300"
                    />
                </div>
            </CardContent>
        </Card>
    );
};