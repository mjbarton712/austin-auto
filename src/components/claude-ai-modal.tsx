import { X, BrainCircuit } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ClaudeAIModalProps {
    isOpen: boolean;
    onClose: () => void;
    query: string;
    onQueryChange: (value: string) => void;
    onSearch: () => void;
    response: string | null;
}

export const ClaudeAIModal: React.FC<ClaudeAIModalProps> = ({
    isOpen,
    onClose,
    query,
    onQueryChange,
    onSearch,
    response
}) => {
    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
        e.stopPropagation();
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={handleBackdropClick}
        >
            <div
                className="bg-gradient-to-br from-blue-600 to-indigo-800 text-white p-6 rounded-lg w-full max-w-2xl mx-4 
                    transform transition-all duration-300 ease-in-out animate-in fade-in slide-in-from-bottom-4"
            >
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        <BrainCircuit className="w-6 h-6 text-gray-300" />
                        <h2 className="text-xl font-bold">Ask Claude AI</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-300 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="relative">
                        <Input
                            placeholder="Ask me anything..."
                            value={query}
                            onChange={(e) => onQueryChange(e.target.value)}
                            onClick={handleInputClick}
                            className="w-full bg-gray-800/50 text-white p-3 rounded-lg border-gray-700 
                focus:border-blue-400 focus:ring-blue-400/20"
                            autoFocus
                        />
                    </div>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onSearch();
                        }}
                        className="w-full bg-indigo-700 hover:bg-indigo-600 px-4 py-2 rounded-lg 
                            transition-colors duration-200 font-medium focus:outline-none 
                            focus:ring-2 focus:ring-blue-400/20"
                    >
                        Search
                    </button>

                    {response && (
                        <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                            <p className="text-gray-300 leading-relaxed">{response}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Modified Card component for Dashboard.tsx
export const ClaudeAICard: React.FC<{
    query: string;
    setQuery: (value: string) => void;
    isModalOpen: boolean;
    setIsModalOpen: (value: boolean) => void;
}> = ({ query, setQuery, isModalOpen, setIsModalOpen }) => {
    return (
        <Card
            className="bg-gradient-to-br from-blue-600 to-indigo-800 text-white cursor-pointer 
        transition-all duration-200 hover:scale-105 hover:shadow-xl"
            onClick={() => setIsModalOpen(true)}
        >
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Ask Claude AI anything...</CardTitle>
                <BrainCircuit className="w-4 h-4 text-gray-300" />
            </CardHeader>
            <CardContent>
                <div>
                    <Input
                        placeholder="Click to ask a question..."
                        value={query}
                        onChange={(e) => {
                            e.stopPropagation();
                            setQuery(e.target.value);
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsModalOpen(true);
                        }}
                        className="bg-gray-800/50 text-white cursor-text"
                    />
                </div>
            </CardContent>
        </Card>
    );
};
