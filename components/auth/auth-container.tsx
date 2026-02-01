"use client"

import { useState } from "react"
import { LoginForm } from "./login-form"
import { SignupForm } from "./signup-form"

export function AuthContainer() {
  const [showSignup, setShowSignup] = useState(false)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {showSignup ? (
        <SignupForm onBackToLogin={() => setShowSignup(false)} />
      ) : (
        <LoginForm onShowSignup={() => setShowSignup(true)} />
      )}
    </div>
  )
}
