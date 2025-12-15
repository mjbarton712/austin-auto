import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { InvoiceTemplate } from './invoice-template'
import { generateInvoicePDF, generateInvoiceNumber, formatInvoiceDate, createInvoiceFileName } from '@/lib/invoice-utils'
import { Job, Car } from '@/types'
import { Download, Loader2, Eye } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface InvoicePreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobs: Job[]
  car: Car
}

export function InvoicePreviewDialog({ 
  open, 
  onOpenChange, 
  jobs, 
  car 
}: InvoicePreviewDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const invoiceRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const invoiceNumber = useRef(generateInvoiceNumber()).current
  const invoiceDate = formatInvoiceDate()

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Invoice content is not ready. Please try again.",
      })
      return
    }

    setIsGenerating(true)
    try {
      const fileName = createInvoiceFileName(car, invoiceNumber)
      await generateInvoicePDF(invoiceRef.current, fileName)
      
      toast({
        title: "Invoice Generated",
        description: `Invoice ${invoiceNumber} has been downloaded successfully.`,
      })
      
      // Close the dialog after successful generation
      setTimeout(() => {
        onOpenChange(false)
      }, 500)
    } catch (error) {
      console.error('Error generating invoice:', error)
      const errorMessage = error instanceof Error ? error.message : 'Please try again.'
      toast({
        variant: "destructive",
        title: "Error Generating Invoice",
        description: errorMessage,
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePrint = () => {
    if (!invoiceRef.current) return
    
    const printWindow = window.open('', '', 'width=800,height=600')
    if (printWindow) {
      printWindow.document.write('<html><head><title>Invoice</title>')
      printWindow.document.write('<style>')
      printWindow.document.write('body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }')
      printWindow.document.write('</style>')
      printWindow.document.write('</head><body>')
      printWindow.document.write(invoiceRef.current.innerHTML)
      printWindow.document.write('</body></html>')
      printWindow.document.close()
      printWindow.print()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Invoice Preview
          </DialogTitle>
          <DialogDescription>
            Review the invoice before downloading or printing
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="border rounded-lg overflow-hidden bg-white">
            <InvoiceTemplate
              ref={invoiceRef}
              car={car}
              jobs={jobs}
              invoiceNumber={invoiceNumber}
              invoiceDate={invoiceDate}
            />
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint}>
              Print
            </Button>
            <Button
              onClick={handleDownloadPDF}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
