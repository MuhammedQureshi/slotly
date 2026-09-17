"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { CircleAlert, CircleCheck, X } from "lucide-react"

type ToastVariant = "success" | "error"

type ToastInput = {
  title: string
  description?: string
  variant?: ToastVariant
}

type ToastItem = ToastInput & {
  id: number
}

type ToastContextValue = {
  toast: (input: ToastInput) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let nextToastId = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>())

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id)
    if (timer) clearTimeout(timer)
    timers.current.delete(id)
    setToasts((current) => current.filter((item) => item.id !== id))
  }, [])

  const toast = useCallback((input: ToastInput) => {
    const id = ++nextToastId
    setToasts((current) => [...current.slice(-2), { ...input, id }])

    const timer = setTimeout(() => {
      timers.current.delete(id)
      setToasts((current) => current.filter((item) => item.id !== id))
    }, 4000)

    timers.current.set(id, timer)
  }, [])

  useEffect(() => {
    const activeTimers = timers.current
    return () => {
      activeTimers.forEach(clearTimeout)
      activeTimers.clear()
    }
  }, [])

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed right-4 bottom-4 z-100 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((item) => {
          const isError = item.variant === "error"
          const Icon = isError ? CircleAlert : CircleCheck

          return (
            <div
              key={item.id}
              role={isError ? "alert" : "status"}
              className="pointer-events-auto flex items-start gap-3 rounded-xl border border-stone-200 bg-white p-4 text-stone-950 shadow-lg animate-in fade-in slide-in-from-bottom-2"
            >
              <Icon
                aria-hidden="true"
                className={isError ? "mt-0.5 size-5 shrink-0 text-red-600" : "mt-0.5 size-5 shrink-0 text-emerald-600"}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{item.title}</p>
                {item.description && (
                  <p className="mt-1 text-sm leading-5 text-stone-600">{item.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                className="-mr-1 -mt-1 grid size-7 shrink-0 place-items-center rounded-md text-stone-400 transition hover:bg-stone-100 hover:text-stone-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
              >
                <X aria-hidden="true" className="size-4" />
                <span className="sr-only">Dismiss notification</span>
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }

  return context
}
