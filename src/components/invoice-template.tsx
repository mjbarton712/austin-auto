import { Job, Car } from '@/types'
import { forwardRef } from 'react'

interface InvoiceTemplateProps {
  car: Car
  jobs: Job[]
  invoiceNumber: string
  invoiceDate: string
}

export const InvoiceTemplate = forwardRef<HTMLDivElement, InvoiceTemplateProps>(
  ({ car, jobs, invoiceNumber, invoiceDate }, ref) => {
    const subtotal = jobs.reduce((sum, job) => sum + (job.amount_charged || 0), 0)
    // Tax rate for Texas - update this value based on your location
    const taxRate = 0.0825 // 8.25%
    const tax = subtotal * taxRate
    const total = subtotal + tax

    return (
      <div ref={ref} className="bg-white p-12 max-w-4xl mx-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
        {/* Header */}
        <div className="mb-12">
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-4">
              <img 
                src="/austins_auto.png" 
                alt="Austin's Auto Logo" 
                className="h-20 w-20 object-contain"
                onError={(e) => {
                  // Hide image if it fails to load
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">INVOICE</h1>
                <div className="text-sm text-gray-600">
                  <p className="font-semibold">Austin Auto</p>
                  <p>Professional Auto Repair Services</p>
                  <p>Austin, Texas</p>
                  <p className="mt-2">Phone: (512) XXX-XXXX</p>
                  <p>Email: service@austinauto.com</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-gray-100 px-6 py-4 rounded-lg">
                <p className="text-sm text-gray-600">Invoice Number</p>
                <p className="text-2xl font-bold text-gray-900">{invoiceNumber}</p>
                <p className="text-sm text-gray-600 mt-3">Invoice Date</p>
                <p className="font-semibold text-gray-900">{invoiceDate}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bill To Section */}
        <div className="mb-8">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-sm font-bold text-gray-600 uppercase mb-3">Bill To</h2>
            <p className="text-lg font-semibold text-gray-900">{car.owner_name}</p>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
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
        </div>

        {/* Jobs/Services Table */}
        <div className="mb-8">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-900">
                <th className="text-left py-3 px-2 text-sm font-bold text-gray-900 uppercase">Job #</th>
                <th className="text-left py-3 px-2 text-sm font-bold text-gray-900 uppercase">Description</th>
                <th className="text-left py-3 px-2 text-sm font-bold text-gray-900 uppercase">Date</th>
                <th className="text-left py-3 px-2 text-sm font-bold text-gray-900 uppercase">Mileage</th>
                <th className="text-right py-3 px-2 text-sm font-bold text-gray-900 uppercase">Amount</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job, index) => (
                <tr key={job.id} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                  <td className="py-4 px-2 text-sm text-gray-900">#{job.job_number}</td>
                  <td className="py-4 px-2">
                    <p className="text-sm font-semibold text-gray-900">{job.description}</p>
                    {job.parts_ordered && (
                      <p className="text-xs text-gray-600 mt-1">Parts: {job.parts_ordered}</p>
                    )}
                    {job.problems_encountered && (
                      <p className="text-xs text-gray-600 mt-1">Notes: {job.problems_encountered}</p>
                    )}
                    {job.hours_spent && job.hours_spent > 0 && (
                      <p className="text-xs text-gray-600 mt-1">
                        Labor: {job.hours_spent} hour{job.hours_spent !== 1 ? 's' : ''}
                        {job.hourly_wage && ` @ $${job.hourly_wage}/hr`}
                      </p>
                    )}
                  </td>
                  <td className="py-4 px-2 text-sm text-gray-600">
                    {job.completion_date 
                      ? new Date(job.completion_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : job.intake_date
                        ? new Date(job.intake_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : 'N/A'
                    }
                  </td>
                  <td className="py-4 px-2 text-sm text-gray-600">
                    {job.mileage ? job.mileage.toLocaleString() : 'N/A'}
                  </td>
                  <td className="py-4 px-2 text-right text-sm font-semibold text-gray-900">
                    ${(job.amount_charged || 0).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="flex justify-end mb-8">
          <div className="w-80">
            <div className="space-y-2">
              <div className="flex justify-between py-2 text-gray-900">
                <span className="font-semibold">Subtotal:</span>
                <span className="font-semibold">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 text-gray-600">
                <span>Tax (8.25%):</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="border-t-2 border-gray-900 pt-3 flex justify-between">
                <span className="text-xl font-bold text-gray-900">Total Due:</span>
                <span className="text-xl font-bold text-gray-900">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Information */}
        <div className="border-t border-gray-200 pt-8">
          <h3 className="text-sm font-bold text-gray-900 uppercase mb-3">Payment Information</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p>Payment is due upon receipt of invoice.</p>
            <p>We accept cash, check, and major credit cards.</p>
            <p className="mt-4 font-semibold">Thank you for your business!</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
          <p>This invoice was generated on {new Date().toLocaleDateString()}</p>
          <p className="mt-1">Austin Auto • Professional Auto Repair Services</p>
        </div>
      </div>
    )
  }
)

InvoiceTemplate.displayName = 'InvoiceTemplate'
