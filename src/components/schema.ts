import { z } from 'zod';

export const carSchema = z.object({
    id: z.string().optional(),
    make: z.string().min(1, "Make is required"),
    model: z.string().min(1, "Model is required"),
    year: z.number().optional().nullable(),
    owner_name: z.string().min(1, "Owner name is required"),
    trim: z.string().optional().nullable(),
    drive_type: z.string().optional().nullable(),
    fuel_type: z.string().optional().nullable(),
    color: z.string().optional().nullable(),
    license_plate: z.string().optional().nullable(),
    engine_type: z.string().optional().nullable(),
    transmission_type: z.string().optional().nullable(),
    oil_type: z.string().optional().nullable(),
    vin: z.string().optional().nullable(),
});

export const jobSchema = z.object({
    id: z.string().optional(),
    mileage: z.number().optional().nullable().default(0),
    description: z.string().min(1, "Description is required"),
    status: z.enum(["not_started", "in_progress", "completed", "cancelled"]),
    intake_date: z.date(),
    completion_date: z.date().optional().nullable(),
    payment_status: z.enum(["unpaid", "partial", "paid"]).default("unpaid"),
    problems_encountered: z.string().optional().nullable().default(""),
    parts_ordered: z.string().optional().nullable().default(""),
    engine_code: z.string().optional().nullable().default(""),
    cost_to_fix: z.number().optional().nullable().default(0),
    amount_charged: z.number().optional().nullable().default(0),
    hours_spent: z.number().optional().nullable().default(0),
});

export const combinedSchema = carSchema.extend({
    jobs: z.array(jobSchema)
});
