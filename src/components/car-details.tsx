// car-details.tsx
'use client'
import { useState, useEffect, useCallback } from 'react'
import { useForm, useFieldArray, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import Header from "@/components/ui/header"
import { useAuth } from '@/contexts/auth-context'
import { carService, jobService, mediaService } from './supabase-client'
import { useToast } from "@/components/ui/use-toast"
import { CarFormSection } from './car-form-section'
import { JobSection } from './job-section'
import { combinedSchema } from './schema'
import { Car, Job, Photo, PendingUpload } from '@/types'
import { format } from 'date-fns'
import { z } from 'zod'
import { FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormToggle } from "@/components/ui/form-toggle"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"


const cleanImageUrl = (url: string) => {
  return url.replace(/%0A/g, '');
};

const defaultJob: z.infer<typeof combinedSchema>['jobs'][number] = {
  mileage: 0,
  description: '',
  status: 'not_started',
  intake_date: new Date(),
  payment_status: 'unpaid',
  problems_encountered: '',
  parts_ordered: '',
  completion_date: undefined,
  engine_code: '',
  cost_to_fix: 0,
  amount_charged: 0,
  hours_spent: 0,
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
  const [isSubmitSuccessful, setIsSubmitSuccessful] = useState(false)
  const [submittedId, setSubmittedId] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<string[]>([])

  const form = useForm<z.infer<typeof combinedSchema>>({
    resolver: zodResolver(combinedSchema),
    defaultValues: {
      make: '',
      model: '',
      owner_name: '',
      jobs: [defaultJob]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'jobs'
  })

  // Fetch cars for dropdown
  const fetchCars = useCallback(async () => {
    if (!user) return
    const { data } = await carService.fetchUserCars(user.id)
    setCars(data || [])
    setIsExistingCar(data?.length ? false : true)
  }, [user])

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) {
          setIsLoading(false)
          return
        }

        const { data: carData } = await carService.fetchCar(id)
        const { data: jobsData } = await jobService.fetchCarJobs(id)

        if (carData) {
          form.reset({
            ...carData,
            jobs: jobsData?.map((j: Job) => ({
              ...j,
              intake_date: new Date(j.intake_date),
              completion_date: j.completion_date ? new Date(j.completion_date) : undefined
            })) || []
          })
        }
        setIsLoading(false)
      } catch (error) {
        console.error('Failed to load data:', error);
        toast({ variant: "destructive", title: "Loading Error", description: "Failed to load vehicle data" });
        setIsLoading(false);
      }
    }

    fetchData()
    fetchCars()

  }, [id, form, fetchCars, toast])

  // Reset form state when switching between new and existing vehicles
  useEffect(() => {
    if (!isExistingCar) {
      form.reset({
        make: '',
        model: '',
        owner_name: '',
        jobs: [{
          mileage: 0,
          description: '',
          status: 'not_started',
          intake_date: new Date(),
          payment_status: 'unpaid'
        }]
      })
    }
  }, [isExistingCar, form])

  // Fix the type mismatch in setPhotos
  const fetchPhotos = useCallback(async () => {
    if (!id) return;

    const { data, error } = await mediaService.fetchCarPhotos(id);

    if (error) {
      console.error('Error fetching media:', error);
      return;
    }

    if (data) {
      setPhotos(data as Photo[]);
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
    console.log("Submitting attempt. Error should be null: ", error)
    setFormErrors([])
    setIsSubmitSuccessful(false)
    
    try {
      let carId = values.id;
      
      // Extract jobs from values and handle null values
      const { jobs, ...carDataWithNull } = values;
      
      // Convert null to undefined where needed
      const carData = Object.fromEntries(
        Object.entries(carDataWithNull).map(([key, value]) => 
          [key, value === null ? undefined : value]
        )
      );

      if (!carId) {
        const { data: newCarData, error: carError } = await carService.createCar({
          ...carData,
          user_id: user.id
        })

        if (carError) throw carError
        carId = newCarData?.[0]?.id
      } else {
        const { error: carError } = await carService.updateCar(carId, carData)
        if (carError) throw carError
      }

      if (!carId) throw new Error('No car ID')

      // Process jobs
      for (const job of jobs) {
        const jobData = {
          ...job,
          intake_date: format(job.intake_date, 'yyyy-MM-dd'),
          completion_date: job.completion_date ? format(job.completion_date, 'yyyy-MM-dd') : null,
        }

        if (job.id) {
          const { error: jobError } = await jobService.updateJob(job.id, jobData)
          if (jobError) throw jobError
        } else {
          const { error: jobError } = await jobService.createJob({
            ...jobData,
            car_id: carId,
            user_id: user.id,
          })
          if (jobError) throw jobError
        }
      }

      // Handle pending photo uploads
      if (pendingUploads.length > 0) {
        setIsUploading(true);
        try {
          // First, get the latest job IDs after creating them
          const { data: jobsData } = await jobService.fetchCarJobs(carId);
          
          if (!jobsData || jobsData.length === 0) {
            throw new Error('Failed to fetch job IDs for uploads');
          }
          
          // Create a map of job indices to job IDs
          const jobMap = new Map();
          jobs.forEach((job, idx) => {
            // Find the matching job in returned data
            const matchingJob = jobsData.find(j => 
              // If the job has a description, match on that
              (job.description && j.description === job.description) ||
              // Otherwise match on intake_date and other fields
              (format(job.intake_date, 'yyyy-MM-dd') === j.intake_date)
            );
            if (matchingJob) {
              jobMap.set(idx, matchingJob.id);
            }
          });

          // Upload photos with correct job IDs
          for (const { file, jobIndex } of pendingUploads) {
            const actualJobId = jobMap.get(jobIndex);
            if (actualJobId) {
              await handleSingleFileUpload(file, actualJobId);
            } else {
              console.error('Could not find job ID for index', jobIndex);
            }
          }
        } catch (error) {
          console.error('Error processing pending uploads:', error);
          toast({
            variant: "destructive",
            title: "Warning",
            description: "Some photos could not be uploaded. You can try again after saving.",
          });
        } finally {
          setPendingUploads([]);
          setIsUploading(false);
        }
      }

      // Set success state
      setIsSubmitSuccessful(true)
      setSubmittedId(carId)
      
      toast({
        title: "Success!",
        description: values.id ? "Changes saved successfully" : "New service entry created",
      })

      // Don't navigate automatically - let user choose with buttons
    } catch (error) {
      console.error('Submission error:', error)
      
      // Format and display error messages
      if (error instanceof Error) {
        setError(error.message)
        setFormErrors([error.message])
      } else if (typeof error === 'object' && error !== null) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errorObj = error as any
        if (errorObj.errors) {
          setFormErrors(Array.isArray(errorObj.errors) 
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ? errorObj.errors.map((e: any) => e.message || String(e))
            : [String(errorObj.errors)]
          )
        }
      } else {
        setError('An unexpected error occurred')
        setFormErrors(['An unexpected error occurred'])
      }
      
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      })
      
      // Scroll to the error section
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, jobIndex: number) => {
    if (!event.target.files?.length) return;

    const files = Array.from(event.target.files);

    if (!id) {
      // Store files with their associated job index
      setPendingUploads(prev => [...prev, ...files.map(file => ({
        file,
        jobIndex
      }))]);
      return;
    }

    setIsUploading(true);

    try {
      // Get the actual job ID from the form
      const jobId = form.getValues().jobs[jobIndex]?.id;
      
      if (!jobId) {
        throw new Error('Job ID is not available. Please save the job first.');
      }

      for (const file of files) {
        await handleSingleFileUpload(file, jobId);
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

  const handleSingleFileUpload = async (file: File, jobId: string) => {
    const fileName = `${Date.now()}-${Math.random()}.${file.name.split('.').pop()}`;
    const filePath = `${jobId}/${fileName}`;

    const { error: uploadError } = await mediaService.uploadPhoto(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = await mediaService.getPublicUrl(filePath);
    const publicUrl = cleanImageUrl(data.publicUrl);

    const { data: photoData, error } = await mediaService.createMediaRecord({
      job_id: jobId,
      car_id: id,
      url: publicUrl,
      filename: fileName
    });

    if (error) {
      throw error;
    }

    if (photoData) {
      setPhotos(prev => [...prev, photoData]);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      const { error } = await mediaService.deletePhoto(photoId);
      if (error) throw error;
      setPhotos(prev => prev.filter(photo => photo.id !== photoId));
    } catch (error) {
      console.error('Error deleting photo:', error);
    }
  };

  // Function to handle job removal
  const handleRemoveJob = (index: number) => {
    remove(index)
    
    // If it's a pending upload, remove those as well
    setPendingUploads(prev => prev.filter(upload => upload.jobIndex !== index));
    
    toast({
      title: "Job Removed",
      description: "The job has been removed from the form",
    })
  }

  // Replace the subscribe useEffect with this version
  useEffect(() => {
    // Check for errors after submission
    if (form.formState.submitCount > 0 && 
        !form.formState.isSubmitting && 
        !form.formState.isSubmitSuccessful && 
        Object.keys(form.formState.errors).length > 0) {
      
      const errorMessages: string[] = []
      
      Object.entries(form.formState.errors).forEach(([field, error]) => {
        if (error && typeof error === 'object' && 'message' in error) {
          errorMessages.push(`${field}: ${error.message}`)
        }
      })
      
      if (errorMessages.length > 0) {
        setFormErrors(errorMessages)
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
      }
    }
  }, [form.formState.submitCount, form.formState.isSubmitting, form.formState.isSubmitSuccessful, form.formState.errors])

  if (isLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="space-y-4 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        <p className="text-foreground">Loading...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="p-4 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-6">
          {id ? 'Edit Vehicle & Jobs' : 'New Service Entry'}
        </h1>

        {/* Car Selection Toggle */}
        {!id && (
          <div className="mb-8">
            <FormToggle
              options={[
                { value: "new", label: "New Vehicle" },
                { value: "existing", label: "Existing Vehicle", disabled: !cars.length }
              ]}
              value={isExistingCar ? "existing" : "new"}
              onChange={(value) => setIsExistingCar(value === "existing")}
            />
          </div>
        )}

        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Existing Car Selector */}
            {!id && isExistingCar && (
              <FormField
                control={form.control}
                name="id"
                render={({ field }) => (
                  <FormItem className="mb-6">
                    <FormLabel className="text-foreground">Select Vehicle</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-card text-foreground">
                          <SelectValue placeholder="Choose vehicle..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover text-foreground">
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
            <div className="space-y-4">
              <CarFormSection />
            </div>
            <div className="space-y-4">
              {fields.map((field, index) => (
                <JobSection
                  key={field.id}
                  index={index}
                  photos={photos}
                  pendingUploads={pendingUploads}
                  isUploading={isUploading}
                  onFileUpload={handleFileUpload}
                  onDeletePhoto={handleDeletePhoto}
                  onRemoveJob={handleRemoveJob}
                />
              ))}
              <Button
                type="button"
                onClick={() => append(defaultJob)}
                className="w-full"
              >
                Add Job
              </Button>
            </div>

            {/* Success message with navigation options */}
            {isSubmitSuccessful && (
              <div className="rounded-lg border bg-card p-4 shadow-sm mb-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <div className="rounded-full bg-green-500/20 p-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5 text-green-500"
                      >
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                    </div>
                    <div className="font-medium">Changes saved successfully!</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() => navigate('/')}
                      className="flex-1"
                    >
                      Return to Dashboard
                    </Button>
                    <Button
                      onClick={() => {
                        setIsSubmitSuccessful(false)
                        if (submittedId && !id) {
                          navigate(`/car-details/${submittedId}`)
                        }
                      }}
                      className="flex-1"
                    >
                      Continue Editing
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Form errors */}
            {formErrors.length > 0 && !isSubmitSuccessful && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-5 mt-2">
                    {formErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              variant="gradient_fullw"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <>
                  <span className="animate-spin mr-2">⟳</span>
                  Processing...
                </>
              ) : id ? 'Save Changes' : 'Create Service Entry'}
            </Button>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}
