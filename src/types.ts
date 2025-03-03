import { z } from 'zod';
import { combinedSchema } from './components/schema';
export interface Car {
    id: string;
    make: string;
    model: string;
    year: number;
    trim?: string;
    drive_type?: string;
    fuel_type?: string;
    color?: string;
    owner_name: string;
    license_plate?: string;
    engine_type?: string;
    transmission_type?: string;
    oil_type?: string;
    vin?: string;
    user_id: string;
}

export interface Job {
    id: string;
    car_id: string;
    job_number: number;
    mileage: number;
    description: string;
    problems_encountered?: string;
    parts_ordered?: string;
    status: 'not_started' | 'in_progress' | 'completed' | 'cancelled';
    payment_status: 'unpaid' | 'partial' | 'paid';
    intake_date: Date;
    completion_date?: Date;
    cost_to_fix: number;
    amount_charged: number;
    hours_spent?: number;
    hourly_wage?: number;
    engine_code?: string;
    user_id: string;
}


export type Photo = {
    id: string;
    url: string;
    filename: string;
    job_id: string;
    car_id?: string;
};


export type PendingUpload = {
    file: File;
    jobIndex: number;
};


export type CarFormValues = z.infer<typeof combinedSchema>;