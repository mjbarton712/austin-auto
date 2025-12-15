import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { Job, Car } from '@/types'

export interface InvoiceData {
  car: Car
  jobs: Job[]
  invoiceNumber: string
  invoiceDate: string
}

/**
 * Generates a PDF from an HTML element containing the invoice
 * @param element - The HTML element to convert to PDF
 * @param fileName - The name for the downloaded PDF file
 */
export async function generateInvoicePDF(element: HTMLElement, fileName: string): Promise<void> {
  try {
    // Validate inputs
    if (!element) {
      throw new Error('No element provided for PDF generation')
    }
    
    if (!fileName) {
      throw new Error('No file name provided for PDF')
    }

    // Capture the element as a canvas
    const canvas = await html2canvas(element, {
      scale: 2, // Higher quality
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    })

    if (!canvas) {
      throw new Error('Failed to create canvas from element')
    }

    const imgData = canvas.toDataURL('image/png')
    
    if (!imgData || imgData === 'data:,') {
      throw new Error('Failed to convert canvas to image data')
    }
    
    // Calculate PDF dimensions
    const imgWidth = 210 // A4 width in mm
    const pageHeight = 297 // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight
    
    const pdf = new jsPDF('p', 'mm', 'a4')
    let position = 0

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    // Add additional pages if needed
    while (heightLeft > 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    // Save the PDF
    pdf.save(fileName)
  } catch (error) {
    console.error('Error generating PDF:', error)
    if (error instanceof Error) {
      throw new Error(`Failed to generate PDF: ${error.message}`)
    }
    throw new Error('Failed to generate PDF due to an unknown error')
  }
}

/**
 * Generates an invoice number based on the current date and a random component
 * Format: INV-YYYYMM-XXX where XXX is a random 3-digit number
 */
export function generateInvoiceNumber(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  // Use timestamp seconds for better uniqueness
  const timestamp = Math.floor(date.getTime() / 1000) % 1000
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0')
  return `INV-${year}${month}${day}-${timestamp}${random}`
}

/**
 * Formats a date for invoice display
 */
export function formatInvoiceDate(date?: Date): string {
  return (date || new Date()).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Creates a file name for the invoice PDF
 */
export function createInvoiceFileName(car: Car, invoiceNumber: string): string {
  const carName = `${car.year}_${car.make}_${car.model}`.replace(/\s+/g, '_')
  return `Invoice_${invoiceNumber}_${carName}.pdf`
}
