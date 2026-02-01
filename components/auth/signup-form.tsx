"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { signUp } from "@/lib/auth"

interface SignupFormProps {
  onBackToLogin: () => void
}

export function SignupForm({ onBackToLogin }: SignupFormProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    full_name: "",
    role: "",
    block: "",
    floor_number: "",
    room_number: "",
    phone: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    if (formData.role === "student" && (!formData.block || !formData.floor_number || !formData.room_number)) {
      setError("Block, floor, and room number are required for students")
      setLoading(false)
      return
    }

    try {
      const userData = {
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        role: formData.role as "student" | "staff" | "admin",
        block: formData.role === "student" ? formData.block : undefined,
        floor_number: formData.role === "student" ? Number.parseInt(formData.floor_number) : undefined,
        room_number: formData.role === "student" ? formData.room_number : undefined,
        phone: formData.phone || undefined,
      }

      await signUp(userData)

      // Show success message and redirect to login
      alert("Account created successfully! Please login with your credentials.")
      onBackToLogin()
    } catch (err: any) {
      setError(err.message || "Signup failed")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
        <CardDescription>Sign up for Laundry Management System</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              type="text"
              value={formData.full_name}
              onChange={(e) => handleInputChange("full_name", e.target.value)}
              required
              placeholder="Enter your full name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={formData.role} onValueChange={(value) => handleInputChange("role", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.role === "student" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="block">Block</Label>
                  <Select value={formData.block} onValueChange={(value) => handleInputChange("block", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Block" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">Block A</SelectItem>
                      <SelectItem value="B">Block B</SelectItem>
                      <SelectItem value="C">Block C</SelectItem>
                      <SelectItem value="D">Block D</SelectItem>
                      <SelectItem value="E">Block E</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="floor_number">Floor</Label>
                  <Select
                    value={formData.floor_number}
                    onValueChange={(value) => handleInputChange("floor_number", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Floor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Floor 1</SelectItem>
                      <SelectItem value="2">Floor 2</SelectItem>
                      <SelectItem value="3">Floor 3</SelectItem>
                      <SelectItem value="4">Floor 4</SelectItem>
                      <SelectItem value="5">Floor 5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="room_number">Room Number</Label>
                <Input
                  id="room_number"
                  type="text"
                  value={formData.room_number}
                  onChange={(e) => handleInputChange("room_number", e.target.value)}
                  required
                  placeholder="Enter room number"
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number (Optional)</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              placeholder="Enter phone number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              required
              placeholder="Enter password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
              required
              placeholder="Confirm password"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating Account..." : "Sign Up"}
          </Button>

          <Button type="button" variant="outline" className="w-full bg-transparent" onClick={onBackToLogin}>
            Back to Login
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
