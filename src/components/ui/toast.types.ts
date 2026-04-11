import * as React from "react"

export type ToastActionElement = React.ReactElement

export interface ToastProps {
  variant?: "default" | "destructive"
  onOpenChange?: (open: boolean) => void
  open?: boolean
  children?: React.ReactNode
  className?: string
}

export interface ToastActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  altText?: string
}