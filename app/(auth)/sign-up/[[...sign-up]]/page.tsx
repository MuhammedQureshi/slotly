import { SignUp } from '@clerk/nextjs'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

export default function SignUpPage() {
  return <main className="grid min-h-dvh place-items-center bg-muted/30 px-4 py-10">
    <div className="w-full max-w-md space-y-6 text-center">
      <div className="space-y-2">
        <Link href="/" className="text-2xl font-bold tracking-tight">Slot<span className="text-amber-600">ly</span></Link>
        <div><Badge variant="secondary">Built for barbers</Badge></div>
        <h1 className="text-xl font-semibold">Create your account</h1>
      </div>
      <div className="flex justify-center"><SignUp fallbackRedirectUrl="/dashboard" /></div>
    </div>
  </main>
}
