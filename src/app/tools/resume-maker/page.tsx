"use client";

import React, { useState } from "react";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { TOOLS } from "@/constants/tools";
import {
  FileText,
  Check,
  ShieldCheck,
  Sparkles,
  LayoutTemplate,
  User,
  Briefcase,
  GraduationCap,
  Wrench,
  Download,
} from "lucide-react";

export default function ResumeMakerPage() {
  const tool = TOOLS.find((t) => t.id === "resume-maker")!;
  const [activeTab, setActiveTab] = useState<"contact" | "experience" | "education" | "skills">("contact");

  return (
    <ModuleLayout tool={tool}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Interactive Structured Form Sections Mockup (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-surface-200 p-6 sm:p-8 shadow-card">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-surface-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center border border-brand-100">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-surface-900">
                    ATS Resume Form Sections
                  </h3>
                  <p className="text-xs text-surface-500">
                    Structured fields compile directly into clean vector PDF text
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                0 Bytes Stored
              </span>
            </div>

            {/* Form Section Navigation Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveTab("contact")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeTab === "contact"
                    ? "bg-brand-600 text-white shadow-sm"
                    : "bg-surface-100 text-surface-700 hover:bg-surface-200"
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Contact Details</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("experience")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeTab === "experience"
                    ? "bg-brand-600 text-white shadow-sm"
                    : "bg-surface-100 text-surface-700 hover:bg-surface-200"
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Work Experience</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("education")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeTab === "education"
                    ? "bg-brand-600 text-white shadow-sm"
                    : "bg-surface-100 text-surface-700 hover:bg-surface-200"
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Education</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("skills")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeTab === "skills"
                    ? "bg-brand-600 text-white shadow-sm"
                    : "bg-surface-100 text-surface-700 hover:bg-surface-200"
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Skills & Tools</span>
              </button>
            </div>

            {/* Form Fields Workspace Placeholder */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-surface-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    disabled
                    placeholder="e.g. John Doe"
                    className="w-full px-3.5 py-2 text-xs bg-surface-50 border border-surface-200 rounded-xl text-surface-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-700 mb-1">
                    Job Title / Target Role
                  </label>
                  <input
                    type="text"
                    disabled
                    placeholder="e.g. Senior Software Engineer"
                    className="w-full px-3.5 py-2 text-xs bg-surface-50 border border-surface-200 rounded-xl text-surface-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-surface-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    placeholder="e.g. john@example.com"
                    className="w-full px-3.5 py-2 text-xs bg-surface-50 border border-surface-200 rounded-xl text-surface-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-surface-700 mb-1">
                    Phone / Mobile
                  </label>
                  <input
                    type="tel"
                    disabled
                    placeholder="e.g. +91 98765 43210"
                    className="w-full px-3.5 py-2 text-xs bg-surface-50 border border-surface-200 rounded-xl text-surface-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-surface-700 mb-1">
                  Professional Summary
                </label>
                <textarea
                  rows={3}
                  disabled
                  placeholder="A concise, impact-oriented summary of your career and key technical competencies..."
                  className="w-full px-3.5 py-2 text-xs bg-surface-50 border border-surface-200 rounded-xl text-surface-500 cursor-not-allowed resize-none"
                />
              </div>
            </div>

            <div className="mt-6 p-4 rounded-xl bg-brand-50/50 border border-brand-100 flex items-center justify-between text-xs">
              <span className="text-brand-800 font-medium">
                Phase 05 Builder Shell Initialized
              </span>
              <span className="text-[11px] font-mono text-brand-700 bg-white px-2 py-0.5 rounded border border-brand-200">
                pdf-lib Vector Output Ready
              </span>
            </div>
          </div>
        </div>

        {/* Right: Live ATS Vector Preview Stage & Specs (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Live Document Preview Mockup */}
          <div className="bg-white rounded-2xl border border-surface-200 p-6 shadow-subtle">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-surface-900 flex items-center gap-2">
                <LayoutTemplate className="w-4 h-4 text-brand-600" />
                <span>Live ATS Paper Preview</span>
              </h4>
              <span className="text-[11px] font-mono text-surface-500">A4 Standard</span>
            </div>

            {/* Paper Stage */}
            <div className="aspect-[1/1.414] bg-surface-50 rounded-xl border border-surface-200 p-6 flex flex-col justify-between shadow-inner">
              <div className="space-y-3">
                <div className="h-4 w-1/2 bg-surface-200 rounded animate-pulse" />
                <div className="h-2 w-1/3 bg-surface-200 rounded animate-pulse" />
                <div className="pt-4 space-y-2">
                  <div className="h-2 w-full bg-surface-200 rounded animate-pulse" />
                  <div className="h-2 w-5/6 bg-surface-200 rounded animate-pulse" />
                  <div className="h-2 w-4/6 bg-surface-200 rounded animate-pulse" />
                </div>
                <div className="pt-4 space-y-2">
                  <div className="h-2.5 w-1/4 bg-surface-300 rounded" />
                  <div className="h-2 w-full bg-surface-200 rounded" />
                  <div className="h-2 w-full bg-surface-200 rounded" />
                </div>
              </div>

              <div className="text-center pt-4 border-t border-surface-200/80">
                <span className="text-[11px] font-medium text-surface-500">
                  Real-time client-side vector PDF generation via pdf-lib
                </span>
              </div>
            </div>
          </div>

          {/* Privacy & Feature Guarantee */}
          <div className="bg-emerald-50 rounded-2xl border border-emerald-200/80 p-6 text-emerald-950">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h4 className="text-sm font-bold">Confidential Career Data</h4>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed">
              Your resume details and career history are never stored in a cloud database or shared with recruiters. Purely client-side memory.
            </p>
          </div>
        </div>
      </div>
    </ModuleLayout>
  );
}
