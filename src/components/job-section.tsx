import { useFormContext } from 'react-hook-form';
import { PhotoUploader } from './photo-uploader';
import { Photo, PendingUpload } from '@/types';
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from "@/components/ui/accordion";
import { cn } from '@/lib/utils';
import { CarIcon, CalendarIcon, Trash2Icon } from 'lucide-react';
import { FormItem, FormLabel, FormMessage, FormField, FormControl } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { jobService } from './supabase-client'
import { useToast } from "@/components/ui/use-toast"

type JobSectionProps = {
    index: number;
    photos: Photo[];
    pendingUploads: PendingUpload[];
    isUploading: boolean;
    onFileUpload: (event: React.ChangeEvent<HTMLInputElement>, jobIndex: number) => void;
    onDeletePhoto: (photoId: string) => void;
    onRemoveJob: (index: number) => void;
};

const truncateDescription = (desc: string, maxLength: number = 40) => {
    if (!desc) return 'New Job';
    return desc.length > maxLength ? `${desc.substring(0, maxLength)}...` : desc;
};

export const JobSection = ({
    index,
    photos,
    pendingUploads,
    isUploading,
    onFileUpload,
    onDeletePhoto,
    onRemoveJob
}: JobSectionProps) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { control, watch, getValues } = useFormContext();
    const description = watch(`jobs.${index}.description`);
    const jobId = watch(`jobs.${index}.id`);
    const { toast } = useToast();
    
    // Watch the fields needed for hourly rate calculation
    const hoursSpent = watch(`jobs.${index}.hours_spent`);
    const amountCharged = watch(`jobs.${index}.amount_charged`);
    const costToFix = watch(`jobs.${index}.cost_to_fix`);

    // Calculate hourly rate
    const calculateHourlyRate = () => {
        if (!hoursSpent || !amountCharged || !costToFix) {
            return null;
        }
        
        if (hoursSpent === 0) {
            return null;
        }

        // Calculate profit (amount charged - cost to fix)
        const profit = amountCharged - costToFix;
        // Calculate hourly rate (profit / hours spent)
        const rate = profit / hoursSpent;
        
        // Return formatted rate with 2 decimal places
        return rate.toFixed(2);
    };

    const hourlyRate = calculateHourlyRate();

    // Function to handle job deletion
    const handleJobDeletion = async () => {
        if (jobId) {
            try {
                const { error } = await jobService.deleteJob(jobId);
                if (error) throw error;
                
                toast({
                    title: "Job Deleted",
                    description: "The job has been removed successfully",
                });
            } catch (error) {
                console.error('Error deleting job:', error);
                toast({
                    variant: "destructive",
                    title: "Deletion Failed",
                    description: "There was a problem deleting this job.",
                });
            }
        }
        
        // Remove from form regardless of server response
        onRemoveJob(index);
    };

    return (
        <Accordion type="single" defaultValue="job" collapsible>
            <AccordionItem value={`job-${index}`} className="w-full">
                <div className="flex items-center justify-between pr-4">
                    <AccordionTrigger className="text-foreground flex-1">
                        <div className="flex items-center gap-2">
                            <CarIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold">
                                Job #{index + 1} - {truncateDescription(description)}
                            </span>
                        </div>
                    </AccordionTrigger>
                    
                    {/* Delete Button - with confirmation for saved jobs */}
                    {jobId ? (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                >
                                    <Trash2Icon className="h-4 w-4" />
                                    <span className="sr-only">Delete job</span>
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the job and all associated data.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleJobDeletion} className="bg-destructive text-destructive-foreground">
                                        Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    ) : (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => onRemoveJob(index)}
                        >
                            <Trash2Icon className="h-4 w-4" />
                            <span className="sr-only">Remove job</span>
                        </Button>
                    )}
                </div>
                
                <AccordionContent>
                    <div className="grid grid-cols-1 gap-4">
                        {/* Basic Job Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={control}
                                name={`jobs.${index}.mileage`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-foreground flex items-center gap-2">
                                            <CarIcon className="h-4 w-4 text-muted-foreground" />
                                            Mileage
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                {...field}
                                                value={field.value || ''}
                                                onChange={e => {
                                                    const value = e.target.value;
                                                    field.onChange(value === '' ? undefined : Number(value));
                                                }}
                                                className="bg-card text-foreground"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={control}
                                name={`jobs.${index}.status`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-foreground flex items-center gap-2">
                                            <CarIcon className="h-4 w-4 text-muted-foreground" />
                                            Status
                                        </FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-card text-foreground">
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-card text-foreground">
                                                <SelectItem value="not_started">Not Started</SelectItem>
                                                <SelectItem value="in_progress">In Progress</SelectItem>
                                                <SelectItem value="completed">Completed</SelectItem>
                                                <SelectItem value="cancelled">Cancelled</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Description */}
                        <FormField
                            control={control}
                            name={`jobs.${index}.description`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-foreground flex items-center gap-2">
                                        <CarIcon className="h-4 w-4 text-muted-foreground" />
                                        Description
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            {...field}
                                            className="bg-card text-foreground border-border min-h-[100px]"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Dates */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={control}
                                name={`jobs.${index}.intake_date`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-foreground flex items-center gap-2">
                                            <CarIcon className="h-4 w-4 text-muted-foreground" />
                                            Intake Date
                                        </FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal",
                                                            "bg-card text-foreground",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? format(field.value, "MMM d, yyyy") : <span>Pick a date</span>}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    className="bg-card text-foreground"
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={control}
                                name={`jobs.${index}.completion_date`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-foreground flex items-center gap-2">
                                            <CarIcon className="h-4 w-4 text-muted-foreground" />
                                            Completion Date <span className="text-muted-foreground text-sm">(optional)</span>
                                        </FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal",
                                                            "bg-card text-foreground",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? format(field.value, "MMM d, yyyy") : <span>Pick a date</span>}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    className="bg-card text-foreground"
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Costs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={control}
                                name={`jobs.${index}.cost_to_fix`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-foreground flex items-center gap-2">
                                            <CarIcon className="h-4 w-4 text-muted-foreground" />
                                            Cost to Fix <span className="text-muted-foreground text-sm">(optional)</span>
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                {...field}
                                                value={field.value || ''}
                                                onChange={e => {
                                                    const value = e.target.value;
                                                    field.onChange(value === '' ? undefined : Number(value));
                                                }}
                                                className="bg-card text-foreground"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={control}
                                name={`jobs.${index}.amount_charged`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-foreground flex items-center gap-2">
                                            <CarIcon className="h-4 w-4 text-muted-foreground" />
                                            Amount Charged <span className="text-muted-foreground text-sm">(optional)</span>
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                {...field}
                                                value={field.value || ''}
                                                onChange={e => {
                                                    const value = e.target.value;
                                                    field.onChange(value === '' ? undefined : Number(value));
                                                }}
                                                className="bg-card text-foreground"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Additional Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={control}
                                name={`jobs.${index}.payment_status`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-foreground flex items-center gap-2">
                                            <CarIcon className="h-4 w-4 text-muted-foreground" />
                                            Payment Status <span className="text-muted-foreground text-sm">(optional)</span>
                                        </FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || "unpaid"}>
                                            <FormControl>
                                                <SelectTrigger className="bg-card text-foreground">
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-card text-foreground">
                                                <SelectItem value="unpaid">Unpaid</SelectItem>
                                                <SelectItem value="partial">Partial</SelectItem>
                                                <SelectItem value="paid">Paid</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={control}
                                name={`jobs.${index}.engine_code`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-foreground flex items-center gap-2">
                                            <CarIcon className="h-4 w-4 text-muted-foreground" />
                                            Engine Code <span className="text-muted-foreground text-sm">(optional)</span>
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                className="bg-card text-foreground"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Labor Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={control}
                                name={`jobs.${index}.hours_spent`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-foreground flex items-center gap-2">
                                            <CarIcon className="h-4 w-4 text-muted-foreground" />
                                            Hours Spent <span className="text-muted-foreground text-sm">(optional)</span>
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.5"
                                                {...field}
                                                value={field.value || ''}
                                                onChange={e => {
                                                    const value = e.target.value;
                                                    field.onChange(value === '' ? undefined : Number(value));
                                                }}
                                                className="bg-card text-foreground"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormItem>
                                <FormLabel className="text-foreground flex items-center gap-2">
                                    <CarIcon className="h-4 w-4 text-muted-foreground" />
                                    Hourly Rate
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        type="text"
                                        value={hourlyRate ? `$${hourlyRate}` : 'Insufficient data'}
                                        readOnly
                                        className="bg-muted text-foreground cursor-not-allowed"
                                    />
                                </FormControl>
                                {!hourlyRate && (
                                    <p className="text-sm text-muted-foreground">
                                        Requires hours spent, amount charged, and cost to fix
                                    </p>
                                )}
                            </FormItem>
                        </div>

                        {/* Notes Fields */}
                        <div className="grid grid-cols-1 gap-4">
                            <FormField
                                control={control}
                                name={`jobs.${index}.problems_encountered`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-foreground flex items-center gap-2">
                                            <CarIcon className="h-4 w-4 text-muted-foreground" />
                                            Problems Encountered <span className="text-muted-foreground text-sm">(optional)</span>
                                        </FormLabel>
                                        <FormControl>
                                            <Textarea
                                                {...field}
                                                className="bg-card text-foreground border-border min-h-[100px]"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={control}
                                name={`jobs.${index}.parts_ordered`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-foreground flex items-center gap-2">
                                            <CarIcon className="h-4 w-4 text-muted-foreground" />
                                            Parts Ordered <span className="text-muted-foreground text-sm">(optional)</span>
                                        </FormLabel>
                                        <FormControl>
                                            <Textarea
                                                {...field}
                                                className="bg-card text-foreground border-border min-h-[100px]"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Photo Uploader */}
                        <PhotoUploader
                            jobIndex={index}
                            photos={photos}
                            pendingUploads={pendingUploads}
                            isUploading={isUploading}
                            onUpload={onFileUpload}
                            onDelete={onDeletePhoto}
                        />
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
};
