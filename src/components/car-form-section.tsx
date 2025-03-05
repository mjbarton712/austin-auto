// car-form-section.tsx
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CarIcon, User } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from "@/components/ui/accordion";

export const CarFormSection = () => {
    const { control } = useFormContext();

    return (
        <Accordion type="single" defaultValue="car" collapsible>
            <AccordionItem value="car">
                <AccordionTrigger className="text-white hover:bg-gray-800 px-4 rounded-lg">
                    <div className="flex items-center gap-2">
                        <CarIcon className="h-4 w-4" />
                        <span className="font-semibold">Vehicle Information</span>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={control}
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
                            control={control}
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
                            control={control}
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
                            control={control}
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

                        {/* Optional fields */}
                        <FormField
                            control={control}
                            name="color"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-gray-300 flex items-center gap-2">
                                        <CarIcon className="h-4 w-4" />
                                        Color <span className="text-gray-500 text-sm">(optional)</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Input {...field} className="bg-gray-800 text-white" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={control}
                            name="license_plate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-gray-300 flex items-center gap-2">
                                        <CarIcon className="h-4 w-4" />
                                        License Plate <span className="text-gray-500 text-sm">(optional)</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Input {...field} className="bg-gray-800 text-white" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={control}
                            name="engine_type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-gray-300 flex items-center gap-2">
                                        <CarIcon className="h-4 w-4" />
                                        Engine Type <span className="text-gray-500 text-sm">(optional)</span>
                                    </FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                                        <FormControl>
                                            <SelectTrigger className="bg-gray-800 text-white">
                                                <SelectValue placeholder="Engine type" />
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
                        <FormField
                            control={control}
                            name="transmission_type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-gray-300 flex items-center gap-2">
                                        <CarIcon className="h-4 w-4" />
                                        Transmission <span className="text-gray-500 text-sm">(optional)</span>
                                    </FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                                        <FormControl>
                                            <SelectTrigger className="bg-gray-800 text-white">
                                                <SelectValue placeholder="Transmission type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-gray-800 text-white">
                                            <SelectItem value="automatic">Automatic</SelectItem>
                                            <SelectItem value="manual">Manual</SelectItem>
                                            <SelectItem value="cvt">CVT</SelectItem>
                                            <SelectItem value="dual_clutch">Dual Clutch</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={control}
                            name="fuel_type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-gray-300 flex items-center gap-2">
                                        <CarIcon className="h-4 w-4" />
                                        Fuel Type <span className="text-gray-500 text-sm">(optional)</span>
                                    </FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                                        <FormControl>
                                            <SelectTrigger className="bg-gray-800 text-white">
                                                <SelectValue placeholder="Fuel type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-gray-800 text-white">
                                            <SelectItem value="gasoline">Gasoline</SelectItem>
                                            <SelectItem value="diesel">Diesel</SelectItem>
                                            <SelectItem value="electric">Electric</SelectItem>
                                            <SelectItem value="hybrid">Hybrid</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={control}
                            name="drive_type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-gray-300 flex items-center gap-2">
                                        <CarIcon className="h-4 w-4" />
                                        Drive Type <span className="text-gray-500 text-sm">(optional)</span>
                                    </FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                                        <FormControl>
                                            <SelectTrigger className="bg-gray-800 text-white">
                                                <SelectValue placeholder="Drive type" />
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
                            control={control}
                            name="trim"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-gray-300 flex items-center gap-2">
                                        <CarIcon className="h-4 w-4" />
                                        Trim <span className="text-gray-500 text-sm">(optional)</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Input {...field} className="bg-gray-800 text-white" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={control}
                            name="oil_type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-gray-300 flex items-center gap-2">
                                        <CarIcon className="h-4 w-4" />
                                        Oil Type <span className="text-gray-500 text-sm">(optional)</span>
                                    </FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                                        <FormControl>
                                            <SelectTrigger className="bg-gray-800 text-white">
                                                <SelectValue placeholder="Oil type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-gray-800 text-white">
                                            <SelectItem value="5w-20">5W-20</SelectItem>
                                            <SelectItem value="5w-30">5W-30</SelectItem>
                                            <SelectItem value="10w-30">10W-30</SelectItem>
                                            <SelectItem value="10w-40">10W-40</SelectItem>
                                            <SelectItem value="15w-40">15W-40</SelectItem>
                                            <SelectItem value="0w-20">0W-20</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={control}
                            name="vin"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-gray-300 flex items-center gap-2">
                                        <CarIcon className="h-4 w-4" />
                                        VIN <span className="text-gray-500 text-sm">(optional)</span>
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
    );
};