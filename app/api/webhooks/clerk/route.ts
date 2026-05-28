import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
  const payload = await req.text()

  const headersList = await headers()

  const svix_id = headersList.get('svix-id')
  const svix_timestamp = headersList.get('svix-timestamp')
  const svix_signature = headersList.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Missing svix headers', { status: 400 })
  }

  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!)

  let event: any

  try {
    event = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    })
  } catch (err) {
    console.error('Webhook verify error:', err)
    return new Response('Bad signature', { status: 400 })
  }

  console.log('Webhook event:', event.type)

  if (event.type === 'user.created') {
    const { id, email_addresses, first_name, last_name } = event.data

    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        clerk_user_id: id,
        email: email_addresses[0].email_address,
        full_name: [first_name, last_name]
          .filter(Boolean)
          .join(' '),
      })
      .select()

    console.log('Insert result:', data)
    console.error('Insert error:', error)
  }

  return new Response('OK', { status: 200 })
}