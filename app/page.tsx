"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay * 1000)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div
      className={`transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      } ${className}`}
    >
      {children}
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Sparkles */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="sparkle sparkle-hero-1" />
        <div className="sparkle sparkle-hero-2" />
        <div className="sparkle sparkle-hero-3" />
        <div className="sparkle sparkle-hero-4" />
        <div className="sparkle sparkle-hero-5" />
        <div className="sparkle sparkle-hero-6" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <FadeIn className="text-2xl font-bold gradient-text font-display">
            SoloSuccess AI
          </FadeIn>
          <FadeIn delay={0.2} className="flex gap-4">
            <Link
              href="/auth/signin"
              className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-all duration-300"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-300"
            >
              Get Started
            </Link>
          </FadeIn>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
        <FadeIn className="max-w-5xl">
          <h1 className="text-6xl sm:text-8xl font-display gradient-text tracking-wider mb-8 relative">
            SoloSuccess AI
            <div className="sparkle sparkle-title-1" />
            <div className="sparkle sparkle-title-2" />
          </h1>

          <FadeIn delay={0.3}>
            <h2 className="text-3xl sm:text-4xl text-white mb-8 font-bold font-body">
              Your Empire. Your Vision. Your AI DreamTeam.
            </h2>
          </FadeIn>

          <FadeIn delay={0.5}>
            <p className="text-xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed font-body">
              Transform your content creation with AI-powered planning,
              scheduling, and optimization. Build your empire with intelligent
              automation and strategic insights.
            </p>
          </FadeIn>

          <FadeIn delay={0.7} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/auth/signup"
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-lg text-lg font-bold hover:shadow-lg hover:scale-105 transition-all duration-300"
            >
              Start Your Journey
            </Link>
            <Link
              href="/auth/signin"
              className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-white/20 transition-all duration-300"
            >
              Already have an account?
            </Link>
          </FadeIn>
        </FadeIn>
      </div>

      {/* Features Section */}
      <FadeIn delay={1} className="relative z-10 max-w-7xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-card text-center p-6">
            <div className="text-4xl mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 mx-auto text-holo-cyan"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">AI-Powered Content</h3>
            <p className="text-white/80">
              Generate compelling content ideas, blog posts, and social media
              content with advanced AI.
            </p>
          </div>

          <div className="glass-card text-center p-6">
            <div className="text-4xl mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 mx-auto text-holo-pink"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Smart Scheduling</h3>
            <p className="text-white/80">
              Automatically schedule and optimize your content for maximum
              engagement and reach.
            </p>
          </div>

          <div className="glass-card text-center p-6">
            <div className="text-4xl mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 mx-auto text-holo-gold"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-3">
              Analytics & Insights
            </h3>
            <p className="text-white/80">
              Track performance and get actionable insights to grow your audience
              and engagement.
            </p>
          </div>
        </div>
      </FadeIn>

      {/* Footer */}
      <FadeIn delay={1.2} className="relative z-10 text-center pb-8 text-white/60">
        <p>
          &copy; {new Date().getFullYear()} SoloSuccess AI. Building your
          empire, one post at a time.
        </p>
      </FadeIn>
    </div>
  )
}
