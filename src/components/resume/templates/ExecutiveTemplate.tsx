"use client";

import React from "react";
import { ResumeData } from "@/types/resume";
import { getPhotoDimensions } from "@/lib/resume/resume-photo";

export interface TemplateProps {
  data: ResumeData;
}

export const ExecutiveTemplate: React.FC<TemplateProps> = ({ data }) => {
  const { personalInfo, summary, experiences, education, skills, projects, certifications, languages, awards, achievements } = data;

  const contactParts: { label: string; url?: string }[] = [];
  if (personalInfo.phone) contactParts.push({ label: personalInfo.phone, url: `tel:${personalInfo.phone.replace(/\s+/g, "")}` });
  if (personalInfo.email) contactParts.push({ label: personalInfo.email, url: `mailto:${personalInfo.email}` });
  if (personalInfo.location) contactParts.push({ label: personalInfo.location });
  if (personalInfo.linkedIn) contactParts.push({ label: `LinkedIn: ${personalInfo.linkedIn.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, "")}`, url: personalInfo.linkedIn });
  if (personalInfo.portfolio) contactParts.push({ label: personalInfo.portfolio.replace(/^https?:\/\/(www\.)?/, ""), url: personalInfo.portfolio });
  if (personalInfo.github) contactParts.push({ label: `GitHub: ${personalInfo.github.replace(/^https?:\/\/(www\.)?github\.com\//, "")}`, url: personalInfo.github });
  if (personalInfo.twitter) contactParts.push({ label: `Twitter: ${personalInfo.twitter.replace(/^https?:\/\/(www\.)?(twitter|x)\.com\//, "@")}`, url: personalInfo.twitter });

  return (
    <div className="w-full bg-white text-slate-900 font-sans p-8 sm:p-12 text-[13px] leading-relaxed select-text">
      {/* Executive Header */}
      <header className="border-b-2 border-slate-900 pb-5 mb-6 flex items-start justify-between gap-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 font-serif">
            {personalInfo.fullName || "Your Full Name"}
          </h1>
          {personalInfo.jobTitle && (
            <p className="text-sm sm:text-base font-semibold text-slate-700 mt-1 uppercase tracking-widest">
              {personalInfo.jobTitle}
            </p>
          )}

          {contactParts.length > 0 && (
            <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-600 mt-2.5 font-medium">
              {contactParts.map((item, idx) => (
                <React.Fragment key={idx}>
                  {item.url ? (
                    <a href={item.url} target="_blank" rel="noreferrer" className="hover:text-slate-900 hover:underline">
                      {item.label}
                    </a>
                  ) : (
                    <span>{item.label}</span>
                  )}
                  {idx < contactParts.length - 1 && <span className="text-slate-400">■</span>}
                </React.Fragment>
              ))}
            </div>
          )}
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

      {/* Executive Summary */}
      {summary && summary.trim() && (
        <section className="mb-6">
          <div className="border-l-4 border-slate-800 bg-slate-50 p-4 rounded-r-lg">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 mb-1.5 font-serif">
              Executive Profile
            </h2>
            <p className="text-slate-700 leading-relaxed text-xs sm:text-[13px] text-justify">
              {summary}
            </p>
          </div>
        </section>
      )}

      {/* Core Competencies & Skills */}
      {(skills.technical?.length > 0 || skills.soft?.length > 0) && (
        <section className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-1 mb-2.5 font-serif">
            Core Competencies & Leadership Capabilities
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {skills.technical?.length > 0 && (
              <div>
                <span className="font-bold text-slate-800 block mb-1">Expertise & Strategic Domain:</span>
                <p className="text-slate-700">{skills.technical.join(" • ")}</p>
              </div>
            )}
            {skills.soft?.length > 0 && (
              <div>
                <span className="font-bold text-slate-800 block mb-1">Leadership & Governance:</span>
                <p className="text-slate-700">{skills.soft.join(" • ")}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Work Experience */}
      {experiences && experiences.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-1 mb-3.5 font-serif">
            Executive & Professional Experience
          </h2>
          <div className="space-y-5">
            {experiences.map((exp) => (
              <div key={exp.id}>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between">
                  <h3 className="font-bold text-slate-950 text-sm font-serif">
                    {exp.jobTitle || "Executive Role"}
                  </h3>
                  <span className="text-xs font-semibold text-slate-600 sm:text-right shrink-0">
                    {exp.startDate} – {exp.current ? "Present" : exp.endDate || "Present"}
                  </span>
                </div>
                <div className="text-xs font-medium text-slate-700 mb-2">
                  <span className="font-semibold text-slate-900">{exp.company}</span>
                  {exp.location && ` | ${exp.location}`}
                </div>

                {exp.responsibilities && (
                  <ul className="space-y-1 text-xs text-slate-700 list-disc list-outside ml-4">
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
                  <div className="mt-1.5 p-2 bg-slate-100/70 rounded text-xs text-slate-800 border-l-2 border-slate-600">
                    <span className="font-bold text-slate-900">Key Milestone / Impact:</span> {exp.achievements}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Projects / Strategic Initiatives */}
      {projects && projects.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-1 mb-3 font-serif">
            Strategic Initiatives & Key Projects
          </h2>
          <div className="space-y-3 text-xs">
            {projects.map((proj) => (
              <div key={proj.id} className="border-b border-slate-200 pb-2.5 last:border-b-0">
                <div className="flex items-baseline justify-between">
                  <span className="font-bold text-slate-900">{proj.title}</span>
                  {proj.projectUrl && (
                    <a
                      href={proj.projectUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-slate-600 hover:text-slate-900 hover:underline"
                    >
                      {proj.projectUrl.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                </div>
                {proj.technologies && (
                  <p className="text-[11px] text-slate-600 font-medium">Domain: {proj.technologies}</p>
                )}
                {proj.description && (
                  <p className="text-slate-700 mt-0.5 leading-relaxed">{proj.description}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {education && education.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-1 mb-3 font-serif">
            Education & Academic Credentials
          </h2>
          <div className="space-y-3 text-xs">
            {education.map((edu) => (
              <div key={edu.id} className="flex flex-col sm:flex-row sm:items-baseline justify-between">
                <div>
                  <span className="font-bold text-slate-900">{edu.degree}</span>
                  {edu.fieldOfStudy && <span> in {edu.fieldOfStudy}</span>}
                  <span className="text-slate-700 block text-[12px]">{edu.institution}</span>
                  {edu.additionalDetails && (
                    <span className="text-slate-500 text-[11px] block">{edu.additionalDetails}</span>
                  )}
                </div>
                {edu.graduationYear && (
                  <span className="text-slate-600 text-xs shrink-0">{edu.graduationYear}</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Additional Credentials: Certifications, Languages, Awards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {certifications && certifications.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-1 mb-2 font-serif">
              Certifications & Credentials
            </h2>
            <ul className="text-xs text-slate-700 space-y-1">
              {certifications.map((c) => (
                <li key={c.id}>
                  <span className="font-semibold text-slate-900">{c.name}</span>
                  {c.issuer && ` – ${c.issuer}`} {c.date && `(${c.date})`}
                </li>
              ))}
            </ul>
          </section>
        )}

        {languages && languages.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-1 mb-2 font-serif">
              Languages
            </h2>
            <p className="text-xs text-slate-700">
              {languages
                .map((l) => (l.proficiency ? `${l.language} (${l.proficiency})` : l.language))
                .join("  •  ")}
            </p>
          </section>
        )}
      </div>

      {((awards && awards.length > 0) || (achievements && achievements.length > 0)) && (
        <section className="mt-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-1 mb-2 font-serif">
            Honors & Leadership Distinctions
          </h2>
          <ul className="text-xs text-slate-700 space-y-1 list-disc list-outside ml-4">
            {awards?.map((a) => (
              <li key={a.id}>
                <span className="font-bold text-slate-900">{a.title}</span>
                {a.issuer && ` – ${a.issuer}`} {a.date && `(${a.date})`}
                {a.summary && <span className="text-slate-600">: {a.summary}</span>}
              </li>
            ))}
            {achievements?.map((ach) => (
              <li key={ach.id}>
                <span className="font-bold text-slate-900">{ach.title}:</span> {ach.description}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};
