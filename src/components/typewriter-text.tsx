import React, { useState, useEffect, useRef } from 'react';

interface TypewriterTextProps {
    text: string;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
    text
}) => {
    const [displayedText, setDisplayedText] = useState('');
    const [fadeIn, setFadeIn] = useState(false);
    const lastUpdateRef = useRef<number>(0);

    useEffect(() => {
        if (!text) return;
        
        // Always update immediately for streaming
        setDisplayedText(text);
        setFadeIn(true);
        lastUpdateRef.current = Date.now();

    }, [text]);

    return (
        <div 
            className={`text-foreground leading-relaxed whitespace-pre-wrap
                       transition-opacity duration-300 ease-in-out
                       ${fadeIn ? 'opacity-100' : 'opacity-0'}`}
        >
            {displayedText}
            <span className="inline-block w-2 h-4 ml-1 bg-blue-400 animate-pulse" />
        </div>
    );
};