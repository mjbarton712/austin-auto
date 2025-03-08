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
import { CarIcon, CalendarIcon } from 'lucide-react';
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

type JobSectionProps = {
    index: number;
    photos: Photo[];
    pendingUploads: PendingUpload[];
    isUploading: boolean;
    onFileUpload: (event: React.ChangeEvent<HTMLInputElement>, jobIndex: number) => void;
    onDeletePhoto: (photoId: string) => void;
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
    onDeletePhoto
}: JobSectionProps) => {
    const { control, watch } = useFormContext();
    const description = watch(`jobs.${index}.description`);
    
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

    return (
        <Accordion type="single" defaultValue="job" collapsible>
            <AccordionItem value={`job-${index}`}>
                <AccordionTrigger className="text-white hover:bg-gray-800 px-4 rounded-lg">
                    <div className="flex items-center gap-2">
                        <CarIcon className="h-4 w-4" />
                        <span className="font-semibold">
                            Job #{index + 1} - {truncateDescription(description)}
                        </span>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pt-4">
                    <div className="grid grid-cols-1 gap-4">
                        {/* Basic Job Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={control}
                                name={`jobs.${index}.mileage`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-gray-300 flex items-center gap-2">
                                            <CarIcon className="h-4 w-4" />
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
                                                className="bg-gray-800 text-white"
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
                                        <FormLabel className="text-gray-300 flex items-center gap-2">
                                            <CarIcon className="h-4 w-4" />
                                            Status
                                        </FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-gray-800 text-white">
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-gray-800 text-white">
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
                                    <FormLabel className="text-gray-300 flex items-center gap-2">
                                        <CarIcon className="h-4 w-4" />
                                        Description
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            {...field}
                                            className="bg-gray-800 text-white min-h-[100px]"
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
                                        <FormLabel className="text-gray-300 flex items-center gap-2">
                                            <CarIcon className="h-4 w-4" />
                                            Intake Date
                                        </FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal",
                                                            "bg-gray-800 text-white",
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
                                                    className="bg-gray-800 text-white"
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
                                        <FormLabel className="text-gray-300 flex items-center gap-2">
                                            <CarIcon className="h-4 w-4" />
                                            Completion Date <span className="text-gray-500 text-sm">(optional)</span>
                                        </FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal",
                                                            "bg-gray-800 text-white",
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
                                                    className="bg-gray-800 text-white"
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
                                        <FormLabel className="text-gray-300 flex items-center gap-2">
                                            <CarIcon className="h-4 w-4" />
                                            Cost to Fix <span className="text-gray-500 text-sm">(optional)</span>
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
                                                className="bg-gray-800 text-white"
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
                                        <FormLabel className="text-gray-300 flex items-center gap-2">
                                            <CarIcon className="h-4 w-4" />
                                            Amount Charged <span className="text-gray-500 text-sm">(optional)</span>
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
                                                className="bg-gray-800 text-white"
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
                                        <FormLabel className="text-gray-300 flex items-center gap-2">
                                            <CarIcon className="h-4 w-4" />
                                            Payment Status <span className="text-gray-500 text-sm">(optional)</span>
                                        </FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || "unpaid"}>
                                            <FormControl>
                                                <SelectTrigger className="bg-gray-800 text-white">
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-gray-800 text-white">
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
                                        <FormLabel className="text-gray-300 flex items-center gap-2">
                                            <CarIcon className="h-4 w-4" />
                                            Engine Code <span className="text-gray-500 text-sm">(optional)</span>
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                className="bg-gray-800 text-white"
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
                                        <FormLabel className="text-gray-300 flex items-center gap-2">
                                            <CarIcon className="h-4 w-4" />
                                            Hours Spent <span className="text-gray-500 text-sm">(optional)</span>
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
                                                className="bg-gray-800 text-white"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormItem>
                                <FormLabel className="text-gray-300 flex items-center gap-2">
                                    <CarIcon className="h-4 w-4" />
                                    Hourly Rate
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        type="text"
                                        value={hourlyRate ? `$${hourlyRate}` : 'Insufficient data'}
                                        readOnly
                                        className="bg-gray-700 text-white cursor-not-allowed"
                                    />
                                </FormControl>
                                {!hourlyRate && (
                                    <p className="text-sm text-gray-400">
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
                                        <FormLabel className="text-gray-300 flex items-center gap-2">
                                            <CarIcon className="h-4 w-4" />
                                            Problems Encountered <span className="text-gray-500 text-sm">(optional)</span>
                                        </FormLabel>
                                        <FormControl>
                                            <Textarea
                                                {...field}
                                                className="bg-gray-800 text-white min-h-[100px]"
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
                                        <FormLabel className="text-gray-300 flex items-center gap-2">
                                            <CarIcon className="h-4 w-4" />
                                            Parts Ordered <span className="text-gray-500 text-sm">(optional)</span>
                                        </FormLabel>
                                        <FormControl>
                                            <Textarea
                                                {...field}
                                                className="bg-gray-800 text-white min-h-[100px]"
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
