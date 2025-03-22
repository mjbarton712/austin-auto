// claude-modal.tsx
import React, { useState } from 'react';
import { X, BrainCircuit, RefreshCw } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TypewriterText } from './typewriter-text';
import Anthropic from '@anthropic-ai/sdk';
import { useTheme } from '@/contexts/theme-context';

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
    const { theme } = useTheme();

    const anthropic = new Anthropic({
        apiKey: anthropicKey,  dangerouslyAllowBrowser: true
    });

    const handleSearch = async () => {
        if (!query.trim() || isLoading) return;

        setIsLoading(true);
        setResponse(''); // Start with empty response
        
        try {
            const stream = await anthropic.messages.create({
                model: "claude-3-5-sonnet-latest",
                max_tokens: 1024,
                messages: [{ role: "user", content: query }],
                stream: true, // Enable streaming
            });

            for await (const chunk of stream) {
                if (chunk.type === 'content_block_delta' && 
                    chunk.delta && 
                    'text' in chunk.delta) {
                    setResponse(prev => (prev || '') + (chunk.delta as { text: string }).text);
                }
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
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center animate-in fade-in duration-300"
            onClick={handleBackdropClick}
        >
            <div
                className={`p-6 rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden animate-in fade-in duration-500 shadow-lg border border-border
                ${theme === 'light' 
                    ? 'bg-gradient-to-br from-sky-200/90 via-blue-200/80 to-sky-200/90 backdrop-blur-md' 
                    : 'bg-card'}`}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        <BrainCircuit className="w-6 h-6 text-primary animate-pulse" />
                        <h2 className="text-xl font-bold text-foreground">Ask Claude AI</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-accent rounded-full transform hover:rotate-90 transition-all duration-300"
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
                            className="w-full bg-background text-foreground p-3 rounded-lg border-border focus:border-primary transition-all duration-300"
                            autoFocus
                        />
                    </div>

                    <div className="flex gap-2">
                        <Button
                            type="submit"
                            disabled={isLoading || !query.trim()}
                            className="flex-1 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
                            variant="default"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                                    Thinking...
                                </span>
                            ) : (
                                'Search'
                            )}
                        </Button>

                        <Button
                            type="button"
                            onClick={handleReset}
                            disabled={!query && !response}
                            variant="outline"
                            className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
                            title="Clear input"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </Button>
                    </div>

                    {response && (
                        <div className="mt-6 p-4 bg-muted rounded-lg border border-border animate-in fade-in duration-700 max-h-[40vh] overflow-y-auto">
                            <TypewriterText text={response} />
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
            variant="secondary"
            className="shadow-lg cursor-pointer transition-all duration-500 hover:scale-105 hover:shadow-xl"
            onClick={onOpenModal}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Ask Claude AI anything...</CardTitle>
                <BrainCircuit
                    className={`w-4 h-4 text-foreground transition-all duration-500 ${
                        isHovered ? 'animate-pulse scale-110' : ''
                    }`}
                />
            </CardHeader>
            <CardContent>
                <div className="transform transition-all duration-300">
                    <Input
                        placeholder="Click to ask a question..."
                        readOnly
                        className="cursor-pointer transition-all duration-300 bg-background/50 text-foreground hover:bg-background/80"
                    />
                </div>
            </CardContent>
        </Card>
    );
};