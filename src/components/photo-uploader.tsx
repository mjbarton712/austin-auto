import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Image, Plus } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Photo, PendingUpload } from "@/types";
import { useTheme } from '@/contexts/theme-context';
import React, { useState } from 'react';
import { PhotoViewer } from './photo-viewer';

type PhotoUploaderProps = {
    jobId?: string;
    jobIndex: number;
    photos: Photo[];
    pendingUploads: PendingUpload[];
    isUploading: boolean;
    onUpload: (event: React.ChangeEvent<HTMLInputElement>, jobIndex: number) => void;
    onDelete: (photoId: string) => void;
};

export const PhotoUploader = ({
    jobId,
    jobIndex,
    photos,
    pendingUploads,
    isUploading,
    onUpload,
    onDelete
}: PhotoUploaderProps) => {
    const { theme } = useTheme();
    const [viewerOpen, setViewerOpen] = useState(false);
    const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

    // Filter photos for this specific job
    const jobPhotos = photos.filter(photo => photo.job_id === jobId);
    
    // Open photo viewer with selected photo
    const openPhotoViewer = (index: number) => {
        setSelectedPhotoIndex(index);
        setViewerOpen(true);
    };
    
    // Trigger the file input click
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const triggerFileInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    React.useEffect(() => {
        console.log(`PhotoUploader mounted with theme: ${theme}`);
    }, [theme]);
    
    return (
        <div className="space-y-4">
            <h3 className="text-foreground font-semibold">Photos <span className="text-muted-foreground text-sm">(optional)</span></h3>
            
            {/* File input (hidden) */}
            <Input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => onUpload(e, jobIndex)}
                disabled={isUploading}
                className="hidden"
            />
            
            {/* Custom upload button */}
            <Button
                type="button"
                variant="outline"
                onClick={triggerFileInput}
                disabled={isUploading}
                className={cn(
                    "w-full bg-card text-foreground h-auto py-3 border-dashed",
                    "hover:bg-accent/50 transition-colors duration-200",
                    isUploading && "opacity-50 cursor-not-allowed"
                )}
            >
                <div className="flex flex-col items-center justify-center w-full py-2">
                    <Image className="h-8 w-8 mb-2 text-muted-foreground" />
                    <span className="text-sm font-medium">
                        {isUploading ? "Uploading..." : "Click to upload photos"}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                        JPG, PNG, GIF up to 8MB
                    </span>
                </div>
            </Button>

            {/* Pending uploads */}
            {!jobId && pendingUploads.some(upload => upload.jobIndex === jobIndex) && (
                <div className="mt-4">
                    <p className="text-sm text-muted-foreground font-medium">Pending uploads:</p>
                    <ul className="mt-2 space-y-2">
                        {pendingUploads
                            .filter(upload => upload.jobIndex === jobIndex)
                            .map((upload, idx) => (
                                <li key={idx} className="flex items-center gap-2 p-2 bg-muted/50 rounded-md text-sm">
                                    <Image className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground truncate">{upload.file.name}</span>
                                </li>
                            ))}
                    </ul>
                </div>
            )}

            {/* Photo grid */}
            {jobPhotos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                    {jobPhotos.map((photo, index) => (
                        <div key={photo.id} className="relative group">
                            <div 
                                className="aspect-square overflow-hidden rounded-lg bg-muted cursor-pointer"
                                onClick={() => openPhotoViewer(index)}
                            >
                                <img
                                    src={photo.url}
                                    alt={`Vehicle service photo ${index + 1}`}
                                    loading="lazy"
                                    className="h-full w-full object-cover transition-all hover:scale-105"
                                />
                            </div>
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(photo.id);
                                }}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    
                    {/* Add more photos button */}
                    <div 
                        className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center cursor-pointer hover:bg-accent/30 transition-colors"
                        onClick={triggerFileInput}
                    >
                        <div className="flex flex-col items-center">
                            <Plus className="h-8 w-8 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground mt-1">Add more</span>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Photo viewer */}
            <PhotoViewer 
                photos={jobPhotos}
                initialIndex={selectedPhotoIndex}
                isOpen={viewerOpen}
                onClose={() => setViewerOpen(false)}
            />
        </div>
    );
};