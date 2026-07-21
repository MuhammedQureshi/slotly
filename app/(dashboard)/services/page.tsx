"use client"
import ServiceCard from '@/components/dashboard/ServiceCard'
export default function Services() {
  return (
    <div>
      <div className="mb-6 space-y-2">
        <h1 className="text-2xl font-bold">Services</h1>
        <p className="text-muted-foreground">These appear on your booking page when customers pick what to book.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ServiceCard service={{ id: '1', name: 'Haircut', duration_minutes: 45, price_pence: 2000, description: 'Classic cut, scissor or clipper. Includes wash.', booking_page_id: 'page-1' }} />
        <ServiceCard service={{ id: '1', name: 'Service 1', duration_minutes: 45, price_pence: 2000, description: 'Description for Service 1', booking_page_id: 'page-1' }} />
        <ServiceCard service={{ id: '2', name: 'Service 2', duration_minutes: 30, price_pence: 1500, description: 'Description for Service 2', booking_page_id: 'page-2' }} />
        <ServiceCard service={{ id: '3', name: 'Service 3', duration_minutes: 60, price_pence: 2500, description: 'Description for Service 3', booking_page_id: 'page-3' }} />
        <ServiceCard service={{ id: '4', name: 'Service 4', duration_minutes: 90, price_pence: 4000, description: 'Description for Service 4', booking_page_id: 'page-4' }} />
        <ServiceCard service={{ id: '5', name: 'Service 5', duration_minutes: 120, price_pence: null, description: 'Description for Service 5', booking_page_id: 'page-5' }} />
      </div>
    </div>
  )
}