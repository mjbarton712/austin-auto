/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '@/lib/supabase'
import { r2Storage } from '@/lib/r2-storage'
import { Car, Job, Photo } from '@/types'

export const carService = {
  async fetchCar(id: string) {
    return await supabase
      .from('cars_new')
      .select('*')
      .eq('id', id)
      .single()
  },

  async fetchUserCars(userId: string) {
    return await supabase
      .from('cars_new')
      .select('*')
      .eq('user_id', userId)
  },

  async createCar(carData: Partial<Car>) {
    return await supabase
      .from('cars_new')
      .insert([carData])
      .select()
  },

  async updateCar(id: string, carData: Partial<Car>) {
    return await supabase
      .from('cars_new')
      .update(carData)
      .eq('id', id)
  }
}

export const jobService = {
  async fetchCarJobs(carId: string) {
    return await supabase
      .from('jobs')
      .select('*')
      .eq('car_id', carId)
  },

  async createJob(jobData: Partial<Job>) {
    return await supabase
      .from('jobs')
      .insert([jobData])
      .select()
  },

  async updateJob(id: string, jobData: any) {
    return await supabase
      .from('jobs')
      .update(jobData)
      .eq('id', id)
  },

  async deleteJob(id: string) {
    return await supabase
      .from('jobs')
      .delete()
      .eq('id', id)
  },

  async getLatestJobs(carId: string, limit: number) {
    return await supabase
      .from('jobs')
      .select('id')
      .eq('car_id', carId)
      .order('created_at', { ascending: false })
      .limit(limit)
  },

  async getLatestJobsForUploads(carId: string, limit: number) {
    const { data: latestJobs } = await supabase
      .from('jobs')
      .select('id')
      .eq('car_id', carId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (latestJobs && latestJobs.length > 0) {
      const jobMap = new Map();
      latestJobs.forEach((job: any, idx: any) => {
        jobMap.set(idx, job.id);
      });
      return jobMap;
    }
    return new Map();
  }
}

export const mediaService = {
  async fetchCarPhotos(carId: string) {
    return await supabase
      .from('media')
      .select('id, url, filename, job_id')
      .eq('car_id', carId)
  },

  async uploadPhoto(filePath: string, file: File) {
    // Now using R2 instead of Supabase storage
    const { error } = await r2Storage.uploadFile(filePath, file);
    return { error };
  },

  async getPublicUrl(filePath: string) {
    // Get public URL from R2
    const publicUrl = r2Storage.getPublicUrl(filePath);
    return { data: { publicUrl } };
  },

  async createMediaRecord(mediaData: Partial<Photo>) {
    return await supabase
      .from('media')
      .insert(mediaData)
      .select('id, url, filename, job_id')
      .single()
  },

  async deletePhoto(photoId: string) {
    return await supabase
      .from('media')
      .delete()
      .eq('id', photoId)
  },
  
  async deleteFile(filePath: string) {
    // Now using R2 instead of Supabase storage
    const { error } = await r2Storage.deleteFile(filePath);
    return { error };
  },
  
  async getPhotoRecord(photoId: string) {
    return await supabase
      .from('media')
      .select('job_id, filename')
      .eq('id', photoId)
      .single()
  }
}

export const authService = {
  async resetPasswordForEmail(email: string) {
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`
    })
  },

  async updatePassword(newPassword: string) {
    return await supabase.auth.updateUser({
      password: newPassword
    })
  }
}