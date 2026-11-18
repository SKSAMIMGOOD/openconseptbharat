"use client";

import React from "react";
import { ResumeData } from "@/types/resume";
import { getPhotoDimensions } from "@/lib/resume/resume-photo";

export interface TemplateProps {
  data: ResumeData;
}

export const MinimalAtsTemplate: React.FC<TemplateProps> = ({ data }) => {
  const { personalInfo, summary, experiences, education, skills, projects, certifications, languages, awards, achievements } = data;

  const contactParts: { label: string; url?: string }[] = [];
  if (personalInfo.phone) contactParts.push({ label: personalInfo.phone, url: `tel:${personalInfo.phone.replace(/\s+/g, "")}` });
  if (personalInfo.email) contactParts.push({ label: personalInfo.email, url: `mailto:${personalInfo.email}` });
  if (personalInfo.location) contactParts.push({ label: personalInfo.location });
  if (personalInfo.linkedIn) contactParts.push({ label: `LinkedIn: ${personalInfo.linkedIn.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, "")}`, url: personalInfo.linkedIn });
  if (personalInfo.github) contactParts.push({ label: `GitHub: ${personalInfo.github.replace(/^https?:\/\/(www\.)?github\.com\//, "")}`, url: personalInfo.github });
  if (personalInfo.portfolio) contactParts.push({ label: personalInfo.portfolio.replace(/^https?:\/\/(www\.)?/, ""), url: personalInfo.portfolio });
  if (personalInfo.twitter) contactParts.push({ label: `Twitter: ${personalInfo.twitter.replace(/^https?:\/\/(www\.)?(twitter|x)\.com\//, "@")}`, url: personalInfo.twitter });

  return (
    <div className="w-full bg-white text-black font-sans p-8 sm:p-12 text-[12.5px] leading-relaxed select-text">
      {/* Header (Single Column, High Contrast) */}
      <header className="border-b border-black pb-3 mb-5 flex items-start justify-between gap-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-wide text-black">
            {personalInfo.fullName || "Your Full Name"}
          </h1>
          {personalInfo.jobTitle && (
            <p className="text-sm font-semibold text-neutral-800 mt-0.5 uppercase tracking-wider">
              {personalInfo.jobTitle}
            </p>
          )}

          {contactParts.length > 0 && (
            <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-neutral-700 mt-2 font-normal">
              {contactParts.map((item, idx) => (
                <React.Fragment key={idx}>
                  {item.url ? (
                    <a href={item.url} target="_blank" rel="noreferrer" className="hover:underline">
                      {item.label}
                    </a>
                  ) : (
                    <span>{item.label}</span>
                  )}
                  {idx < contactParts.length - 1 && <span className="text-neutral-400">|</span>}
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

      {/* Summary */}
      {summary && summary.trim() && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-2">
            Professional Summary
          </h2>
          <p className="text-neutral-800 leading-relaxed text-xs">{summary}</p>
        </section>
      )}

      {/* Work Experience */}
      {experiences && experiences.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-2.5">
            Work Experience
          </h2>
          <div className="space-y-4">
            {experiences.map((exp) => (
              <div key={exp.id}>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between font-bold text-xs text-black">
                  <span>
                    {exp.jobTitle || "Job Title"} – <span className="font-semibold">{exp.company}</span>
                  </span>
                  <span className="font-normal text-neutral-600 sm:text-right shrink-0">
                    {exp.startDate} – {exp.current ? "Present" : exp.endDate || "Present"}
                    {exp.location && ` | ${exp.location}`}
                  </span>
                </div>

                {exp.responsibilities && (
                  <ul className="mt-1.5 space-y-1 text-xs text-neutral-800 list-disc list-outside ml-4">
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
                  <p className="mt-1 text-xs text-neutral-700 ml-4">
                    <strong>Key Achievement:</strong> {exp.achievements}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {education && education.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-2.5">
            Education
          </h2>
          <div className="space-y-3">
            {education.map((edu) => (
              <div key={edu.id}>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between font-bold text-xs text-black">
                  <span>
                    {edu.degree}
                    {edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ""} –{" "}
                    <span className="font-semibold">{edu.institution}</span>
                  </span>
                  {edu.graduationYear && (
                    <span className="font-normal text-neutral-600 shrink-0">
                      {edu.graduationYear}
                    </span>
                  )}
                </div>
                {edu.additionalDetails && (
                  <p className="text-xs text-neutral-700 mt-0.5">{edu.additionalDetails}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {(skills.technical?.length > 0 || skills.soft?.length > 0) && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-2">
            Skills
          </h2>
          <div className="space-y-1.5 text-xs text-neutral-800">
            {skills.technical?.length > 0 && (
              <p>
                <strong>Technical Skills:</strong> {skills.technical.join(", ")}
              </p>
            )}
            {skills.soft?.length > 0 && (
              <p>
                <strong>Soft Skills:</strong> {skills.soft.join(", ")}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Projects */}
      {projects && projects.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-2.5">
            Key Projects
          </h2>
          <div className="space-y-3">
            {projects.map((proj) => (
              <div key={proj.id}>
                <div className="flex items-baseline justify-between font-bold text-xs">
                  <span>
                    {proj.title}
                    {proj.technologies && (
                      <span className="font-normal text-neutral-700"> ({proj.technologies})</span>
                    )}
                  </span>
                  {proj.projectUrl && (
                    <a
                      href={proj.projectUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-normal text-neutral-600 text-[11px] hover:underline truncate max-w-[200px]"
                    >
                      {proj.projectUrl}
                    </a>
                  )}
                </div>
                {proj.description && (
                  <p className="text-xs text-neutral-800 mt-0.5 leading-relaxed">
                    {proj.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Additional sections: Certifications, Languages, Awards */}
      {certifications && certifications.length > 0 && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-1.5">
            Certifications
          </h2>
          <ul className="text-xs text-neutral-800 space-y-1 list-disc list-outside ml-4">
            {certifications.map((c) => (
              <li key={c.id}>
                {c.url ? (
                  <a href={c.url} target="_blank" rel="noreferrer" className="hover:underline">
                    <strong>{c.name}</strong>
                  </a>
                ) : (
                  <strong>{c.name}</strong>
                )}
                {c.issuer && ` – ${c.issuer}`} {c.date && `(${c.date})`}
              </li>
            ))}
          </ul>
        </section>
      )}

      {languages && languages.length > 0 && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-1.5">
            Languages
          </h2>
          <p className="text-xs text-neutral-800">
            {languages
              .map((l) => (l.proficiency ? `${l.language} (${l.proficiency})` : l.language))
              .join("   •   ")}
          </p>
        </section>
      )}

      {((awards && awards.length > 0) || (achievements && achievements.length > 0)) && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider border-b border-black pb-0.5 mb-1.5">
            Honors & Achievements
          </h2>
          <ul className="text-xs text-neutral-800 space-y-1 list-disc list-outside ml-4">
            {awards?.map((a) => (
              <li key={a.id}>
                <strong>{a.title}</strong>
                {a.issuer && ` – ${a.issuer}`}
                {a.date && ` (${a.date})`}
                {a.summary && `: ${a.summary}`}
              </li>
            ))}
            {achievements?.map((ach) => (
              <li key={ach.id}>
                <strong>{ach.title}:</strong> {ach.description}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};
