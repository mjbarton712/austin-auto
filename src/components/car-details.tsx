'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
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
import { CalendarIcon, CheckCircle2, X } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Header from "@/components/ui/header"
import { createClient } from '@supabase/supabase-js'
import { cn } from "@/lib/utils";
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


const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

// Define the schema for form validation
const formSchema = z.object({
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  color: z.string().optional(),
  mileage: z.number().positive().optional(),
  owner_name: z.string().min(1, "Owner name is required"),
  intake_date: z.date().optional(),
  description: z.string().min(1, "Description is required"),
  license_plate: z.string().optional(),
  engine_type: z.string().optional(),
  transmission_type: z.string().optional(),
  fuel_type: z.string().optional(),
  service_history: z.string().optional(),
  repair_status: z.enum(["in_progress", "completed", "not_started", "cancelled"]),
  parts_ordered: z.string().optional(),
  estimated_completion_date: z.date().optional(),
  cost_to_fix: z.number().nonnegative().optional(),
  amount_charged: z.number().nonnegative().optional(),
  payment_status: z.enum(["unpaid", "partial", "paid"]).optional(),
  trim: z.string().optional(),
  drive_type: z.string().optional(),
  oil_type: z.string().optional(),
  problems_encountered: z.string().optional(),
  photos: z.array(z.object({
    url: z.string(),
    filename: z.string()
  })).optional(),
})

