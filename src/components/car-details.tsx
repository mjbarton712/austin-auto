'use client'
import { useState, useEffect, useCallback } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon, X, Car as CarIcon, User } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Header from "@/components/ui/header"
import { cn } from "@/lib/utils"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { Car } from '@/types'
import { AlertCircle } from 'lucide-react'
import { useToast } from "@/components/ui/use-toast"
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

const carFormSchema = z.object({
  id: z.string().optional(),
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.number().int().min(1900),
  owner_name: z.string().min(1, "Owner name is required"),
  trim: z.string().optional(),
  drive_type: z.string().optional(),
  fuel_type: z.string().optional(),
  color: z.string().optional(),
  license_plate: z.string().optional(),
  engine_type: z.string().optional(),
  transmission_type: z.string().optional(),
  oil_type: z.string().optional(),
  vin: z.string().optional(),
})

const jobFormSchema = z.object({
  jobs: z.array(z.object({
    id: z.string().optional(),
    mileage: z.number().positive(),
    description: z.string().min(1, "Description is required"),
    status: z.enum(["not_started", "in_progress", "completed", "cancelled"]),
    intake_date: z.date(),
    payment_status: z.enum(["unpaid", "partial", "paid"]).optional(),
    problems_encountered: z.string().optional(),
    parts_ordered: z.string().optional(),
    completion_date: z.date().optional(),
    cost_to_fix: z.number().optional(),
    amount_charged: z.number().optional(),
    hours_spent: z.number().optional(),
    hourly_wage: z.number().optional(),
    engine_code: z.string().optional(),
  }))
})

const combinedSchema = carFormSchema.merge(jobFormSchema)

// Add these new types for photo handling
type Photo = {
  id: string;
  url: string;
  filename: string;
};

type PendingUpload = {
  file: File;
};

// Add these helper functions
const cleanImageUrl = (url: string) => {
  return url.replace(/%0A/g, '');
};

