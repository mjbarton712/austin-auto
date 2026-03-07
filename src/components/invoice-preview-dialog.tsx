import { useEffect, useMemo, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { InvoiceTemplate } from './invoice-template'
import { createInvoiceFileName, createInvoiceImageFileName, downloadInvoicePNG, formatInvoiceDate, generateInvoiceNumber, generateInvoicePDF, generateInvoicePNGBlob } from '@/lib/invoice-utils'
import { Job, Car } from '@/types'
import { Calendar, Copy, Download, Eye, FileText, Loader2, Mail, MessageSquare, Image as ImageIcon } from "lucide-react"
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
  const [isSharing, setIsSharing] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const venmoUrl = 'https://venmo.com/Austin-N'

  useEffect(() => {
    if (open) {
      setInvoiceNumber(generateInvoiceNumber())
      setInvoiceDate(formatInvoiceDate())
    }
  }, [open])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)')
    const update = () => setIsMobile(mediaQuery.matches)
    update()

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', update)
      return () => mediaQuery.removeEventListener('change', update)
    }

    mediaQuery.addListener(update)
    return () => mediaQuery.removeListener(update)
  }, [])

  const subtotal = useMemo(() => {
    return jobs.reduce((sum, job) => sum + (job.amount_charged || 0), 0)
  }, [jobs])

  const taxRate = 0.0825
  const tax = subtotal * taxRate
  const total = subtotal + tax

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`

  const emailMessage = useMemo(() => {
    return [
      `Hi ${car.owner_name},`,
      '',
      `Thanks for trusting me to help with your vehicle. I’ve attached your invoice (${invoiceNumber}) for your ${car.year} ${car.make} ${car.model}.`,
      `Total due: ${formatCurrency(total)}.`,
      '',
      `You can pay by Venmo here: ${venmoUrl}`,
      '',
      'Thank you!',
      'Austin',
    ].join('\n')
  }, [car.make, car.model, car.owner_name, car.year, invoiceNumber, total])

  const textMessage = useMemo(() => {
    return [
      `Hi ${car.owner_name} — your invoice (${invoiceNumber}) is ready.`,
      `Total: ${formatCurrency(total)}.`,
      `Venmo: ${venmoUrl}`,
      'Thanks! - Austin',
    ].join('\n')
  }, [car.owner_name, invoiceNumber, total])

  const canShareFiles = async (file: File) => {
    const shareNavigator = navigator as Navigator & { canShare?: (data?: ShareData) => boolean }
    if (!shareNavigator.share) return false
    if (typeof shareNavigator.canShare === 'function') {
      return shareNavigator.canShare({ files: [file] })
    }
    return false
  }

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

  const handleDownloadPNG = async () => {
    if (!invoiceRef.current) return

    setIsSharing(true)
    try {
      const fileName = createInvoiceImageFileName(car, invoiceNumber)
      await downloadInvoicePNG(invoiceRef.current, fileName)
      toast({
        title: 'PNG Downloaded',
        description: `${fileName} was downloaded successfully.`,
      })
    } catch (error) {
      console.error('Error downloading PNG:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to export PNG. Please try again.',
      })
    } finally {
      setIsSharing(false)
    }
  }

  const handleCopyPNG = async () => {
    if (!invoiceRef.current) return

    setIsSharing(true)
    try {
      const blob = await generateInvoicePNGBlob(invoiceRef.current)

      if (!navigator.clipboard || !('ClipboardItem' in window)) {
        const fileName = createInvoiceImageFileName(car, invoiceNumber)
        await downloadInvoicePNG(invoiceRef.current, fileName)
        toast({
          title: 'Clipboard Not Supported',
          description: 'PNG was downloaded instead. You can attach it manually.',
        })
        return
      }

      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ])

      toast({
        title: 'PNG Copied',
        description: 'Invoice image copied to clipboard.',
      })
    } catch (error) {
      console.error('Error copying PNG:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to copy PNG. Try downloading it instead.',
      })
    } finally {
      setIsSharing(false)
    }
  }

  const handleShareEmail = async () => {
    if (!invoiceRef.current) return

    setIsSharing(true)
    try {
      const blob = await generateInvoicePNGBlob(invoiceRef.current)
      const fileName = createInvoiceImageFileName(car, invoiceNumber)
      const file = new File([blob], fileName, { type: 'image/png' })

      if (await canShareFiles(file)) {
        await navigator.share({
          title: `Invoice ${invoiceNumber}`,
          text: emailMessage,
          files: [file],
        })
        return
      }

      await downloadInvoicePNG(invoiceRef.current, fileName)
      const subject = `Invoice ${invoiceNumber} - ${car.year} ${car.make} ${car.model}`
      const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`${emailMessage}\n\n(Invoice PNG downloaded - please attach it before sending.)`)}`
      window.location.href = mailtoLink

      toast({
        title: 'Email Draft Opened',
        description: 'A draft email was opened and the invoice PNG was downloaded for attachment.',
      })
    } catch (error) {
      console.error('Error sharing email:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Unable to open email share. Please try again.',
      })
    } finally {
      setIsSharing(false)
    }
  }

  const handleShareText = async () => {
    if (!invoiceRef.current) return

    setIsSharing(true)
    try {
      const blob = await generateInvoicePNGBlob(invoiceRef.current)
      const fileName = createInvoiceImageFileName(car, invoiceNumber)
      const file = new File([blob], fileName, { type: 'image/png' })

      if (await canShareFiles(file)) {
        await navigator.share({
          title: `Invoice ${invoiceNumber}`,
          text: textMessage,
          files: [file],
        })
        return
      }

      await downloadInvoicePNG(invoiceRef.current, fileName)
      window.location.href = `sms:&body=${encodeURIComponent(`${textMessage}\n\n(Invoice image downloaded - please attach before sending.)`)}`

      toast({
        title: 'Text Message Opened',
        description: 'Invoice PNG was downloaded for attachment in your message.',
      })
    } catch (error) {
      console.error('Error sharing text:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Unable to open text share. Please try again.',
      })
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1rem)] max-w-5xl max-h-[92vh] overflow-y-auto p-4 sm:p-6">
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

        <DialogFooter className="flex flex-col gap-3 sm:gap-2">
          <div className="grid gap-2 sm:flex sm:flex-wrap sm:items-center">
            <Button className="w-full sm:w-auto" type="button" variant="outline" onClick={handleShareEmail} disabled={isGenerating || isSharing}>
              <Mail className="mr-2 h-4 w-4" />
              Share via Email
            </Button>
            {isMobile && (
              <Button className="w-full sm:w-auto" type="button" variant="outline" onClick={handleShareText} disabled={isGenerating || isSharing}>
                <MessageSquare className="mr-2 h-4 w-4" />
                Share via Text
              </Button>
            )}
            <Button className="w-full sm:w-auto" type="button" variant="outline" onClick={handleCopyPNG} disabled={isGenerating || isSharing}>
              <Copy className="mr-2 h-4 w-4" />
              Copy PNG
            </Button>
            <Button className="w-full sm:w-auto" type="button" variant="outline" onClick={handleDownloadPNG} disabled={isGenerating || isSharing}>
              <ImageIcon className="mr-2 h-4 w-4" />
              Download PNG
            </Button>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Button className="w-full sm:w-auto" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button className="flex-1 sm:flex-none" variant="outline" onClick={handlePrint}>
              Print
            </Button>
            <Button
              className="flex-1 sm:flex-none"
              onClick={handleDownloadPDF}
              disabled={isGenerating || isSharing}
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
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
