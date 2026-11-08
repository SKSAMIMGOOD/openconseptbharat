"use client";

import React from "react";
import { ResumeData } from "@/types/resume";
import { Mail, Phone, MapPin, Globe, Linkedin, ExternalLink } from "lucide-react";

export interface TemplateProps {
  data: ResumeData;
}

export const ModernProfessionalTemplate: React.FC<TemplateProps> = ({ data }) => {
  const { personalInfo, summary, experiences, education, skills, projects, certifications, languages, awards, achievements } = data;

  const hasContact = personalInfo.email || personalInfo.phone || personalInfo.location || personalInfo.linkedIn || personalInfo.portfolio;

  return (
    <div className="w-full bg-white text-surface-900 font-sans p-8 sm:p-12 text-[13px] leading-relaxed select-text">
      {/* Header */}
      <header className="border-b-2 border-brand-600/80 pb-5 mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight">
          {personalInfo.fullName || "Your Full Name"}
        </h1>
        {personalInfo.jobTitle && (
          <p className="text-sm sm:text-base font-semibold text-brand-700 mt-1">
            {personalInfo.jobTitle}
          </p>
        )}

        {hasContact && (
          <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 mt-3 text-xs text-surface-600">
            {personalInfo.email && (
              <span className="inline-flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                <span>{personalInfo.email}</span>
              </span>
            )}
            {personalInfo.phone && (
              <span className="inline-flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                <span>{personalInfo.phone}</span>
              </span>
            )}
            {personalInfo.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                <span>{personalInfo.location}</span>
              </span>
            )}
            {personalInfo.linkedIn && (
              <a
                href={personalInfo.linkedIn}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-brand-600 hover:underline"
              >
                <Linkedin className="w-3.5 h-3.5 shrink-0" />
                <span>LinkedIn</span>
              </a>
            )}
            {personalInfo.portfolio && (
              <a
                href={personalInfo.portfolio}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-brand-600 hover:underline"
              >
                <Globe className="w-3.5 h-3.5 shrink-0" />
                <span>Portfolio</span>
              </a>
            )}
          </div>
        )}
      </header>

      {/* Summary */}
      {summary && summary.trim() && (
        <section className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-surface-900 pb-1 border-b border-surface-200 flex items-center justify-between mb-2.5">
            <span>Professional Summary</span>
            <span className="w-12 h-0.5 bg-brand-600 rounded" />
          </h2>
          <p className="text-surface-700 leading-relaxed text-xs sm:text-[13px]">{summary}</p>
        </section>
      )}

      {/* Work Experience */}
      {experiences && experiences.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-surface-900 pb-1 border-b border-surface-200 flex items-center justify-between mb-3">
            <span>Work Experience</span>
            <span className="w-12 h-0.5 bg-brand-600 rounded" />
          </h2>
          <div className="space-y-4">
            {experiences.map((exp) => (
              <div key={exp.id} className="group">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <div>
                    <h3 className="text-sm font-bold text-surface-900">{exp.jobTitle || "Job Title"}</h3>
                    <p className="text-xs font-semibold text-brand-700">{exp.company}</p>
                  </div>
                  <div className="text-xs text-surface-500 font-medium sm:text-right shrink-0">
                    <span>
                      {exp.startDate} – {exp.current ? "Present" : exp.endDate || "Present"}
                    </span>
                    {exp.location && <span className="block text-[11px] text-surface-400">{exp.location}</span>}
                  </div>
                </div>

                {exp.responsibilities && (
                  <ul className="mt-2 space-y-1 text-xs text-surface-700 list-disc list-outside ml-4">
                    {exp.responsibilities
                      .split("\n")
                      .map((r) => r.trim().replace(/^[-•*]\s*/, ""))
                      .filter(Boolean)
                      .map((resp, i) => (
                        <li key={i} className="leading-relaxed">
                          {resp}
                        </li>
                      ))}
                  </ul>
                )}

                {exp.achievements && (
                  <p className="mt-1.5 text-xs text-surface-600 italic bg-brand-50/50 p-2 rounded border border-brand-100/60">
                    <strong className="text-surface-700 not-italic font-semibold">Key Result:</strong>{" "}
                    {exp.achievements}
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
          <h2 className="text-xs font-bold uppercase tracking-wider text-surface-900 pb-1 border-b border-surface-200 flex items-center justify-between mb-3">
            <span>Education</span>
            <span className="w-12 h-0.5 bg-brand-600 rounded" />
          </h2>
          <div className="space-y-3">
            {education.map((edu) => (
              <div key={edu.id} className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                <div>
                  <h3 className="text-sm font-bold text-surface-900">
                    {edu.degree}
                    {edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ""}
                  </h3>
                  <p className="text-xs font-semibold text-brand-700">{edu.institution}</p>
                  {edu.additionalDetails && (
                    <p className="text-xs text-surface-600 mt-1">{edu.additionalDetails}</p>
                  )}
                </div>
                {edu.graduationYear && (
                  <span className="text-xs text-surface-500 font-medium shrink-0">
                    {edu.graduationYear}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {(skills.technical?.length > 0 || skills.soft?.length > 0) && (
        <section className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-surface-900 pb-1 border-b border-surface-200 flex items-center justify-between mb-3">
            <span>Skills & Proficiencies</span>
            <span className="w-12 h-0.5 bg-brand-600 rounded" />
          </h2>
          <div className="space-y-2.5 text-xs">
            {skills.technical?.length > 0 && (
              <div>
                <span className="font-bold text-surface-900 mr-2">Technical:</span>
                <span className="text-surface-700">{skills.technical.join("  •  ")}</span>
              </div>
            )}
            {skills.soft?.length > 0 && (
              <div>
                <span className="font-bold text-surface-900 mr-2">Core Competencies:</span>
                <span className="text-surface-700">{skills.soft.join("  •  ")}</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Projects */}
      {projects && projects.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-surface-900 pb-1 border-b border-surface-200 flex items-center justify-between mb-3">
            <span>Key Projects</span>
            <span className="w-12 h-0.5 bg-brand-600 rounded" />
          </h2>
          <div className="space-y-3">
            {projects.map((proj) => (
              <div key={proj.id}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-surface-900">{proj.title}</h3>
                  {proj.projectUrl && (
                    <a
                      href={proj.projectUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-brand-600 hover:underline inline-flex items-center gap-1"
                    >
                      <span>Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                {proj.technologies && (
                  <p className="text-xs font-semibold text-brand-700 mt-0.5">
                    Stack: {proj.technologies}
                  </p>
                )}
                {proj.description && (
                  <p className="text-xs text-surface-700 mt-1 leading-relaxed">
                    {proj.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Certifications & Languages & Awards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {certifications && certifications.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-surface-900 pb-1 border-b border-surface-200 mb-2">
              Certifications
            </h2>
            <ul className="space-y-1.5 text-xs">
              {certifications.map((c) => (
                <li key={c.id}>
                  <div className="font-semibold text-surface-900">{c.name}</div>
                  <div className="text-surface-500 text-[11px]">
                    {c.issuer} {c.date && `• ${c.date}`}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {languages && languages.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-surface-900 pb-1 border-b border-surface-200 mb-2">
              Languages
            </h2>
            <div className="text-xs text-surface-700 flex flex-wrap gap-2">
              {languages.map((l) => (
                <span key={l.id} className="bg-surface-100 px-2.5 py-1 rounded-md border border-surface-200 font-medium">
                  {l.language} {l.proficiency && `(${l.proficiency})`}
                </span>
              ))}
            </div>
          </section>
        )}
      </div>

      {((awards && awards.length > 0) || (achievements && achievements.length > 0)) && (
        <section className="mt-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-surface-900 pb-1 border-b border-surface-200 mb-2">
            Awards & Honors
          </h2>
          <div className="space-y-2 text-xs">
            {awards?.map((a) => (
              <div key={a.id}>
                <span className="font-bold text-surface-900">{a.title}</span>
                {a.issuer && <span className="text-surface-600"> – {a.issuer}</span>}
                {a.date && <span className="text-surface-400 text-[11px] ml-2">({a.date})</span>}
                {a.summary && <p className="text-surface-600 text-[11px] mt-0.5">{a.summary}</p>}
              </div>
            ))}
            {achievements?.map((ach) => (
              <div key={ach.id}>
                <span className="font-bold text-surface-900">{ach.title}:</span>{" "}
                <span className="text-surface-700">{ach.description}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
