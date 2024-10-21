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
import { CalendarIcon, CheckCircle2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Header from "@/components/ui/header"
import { createClient } from '@supabase/supabase-js'
import { cn } from "@/lib/utils";


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
})

export function CarDetails() {
  const { id } = useParams<{ id: string }>(); // Get uuid from URL parameters
  const navigate = useNavigate();
  const [showSuccessNotification, setShowSuccessNotification] = useState(false)
  const [showForm, setShowForm] = useState(true)
  const [pageTitle, setPageTitle] = useState("")
  const [newCarId, setNewCarId] = useState("")

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
        console.log(data);
        if (error) {
          console.error("Error fetching car details:", error)
          return;
        }
        // Populate form with fetched data
        form.reset({
          ...data,
          //intake_date: new Date(data.intake_date),
          //estimated_completion_date: data.estimated_completion_date ? new Date(data.estimated_completion_date) : undefined,
        });

        // Set the page title
        //const intakeDate = new Date(data.intake_date);
        setPageTitle(`${data.owner_name}'s ${data.make} ${data.model}`);// - ${format(intakeDate, 'MMMM yyyy')}`);
      } else {
        // Reset form when no id is present (for adding a new car)
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
      }
      setShowForm(true);
      setShowSuccessNotification(false);
    }

    fetchCarDetails();
  }, [id, form]);

  // Function to handle form submission
  async function onSubmit(values: z.infer<typeof formSchema>) {
    let newId: string | null = null;
    if (id) {
      // Update existing record
      const { error } = await supabase
        .from('cars') // Name of Supabase table
        .update({ // eventually TODO i can just make this .update(values)
          make: values.make,
          model: values.model,
          // year: values.year,
          // color: values.color,
          // mileage: values.mileage,
          owner_name: values.owner_name,
          description: values.description,
          repair_status: values.repair_status,
          // Include other fields as necessary
        })
        .eq('id', id); // Ensure you update the correct car

      if (error) {
        console.error("Error updating data:", error)
        return; // Optionally show an error notification
      }
      newId = id;

    } else {
      // Insert new record
      const { data, error } = await supabase
        .from('cars')
        .insert([ // eventually TODO this can just be .insert([values])
          {
            make: values.make,
            model: values.model,
            // year: values.year,
            // color: values.color,
            // mileage: values.mileage,
            owner_name: values.owner_name,
            description: values.description,
            repair_status: values.repair_status,
            // TODO add more values
          },
        ])
        .select()

      if (error) {
        console.error("Error inserting data:", error)
        return; // TODO Optionally show an error notification
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
    setShowForm(false)

    window.scrollTo(0, 0);
    // Hide notification after 10 seconds
    //setTimeout(() => {
    //  setShowSuccessNotification(false)
    //}, 10000)
  }

  function NavigationOptions() {
    return (
      <div className="flex justify-center space-x-4 mt-4">
        <Button onClick={() => navigate('/')} className="bg-blue-600 text-white hover:bg-blue-800">
          Back to Dashboard
        </Button>
        <Button 
          onClick={() => {
            navigate(`/car-details/${newCarId || id}`);
            setShowForm(true);  // Show the form when navigating to car details
            setShowSuccessNotification(false);
          }} 
          className="bg-green-600 text-white hover:bg-green-800"
        >
          View Car Details
        </Button>
      </div>
    )
  }

  return (
    <div>
      <Header />
      <div className="w-full py-10 bg-gray-900 text-gray-100 min-h-screen" style={{ paddingLeft: '10%', paddingRight: '10%' }}>
        {pageTitle && <h1 className="text-3xl font-bold mb-6">{pageTitle}</h1>}
        {showSuccessNotification && (
          <Alert className="mb-4 bg-green-600 text-white">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>
              Car details have been successfully saved.
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="service_history"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service History</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Previous service history" {...field} className="bg-gray-800 text-white" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="parts_ordered"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parts Ordered</FormLabel>
                        <FormControl>
                          <Textarea placeholder="List of parts ordered" {...field} className="bg-gray-800 text-white" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" variant="gradient">Save Car Details</Button>
                </form>
            </Form>
          </>
        )}
      </div>
    </div>
  )
}