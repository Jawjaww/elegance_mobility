import { useState } from "react"
import { DeliveryRun } from "@/lib/stores/runsStore"

interface UseRunDialogReturn {
  isOpen: boolean
  run: DeliveryRun | null
  onOpen: () => void
  onOpenEdit: (run: DeliveryRun) => void
  onClose: () => void
}

const defaultRun: Partial<DeliveryRun> = {
  status: "pending",
  time_window_start: new Date(),
  time_window_end: new Date(Date.now() + 30 * 60 * 1000), // +30 minutes par défaut
}

export function useRunDialog(): UseRunDialogReturn {
  const [isOpen, setIsOpen] = useState(false)
  const [run, setRun] = useState<DeliveryRun | null>(null)

  const onOpen = () => {
    setRun(defaultRun as DeliveryRun)
    setIsOpen(true)
  }

  const onOpenEdit = (run: DeliveryRun) => {
    setRun(run)
    setIsOpen(true)
  }

  const onClose = () => {
    setIsOpen(false)
    setRun(null)
  }

  return {
    isOpen,
    run,
    onOpen,
    onOpenEdit,
    onClose,
  }
}