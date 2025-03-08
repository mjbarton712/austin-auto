import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Photo, PendingUpload } from "@/types";
import { useTheme } from '@/contexts/theme-context';

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
    
    return (
        <div className="space-y-4">
            <h3 className="text-foreground font-semibold">Photos <span className="text-muted-foreground text-sm">(optional)</span></h3>
            <Input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => onUpload(e, jobIndex)}
                disabled={isUploading}
                className={cn(
                    "bg-card text-foreground h-auto py-2",
                    "file:text-foreground file:bg-accent file:border-0 file:px-4 file:py-2 file:mr-4 file:hover:bg-accent/80 file:cursor-pointer",
                    isUploading && "opacity-50 cursor-not-allowed"
                )}
            />

            {isUploading && <div className="text-sm text-muted-foreground">Uploading...</div>}

            {!jobId && pendingUploads.some(upload => upload.jobIndex === jobIndex) && (
                <div className="mt-4">
                    <p className="text-sm text-muted-foreground">Pending uploads:</p>
                    <ul className="list-disc pl-5 mt-2">
                        {pendingUploads
                            .filter(upload => upload.jobIndex === jobIndex)
                            .map((upload, idx) => (
                                <li key={idx} className="text-muted-foreground">{upload.file.name}</li>
                            ))}
                    </ul>
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {photos
                    .filter(photo => photo.job_id === jobId)
                    .map((photo, index) => (
                        <div key={photo.id} className="relative group">
                            <div className="aspect-square overflow-hidden rounded-lg bg-muted">
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
                                onClick={() => onDelete(photo.id)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
            </div>
        </div>
    );
};