export default function CarDetails() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isExistingCar, setIsExistingCar] = useState(false)
  const [cars, setCars] = useState<Car[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([])
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const [jobToDelete, setJobToDelete] = useState<number | null>(null)

  const form = useForm<z.infer<typeof combinedSchema>>({
    resolver: zodResolver(combinedSchema),
    defaultValues: {
      make: '',
      model: '',
      year: new Date().getFullYear(),
      owner_name: '',
      jobs: [{
        mileage: 0,
        description: '',
        status: 'not_started',
        intake_date: new Date(),
        payment_status: 'unpaid'
      }]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'jobs'
  })

  // Fetch cars for dropdown
  const fetchCars = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('cars_new')
      .select('*')
      .eq('user_id', user.id)
    setCars(data || [])
    setIsExistingCar(data?.length ? true : false)
  }, [user])

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setIsLoading(false)
        return
      }

      // Fetch car with jobs
      const { data: carData } = await supabase
        .from('cars_new')
        .select('*')
        .eq('id', id)
        .single()

      const { data: jobsData } = await supabase
        .from('jobs')
        .select('*')
        .eq('car_id', id)

      if (carData) {
        form.reset({
          ...carData,
          jobs: jobsData?.map(j => ({
            ...j,
            intake_date: new Date(j.intake_date),
            completion_date: j.completion_date ? new Date(j.completion_date) : undefined
          })) || []
        })
      }
      setIsLoading(false)
    }

    fetchData()
    fetchCars()
  }, [id, form, fetchCars])

  // Add this to your useEffect for fetching initial data
  const fetchPhotos = useCallback(async () => {
    if (!id) return;
    
    const { data, error } = await supabase
      .from('photos')
      .select('id, url, filename')
      .eq('car_id', id);

    if (error) {
      console.error('Error fetching photos:', error);
      return;
    }

    if (data) {
      setPhotos(data);
    }
  }, [id]);

  useEffect(() => {
    fetchPhotos();
  }, [id, fetchPhotos]);

  const onSubmit = async (values: z.infer<typeof combinedSchema>) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "You must be logged in to perform this action",
      })
      return
    }

    setError(null)
    try {
      // Save/update car
      const carOperation = values.id 
        ? supabase.from('cars_new').update(values).eq('id', values.id)
        : supabase.from('cars_new').insert([{ ...values, user_id: user.id }]).select()

      const { data: carData, error: carError } = await carOperation
      if (carError) throw carError

      const carId = values.id || carData?.[0]?.id
      if (!carId) throw new Error('No car ID')

      // Process jobs
      const jobsOperations = values.jobs.map(job => ({
        ...job,
        car_id: carId,
        user_id: user.id,
        intake_date: format(job.intake_date, 'yyyy-MM-dd'),
        completion_date: job.completion_date ? format(job.completion_date, 'yyyy-MM-dd') : null
      }))

      const { error: jobsError } = await supabase.from('jobs').upsert(jobsOperations)
      if (jobsError) throw jobsError

      // Handle pending photo uploads for new cars
      if (!values.id && pendingUploads.length > 0) {
        setIsUploading(true)
        for (const { file } of pendingUploads) {
          await handleSingleFileUpload(file, carId)
        }
        setPendingUploads([])
        setIsUploading(false)
      }

      toast({
        title: "Success!",
        description: values.id ? "Changes saved successfully" : "New service entry created",
      })

      if (!id) navigate(`/car-details/${carId}`)
    } catch (error) {
      console.error('Submission error:', error)
      setError(error instanceof Error ? error.message : 'An unexpected error occurred')
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      })
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;
    
    const files = Array.from(event.target.files);
    
    if (!id) {
      // For new cars, store files for later upload
      setPendingUploads(prev => [...prev, ...files.map(file => ({ file }))]);
      return;
    }

    setIsUploading(true);

    try {
      for (const file of files) {
        await handleSingleFileUpload(file, id);
      }
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload photos",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSingleFileUpload = async (file: File, carId: string) => {
    const fileName = `${Date.now()}-${Math.random()}.${file.name.split('.').pop()}`;
    const filePath = `${carId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('car-photos')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('car-photos')
      .getPublicUrl(filePath);

    const publicUrl = cleanImageUrl(data.publicUrl);

    const { data: photoData, error } = await supabase
      .from('photos')
      .insert({
        car_id: carId,
        url: publicUrl,
        filename: fileName
      })
      .select('id, url, filename')
      .single();

    if (error) {
      throw error;
    }

    if (photoData) {
      setPhotos(prev => [...prev, photoData]);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      const { error } = await supabase
        .from('photos')
        .delete()
        .eq('id', photoId);

      if (error) throw error;

      setPhotos(prev => prev.filter(photo => photo.id !== photoId));
    } catch (error) {
      console.error('Error deleting photo:', error);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="space-y-4 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
        <p className="text-white">Loading...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      <div className="p-4 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">
          {id ? 'Edit Vehicle & Jobs' : 'New Service Entry'}
        </h1>

        {/* Car Selection Toggle */}
        {!id && (
          <div className="flex gap-4 mb-8">
            <Button
              variant={isExistingCar ? 'outline' : 'default'}
              onClick={() => setIsExistingCar(false)}
            >
              New Vehicle
            </Button>
            <Button
              variant={isExistingCar ? 'default' : 'outline'}
              onClick={() => setIsExistingCar(true)}
              disabled={!cars.length}
            >
              Existing Vehicle
            </Button>
          </div>
        )}

        {/* Existing Car Selector */}
        {!id && isExistingCar && (
          <FormField
            control={form.control}
            name="id"
            render={({ field }) => (
              <FormItem className="mb-6">
                <FormLabel className="text-white">Select Vehicle</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-gray-800 text-white">
                      <SelectValue placeholder="Choose vehicle..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-gray-800 text-white">
                    {cars.map(car => (
                      <SelectItem key={car.id} value={car.id}>
                        {`${car.year} ${car.make} ${car.model} (${car.license_plate})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Car Details Accordion */}
            <Accordion type="single" defaultValue="car" collapsible>
              <AccordionItem value="car">
                <AccordionTrigger className="text-white hover:bg-gray-800 px-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CarIcon className="h-4 w-4" />
                    <span className="font-semibold">
                      {id ? 'Vehicle Details' : 'Vehicle Information'}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="make"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300 flex items-center gap-2">
                            <CarIcon className="h-4 w-4" />
                            Make
                          </FormLabel>
                          <FormControl>
                            <Input {...field} className="bg-gray-800 text-white" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="model"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300 flex items-center gap-2">
                            <CarIcon className="h-4 w-4" />
                            Model
                          </FormLabel>
                          <FormControl>
                            <Input {...field} className="bg-gray-800 text-white" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="year"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300 flex items-center gap-2">
                            <CarIcon className="h-4 w-4" />
                            Year
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={e => field.onChange(Number(e.target.value))}
                              className="bg-gray-800 text-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="owner_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300 flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Owner
                          </FormLabel>
                          <FormControl>
                            <Input {...field} className="bg-gray-800 text-white" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Photos Accordion */}
            <Accordion type="single" collapsible className="mb-6">
              <AccordionItem value="photos">
                <AccordionTrigger className="text-white hover:bg-gray-800 px-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CarIcon className="h-4 w-4" />
                    <span className="font-semibold">Photos</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pt-4">
                  <div className="space-y-4">
                    <Input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      className={cn(
                        "bg-gray-800 text-white h-auto py-2",
                        "file:text-white file:bg-gray-700 file:border-0 file:px-4 file:py-2 file:mr-4 file:hover:bg-gray-600 file:cursor-pointer",
                        isUploading && "opacity-50 cursor-not-allowed"
                      )}
                    />
                    {isUploading && (
                      <div className="text-sm text-gray-400">Uploading...</div>
                    )}
                    
                    {/* Pending uploads for new cars */}
                    {!id && pendingUploads.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-400">Pending uploads:</p>
                        <ul className="list-disc pl-5 mt-2">
                          {pendingUploads.map((upload, index) => (
                            <li key={index} className="text-gray-400">{upload.file.name}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Photo grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {photos.map((photo, index) => (
                        <div key={photo.id} className="relative group">
                          <div 
                            className="aspect-square overflow-hidden rounded-lg bg-gray-800"
                          >
                            <img
                              src={photo.url}
                              alt={`Car photo ${index + 1}`}
                              className="h-full w-full object-cover transition-all hover:scale-105"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDeletePhoto(photo.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Jobs Section */}
            <div className="space-y-4">
              {fields.map((field, index) => (
                <Accordion key={field.id} type="single" collapsible>
                  <AccordionItem value={`job-${index}`}>
                    <AccordionTrigger className="text-white hover:bg-gray-800 px-4 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CarIcon className="h-4 w-4" />
                        <span className="font-semibold">
                          Job #{index + 1} - {form.watch(`jobs.${index}.description`) || 'New Job'}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pt-4">
                      <div className="grid grid-cols-1 gap-4">
                        {/* Basic Job Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
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
                                    onChange={e => field.onChange(Number(e.target.value))}
                                    className="bg-gray-800 text-white"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
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
                          control={form.control}
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
                            control={form.control}
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
                            control={form.control}
                            name={`jobs.${index}.completion_date`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-300 flex items-center gap-2">
                                  <CarIcon className="h-4 w-4" />
                                  Completion Date
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
                            control={form.control}
                            name={`jobs.${index}.cost_to_fix`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-300 flex items-center gap-2">
                                  <CarIcon className="h-4 w-4" />
                                  Cost to Fix
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    {...field}
                                    onChange={e => field.onChange(Number(e.target.value))}
                                    className="bg-gray-800 text-white"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`jobs.${index}.amount_charged`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-300 flex items-center gap-2">
                                  <CarIcon className="h-4 w-4" />
                                  Amount Charged
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    {...field}
                                    onChange={e => field.onChange(Number(e.target.value))}
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
                            control={form.control}
                            name={`jobs.${index}.payment_status`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-300 flex items-center gap-2">
                                  <CarIcon className="h-4 w-4" />
                                  Payment Status
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
                            control={form.control}
                            name={`jobs.${index}.engine_code`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-300 flex items-center gap-2">
                                  <CarIcon className="h-4 w-4" />
                                  Engine Code
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
                            control={form.control}
                            name={`jobs.${index}.hours_spent`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-300 flex items-center gap-2">
                                  <CarIcon className="h-4 w-4" />
                                  Hours Spent
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.5"
                                    {...field}
                                    onChange={e => field.onChange(Number(e.target.value))}
                                    className="bg-gray-800 text-white"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`jobs.${index}.hourly_wage`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-300 flex items-center gap-2">
                                  <CarIcon className="h-4 w-4" />
                                  Hourly Rate
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    {...field}
                                    onChange={e => field.onChange(Number(e.target.value))}
                                    className="bg-gray-800 text-white"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Notes Fields */}
                        <div className="grid grid-cols-1 gap-4">
                          <FormField
                            control={form.control}
                            name={`jobs.${index}.problems_encountered`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-300 flex items-center gap-2">
                                  <CarIcon className="h-4 w-4" />
                                  Problems Encountered
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
                            control={form.control}
                            name={`jobs.${index}.parts_ordered`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-300 flex items-center gap-2">
                                  <CarIcon className="h-4 w-4" />
                                  Parts Ordered
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

                        {/* Delete Job Button */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              type="button"
                              variant="destructive"
                              onClick={() => setJobToDelete(index)}
                              className="mt-2"
                            >
                              Delete Job
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-gray-800 text-white">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Job</AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-300">
                                Are you sure you want to delete this job? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel 
                                onClick={() => setJobToDelete(null)}
                                className="bg-gray-700 text-white hover:bg-gray-600"
                              >
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => {
                                  if (jobToDelete !== null) {
                                    remove(jobToDelete)
                                    setJobToDelete(null)
                                  }
                                }}
                                className="bg-red-600 text-white hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ))}

              <Button
                type="button"
                variant="outline"
                className="text-white"
                onClick={() => append({
                  mileage: 0,
                  description: '',
                  status: 'not_started',
                  intake_date: new Date(),
                  payment_status: 'unpaid'
                })}
              >
                Add Job
              </Button>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {id ? 'Save Changes' : 'Create Service Entry'}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}