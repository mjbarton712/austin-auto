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

  const form = useForm<z.infer<typeof combinedSchema>>({
    resolver: zodResolver(combinedSchema),
    defaultValues: {
      make: '',
      model: '',
      owner_name: '',
      jobs: [defaultJob]
    }
  })

  const { fields, append } = useFieldArray({
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
    try {
      let carId = values.id;
      
      // Extract jobs from values and create a car object without jobs
      const { jobs, ...carData } = values;

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
          const jobMap = await jobService.getLatestJobsForUploads(carId, values.jobs.length);

          // Upload photos with correct job IDs
          for (const { file, jobIndex } of pendingUploads) {
            const actualJobId = jobMap.get(jobIndex);
            if (actualJobId) {
              await handleSingleFileUpload(file, actualJobId);
            }
          }
        } finally {
          setPendingUploads([]);
          setIsUploading(false);
        }
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
      for (const file of files) {
        await handleSingleFileUpload(file, jobIndex.toString());
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

            {error && (
              <div className="text-destructive text-sm">{error}</div>
            )}

            <Button
              type="submit"
              variant="gradient_fullw"
            >
              {id ? 'Save Changes' : 'Create Service Entry'}
            </Button>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}
