"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Zap,
  Lock,
  Camera,
  Scissors,
  SlidersHorizontal,
  CreditCard,
  FileText,
  CheckCircle2,
  Cpu,
  Layers,
  Crop,
  Printer,
  ChevronRight,
  HardDriveDownload,
  Info,
} from "lucide-react";
import { TOOLS, TOOL_CATEGORIES } from "@/constants/tools";
import { ToolMetadata } from "@/types/tools";
import { CategoryCard } from "@/components/common/CategoryCard";
import { ToolCard } from "@/components/common/ToolCard";
import { PrivacyNotice } from "@/components/common/PrivacyNotice";
import { FileDropzone } from "@/components/common/FileDropzone";
import { NotificationBanner } from "@/components/common/NotificationBanner";
import { useNotification } from "@/hooks/useNotification";

// 5 Featured Tools for Section 4B
const FEATURED_TOOL_IDS = [
  "photo-studio",
  "background-remover",
  "photo-editor",
  "pan-card-crop", // Smart Document Crop
  "resume-maker",
];

export default function HomePage() {
  const { notifications, notify, removeNotification } = useNotification();
  const [activeMockupTab, setActiveMockupTab] = useState<"passport" | "card" | "resume">("passport");

  const handleDemoFileSelect = (file: File) => {
    notify({
      type: "success",
      title: "File Inspected In-Memory",
      message: `"${file.name}" (${(file.size / (1024 * 1024)).toFixed(2)} MB) loaded strictly into client memory. 0 bytes uploaded.`,
      duration: 6000,
    });
  };

  // Get the 5 featured tools
  const featuredTools: {
    id: string;
    name: string;
    shortDescription: string;
    route: string;
    icon: React.ElementType;
    badge: string;
    features: string[];
    accentColor: string;
    iconBg: string;
    iconColor: string;
  }[] = [
    {
      id: "photo-studio",
      name: "Professional Photo Studio",
      shortDescription: "Generate standard Indian passport, visa, and stamp-size photos with customizable backdrops.",
      route: "/tools/photo-studio",
      icon: Camera,
      badge: "Passport & Visa",
      features: ["Indian Passport (35×45 mm)", "US & Schengen Visa presets", "300 DPI resolution", "Name & Date imprint"],
      accentColor: "hover:border-blue-300",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      id: "background-remover",
      name: "Background Remover",
      shortDescription: "Automatically remove image backgrounds using in-browser neural networks with zero server uploads.",
      route: "/tools/background-remover",
      icon: Scissors,
      badge: "Local AI",
      features: ["100% on-device AI model", "Fine edge alpha matting", "Transparent PNG export", "Zero cloud latency"],
      accentColor: "hover:border-violet-300",
      iconBg: "bg-violet-50",
      iconColor: "text-violet-600",
    },
    {
      id: "photo-editor",
      name: "Advanced Photo Editor",
      shortDescription: "Crop, rotate, adjust tone, and compress photos to exact target file sizes in browser memory.",
      route: "/tools/photo-editor",
      icon: SlidersHorizontal,
      badge: "Canvas Editor",
      features: ["Non-destructive curves", "Aspect ratio presets", "Target KB compressor (<50KB)", "Instant browser export"],
      accentColor: "hover:border-teal-300",
      iconBg: "bg-teal-50",
      iconColor: "text-teal-600",
    },
    {
      id: "smart-document-crop",
      name: "Smart Document Crop",
      shortDescription: "Extract front and back PAN, Aadhaar, and Ration cards to standard ISO/IEC 7810 ID-1 wallet size.",
      route: "/tools/pan-card-crop",
      icon: CreditCard,
      badge: "ID-1 Standard",
      features: ["PAN & Aadhaar calibration", "Dual-side front & back", "High-contrast text boost", "Print-ready A4 sheet"],
      accentColor: "hover:border-emerald-300",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      id: "resume-maker",
      name: "Resume / CV Maker",
      shortDescription: "Craft clean, modern ATS-friendly resumes with instant browser vector PDF rendering.",
      route: "/tools/resume-maker",
      icon: FileText,
      badge: "ATS-Ready",
      features: ["Structured form builder", "Live side-by-side preview", "Direct vector PDF export", "Zero employment profiling"],
      accentColor: "hover:border-indigo-300",
      iconBg: "bg-indigo-50",
      iconColor: "text-indigo-600",
    },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <NotificationBanner notifications={notifications} onDismiss={removeNotification} />

      {/* 4A. HERO SECTION */}
      <section className="relative overflow-hidden bg-white border-b border-surface-200/80 pt-16 pb-20 lg:pt-20 lg:pb-24">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            {/* Zero-Upload Guarantee Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-subtle mb-6 animate-in fade-in">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Zero-Upload Guarantee • 100% In-Browser Execution</span>
            </div>

            {/* Suggested Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-surface-900 tracking-tight leading-[1.15]">
              Everything You Need to{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-indigo-600 to-teal-600">
                Edit, Crop & Create.
              </span>
            </h1>

            {/* Suggested Subtitle */}
            <p className="mt-5 text-base sm:text-lg text-surface-600 leading-relaxed max-w-2xl mx-auto">
              Professional photo, document and printing tools. Process everything directly in your browser.
            </p>

            {/* Actions: Primary Explore Tools & Secondary Privacy Information */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link
                href="/tools"
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 transition-all shadow-sm hover:shadow gap-2 group"
              >
                <span>Explore Tools</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/privacy"
                className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-3 rounded-xl text-sm font-semibold bg-surface-100 text-surface-800 hover:bg-surface-200 hover:text-surface-900 transition-colors border border-surface-200/80 gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Privacy Guarantee</span>
              </Link>
            </div>

            {/* Architectural Trust Points */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-surface-500 font-medium">
              <div className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>0 Server Uploads</span>
              </div>
              <span className="text-surface-300 hidden sm:inline">•</span>
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Instant WASM Speed</span>
              </div>
              <span className="text-surface-300 hidden sm:inline">•</span>
              <div className="flex items-center gap-1.5">
                <HardDriveDownload className="w-3.5 h-3.5 text-brand-600" />
                <span>300 DPI Print Calibration</span>
              </div>
              <span className="text-surface-300 hidden sm:inline">•</span>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>8 Modular Tools</span>
              </div>
            </div>
          </div>

          {/* Visual Illustration of the Utility Platform (4A) */}
          <div className="mt-14 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-surface-200 shadow-float overflow-hidden">
              {/* Window Header */}
              <div className="bg-surface-100/90 border-b border-surface-200 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-surface-300" />
                  <div className="w-3 h-3 rounded-full bg-surface-300" />
                  <div className="w-3 h-3 rounded-full bg-surface-300" />
                  <span className="ml-2 text-xs font-mono text-surface-500 hidden sm:inline">
                    studio.local/in-memory-canvas
                  </span>
                </div>

                {/* Illustration View Switcher */}
                <div className="flex items-center gap-1 bg-surface-200/70 p-1 rounded-lg text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setActiveMockupTab("passport")}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      activeMockupTab === "passport" ? "bg-white text-surface-900 shadow-sm" : "text-surface-600 hover:text-surface-900"
                    }`}
                  >
                    Passport Studio
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMockupTab("card")}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      activeMockupTab === "card" ? "bg-white text-surface-900 shadow-sm" : "text-surface-600 hover:text-surface-900"
                    }`}
                  >
                    ID-1 Card Cropper
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMockupTab("resume")}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      activeMockupTab === "resume" ? "bg-white text-surface-900 shadow-sm" : "text-surface-600 hover:text-surface-900"
                    }`}
                  >
                    ATS Vector Resume
                  </button>
                </div>
              </div>

              {/* Window Canvas Stage Body */}
              <div className="p-6 sm:p-8 bg-surface-50">
                {activeMockupTab === "passport" && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    <div className="md:col-span-7 space-y-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        <Camera className="w-3.5 h-3.5" />
                        <span>35 × 45 mm Passport Calibration</span>
                      </div>
                      <h3 className="text-xl font-bold text-surface-900">
                        Precision Biometric Alignment & Multi-Copy Sheet Tiling
                      </h3>
                      <p className="text-xs text-surface-600 leading-relaxed">
                        Automatic head-to-chin guidelines, uniform white/blue backdrop replacement, and 300 DPI high-resolution export ready for official passport and visa submissions.
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-2.5 py-1 rounded-lg bg-white border border-surface-200 font-medium text-surface-700">
                          ✓ Indian Passport 3.5×4.5 cm
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-white border border-surface-200 font-medium text-surface-700">
                          ✓ US Visa 2×2 Inch
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-white border border-surface-200 font-medium text-surface-700">
                          ✓ A4 & 4×6&quot; Photo Sheets
                        </span>
                      </div>
                    </div>

                    <div className="md:col-span-5 flex justify-center">
                      <div className="relative w-44 h-56 bg-white rounded-2xl border-2 border-brand-500 shadow-card p-3 flex flex-col items-center justify-between">
                        {/* Overlay guidelines */}
                        <div className="absolute inset-x-4 top-10 border-b border-dashed border-brand-400 text-[10px] text-brand-600 font-mono text-center">
                          Crown Guide
                        </div>
                        <div className="absolute inset-x-4 bottom-14 border-b border-dashed border-brand-400 text-[10px] text-brand-600 font-mono text-center">
                          Chin Guide
                        </div>
                        <div className="w-20 h-24 rounded-full bg-surface-200/80 mt-4 flex items-center justify-center">
                          <Camera className="w-8 h-8 text-surface-400" />
                        </div>
                        <div className="w-full text-center">
                          <span className="text-[11px] font-bold text-surface-800 block">35 × 45 mm</span>
                          <span className="text-[10px] font-mono text-emerald-600">300 DPI • Local RAM</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeMockupTab === "card" && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    <div className="md:col-span-7 space-y-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>ISO/IEC 7810 ID-1 Standard (85.6 × 53.98 mm)</span>
                      </div>
                      <h3 className="text-xl font-bold text-surface-900">
                        Government Identity Card Dual-Side Crop Pipeline
                      </h3>
                      <p className="text-xs text-surface-600 leading-relaxed">
                        Crop front and back sections of PAN, Aadhaar, and Ration Card documents with calibrated aspect locking, dot-matrix text enhancement, and printable PVC sheet layout.
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-2.5 py-1 rounded-lg bg-white border border-surface-200 font-medium text-surface-700">
                          ✓ NSDL / UTIITSL PAN PDFs
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-white border border-surface-200 font-medium text-surface-700">
                          ✓ In-Browser e-Aadhaar Unlock
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-white border border-surface-200 font-medium text-surface-700">
                          ✓ 1:1 Scale Print Calibrated
                        </span>
                      </div>
                    </div>

                    <div className="md:col-span-5 flex justify-center">
                      <div className="w-56 h-36 bg-white rounded-xl border-2 border-teal-500 shadow-card p-3 flex flex-col justify-between">
                        <div className="flex items-center justify-between border-b border-surface-100 pb-2">
                          <span className="text-xs font-bold text-surface-900">ID-1 CARD STANDARD</span>
                          <span className="text-[10px] font-mono bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded">
                            1.586 : 1
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-14 rounded bg-surface-200/80 flex items-center justify-center shrink-0">
                            <CreditCard className="w-6 h-6 text-surface-400" />
                          </div>
                          <div className="space-y-1.5 w-full">
                            <div className="h-2 w-full bg-surface-200 rounded" />
                            <div className="h-2 w-3/4 bg-surface-200 rounded" />
                            <div className="h-2 w-1/2 bg-surface-200 rounded" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-surface-500 font-mono pt-1">
                          <span>85.6 mm</span>
                          <span className="text-emerald-600 font-semibold">0 Server Uploads</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeMockupTab === "resume" && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    <div className="md:col-span-7 space-y-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200">
                        <FileText className="w-3.5 h-3.5" />
                        <span>ATS-Friendly Vector Document Builder</span>
                      </div>
                      <h3 className="text-xl font-bold text-surface-900">
                        Clean ATS Resume Maker with Vector PDF Synthesis
                      </h3>
                      <p className="text-xs text-surface-600 leading-relaxed">
                        Design professional, recruiter-ready resumes without signing up or exposing your sensitive employment records to cloud job boards.
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-2.5 py-1 rounded-lg bg-white border border-surface-200 font-medium text-surface-700">
                          ✓ Pure Vector PDF Output
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-white border border-surface-200 font-medium text-surface-700">
                          ✓ Selectable Text & ATS Scores
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-white border border-surface-200 font-medium text-surface-700">
                          ✓ Zero Account Requirement
                        </span>
                      </div>
                    </div>

                    <div className="md:col-span-5 flex justify-center">
                      <div className="w-48 h-56 bg-white rounded-xl border-2 border-violet-500 shadow-card p-4 flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="h-3 w-3/4 bg-surface-300 rounded" />
                          <div className="h-2 w-1/2 bg-surface-200 rounded" />
                          <div className="pt-2 space-y-1.5">
                            <div className="h-1.5 w-full bg-surface-200 rounded" />
                            <div className="h-1.5 w-5/6 bg-surface-200 rounded" />
                            <div className="h-1.5 w-4/6 bg-surface-200 rounded" />
                          </div>
                        </div>
                        <div className="border-t border-surface-100 pt-2 flex items-center justify-between text-[10px] text-surface-500 font-mono">
                          <span>pdf-lib Vector</span>
                          <span className="text-emerald-600 font-semibold">Client-Only</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4B. FEATURED TOOLS SECTION */}
      <section className="py-16 sm:py-20 bg-surface-50 border-b border-surface-200/80" id="featured-tools">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 block mb-1">
                Essential Studio Utilities
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight">
                Featured Tools
              </h2>
              <p className="text-xs sm:text-sm text-surface-600 mt-1 max-w-2xl">
                The most popular client-side photo, document, and printing workflows built for precision and privacy.
              </p>
            </div>

            <Link
              href="/tools"
              className="inline-flex items-center text-xs font-semibold text-brand-600 hover:text-brand-800 transition-colors gap-1.5 shrink-0"
            >
              <span>View all 8 utilities</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* 5 Featured Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link
                  key={tool.id}
                  href={tool.route}
                  className={`group relative flex flex-col justify-between bg-white rounded-2xl border border-surface-200/90 p-6 shadow-subtle hover:shadow-float hover:-translate-y-1 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 ${tool.accentColor}`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 border border-surface-200/60 ${tool.iconBg} ${tool.iconColor}`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                        {tool.badge}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-surface-900 group-hover:text-brand-600 transition-colors">
                      {tool.name}
                    </h3>
                    <p className="text-xs text-surface-600 mt-2 line-clamp-2 leading-relaxed">
                      {tool.shortDescription}
                    </p>

                    <div className="mt-4 pt-3 border-t border-surface-100 flex flex-wrap gap-1.5">
                      {tool.features.slice(0, 2).map((feat, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] text-surface-600 bg-surface-50 px-2 py-0.5 rounded-md border border-surface-200/60 truncate max-w-full"
                        >
                          • {feat}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-2 flex items-center justify-between text-xs font-semibold text-brand-600 group-hover:text-brand-700">
                    <span>Open Tool</span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4C. CATEGORIES SECTION */}
      <section className="py-16 sm:py-20 bg-white border-b border-surface-200/80" id="categories">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 block mb-1">
              Organized Catalog
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight">
              Explore by Tool Category
            </h2>
            <p className="text-xs sm:text-sm text-surface-600 mt-2">
              Select a specialized category to find tailored utilities for photo editing, government document card cropping, PDF workflows, or resume drafting.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TOOL_CATEGORIES.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Dropzone Verification Showcase (Zero-Upload Demonstration) */}
      <section className="py-16 bg-surface-50 border-b border-surface-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl border border-surface-200/90 p-8 sm:p-12 shadow-subtle">
            <div className="max-w-2xl mb-8">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
                Interactive Verification Stage
              </span>
              <h2 className="text-2xl font-bold text-surface-900 mt-1 tracking-tight">
                Inspect In-Browser File Ingestion
              </h2>
              <p className="text-xs sm:text-sm text-surface-600 mt-2 leading-relaxed">
                Drop any document or photo below to verify client-side validation and ephemeral memory isolation. Open your browser Developer Tools (F12) to verify that zero network bytes leave your machine.
              </p>
            </div>

            <FileDropzone
              label="Drop an image or PDF to inspect in browser"
              hint="Supports JPG, PNG, WebP, and PDF up to 25 MB. Never uploaded."
              onFileSelect={handleDemoFileSelect}
              maxSizeMB={25}
            />
          </div>
        </div>
      </section>

      {/* 4D. PRIVACY SECTION */}
      <section className="py-16 sm:py-20 bg-white" id="privacy-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Architectural Privacy By Design</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight">
              Strict Zero-Upload Architecture
            </h2>
            <p className="text-xs sm:text-sm text-surface-600 mt-2 leading-relaxed">
              We believe citizen documents and biometric portraits should remain in citizen hands. Here is exactly how our platform protects your digital sovereignty:
            </p>
          </div>

          <PrivacyNotice variant="card" />

          {/* DevTools Verification Callout */}
          <div className="mt-8 p-6 rounded-2xl bg-surface-50 border border-surface-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-surface-200 text-surface-700 flex items-center justify-center shrink-0">
                <Info className="w-4 h-4" />
              </div>
              <p className="text-surface-700">
                Want to inspect the network tab yourself? Follow our independent verification instructions.
              </p>
            </div>
            <Link
              href="/privacy"
              className="font-semibold text-brand-600 hover:text-brand-800 hover:underline shrink-0"
            >
              Read Verification Guide &rarr;
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
