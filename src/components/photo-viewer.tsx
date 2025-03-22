import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Photo } from "@/types";

type PhotoViewerProps = {
    photos: Photo[];
    initialIndex: number;
    isOpen: boolean;
    onClose: () => void;
};

export const PhotoViewer = ({ photos, initialIndex, isOpen, onClose }: PhotoViewerProps) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    
    // Reset current index when opened with a different initial index
    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(initialIndex);
        }
    }, [isOpen, initialIndex]);
    
    if (!photos.length) return null;
    
    const currentPhoto = photos[currentIndex];
    
    const goToNext = () => {
        setCurrentIndex((prev) => (prev + 1) % photos.length);
    };
    
    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
    };
    
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowRight') goToNext();
        if (e.key === 'ArrowLeft') goToPrevious();
        if (e.key === 'Escape') onClose();
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent 
                className="max-w-4xl w-full p-0 bg-black/90 border-border"
                onKeyDown={handleKeyDown}
                tabIndex={0}
            >
                <div className="relative flex flex-col h-full">
                    {/* Header */}
                    <div className="flex justify-between items-center p-4 absolute top-0 left-0 right-0 z-10">
                        <div className="text-white/70 text-sm">
                            {currentIndex + 1} / {photos.length}
                        </div>
                        <DialogClose asChild>
                            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                                <X className="h-5 w-5" />
                            </Button>
                        </DialogClose>
                    </div>
                    
                    {/* Main image */}
                    <div className="flex-1 flex items-center justify-center p-6 pt-16 pb-16">
                        <img
                            src={currentPhoto.url}
                            alt={`Vehicle service photo ${currentIndex + 1}`}
                            className="max-h-[70vh] max-w-full object-contain"
                        />
                    </div>
                    
                    {/* Navigation buttons */}
                    {photos.length > 1 && (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white h-12 w-12 rounded-full hover:bg-white/20"
                                onClick={goToPrevious}
                            >
                                <ChevronLeft className="h-8 w-8" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white h-12 w-12 rounded-full hover:bg-white/20"
                                onClick={goToNext}
                            >
                                <ChevronRight className="h-8 w-8" />
                            </Button>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}; 