  import { Sidebar } from '@/components/dashboard/Sidebar'
import { auth, currentUser } from '@clerk/nextjs/server'
  
  export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const user = await currentUser()
    return (
      <div className="flex h-screen bg-stone-50 overflow-hidden">
        <Sidebar userName={user?.firstName} />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto">{children}</div>
        </main>
      </div>
    )
  }
