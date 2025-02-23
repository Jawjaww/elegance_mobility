"use client"

import { PropsWithChildren } from "react"
import { ToastProvider } from "@/components/providers/toast-provider"

export function Providers({ children }: PropsWithChildren) {
  return (
    <>
      {children}
      <ToastProvider />
    </>
  )
}