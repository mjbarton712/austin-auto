import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Job, Car } from '@/types'
import { StatusBadge } from "@/components/ui/status-badge"
import { FileText, Loader2 } from "lucide-react"

interface InvoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobs: Job[]
  car: Car
  onGenerateInvoice: (selectedJobIds: string[]) => void
}

export function InvoiceDialog({ 
  open, 
  onOpenChange, 
  jobs, 
  car,
  onGenerateInvoice 
}: InvoiceDialogProps) {
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set())
  const [isGenerating, setIsGenerating] = useState(false)

  // Reset selection when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedJobs(new Set())
    }
  }, [open])

  const handleToggleJob = (jobId: string) => {
    const newSelected = new Set(selectedJobs)
    if (newSelected.has(jobId)) {
      newSelected.delete(jobId)
    } else {
      newSelected.add(jobId)
    }
    setSelectedJobs(newSelected)
  }

  const handleGenerateInvoice = async () => {
    if (selectedJobs.size === 0) return
    
    setIsGenerating(true)
    try {
      await onGenerateInvoice(Array.from(selectedJobs))
    } finally {
      setIsGenerating(false)
    }
  }

  const selectedJobsArray = jobs.filter(j => selectedJobs.has(j.id))
  const totalCost = selectedJobsArray.reduce((sum, job) => sum + (job.amount_charged || 0), 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Invoice
          </DialogTitle>
          <DialogDescription>
            Select the jobs to include in the invoice for {car.year} {car.make} {car.model}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {jobs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No jobs found for this vehicle
            </p>
          ) : (
            <div className="space-y-2">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-accent/50 transition-colors"
                >
                  <Checkbox
                    id={`job-${job.id}`}
                    checked={selectedJobs.has(job.id)}
                    onCheckedChange={() => handleToggleJob(job.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-1">
                    <Label
                      htmlFor={`job-${job.id}`}
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      Job #{job.job_number ?? 'N/A'} - {job.description}
                    </Label>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>Mileage: {job.mileage?.toLocaleString()}</span>
                      <span>•</span>
                      <StatusBadge status={job.status} payment={job.payment_status} />
                      <span>•</span>
                      <span className="font-semibold text-foreground">
                        ${(job.amount_charged || 0).toFixed(2)}
                      </span>
                    </div>
                    {job.intake_date && (
                      <p className="text-xs text-muted-foreground">
                        Date: {new Date(job.intake_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedJobs.size > 0 && (
            <div className="border-t pt-4">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total ({selectedJobs.size} job{selectedJobs.size !== 1 ? 's' : ''}):</span>
                <span>${totalCost.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerateInvoice}
            disabled={selectedJobs.size === 0 || isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Generate Invoice
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
