import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { Job, Car } from '@/types'

export interface InvoiceData {
  car: Car
  jobs: Job[]
  invoiceNumber: string
  invoiceDate: string
}

const withStableInvoiceRender = async <T>(element: HTMLElement, task: () => Promise<T>): Promise<T> => {
  const originalWidth = element.style.width
  const originalMaxWidth = element.style.maxWidth
  const originalPosition = element.style.position
  const originalLeft = element.style.left
  const originalTop = element.style.top

  try {
    element.style.width = '210mm'
    element.style.maxWidth = '210mm'
    element.style.position = 'absolute'
    element.style.left = '-9999px'
    element.style.top = '0'

    await new Promise(resolve => setTimeout(resolve, 100))
    return await task()
  } finally {
    element.style.width = originalWidth
    element.style.maxWidth = originalMaxWidth
    element.style.position = originalPosition
    element.style.left = originalLeft
    element.style.top = originalTop
  }
}

async function captureInvoiceCanvas(element: HTMLElement): Promise<HTMLCanvasElement> {
  return withStableInvoiceRender(element, async () => {
    return html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: element.scrollWidth,
      height: element.scrollHeight,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    })
  })
}

/**
 * Generates a PDF from an HTML element containing the invoice
 * @param element - The HTML element to convert to PDF
 * @param fileName - The name for the downloaded PDF file
 */
export async function generateInvoicePDF(element: HTMLElement, fileName: string): Promise<void> {
  try {
    const canvas = await captureInvoiceCanvas(element)

    const imgData = canvas.toDataURL('image/png')

    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = 210
    const pageHeight = 297
    const margin = 10
    const maxWidth = pageWidth - margin * 2
    const maxHeight = pageHeight - margin * 2

    const widthFittedHeight = (canvas.height * maxWidth) / canvas.width

    let renderWidth = maxWidth
    let renderHeight = widthFittedHeight

    if (renderHeight > maxHeight) {
      renderHeight = maxHeight
      renderWidth = (canvas.width * renderHeight) / canvas.height
    }

    const x = (pageWidth - renderWidth) / 2
    const y = (pageHeight - renderHeight) / 2

    pdf.addImage(imgData, 'PNG', x, y, renderWidth, renderHeight)

    pdf.save(fileName)
  } catch (error) {
    console.error('Error generating PDF:', error)
    throw new Error('Failed to generate PDF')
  }
}

export async function generateInvoicePNGBlob(element: HTMLElement): Promise<Blob> {
  try {
    const canvas = await captureInvoiceCanvas(element)
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to generate PNG'))
          return
        }
        resolve(blob)
      }, 'image/png')
    })
  } catch (error) {
    console.error('Error generating PNG:', error)
    throw new Error('Failed to generate PNG')
  }
}

export async function downloadInvoicePNG(element: HTMLElement, fileName: string): Promise<void> {
  const blob = await generateInvoicePNGBlob(element)
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

/**
 * Generates an invoice number based on the current date and a random component
 */
export function generateInvoiceNumber(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const time = `${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}`
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0')
  return `INV-${year}${month}${day}-${time}${random}`
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
  const carName = `${car.year}_${car.make}_${car.model}`
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '')
  return `Invoice_${invoiceNumber}_${carName}.pdf`
}

export function createInvoiceImageFileName(car: Car, invoiceNumber: string): string {
  const carName = `${car.year}_${car.make}_${car.model}`
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '')
  return `Invoice_${invoiceNumber}_${carName}.png`
}
