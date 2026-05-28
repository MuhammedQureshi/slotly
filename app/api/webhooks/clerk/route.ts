import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import type { WebhookEvent } from '@clerk/nextjs/server'

export async function POST(req: Request) {
  const payload = await req.text()
  const headersList = await headers()

  const svix_id = headersList.get('svix-id')
  const svix_timestamp = headersList.get('svix-timestamp')
  const svix_signature = headersList.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Missing headers', { status: 400 })
  }

  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!)

  let event: WebhookEvent

  try {
    event = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Webhook verification failed:', err)
    return new Response('Bad signature', { status: 400 })
  }

  console.log('Event type:', event.type)

  if (event.type === 'user.created') {
    const { id, email_addresses, first_name, last_name } = event.data

    const { error } = await supabaseAdmin.from('users').insert({
      clerk_user_id: id,
      email: email_addresses[0].email_address,
      full_name: [first_name, last_name].filter(Boolean).join(' '),
    })

    if (error) {
      console.error('Supabase error:', error)
    }
  }

  return new Response('OK')
}