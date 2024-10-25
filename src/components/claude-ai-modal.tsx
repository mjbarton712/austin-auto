import React, { useState } from 'react';
import { X, BrainCircuit, RefreshCw } from 'lucide-react';
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
    onResponseChange: (value: string | null) => void;
    onReset: () => void;
    isLoading?: boolean;
}

export const ClaudeAIModal: React.FC<ClaudeAIModalProps> = ({
    isOpen,
    onClose,
    query,
    onQueryChange,
    onSearch,
    response,
    onResponseChange,  // Add the new prop
    onReset,
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
        if (query.trim()) {  // Only search if there's a non-empty query
            onSearch();
        }
    };

    const handleClear = (e: React.MouseEvent) => {
        e.preventDefault();
        onReset();
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center
                        animate-in fade-in duration-300"
            onClick={handleBackdropClick}
        >
            <div
                className="bg-gradient-to-br from-blue-600 to-indigo-800 text-white p-6 rounded-lg w-full max-w-2xl mx-4 
                            animate-in fade-in duration-500
                            hover:shadow-xl hover:shadow-blue-700/20"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4 animate-in fade-in duration-500">
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
                    <div className="relative animate-in fade-in duration-500">
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

                    <div className="flex gap-2 animate-in fade-in duration-500">
                        <button
                            type="submit"
                            disabled={isLoading || !query.trim()}  // Disable if loading or empty query
                            className="flex-1 bg-indigo-700 hover:bg-indigo-600 px-4 py-2 rounded-lg 
                                    transition-all duration-300 font-medium focus:outline-none 
                                    focus:ring-2 focus:ring-blue-400/20 disabled:opacity-50 disabled:cursor-not-allowed
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

                        <button
                            type="button"
                            onClick={handleClear}
                            disabled={!query && !response}  // Disable if nothing to clear
                            className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg transition-all duration-300
                                    focus:outline-none focus:ring-2 focus:ring-blue-400/20
                                    hover:shadow-lg hover:scale-[1.02]
                                    disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Clear input"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                    </div>

                    {response && (
                        <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700
                                        animate-in fade-in duration-700">
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