export function CarDetails() {
  const { id } = useParams<{ id: string }>(); // Get uuid from URL parameters
  const navigate = useNavigate();
  const [showSuccessNotification, setShowSuccessNotification] = useState(false)
  const [showDeleteNotification, setShowDeleteNotification] = useState(false)
  
  const [showForm, setShowForm] = useState(true)
  const [pageTitle, setPageTitle] = useState("")
  const [newCarId, setNewCarId] = useState("")
  const [showDeleteButton, setShowDeleteButton] = useState(false)
  const [photos, setPhotos] = useState<Array<{ id: string; url: string }>>([])
  const [isUploading, setIsUploading] = useState(false)
  const [photoToDelete, setPhotoToDelete] = useState<{ id: string; url: string } | null>(null);

  // Initialize the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      make: "",
      model: "",
      color: "",
      owner_name: "",
      intake_date: new Date(),
      description: "",
      license_plate: "",
      engine_type: "",
      transmission_type: "",
      fuel_type: "",
      service_history: "",
      parts_ordered: "",
      cost_to_fix: 0,
      amount_charged: 0,
      payment_status: "unpaid",
    },
  })

  // Fetch car details if uuid exists
  useEffect(() => {
    const fetchCarDetails = async () => {
      if (id) {
        const { data, error } = await supabase
          .from('cars')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error("Error fetching car details:", error)
          return;
        }

        if (data) {
        form.reset({
          ...data,
          intake_date: data.intake_date ? new Date(data.intake_date) : undefined,
          estimated_completion_date: data.estimated_completion_date ? new Date(data.estimated_completion_date) : undefined,
        });

          setPageTitle(`${data.owner_name}'s ${data.make} ${data.model}`);
        setShowDeleteButton(true);
        }
        
        // Fetch photos for this car
        await fetchPhotos();
      } else {
        form.reset({
          make: "",
          model: "",
          color: "",
          owner_name: "",
          intake_date: new Date(),
          description: "",
          license_plate: "",
          engine_type: "",
          transmission_type: "",
          fuel_type: "",
          service_history: "",
          parts_ordered: "",
          cost_to_fix: 0,
          amount_charged: 0,
          payment_status: "unpaid",
        });
  
        setPageTitle("Add New Car");
        setShowDeleteButton(false);
      }
      setShowForm(true);
      setShowSuccessNotification(false);
      setShowDeleteNotification(false);
    };

    fetchCarDetails();
  }, [id, form]);

  // Function to handle form submission
  async function onSubmit(values: z.infer<typeof formSchema>) {
    let newId: string | null = null;
    if (id) {
      // Update existing record
      const { error } = await supabase
        .from('cars')
        .update({
          make: values.make,
          model: values.model,
          year: values.year,
          color: values.color,
          mileage: values.mileage,
          owner_name: values.owner_name,
          intake_date: values.intake_date,
          description: values.description,
          license_plate: values.license_plate,
          engine_type: values.engine_type,
          transmission_type: values.transmission_type,
          fuel_type: values.fuel_type,
          service_history: values.service_history,
          repair_status: values.repair_status,
          parts_ordered: values.parts_ordered,
          estimated_completion_date: values.estimated_completion_date,
          cost_to_fix: values.cost_to_fix,
          amount_charged: values.amount_charged,
          payment_status: values.payment_status,
          trim: values.trim,
          drive_type: values.drive_type,
          oil_type: values.oil_type,
          problems_encountered: values.problems_encountered,
        })
        .eq('id', id);

      if (error) {
        console.error("Error updating data:", error)
        return;
      }
      newId = id;

    } else {
      // Insert new record
      const { data, error } = await supabase
        .from('cars')
        .insert([
          {
            make: values.make,
            model: values.model,
            year: values.year,
            color: values.color,
            mileage: values.mileage,
            owner_name: values.owner_name,
            intake_date: values.intake_date,
            description: values.description,
            license_plate: values.license_plate,
            engine_type: values.engine_type,
            transmission_type: values.transmission_type,
            fuel_type: values.fuel_type,
            service_history: values.service_history,
            repair_status: values.repair_status,
            parts_ordered: values.parts_ordered,
            estimated_completion_date: values.estimated_completion_date,
            cost_to_fix: values.cost_to_fix,
            amount_charged: values.amount_charged,
            payment_status: values.payment_status,
            trim: values.trim,
            drive_type: values.drive_type,
            oil_type: values.oil_type,
            problems_encountered: values.problems_encountered,
          },
        ])
        .select();

      if (error) {
        console.error("Error inserting data:", error)
        return;
      }
      if (data && data.length > 0 && data[0].id) {
        newId = data[0].id;
      } else {
        console.error("No data returned after insert")
        return;
      }
    }

    if (newId) {
      setNewCarId(newId);
    } else {
      console.error("Failed to get a valid ID");
      return;
    }

    setShowSuccessNotification(true)
    setShowDeleteNotification(false)
    setShowForm(false)

    window.scrollTo(0, 0);
  }

  async function deleteRecord() {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('cars')
        .delete()  // Use delete operation instead of select
        .eq('id', id);
        
      if (error) {
        console.error("Error deleting the car record:", error);
        return;
      }
  
      console.log("Deleted record:", data);
  
      // Show success notification
      setShowSuccessNotification(false);
      setShowDeleteNotification(true);
      setShowForm(false);
      console.log("- success - " + showSuccessNotification + " - delete - " + showDeleteNotification)
      // Scroll to the top of the page
      window.scrollTo(0, 0);
  
    } catch (error) {
      console.error("Unexpected error during deletion:", error);
    }
  }
 
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;

    setIsUploading(true);
    const files = Array.from(event.target.files);

    try {
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${id}/${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('car-photos')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('car-photos')
          .getPublicUrl(filePath);

        // Save to photos table
        const { data, error } = await supabase
          .from('photos')
          .insert({
            car_id: id,
            url: publicUrl,
            filename: fileName
          })
          .select();

        if (error) {
          console.error('Database error:', error);
          continue;
        }

        // Add the new photo to the list
        if (data && data[0]) {
          setPhotos(prev => [...prev, { id: data[0].id, url: publicUrl }]);
        }
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePhoto = async (photo: { id: string; url: string }) => {
    setPhotoToDelete(photo);
  };

  // Add this new function for confirming photo deletion
  const confirmDeletePhoto = async () => {
    if (!photoToDelete) return;

    try {
      const { error } = await supabase
        .from('photos')
        .delete()
        .eq('id', photoToDelete.id);

      if (error) throw error;

      // Remove the photo from the UI
      setPhotos(prev => prev.filter(photo => photo.id !== photoToDelete.id));
      
      // Clear the photo to delete
      setPhotoToDelete(null);
    } catch (error) {
      console.error('Error deleting photo:', error);
    }
  };

  // Fetch photos
  const fetchPhotos = async () => {
    if (id) {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('car_id', id)

      if (error) {
        console.error('Error fetching photos:', error)
        return
      }

      setPhotos(data)
    }
  }

  useEffect(() => {
    return () => {
      // Cleanup object URLs when component unmounts
      photos.forEach(photo => {
        if (photo.url.startsWith('blob:')) {
          URL.revokeObjectURL(photo.url);
        }
      });
    };
  }, [photos]);

  function NavigationOptions() {
    return (
      <div className="flex justify-center space-x-4 mt-4">
        <Button onClick={() => navigate('/')} variant="gradient">
          Back to Dashboard
        </Button>
        {showSuccessNotification && (
          <Button 
            onClick={() => {
              navigate(`/car-details/${newCarId || id}`);
              setShowForm(true);  // Show the form when navigating to car details
              setShowSuccessNotification(false);
              setShowDeleteNotification(false);
            }} 
            className="bg-emerald-600 text-white hover:bg-emerald-800"
          >
            View Car Details
          </Button>
        )}
      </div>
    )
  }

  return (
    <div>
      <Header />
      <div className="w-full py-10 bg-gray-900 text-gray-100 min-h-screen" style={{ paddingLeft: '10%', paddingRight: '10%' }}>
        {pageTitle && <h1 className="text-3xl font-bold mb-6">{pageTitle}</h1>}
        {showSuccessNotification && (
          <Alert className="mb-4 bg-emerald-600 text-white">
            <CheckCircle2 color="white" className="h-4 w-4 text-white" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>
              Car details have been successfully saved.
            </AlertDescription>
          </Alert>
        )}
        {showDeleteNotification && (
          <Alert className="mb-4 bg-red-600 text-white">
            <CheckCircle2 color="white" className="h-4 w-4 text-white" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>
              Car has been successfully deleted.
            </AlertDescription>
          </Alert>
        )}
        {!showForm && <NavigationOptions />}
        {showForm && (
          <>
            <h1 className="text-2xl font-bold mb-4">Car Detail Page</h1>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="make"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Make</FormLabel>
                        <FormControl>
                          <Input placeholder="Car make" {...field} className="bg-gray-800 text-white" />
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
                        <FormLabel>Model</FormLabel>
                        <FormControl>
                          <Input placeholder="Car model" {...field} className="bg-gray-800 text-white" />
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
                        <FormLabel>Owner Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Owner name" {...field} className="bg-gray-800 text-white" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Description of repairs needed" {...field} className="bg-gray-800 text-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="intake_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Intake Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  "border-2 border-transparent-light bg-gray-800 text-white",
                                  "hover:bg-gray-700 hover:border-transparent-lighter",
                                  "focus:border-transparent-lighter focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                                  "transition-colors",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                              className="bg-gray-800 text-white border-transparent-light"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="estimated_completion_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Estimated Completion Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  "border-2 border-transparent-light bg-gray-800 text-white",
                                  "hover:bg-gray-700 hover:border-transparent-lighter",
                                  "focus:border-transparent-lighter focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                                  "transition-colors",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                              className="bg-gray-800 text-white border-transparent-light"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="repair_status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Repair Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-gray-800 text-white">
                              <SelectValue placeholder="Select repair status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-gray-800 text-white">
                            <SelectItem value="not_started">Not started</SelectItem>
                            <SelectItem value="in_progress">In progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="cost_to_fix"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cost to Fix</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} className="bg-gray-800 text-white" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="amount_charged"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount Charged</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} className="bg-gray-800 text-white" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="payment_status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-gray-800 text-white">
                              <SelectValue placeholder="Select payment status" />
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} className="bg-gray-800 text-white" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color</FormLabel>
                        <FormControl>
                          <Input placeholder="Car color" {...field} className="bg-gray-800 text-white" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mileage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mileage</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} className="bg-gray-800 text-white" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="license_plate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>License Plate</FormLabel>
                        <FormControl>
                          <Input placeholder="License Plate Number" {...field} className="bg-gray-800 text-white" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="engine_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Engine Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-gray-800 text-white">
                              <SelectValue placeholder="Select engine type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-gray-800 text-white">
                            <SelectItem value="I4">Inline 4 (I4)</SelectItem>
                            <SelectItem value="I6">Inline 6 (I6)</SelectItem>
                            <SelectItem value="V6">V6</SelectItem>
                            <SelectItem value="V8">V8</SelectItem>
                            <SelectItem value="V10">V10</SelectItem>
                            <SelectItem value="V12">V12</SelectItem>
                            <SelectItem value="boxer">Boxer (Flat Engine)</SelectItem>
                            <SelectItem value="rotary">Rotary (Wankel)</SelectItem>
                            <SelectItem value="electric">Electric</SelectItem>
                            <SelectItem value="hybrid">Hybrid</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="transmission_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transmission Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-gray-800 text-white">
                              <SelectValue placeholder="Select transmission type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-gray-800 text-white">
                            <SelectItem value="automatic">Automatic</SelectItem>
                            <SelectItem value="manual">Manual</SelectItem>
                            <SelectItem value="cvt">CVT</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fuel_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fuel Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-gray-800 text-white">
                              <SelectValue placeholder="Select fuel type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-gray-800 text-white">
                            <SelectItem value="gasoline">Gasoline</SelectItem>
                            <SelectItem value="diesel">Diesel</SelectItem>
                            <SelectItem value="electric">Electric</SelectItem>
                            <SelectItem value="hybrid">Hybrid</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="trim"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Trim Level</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-gray-800 text-white">
                              <SelectValue placeholder="Select trim level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-gray-800 text-white">
                            <SelectItem value="base">Base</SelectItem>
                            <SelectItem value="le">LE</SelectItem>
                            <SelectItem value="xle">XLE</SelectItem>
                            <SelectItem value="se">SE</SelectItem>
                            <SelectItem value="xse">XSE</SelectItem>
                            <SelectItem value="limited">Limited</SelectItem>
                            <SelectItem value="sport">Sport</SelectItem>
                            <SelectItem value="touring">Touring</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="drive_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Drive Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-gray-800 text-white">
                              <SelectValue placeholder="Select drive type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-gray-800 text-white">
                            <SelectItem value="fwd">FWD</SelectItem>
                            <SelectItem value="rwd">RWD</SelectItem>
                            <SelectItem value="awd">AWD</SelectItem>
                            <SelectItem value="4wd">4WD</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="oil_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Oil Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-gray-800 text-white">
                              <SelectValue placeholder="Select oil type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-gray-800 text-white">
                            <SelectItem value="0w-20">0W-20</SelectItem>
                            <SelectItem value="5w-20">5W-20</SelectItem>
                            <SelectItem value="5w-30">5W-30</SelectItem>
                            <SelectItem value="10w-30">10W-30</SelectItem>
                            <SelectItem value="15w-40">15W-40</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="problems_encountered"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Problems Encountered</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="List any problems encountered during repairs" 
                          {...field} 
                          className="bg-gray-800 text-white" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Photo Upload Section */}
                <div className="mt-6">
                  <FormLabel>Photos</FormLabel>
                  <div className="mt-2">
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
                    {isUploading && <p className="text-sm text-gray-400 mt-2">Uploading...</p>}
                  </div>
                  {/* Display uploaded photos */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    {photos.map((photo, index) => (
                      <div key={photo.id} className="relative">
                        <img
                          src={photo.url}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-40 object-cover rounded-lg"
                        />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              onClick={() => handleDeletePhoto(photo)}
                              className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 p-1 rounded-full"
                              size="sm"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-gray-800 text-white">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Photo</AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-300">
                                Are you sure you want to delete this photo? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={confirmDeletePhoto}
                                className="bg-red-600 text-white hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ))}
                  </div>
                </div>

                <Button type="submit" variant="gradient">Save Car Details</Button>
                {showDeleteButton && <Button onClick={deleteRecord} className="bg-red-700 text-white mx-4">Delete Car</Button>}
                </form>
            </Form>
          </>
        )}
      </div>
    </div>
  )
}