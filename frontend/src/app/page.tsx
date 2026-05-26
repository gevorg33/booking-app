'use client';

import Link from 'next/link';
import { Calendar, Brain, Shield, Zap, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <nav className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">OptiSchedule</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-gray-400 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/register" className="btn-primary">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-500/20 rounded-full px-4 py-1.5 text-blue-400 text-sm mb-6">
            <Brain className="w-4 h-4" />
            AI-Native Operations Platform
          </div>
          <h1 className="text-5xl font-bold tracking-tight mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Scheduling that thinks for your business
          </h1>
          <p className="text-xl text-gray-400 mb-10 leading-relaxed">
            Express intent, not instructions. Our AI operator understands your business goals and
            orchestrates optimal schedules, resolves conflicts, and maximizes utilization —
            automatically.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="btn-primary text-lg px-8 py-3 flex items-center gap-2"
            >
              Start Free <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/login" className="btn-secondary text-lg px-8 py-3">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="card">
            <div className="w-12 h-12 bg-blue-600/10 rounded-xl flex items-center justify-center mb-4">
              <Brain className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Intent-Driven AI</h3>
            <p className="text-gray-400">
              Say &quot;fill empty slots tomorrow&quot; and the AI builds a validated plan. No manual
              scheduling required.
            </p>
          </div>
          <div className="card">
            <div className="w-12 h-12 bg-green-600/10 rounded-xl flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Safe by Design</h3>
            <p className="text-gray-400">
              AI proposes, the system validates. Every action passes through policy checks, constraint
              validation, and audit logging.
            </p>
          </div>
          <div className="card">
            <div className="w-12 h-12 bg-purple-600/10 rounded-xl flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Deterministic Engine</h3>
            <p className="text-gray-400">
              10-minute slot precision. Prevents double-booking. Handles breaks, vacations, and
              business rules automatically.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-800 px-6 py-8 mt-16">
        <div className="max-w-7xl mx-auto text-center text-gray-500 text-sm">
          OptiSchedule — AI-native scheduling platform
        </div>
      </footer>
    </div>
  );
}
