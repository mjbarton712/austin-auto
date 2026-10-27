// car-details.tsx
'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useForm, useFieldArray, useWatch, FormProvider } from 'react-hook-form'
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
import { z } from 'zod'
import { FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormToggle } from "@/components/ui/form-toggle"
import { AlertCircle, FileText } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InvoiceDialog } from './invoice-dialog'
import { InvoicePreviewDialog } from './invoice-preview-dialog'
import { prepareImageForUpload, IMAGE_EXTENSIONS } from '@/lib/image'
import { calculateJobNumbers, formatDateForServer, normalizeDate, sanitizeCarData, cleanNumberFields } from '@/lib/car-form'


const cleanImageUrl = (url: string) => {
  return url.replace(/%0A/g, '');
};

type FormValues = z.infer<typeof combinedSchema>;

const defaultJob: FormValues['jobs'][number] = {
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

const emptyCar = {
  id: undefined,
  make: '',
  model: '',
  owner_name: '',
  year: null,
  color: '',
  license_plate: '',
  engine_type: '',
  transmission_type: '',
  fuel_type: '',
  drive_type: '',
  trim: '',
  oil_type: '',
  vin: '',
};

// Fresh values for a new vehicle (new Date() so intake date is today, not module-load day)
const newEntryValues = (): FormValues => ({
  ...emptyCar,
  jobs: [{ ...defaultJob, intake_date: new Date() }],
});

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
  const { toast } = useToast()
  const [isSubmitSuccessful, setIsSubmitSuccessful] = useState(false)
  const [submittedId, setSubmittedId] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<string[]>([])
  const [isEditMode, setIsEditMode] = useState(!!id)
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false)
  const [isInvoicePreviewOpen, setIsInvoicePreviewOpen] = useState(false)
  const [selectedInvoiceJobs, setSelectedInvoiceJobs] = useState<Job[]>([])

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

  const watchedJobs = useWatch({ control: form.control, name: 'jobs' });

  // Calculate job numbers based on intake dates
  const jobNumberMap = useMemo(() => calculateJobNumbers(watchedJobs || []), [watchedJobs]);

  // Create sorted field indices for display (sorted by intake_date)
  const sortedFieldIndices = useMemo(() => {
    return (watchedJobs || [])
      .map((job, index) => ({ index, intake_date: job.intake_date }))
      .sort((a, b) => {
        const dateA = a.intake_date ? new Date(a.intake_date).getTime() : 0;
        const dateB = b.intake_date ? new Date(b.intake_date).getTime() : 0;
        return dateA - dateB;
      })
      .map(item => item.index);
  }, [watchedJobs]);

  // Fetch cars for dropdown
  const fetchCars = useCallback(async () => {
    if (!user) return
    const { data } = await carService.fetchUserCars(user.id)
    setCars(data || [])
  }, [user])

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) {
          // When there's no id (new car), reset the form to default values
          form.reset(newEntryValues());
          setPhotos([]);
          setPendingUploads([]);
          setIsEditMode(false);
          setIsLoading(false);
          return;
        }

        const { data: carData } = await carService.fetchCar(id)
        const { data: jobsData } = await jobService.fetchCarJobs(id)

        if (carData) {
          form.reset({
            ...carData,
            jobs: jobsData?.map((j: Job) => ({
              ...j,
              intake_date: normalizeDate(j.intake_date) || new Date(),
              completion_date: normalizeDate(j.completion_date)
            })) || []
          })
          setIsEditMode(true);
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

  // Update isEditMode when a car is selected from dropdown
  useEffect(() => {
    const selectedCarId = form.getValues().id;
    setIsEditMode(!!id || (isExistingCar && !!selectedCarId));
  }, [id, isExistingCar, form.getValues().id]);

  // Update processPendingUploads to be more robust
  const processPendingUploads = async (carId: string, jobMap: Map<number, string>) => {
    if (pendingUploads.length === 0) return;
    
    setIsUploading(true);
    try {
      
      // Group uploads by job index
      const successfulUploads: Photo[] = [];
      const failedUploads = new Set<PendingUpload>();
      
      for (const upload of pendingUploads) {
        const jobId = jobMap.get(upload.jobIndex);
        
        if (!jobId) {
          console.error('No job ID found for job index:', upload.jobIndex);
          failedUploads.add(upload);
          continue;
        }
        
        try {
          const photoData = await handleSingleFileUpload(upload.file, jobId, carId);
          if (photoData) {
            successfulUploads.push(photoData);
          }
        } catch (error) {
          console.error(`Error uploading file for job index ${upload.jobIndex}:`, error);
          failedUploads.add(upload);
        }
      }
      
      // Update the photos state with the new uploads
      if (successfulUploads.length > 0) {
        setPhotos(prev => [...prev, ...successfulUploads]);
      }
      
      // Clean up processed uploads, keeping only the failed ones
      if (failedUploads.size > 0) {
        // Only the photos that failed stay queued; the ones that uploaded must not be retried
        setPendingUploads(prev => prev.filter(upload => failedUploads.has(upload)));
        
        toast({
          variant: "destructive",
          title: "Partial Upload",
          description: "Some photos couldn't be uploaded. You can try again later."
        });
      } else {
        // All uploads succeeded
        setPendingUploads([]);
      }
    } catch (error) {
      console.error('Error processing pending uploads:', error);
      toast({
        variant: "destructive",
        title: "Upload Error",
        description: "There was a problem uploading photos."
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Update handleSingleFileUpload to return the created photo data
  const handleSingleFileUpload = async (file: File, jobId: string, carId: string): Promise<Photo | null> => {
    // Check if the jobId is valid
    if (!jobId || jobId === 'undefined') {
      console.error('Invalid job ID for file upload:', jobId);
      throw new Error('Invalid job ID for file upload');
    }
    
    // Shrink to fit the serverless body limit; may re-encode as JPEG
    const upload = await prepareImageForUpload(file);
    const fileExtension = IMAGE_EXTENSIONS[upload.type];
    if (!fileExtension) throw new Error(`"${file.name}" is not a supported image type`);
    const fileName = `${crypto.randomUUID()}.${fileExtension}`;
    
    // Use the job ID as the folder name
    const filePath = `${jobId}/${fileName}`;

    const { error: uploadError } = await mediaService.uploadPhoto(filePath, upload);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    const { data } = await mediaService.getPublicUrl(filePath);
    const publicUrl = cleanImageUrl(data.publicUrl);

    const { data: photoData, error } = await mediaService.createMediaRecord({
      job_id: jobId,
      car_id: carId,
      url: publicUrl,
      filename: fileName
    });

    if (error) {
      throw error;
    }

    return photoData || null;
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      // First get the photo record to get the filename
      const { data: photoData, error: fetchError } = await mediaService.getPhotoRecord(photoId);
      
      if (fetchError) {
        console.error('Error fetching photo record:', fetchError);
        throw fetchError;
      }
      
      if (photoData) {
        // Construct the file path using job_id and filename
        const filePath = `${photoData.job_id}/${photoData.filename}`;
        
        // Delete the file from storage
        const { error: deleteFileError } = await mediaService.deleteFile(filePath);
        
        if (deleteFileError) {
          console.error('Error deleting file from storage:', deleteFileError);
          throw deleteFileError;
        }
      }
      
      // Then delete the database record
      const { error } = await mediaService.deletePhoto(photoId);
      if (error) throw error;
      
      // Update the UI by filtering out the deleted photo
      setPhotos(prev => prev.filter(photo => photo.id !== photoId));
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete photo",
      });
    }
  };

  // Function to handle job removal
  const handleRemoveJob = (index: number) => {
    remove(index)
    
    // If it's a pending upload, remove those as well
    setPendingUploads(prev => prev
      .filter(upload => upload.jobIndex !== index)
      .map(upload => upload.jobIndex > index ? { ...upload, jobIndex: upload.jobIndex - 1 } : upload));
    
    toast({
      title: "Job Removed",
      description: "The job has been removed from the form",
    })
  }

  // Invoice handler functions
  const handleGenerateInvoice = (selectedJobIds: string[]) => {
    const formJobs = form.getValues('jobs') as Job[]
    const jobsToInvoice = formJobs.filter(job => job.id && selectedJobIds.includes(job.id))
    
    if (jobsToInvoice.length === 0) {
      toast({
        variant: "destructive",
        title: "No Jobs Selected",
        description: "Please select at least one job to include in the invoice.",
      })
      return
    }
    
    setSelectedInvoiceJobs(jobsToInvoice)
    setIsInvoiceDialogOpen(false)
    setIsInvoicePreviewOpen(true)
  }

  const handleOpenInvoiceDialog = () => {
    const formJobs = form.getValues('jobs') as Job[]
    const savedJobs = formJobs.filter(job => job.id) // Only show saved jobs
    
    if (savedJobs.length === 0) {
      toast({
        variant: "destructive",
        title: "No Saved Jobs",
        description: "Please save the vehicle and jobs before generating an invoice.",
      })
      return
    }
    
    setIsInvoiceDialogOpen(true)
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

  // Replace the toggle handler
  const handleCarToggle = (value: string) => {
    const newValue = value === "existing";
    
    if (newValue !== isExistingCar) {
      // User is switching modes
      setIsExistingCar(newValue);
      
      if (!newValue) {
        // Switching to "new car" - reset everything
        resetForm();
      }
    }
  };

  // Reset form to empty state
  const resetForm = () => {
    form.reset(newEntryValues());
    setPhotos([]);
    setPendingUploads([]);
    setIsEditMode(false);
  };

  // Load existing car data when selected from dropdown
  const loadExistingCarData = async (carId: string) => {
    if (!carId) return;
    
    setIsLoading(true);
    try {
      const { data: carData } = await carService.fetchCar(carId);
      const { data: jobsData } = await jobService.fetchCarJobs(carId);
      
      if (carData) {
        form.reset({
          ...carData,
          jobs: jobsData?.map((j: Job) => ({
            ...j,
            intake_date: normalizeDate(j.intake_date) || new Date(),
            completion_date: normalizeDate(j.completion_date)
          })) || []
        });
        
        // Also fetch photos for this car
        const { data: photosData } = await mediaService.fetchCarPhotos(carId);
        if (photosData) {
          setPhotos(photosData as Photo[]);
        }
        
        // Set edit mode since we're working with an existing car
        setIsEditMode(true);
      }
    } catch (error) {
      console.error('Failed to load existing car data:', error);
      toast({ 
        variant: "destructive", 
        title: "Loading Error", 
        description: "Failed to load vehicle data" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Modify the onSubmit function to fetch the updated photos after submission
  const onSubmit = async (values: z.infer<typeof combinedSchema>) => {
    setFormErrors([]);
    
    try {
      const { jobs, ...carData } = values;
      const carId = id || values.id;
      let resultCarId = carId;
      
      // Handle car data (create or update)
      if (carId) {
        // Updating existing car - use sanitized data
        const sanitizedCarData = sanitizeCarData({
          ...carData,
          user_id: user?.id
        });
        
        const { error: carError } = await carService.updateCar(carId, sanitizedCarData);
        
        if (carError) throw carError;
      } else {
        // Creating new car - remove the id field entirely
        const newCarData = { ...carData };
        delete newCarData.id;
        
        // Sanitize the data before sending to API
        const sanitizedCarData = sanitizeCarData({
          ...newCarData,
          user_id: user?.id
        });
        
        const { data: newCar, error: carError } = await carService.createCar(sanitizedCarData);
        
        if (carError) throw carError;
        if (newCar && newCar.length > 0) {
          resultCarId = newCar[0].id;
          setSubmittedId(resultCarId || null);
          // Remember the new car so a retry after a later failure updates it instead of creating a duplicate
          form.setValue('id', resultCarId);
        }
      }
      
      // Only proceed if we have a valid car ID
      if (!resultCarId) {
        throw new Error('Failed to create or update the car record');
      }
      
      // Create a job map to track which form index maps to which job ID
      const jobMap = new Map<number, string>();
      
      // Handle jobs data
      for (let i = 0; i < jobs.length; i++) {
        const job = jobs[i];
        const { id: jobId, ...jobData } = job;
        
        // Ensure number fields are properly formatted with our helper
        const cleanedJobData = cleanNumberFields(jobData);
        
        // Prepare common job data with proper date formatting
        const jobPayload = sanitizeCarData({
          ...cleanedJobData,
          car_id: resultCarId,
          user_id: user?.id,
          intake_date: formatDateForServer(job.intake_date),
          completion_date: formatDateForServer(job.completion_date)
        });
        
        if (jobId) {
          // Update existing job
          const { error: jobError } = await jobService.updateJob(jobId, jobPayload);
          if (jobError) throw jobError;
          
          // Store the job ID mapping
          jobMap.set(i, jobId);
        } else {
          // Create new job
          const { data: newJob, error: jobError } = await jobService.createJob(jobPayload);
          if (jobError) throw jobError;
          
          // Use proper type checking for newJob array
          if (newJob && Array.isArray(newJob) && newJob.length > 0) {
            const newJobId = newJob[0].id;
            // Store the job ID mapping
            jobMap.set(i, newJobId);
            form.setValue(`jobs.${i}.id`, newJobId);
          }
        }
      }
      
      // Process all pending uploads after jobs are created
      await processPendingUploads(resultCarId, jobMap);
      
      // Fetch all photos after everything is completed
      const { data: updatedPhotos } = await mediaService.fetchCarPhotos(resultCarId);
      if (updatedPhotos) {
        setPhotos(updatedPhotos as Photo[]);
      }
      
      // Show success state
      setIsSubmitSuccessful(true);
      
      toast({
        title: carId ? "Updated Successfully" : "Created Successfully",
        description: `Vehicle service record has been ${carId ? 'updated' : 'created'}.`
      });
      
    } catch (error) {
      console.error('Submission error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setFormErrors([errorMessage]);
      
      toast({
        variant: "destructive",
        title: "Submission Error",
        description: errorMessage
      });
    }
  };

  // Update handleFileUpload function to fetch photos after direct upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, jobIndex: number) => {
    if (!event.target.files?.length) return;

    const files = Array.from(event.target.files);
    const currentJob = form.getValues().jobs[jobIndex];
    
    // If we're in edit mode and have a job ID
    if (isEditMode && currentJob?.id) {
      setIsUploading(true);
      
      try {
        // Get the current car ID
        const currentCarId = id || form.getValues().id;
        if (!currentCarId) {
          throw new Error('No car ID available');
        }
        
        // Upload each file
        for (const file of files) {
          await handleSingleFileUpload(file, currentJob.id, currentCarId);
        }
        
        // Fetch all photos to ensure we have the latest data
        const { data: latestPhotos } = await mediaService.fetchCarPhotos(currentCarId);
        if (latestPhotos) {
          setPhotos(latestPhotos as Photo[]);
        }
      } catch (error) {
        console.error('Error uploading photos:', error);
        toast({
          variant: "destructive",
          title: "Photo upload failed",
          description: error instanceof Error ? error.message : "Failed to upload photos",
        });
      } finally {
        setIsUploading(false);
      }
    } else {
      // For new cars/jobs, just store the pending uploads
      setPendingUploads(prev => [...prev, ...files.map(file => ({
        file,
        jobIndex
      }))]);
    }
  };

  const invoiceCar: Car = {
    id: id || form.getValues('id') || '',
    make: form.getValues('make'),
    model: form.getValues('model'),
    year: form.getValues('year') || 0,
    owner_name: form.getValues('owner_name'),
    color: form.getValues('color') || undefined,
    license_plate: form.getValues('license_plate') || undefined,
    vin: form.getValues('vin') || undefined,
    user_id: user?.id || '',
  }

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
          {isEditMode ? 'Edit Vehicle & Jobs' : 'New Service Entry'}
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
              onChange={handleCarToggle}
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
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        
                        // When a car is selected, load its data immediately
                        if (value) {
                          loadExistingCarData(value);
                        }
                      }} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-card text-foreground">
                          <SelectValue placeholder="Choose vehicle..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover text-foreground">
                        {cars.map(car => (
                          <SelectItem key={car.id} value={car.id}>
                            {`${car.year} ${car.make} ${car.model} (${car.license_plate || 'No plate'})`}
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
              {sortedFieldIndices.map((originalIndex) => {
                const field = fields[originalIndex];
                return (
                  <JobSection
                    key={field.id}
                    index={originalIndex}
                    jobNumber={jobNumberMap.get(originalIndex) || originalIndex + 1}
                    photos={photos}
                    pendingUploads={pendingUploads}
                    isUploading={isUploading}
                    onFileUpload={handleFileUpload}
                    onDeletePhoto={handleDeletePhoto}
                    onRemoveJob={handleRemoveJob}
                  />
                );
              })}
              <Button
                type="button"
                onClick={() => append(defaultJob)}
                variant="outline"
                className="w-full text-muted-foreground border-dashed border-muted-foreground/50 hover:bg-muted/50"
              >
                Add Job
              </Button>
              
              {/* Invoice Button - only show for existing cars with saved jobs */}
              {isEditMode && fields.some(field => 'id' in field && field.id) && (
                <Button
                  type="button"
                  onClick={handleOpenInvoiceDialog}
                  variant="default"
                  className="w-full"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Invoice
                </Button>
              )}
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
                      className="flex-1 text-foreground"
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
                      className="flex-1 text-foreground"
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
              variant="default"
              disabled={form.formState.isSubmitting}
              className="text-foreground w-full"
            >
              {form.formState.isSubmitting ? (
                <>
                  <span className="animate-spin mr-2 text-foreground">⟳</span>
                  Processing...
                </>
              ) : isEditMode ? 'Save Changes' : 'Create Service Entry'}
            </Button>
          </form>
        </FormProvider>

        {/* Invoice Dialogs */}
        <InvoiceDialog
          open={isInvoiceDialogOpen}
          onOpenChange={setIsInvoiceDialogOpen}
          jobs={(form.getValues('jobs') as Job[]).filter(job => job.id)}
          car={invoiceCar}
          onGenerateInvoice={handleGenerateInvoice}
        />

        <InvoicePreviewDialog
          open={isInvoicePreviewOpen}
          onOpenChange={setIsInvoicePreviewOpen}
          jobs={selectedInvoiceJobs}
          car={invoiceCar}
        />
      </div>
    </div>
  );
}
