// claude-modal.tsx
import React, { useState } from 'react';
import { X, BrainCircuit, RefreshCw } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TypewriterText } from './typewriter-text';
import Anthropic from '@anthropic-ai/sdk';

// Common interface for both modal and card props
interface ClaudeCommonProps {
    anthropicKey: string;
}

interface ClaudeModalProps extends ClaudeCommonProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ClaudeModal: React.FC<ClaudeModalProps> = ({
    isOpen,
    onClose,
    anthropicKey
}) => {
    const [query, setQuery] = useState('');
    const [response, setResponse] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const anthropic = new Anthropic({
        apiKey: anthropicKey,  dangerouslyAllowBrowser: true
    });

    const handleSearch = async () => {
        if (!query.trim() || isLoading) return;

        setIsLoading(true);
        try {
            const msg = await anthropic.messages.create({
                model: "claude-3-5-sonnet-latest", // TODO change to haiku soon
                max_tokens: 1024,
                messages: [{ role: "user", content: query }]
            });

            if (msg.content[0].type === 'text') {
                setResponse(msg.content[0].text);
            } else {
                setResponse('Received an unexpected response format');
            }
        } catch (error) {
            console.error("Error during Claude AI search:", error);
            setResponse("An error occurred during the search. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setQuery('');
        setResponse(null);
        setIsLoading(false);
    };

    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center
                        animate-in fade-in duration-300"
            onClick={handleBackdropClick}
        >
            <div
                className="bg-gradient-to-br from-blue-600 to-indigo-800 text-white p-6 rounded-lg 
                            w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden
                            animate-in fade-in duration-500
                            hover:shadow-xl hover:shadow-blue-700/20"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
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

                <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="space-y-4">
                    <div className="relative">
                        <Input
                            placeholder="Ask me anything..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full bg-gray-800/50 text-white p-3 rounded-lg border-gray-700 
                                        focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-300
                                        hover:bg-gray-800/70"
                            autoFocus
                        />
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="submit"
                            disabled={isLoading || !query.trim()}
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
                            onClick={handleReset}
                            disabled={!query && !response}
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
                                        animate-in fade-in duration-700 
                                        max-h-[40vh] overflow-y-auto
                                        scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                            <TypewriterText text={response} speed={10} />
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

// Simple card component that triggers the modal
export const ClaudeCard: React.FC<ClaudeCommonProps & {
    onOpenModal: () => void;
}> = ({ onOpenModal }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <Card
            className="bg-gradient-to-br from-blue-600 to-indigo-800 text-white cursor-pointer 
                        transition-all duration-500 hover:scale-105 hover:shadow-xl hover:shadow-blue-700/20"
            onClick={onOpenModal}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Ask Claude AI anything...</CardTitle>
                <BrainCircuit
                    className={`w-4 h-4 text-gray-300 transition-all duration-500 ${
                        isHovered ? 'animate-pulse scale-110' : ''
                    }`}
                />
            </CardHeader>
            <CardContent>
                <div className="transform transition-all duration-300">
                    <Input
                        placeholder="Click to ask a question..."
                        readOnly
                        className="bg-gray-800/50 text-white cursor-pointer hover:bg-gray-800/70
                                    transition-all duration-300"
                    />
                </div>
            </CardContent>
        </Card>
    );
};