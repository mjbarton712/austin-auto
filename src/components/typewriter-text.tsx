import React, { useState, useEffect } from 'react';

interface TypewriterTextProps {
    text: string;
    speed?: number;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
    text,
    speed = 30
}) => {
    const [displayedText, setDisplayedText] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (!text) return;
        setDisplayedText('');
        setCurrentIndex(0);
    }, [text]);

    useEffect(() => {
        if (currentIndex >= text.length) return;

        const timer = setTimeout(() => {
            setDisplayedText(prev => prev + text[currentIndex]);
            setCurrentIndex(prev => prev + 1);
        }, speed);

        return () => clearTimeout(timer);
    }, [currentIndex, text, speed]);

    return (
        <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
            {displayedText}
            {currentIndex < text.length && (
                <span className="inline-block w-2 h-4 ml-1 bg-blue-400 animate-pulse" />
            )}
        </div>
    );
};