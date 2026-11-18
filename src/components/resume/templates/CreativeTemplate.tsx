"use client";

import React from "react";
import { ResumeData } from "@/types/resume";
import { getPhotoDimensions } from "@/lib/resume/resume-photo";
import { Mail, Phone, MapPin, Globe, Linkedin, Github, Twitter, Sparkles, ExternalLink } from "lucide-react";

export interface TemplateProps {
  data: ResumeData;
}

export const CreativeTemplate: React.FC<TemplateProps> = ({ data }) => {
  const { personalInfo, summary, experiences, education, skills, projects, certifications, languages, awards, achievements } = data;

  return (
    <div className="w-full bg-white text-neutral-900 font-sans p-8 sm:p-12 text-[13px] leading-relaxed select-text">
      {/* Creative Header */}
      <header className="pb-6 mb-6 border-b-2 border-violet-500/80 flex items-start justify-between gap-6">
        <div className="flex-1 min-w-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-800 text-[11px] font-semibold mb-2">
            <Sparkles className="w-3 h-3 text-violet-600" />
            <span>Creative Portfolio</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-neutral-900 tracking-tight">
            {personalInfo.fullName || "Your Full Name"}
          </h1>
          {personalInfo.jobTitle && (
            <p className="text-base sm:text-lg font-bold text-violet-700 mt-1">
              {personalInfo.jobTitle}
            </p>
          )}

          {/* Social and Contact Badges */}
          <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
            {personalInfo.email && (
              <a
                href={`mailto:${personalInfo.email}`}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-neutral-100 hover:bg-violet-50 text-neutral-800 hover:text-violet-700 transition-colors"
              >
                <Mail className="w-3 h-3 text-violet-600" />
                <span>{personalInfo.email}</span>
              </a>
            )}
            {personalInfo.phone && (
              <a
                href={`tel:${personalInfo.phone.replace(/\s+/g, "")}`}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-neutral-100 hover:bg-violet-50 text-neutral-800 hover:text-violet-700 transition-colors"
              >
                <Phone className="w-3 h-3 text-violet-600" />
                <span>{personalInfo.phone}</span>
              </a>
            )}
            {personalInfo.location && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-neutral-100 text-neutral-700">
                <MapPin className="w-3 h-3 text-violet-600" />
                <span>{personalInfo.location}</span>
              </span>
            )}
            {personalInfo.portfolio && (
              <a
                href={personalInfo.portfolio}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-violet-50 hover:bg-violet-100 text-violet-800 font-semibold transition-colors"
              >
                <Globe className="w-3 h-3 text-violet-600" />
                <span>Portfolio</span>
              </a>
            )}
            {personalInfo.github && (
              <a
                href={personalInfo.github}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition-colors"
              >
                <Github className="w-3 h-3" />
                <span>GitHub</span>
              </a>
            )}
            {personalInfo.linkedIn && (
              <a
                href={personalInfo.linkedIn}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-neutral-100 hover:bg-violet-50 text-neutral-800 hover:text-violet-700 transition-colors"
              >
                <Linkedin className="w-3 h-3 text-violet-600" />
                <span>LinkedIn</span>
              </a>
            )}
            {personalInfo.twitter && (
              <a
                href={personalInfo.twitter}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-neutral-100 hover:bg-violet-50 text-neutral-800 hover:text-violet-700 transition-colors"
              >
                <Twitter className="w-3 h-3 text-violet-600" />
                <span>Twitter</span>
              </a>
            )}
          </div>
        </div>

        {/* Profile Photo if enabled */}
        {personalInfo.showPhoto && personalInfo.photoUrl && (() => {
          const photoDims = getPhotoDimensions(personalInfo.photoSize, personalInfo.photoShape);
          return (
            <div
              className={`shrink-0 overflow-hidden ${
                photoDims.isCircle ? "rounded-full" : "rounded-none"
              }`}
              style={{
                width: `${photoDims.previewWidthPx}px`,
                height: `${photoDims.previewHeightPx}px`,
                minWidth: `${photoDims.previewWidthPx}px`,
                minHeight: `${photoDims.previewHeightPx}px`,
                maxWidth: `${photoDims.previewWidthPx}px`,
                maxHeight: `${photoDims.previewHeightPx}px`,
                flex: `0 0 ${photoDims.previewWidthPx}px`,
                borderRadius: photoDims.isCircle ? "50%" : "0",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={personalInfo.photoUrl}
                alt={personalInfo.fullName || "Profile"}
                className={`w-full h-full object-cover block ${
                  photoDims.isCircle ? "rounded-full" : "rounded-none"
                }`}
                style={{
                  width: "100%",
                  height: "100%",
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "cover",
                  objectPosition: "center",
                  borderRadius: photoDims.isCircle ? "50%" : "0",
                  display: "block",
                }}
              />
            </div>
          );
        })()}
      </header>

      {/* Summary / Creative Bio */}
      {summary && summary.trim() && (
        <section className="mb-6">
          <h2 className="text-xs font-black uppercase tracking-wider text-violet-800 mb-2 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-600" />
            <span>Creative Profile & Vision</span>
          </h2>
          <p className="text-neutral-700 leading-relaxed text-xs sm:text-[13px] text-justify">
            {summary}
          </p>
        </section>
      )}

      {/* Toolbox / Skills as Colored Badges */}
      {(skills.technical?.length > 0 || skills.soft?.length > 0) && (
        <section className="mb-6">
          <h2 className="text-xs font-black uppercase tracking-wider text-violet-800 mb-2.5 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-600" />
            <span>Toolbox & Skills</span>
          </h2>
          <div className="space-y-2.5">
            {skills.technical?.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-bold text-neutral-800 mr-1">Technical:</span>
                {skills.technical.map((sk, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-0.5 rounded-full bg-violet-50 text-violet-900 border border-violet-200 text-xs font-medium"
                  >
                    {sk}
                  </span>
                ))}
              </div>
            )}
            {skills.soft?.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-bold text-neutral-800 mr-1">Creative & Interpersonal:</span>
                {skills.soft.map((sk, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-800 border border-neutral-200 text-xs font-medium"
                  >
                    {sk}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Featured Projects */}
      {projects && projects.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-black uppercase tracking-wider text-violet-800 mb-3 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-600" />
            <span>Featured Works & Projects</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {projects.map((proj) => (
              <div
                key={proj.id}
                className="p-3 rounded-xl border border-violet-100 bg-violet-50/40 hover:bg-violet-50/80 transition-colors"
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <h3 className="font-bold text-neutral-900 text-xs sm:text-sm">{proj.title}</h3>
                  {proj.projectUrl && (
                    <a
                      href={proj.projectUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-violet-700 hover:underline inline-flex items-center gap-0.5 text-[11px]"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                {proj.technologies && (
                  <p className="text-[11px] font-semibold text-violet-700 mb-1">
                    {proj.technologies}
                  </p>
                )}
                {proj.description && (
                  <p className="text-xs text-neutral-700 leading-relaxed">{proj.description}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Work Experience */}
      {experiences && experiences.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-black uppercase tracking-wider text-violet-800 mb-3 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-600" />
            <span>Professional Experience</span>
          </h2>
          <div className="space-y-4">
            {experiences.map((exp) => (
              <div key={exp.id} className="relative pl-3.5 border-l-2 border-violet-300">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between">
                  <h3 className="font-bold text-neutral-900 text-xs sm:text-sm">
                    {exp.jobTitle || "Role Title"}
                  </h3>
                  <span className="text-xs font-semibold text-violet-800 shrink-0">
                    {exp.startDate} – {exp.current ? "Present" : exp.endDate || "Present"}
                  </span>
                </div>
                <div className="text-xs font-medium text-neutral-600 mb-1.5">
                  <span className="font-bold text-neutral-800">{exp.company}</span>
                  {exp.location && ` • ${exp.location}`}
                </div>
                {exp.responsibilities && (
                  <ul className="space-y-1 text-xs text-neutral-700 list-disc list-outside ml-3.5">
                    {exp.responsibilities
                      .split("\n")
                      .map((r) => r.trim().replace(/^[-•*]\s*/, ""))
                      .filter(Boolean)
                      .map((resp, i) => (
                        <li key={i}>{resp}</li>
                      ))}
                  </ul>
                )}
                {exp.achievements && (
                  <p className="text-xs text-neutral-800 mt-1 pl-3.5 font-medium">
                    <span className="text-violet-700 font-bold">Highlight:</span> {exp.achievements}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {education && education.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-black uppercase tracking-wider text-violet-800 mb-2.5 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-600" />
            <span>Education</span>
          </h2>
          <div className="space-y-2 text-xs">
            {education.map((edu) => (
              <div key={edu.id} className="flex flex-col sm:flex-row sm:items-baseline justify-between">
                <div>
                  <span className="font-bold text-neutral-900">{edu.degree}</span>
                  {edu.fieldOfStudy && <span> in {edu.fieldOfStudy}</span>}
                  <span className="text-violet-700 font-semibold block text-[12px]">{edu.institution}</span>
                  {edu.additionalDetails && (
                    <span className="text-neutral-500 text-[11px] block mt-0.5">{edu.additionalDetails}</span>
                  )}
                </div>
                {edu.graduationYear && (
                  <span className="text-neutral-500 font-medium shrink-0">{edu.graduationYear}</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Certifications, Languages & Awards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-neutral-200">
        {certifications && certifications.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-violet-800 mb-1.5">
              Certifications
            </h3>
            <ul className="text-xs text-neutral-700 space-y-1">
              {certifications.map((c) => (
                <li key={c.id}>
                  <p className="font-semibold text-neutral-900">{c.name}</p>
                  <p className="text-[11px] text-neutral-500">{c.issuer} {c.date && `(${c.date})`}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {languages && languages.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-violet-800 mb-1.5">
              Languages
            </h3>
            <ul className="text-xs text-neutral-700 space-y-1">
              {languages.map((l) => (
                <li key={l.id}>
                  <span className="font-medium text-neutral-900">{l.language}</span>
                  {l.proficiency && <span className="text-neutral-500"> ({l.proficiency})</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {((awards && awards.length > 0) || (achievements && achievements.length > 0)) && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-violet-800 mb-1.5">
              Awards
            </h3>
            <ul className="text-xs text-neutral-700 space-y-1">
              {awards?.map((a) => (
                <li key={a.id}>
                  <span className="font-semibold text-neutral-900">{a.title}</span>
                  {a.issuer && <span className="text-[11px] text-neutral-500 block">{a.issuer}</span>}
                </li>
              ))}
              {achievements?.map((ach) => (
                <li key={ach.id}>
                  <span className="font-semibold text-neutral-900">{ach.title}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
