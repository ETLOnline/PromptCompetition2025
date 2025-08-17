"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"

interface RegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (input: string) => void
  competitionTitle: string
  isLoading: boolean
}

export const RegistrationModal = ({
  isOpen,
  onClose,
  onConfirm,
  competitionTitle,
  isLoading,
}: RegistrationModalProps) => {
  const [registerInput, setRegisterInput] = useState("")

  const handleConfirm = () => {
    onConfirm(registerInput)
    setRegisterInput("")
  }

  const handleClose = () => {
    setRegisterInput("")
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Confirm Registration</h3>
          <Button variant="ghost" size="sm" onClick={handleClose} className="h-8 w-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            You are about to register for <strong>{competitionTitle}</strong>
          </p>
          <p className="text-sm text-gray-600">
            Type <strong>"REGISTER"</strong> to confirm your registration.
          </p>
          <Input
            placeholder="Type REGISTER to confirm"
            value={registerInput}
            onChange={(e) => setRegisterInput(e.target.value)}
            className="w-full"
            disabled={isLoading}
          />
          <div className="flex gap-2 pt-2">
            <Button onClick={handleConfirm} disabled={registerInput !== "REGISTER" || isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Registering...
                </>
              ) : (
                "Confirm Registration"
              )}
            </Button>
            <Button variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
