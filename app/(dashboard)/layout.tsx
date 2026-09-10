  import { Sidebar } from '@/components/dashboard/Sidebar'
import { currentUser } from '@clerk/nextjs/server'
import { ToastProvider } from '@/components/ui/toast'
  
  export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const user = await currentUser()
    return (
      <ToastProvider>
        <div className="flex h-dvh flex-col overflow-hidden bg-stone-50 md:flex-row">
          <Sidebar userName={user?.firstName} />
          <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-5xl">{children}</div>
          </main>
        </div>
      </ToastProvider>
    )
  }
