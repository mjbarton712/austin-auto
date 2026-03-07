import { Job, Car } from '@/types'
import { forwardRef, useMemo } from 'react'

interface InvoiceTemplateProps {
  car: Car
  jobs: Job[]
  invoiceNumber: string
  invoiceDate: string
}

// Utility function to assign job numbers based on intake date
const assignJobNumbers = (jobs: Job[]): (Job & { calculatedJobNumber: number })[] => {
  // Sort jobs by intake_date (earliest first)
  const sortedJobs = [...jobs].sort((a, b) => {
    const dateA = new Date(a.intake_date).getTime()
    const dateB = new Date(b.intake_date).getTime()
    return dateA - dateB
  })
  
  // Assign sequential job numbers
  return sortedJobs.map((job, index) => ({
    ...job,
    calculatedJobNumber: index + 1
  }))
}

export const InvoiceTemplate = forwardRef<HTMLDivElement, InvoiceTemplateProps>(
  ({ car, jobs, invoiceNumber, invoiceDate }, ref) => {
    // Calculate job numbers based on intake dates
    const jobsWithNumbers = useMemo(() => assignJobNumbers(jobs), [jobs])
    
    const subtotal = jobsWithNumbers.reduce((sum, job) => sum + (job.amount_charged || 0), 0)
    const partsTotal = jobsWithNumbers.reduce((sum, job) => sum + (job.cost_to_fix || 0), 0)
    const laborTotal = subtotal - partsTotal
    const taxRate = 0.0825 // 8.25% - adjust as needed
    const tax = subtotal * taxRate
    const total = subtotal + tax
    const paidJobs = jobsWithNumbers.filter((job) => job.payment_status === 'paid').length
    const unpaidJobs = jobsWithNumbers.length - paidJobs

    const truncate = (value?: string | null, max = 80) => {
      if (!value) return ''
      return value.length > max ? `${value.slice(0, max).trimEnd()}…` : value
    }

    return (
      <div ref={ref} className="bg-white p-8 max-w-4xl mx-auto text-gray-900" style={{ fontFamily: 'Arial, sans-serif' }}>
        <div className="mb-6 border-b-2 border-gray-900 pb-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-1">RUNEW</p>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">INVOICE</h1>
              <div className="text-xs text-gray-600 space-y-0.5">
                <p className="font-semibold text-gray-900">Professional Auto Repair Services</p>
                <p>Maple Grove, MN</p>
              </div>
            </div>
            <div className="text-right">
              <div className="border border-gray-300 px-4 py-3 rounded-md">
                <p className="text-xs uppercase tracking-wide text-gray-500">Invoice Number</p>
                <p className="text-lg font-bold mt-0.5">{invoiceNumber}</p>
                <p className="text-xs uppercase tracking-wide text-gray-500 mt-2">Invoice Date</p>
                <p className="font-semibold mt-1">{invoiceDate}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="invoice-bill-summary mb-5 grid gap-3 md:grid-cols-3">
          <div className="invoice-bill-to bg-gray-50 p-4 rounded-md md:col-span-2">
            <h2 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">Bill To</h2>
            <p className="text-base font-semibold text-gray-900">{car.owner_name}</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-gray-600">Vehicle</p>
                <p className="font-semibold text-gray-900">
                  {car.year} {car.make} {car.model} {car.trim || ''}
                </p>
              </div>
              {car.vin && (
                <div>
                  <p className="text-gray-600">VIN</p>
                  <p className="font-semibold text-gray-900">{car.vin}</p>
                </div>
              )}
              {car.license_plate && (
                <div>
                  <p className="text-gray-600">License Plate</p>
                  <p className="font-semibold text-gray-900">{car.license_plate}</p>
                </div>
              )}
              {car.color && (
                <div>
                  <p className="text-gray-600">Color</p>
                  <p className="font-semibold text-gray-900">{car.color}</p>
                </div>
              )}
            </div>
          </div>

          <div className="invoice-summary border border-gray-200 rounded-md p-3">
            <h2 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Summary</h2>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Jobs Included</span>
                <span className="font-semibold text-gray-900">{jobsWithNumbers.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Paid Jobs</span>
                <span className="font-semibold text-gray-900">{paidJobs}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Unpaid/Partial</span>
                <span className="font-semibold text-gray-900">{unpaidJobs}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Parts Cost</span>
                <span className="font-semibold text-gray-900">${partsTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-5">
          <h2 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Services</h2>
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-900">
                <th className="text-left py-2 px-1.5 text-[11px] font-bold text-gray-900 uppercase">Job #</th>
                <th className="text-left py-2 px-1.5 text-[11px] font-bold text-gray-900 uppercase">Description</th>
                <th className="text-left py-2 px-1.5 text-[11px] font-bold text-gray-900 uppercase">Date</th>
                <th className="text-left py-2 px-1.5 text-[11px] font-bold text-gray-900 uppercase">Mileage</th>
                <th className="text-right py-2 px-1.5 text-[11px] font-bold text-gray-900 uppercase">Amount</th>
              </tr>
            </thead>
            <tbody>
              {jobsWithNumbers.map((job, index) => (
                <tr key={job.id} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                  <td className="py-2 px-1.5 text-xs text-gray-900">#{job.job_number || job.calculatedJobNumber}</td>
                  <td className="py-2 px-1.5 align-top">
                    <p className="text-xs font-semibold text-gray-900">{truncate(job.description, 90)}</p>
                    {job.parts_ordered && (
                      <p className="text-[11px] text-gray-600 mt-0.5">Parts: {truncate(job.parts_ordered, 70)}</p>
                    )}
                    {(job.cost_to_fix || 0) > 0 && (
                      <p className="text-[11px] text-gray-600 mt-0.5">Parts Cost: ${(job.cost_to_fix || 0).toFixed(2)}</p>
                    )}
                    {job.problems_encountered && (
                      <p className="text-[11px] text-gray-600 mt-0.5">Notes: {truncate(job.problems_encountered, 70)}</p>
                    )}
                    {job.hours_spent && job.hours_spent > 0 && (
                      <p className="text-[11px] text-gray-600 mt-0.5">
                        Labor: {job.hours_spent} hour{job.hours_spent !== 1 ? 's' : ''}
                        {job.hourly_wage && ` @ $${job.hourly_wage}/hr`}
                      </p>
                    )}
                    <p className="text-[11px] text-gray-600 mt-0.5">
                      Payment: {job.payment_status === 'paid' ? 'Paid' : job.payment_status === 'partial' ? 'Partial' : 'Unpaid'}
                    </p>
                  </td>
                  <td className="py-2 px-1.5 text-xs text-gray-600 align-top">
                    {job.completion_date 
                      ? new Date(job.completion_date).toLocaleDateString()
                      : new Date(job.intake_date).toLocaleDateString()
                    }
                  </td>
                  <td className="py-2 px-1.5 text-xs text-gray-600 align-top">
                    {job.mileage?.toLocaleString()}
                  </td>
                  <td className="py-2 px-1.5 text-right text-xs font-semibold text-gray-900 align-top">
                    ${(job.amount_charged || 0).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end mb-5">
          <div className="w-72">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between py-1 text-gray-600">
                <span>Parts Cost:</span>
                <span>${partsTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 text-gray-600">
                <span>Labor Cost:</span>
                <span>${laborTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 text-gray-900">
                <span className="font-semibold">Subtotal (Labor + Parts):</span>
                <span className="font-semibold">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 text-gray-600">
                <span>Tax (8.25%):</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="border-t-2 border-gray-900 pt-2 flex justify-between">
                <span className="text-lg font-bold text-gray-900">Total Due:</span>
                <span className="text-lg font-bold text-gray-900">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-1.5">Payment Information</h3>
          <div className="text-xs text-gray-600 space-y-0.5">
            <p>Payment is due upon receipt of invoice.</p>
            <p>Pay via cash or Venmo @Austin-N</p>
            <p className="mt-2 font-semibold">Thank you for your business!</p>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-gray-200 text-center text-[10px] text-gray-500">
          <p>This invoice was generated on {new Date().toLocaleDateString()}</p>
          <p className="mt-1">RUNEW • Maple Grove, MN</p>
        </div>
      </div>
    )
  }
)

InvoiceTemplate.displayName = 'InvoiceTemplate'
