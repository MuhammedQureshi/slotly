import { Html, Body, Container, Heading, Text, Button } from '@react-email/components'

type Props = {
  customerName: string
  businessName: string
  serviceName: string
  date: string
  time: string
  duration: number
  price: string  // already formatted, e.g. '£20.00' or 'Free'
  dashboardUrl?: string  // optional, for a button to view the booking in the dashboard
}

export default function OwnerNotification({ customerName, businessName, serviceName, date, time, duration, price, dashboardUrl }: Props) {
  return (
    <Html>
      <Body>
        <Container>
          <Heading>New Booking Received</Heading>
          <Text>Hi {businessName},</Text>
          <Text>A new booking has been received for {serviceName} on {date} at {time}.</Text>
          <Text>Customer: {customerName}</Text>
          <Text>Duration: {duration} minutes</Text>
          <Text>Price: {price}</Text>
          {dashboardUrl && (
            <Button href={dashboardUrl}>View Booking</Button>
          )}
        </Container>
      </Body>
    </Html>
  )
}