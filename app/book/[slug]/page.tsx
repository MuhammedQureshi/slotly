import {supabase} from "@/lib/supabase"


export default async function BookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  // 'edin-barber'

  const { data, error } = await supabase
    .from ('booking_pages')    
    .select('*, services(*)')
    .eq('slug', slug)
    .eq('is_published', true)
    .eq('is_active', true)
    .single()

  if (error) {
    console.error('Error fetching booking:', error)
    console.error('Error fetching booking:', JSON.stringify(error))
    return <div>Error loading booking page.</div>
  }

  if (!data) {
    return <div>No booking page found for slug: {slug}</div>
  }

  return (
    <div>
      <h1>Booking Page for {slug}</h1>
      {/* Add your booking page content here */}
    </div>
  )
}
