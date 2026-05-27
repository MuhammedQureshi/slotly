import { Webhook } from 'svix'
  import { headers } from 'next/headers'
  import { supabaseAdmin } from '@/lib/supabase'
  
  export async function POST(req: Request) {
    const payload = await req.text()
    const headersList = await headers()
    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!)
    let event: any
    try {
      event = wh.verify(payload, {
        'svix-id': headersList.get('svix-id')!,
        'svix-timestamp': headersList.get('svix-timestamp')!,
        'svix-signature': headersList.get('svix-signature')!,
      })
    } catch { return new Response('Bad signature', { status: 400 }) }
  
    if (event.type === 'user.created') {
      const { id, email_addresses, first_name, last_name } = event.data
      await supabaseAdmin.from('users').insert({
        clerk_user_id: id,
        email: email_addresses[0].email_address,
        full_name: [first_name, last_name].filter(Boolean).join(' '),
      })
    }
    return new Response('OK', { status: 200 })
  }


