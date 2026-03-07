import { useEffect, useMemo, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { InvoiceTemplate } from './invoice-template'
import { generateInvoicePDF, generateInvoiceNumber, formatInvoiceDate, createInvoiceFileName } from '@/lib/invoice-utils'
import { Job, Car } from '@/types'
import { Calendar, Download, Eye, FileText, Loader2 } from "lucide-react"
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
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [invoiceDate, setInvoiceDate] = useState('')

  useEffect(() => {
    if (open) {
      setInvoiceNumber(generateInvoiceNumber())
      setInvoiceDate(formatInvoiceDate())
    }
  }, [open])

  const subtotal = useMemo(() => {
    return jobs.reduce((sum, job) => sum + (job.amount_charged || 0), 0)
  }, [jobs])

  const taxRate = 0.0825
  const tax = subtotal * taxRate
  const total = subtotal + tax

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return

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
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate invoice PDF. Please try again.",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePrint = () => {
    if (!invoiceRef.current) return
    
    const printWindow = window.open('', '', 'width=800,height=600')
    if (printWindow) {
      const invoiceElement = invoiceRef.current
      const styleTags = Array.from(document.querySelectorAll('style')).map((style) => style.outerHTML).join('\n')
      const cssLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map((link) => link.outerHTML).join('\n')

      const marginMm = 10
      const mmToPx = 96 / 25.4
      const printableWidthPx = (210 - marginMm * 2) * mmToPx
      const printableHeightPx = (297 - marginMm * 2) * mmToPx
      const scale = Math.min(
        1,
        printableWidthPx / invoiceElement.scrollWidth,
        printableHeightPx / invoiceElement.scrollHeight
      )

      printWindow.document.write('<html><head><title>Invoice</title>')
      printWindow.document.write(cssLinks)
      printWindow.document.write(styleTags)
      printWindow.document.write(`
        <style>
          @page { size: A4 portrait; margin: ${marginMm}mm; }
          html, body { margin: 0; padding: 0; background: #fff; }
          body { font-family: Arial, sans-serif; }
          .invoice-bill-summary {
            display: grid !important;
            grid-template-columns: 2fr 1fr !important;
            gap: 12px !important;
            align-items: start !important;
          }
          .invoice-bill-to,
          .invoice-summary {
            width: 100% !important;
          }
          .invoice-print-page {
            width: ${printableWidthPx}px;
            height: ${printableHeightPx}px;
            overflow: hidden;
          }
          .invoice-scale-wrap {
            transform-origin: top left;
            transform: scale(${scale});
            width: ${100 / scale}%;
          }
        </style>
      `)
      printWindow.document.write('</head><body>')
      printWindow.document.write('<div class="invoice-print-page"><div class="invoice-scale-wrap">')
      printWindow.document.write(invoiceElement.outerHTML)
      printWindow.document.write('</div></div>')
      printWindow.document.write('</body></html>')
      printWindow.document.close()

      printWindow.onload = () => {
        printWindow.focus()
        printWindow.print()
      }
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
            Review details before downloading or printing
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-md border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Invoice #</p>
              <p className="text-sm font-semibold">{invoiceNumber || '—'}</p>
            </div>
            <div className="rounded-md border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="text-sm font-semibold flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {invoiceDate || '—'}
              </p>
            </div>
            <div className="rounded-md border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Jobs</p>
              <p className="text-sm font-semibold flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                {jobs.length}
              </p>
            </div>
            <div className="rounded-md border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Total Due</p>
              <p className="text-sm font-semibold">${total.toFixed(2)}</p>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <InvoiceTemplate
                ref={invoiceRef}
                car={car}
                jobs={jobs}
                invoiceNumber={invoiceNumber}
                invoiceDate={invoiceDate}
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <div className="w-full max-w-sm space-y-1 rounded-md border p-3 text-sm">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Tax (8.25%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between border-t pt-2 font-semibold">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
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
