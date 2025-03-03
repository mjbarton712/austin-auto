import { z } from 'zod';

export const carFormSchema = z.object({
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
});

export const jobFormSchema = z.object({
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
});

export const combinedSchema = carFormSchema.merge(jobFormSchema);