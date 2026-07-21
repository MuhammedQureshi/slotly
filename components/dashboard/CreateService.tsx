import { useState } from "react"

type Service = {
  id: string
  name: string
  booking_page_id: string 
  duration_minutes: number
  price_pence: number | null
  description: string | null
}

export default function CreateService(service: Service) {
    const [open, setOpen] = useState(false)
  return (
    <div>CreateService</div>
  )
}
