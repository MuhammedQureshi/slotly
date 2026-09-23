import { Html, Body, Container, Heading, Text, Button } from '@react-email/components'

type Props = {
  customerName: string
  businessName: string
  serviceName: string
  date: string
  time: string
  duration: number
  price: string  // already formatted, e.g. '£20.00' or 'Free'
  cancelUrl: string
}

export default function BookingConfirmation({ customerName, businessName, serviceName, date, time, duration, price, cancelUrl }: Props) {
  return (
    <Html>
      <Body>
        <Container>
          <Heading>Booking Confirmed!</Heading>
          <Text>Hi {customerName},</Text>
          <Text>You have successfully booked a {serviceName} with {businessName} on {date} at {time}.</Text>
          <Text>Duration: {duration} minutes</Text>
          <Text>Price: {price}</Text>
          <Button href={cancelUrl}>Cancel Booking</Button>
        </Container>
      </Body>
    </Html>
  )
}