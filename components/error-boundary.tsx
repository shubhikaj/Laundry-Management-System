"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo)
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />
      }

      return (
        <Card className="w-full max-w-md mx-auto mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Something went wrong
            </CardTitle>
            <CardDescription>
              An unexpected error occurred. Please try refreshing the page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {this.state.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800 font-mono">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={this.resetError} variant="outline">
                Try Again
              </Button>
              <Button onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
            </div>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}

// Simple error fallback component
export function SimpleErrorFallback({ error, resetError }: { error?: Error; resetError: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-[200px] p-4">
      <Card className="w-full max-w-sm">
        <CardContent className="pt-6 text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-4">
            Something went wrong with this component
          </p>
          <Button onClick={resetError} size="sm">
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

