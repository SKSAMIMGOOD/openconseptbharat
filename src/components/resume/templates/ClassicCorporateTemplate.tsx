"use client";

import React from "react";
import { ResumeData } from "@/types/resume";
import { getPhotoDimensions } from "@/lib/resume/resume-photo";

export interface TemplateProps {
  data: ResumeData;
}

export const ClassicCorporateTemplate: React.FC<TemplateProps> = ({ data }) => {
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
    <div className="w-full bg-white text-neutral-900 font-serif p-8 sm:p-12 text-[13px] leading-relaxed select-text">
      {/* Header: Centered, Executive Style with Double Border */}
      <header className="pb-4 mb-5 border-b-2 border-neutral-900 flex items-start justify-between gap-6">
        <div className={`flex-1 min-w-0 ${personalInfo.showPhoto && personalInfo.photoUrl ? "text-left" : "text-center"}`}>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-normal text-neutral-900">
            {personalInfo.fullName || "Your Full Name"}
          </h1>
          {personalInfo.jobTitle && (
            <p className="text-sm italic font-medium text-neutral-700 mt-1">
              {personalInfo.jobTitle}
            </p>
          )}

          {contactParts.length > 0 && (
            <div className={`text-xs text-neutral-600 mt-2 font-sans tracking-wide flex flex-wrap items-center gap-y-1 gap-x-2.5 ${personalInfo.showPhoto && personalInfo.photoUrl ? "justify-start" : "justify-center"}`}>
              {contactParts.map((item, idx) => (
                <React.Fragment key={idx}>
                  {item.url ? (
                    <a href={item.url} target="_blank" rel="noreferrer" className="hover:underline">
                      {item.label}
                    </a>
                  ) : (
                    <span>{item.label}</span>
                  )}
                  {idx < contactParts.length - 1 && <span className="text-neutral-400">♦</span>}
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
          <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-900 border-b border-neutral-400 pb-0.5 mb-2">
            Executive Profile
          </h2>
          <p className="text-neutral-800 leading-relaxed text-xs sm:text-[13px] text-justify">
            {summary}
          </p>
        </section>
      )}

      {/* Work Experience */}
      {experiences && experiences.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-900 border-b border-neutral-400 pb-0.5 mb-2.5">
            Professional Experience
          </h2>
          <div className="space-y-4">
            {experiences.map((exp) => (
              <div key={exp.id}>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between text-xs sm:text-sm">
                  <span className="font-bold text-neutral-900">{exp.jobTitle || "Job Title"}</span>
                  <span className="text-xs italic text-neutral-600 font-sans sm:text-right shrink-0">
                    {exp.startDate} – {exp.current ? "Present" : exp.endDate || "Present"}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between text-xs text-neutral-700 italic">
                  <span>{exp.company}</span>
                  {exp.location && <span className="text-[11px] not-italic text-neutral-500">{exp.location}</span>}
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
                  <p className="mt-1 text-xs text-neutral-700 italic ml-4">
                    <span className="font-semibold not-italic">Notable Achievement:</span>{" "}
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
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-900 border-b border-neutral-400 pb-0.5 mb-2.5">
            Education & Academic Credentials
          </h2>
          <div className="space-y-2.5">
            {education.map((edu) => (
              <div key={edu.id} className="text-xs">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between font-bold text-neutral-900">
                  <span>
                    {edu.degree}
                    {edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ""}
                  </span>
                  {edu.graduationYear && (
                    <span className="italic font-normal text-neutral-600 font-sans shrink-0">
                      {edu.graduationYear}
                    </span>
                  )}
                </div>
                <div className="italic text-neutral-700">{edu.institution}</div>
                {edu.additionalDetails && (
                  <p className="text-neutral-600 mt-0.5 text-[11px]">{edu.additionalDetails}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {(skills.technical?.length > 0 || skills.soft?.length > 0) && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-900 border-b border-neutral-400 pb-0.5 mb-2">
            Areas of Expertise
          </h2>
          <div className="space-y-1 text-xs text-neutral-800">
            {skills.technical?.length > 0 && (
              <div>
                <span className="font-bold">Core Technologies:</span>{" "}
                <span>{skills.technical.join("  ♦  ")}</span>
              </div>
            )}
            {skills.soft?.length > 0 && (
              <div>
                <span className="font-bold">Management & Leadership:</span>{" "}
                <span>{skills.soft.join("  ♦  ")}</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Projects */}
      {projects && projects.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-900 border-b border-neutral-400 pb-0.5 mb-2.5">
            Key Initiatives & Projects
          </h2>
          <div className="space-y-2.5 text-xs">
            {projects.map((proj) => (
              <div key={proj.id}>
                <div className="flex items-baseline justify-between font-bold text-neutral-900">
                  <span>{proj.title}</span>
                  {proj.projectUrl && (
                    <a
                      href={proj.projectUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-sans font-normal text-[11px] text-neutral-600 hover:underline"
                    >
                      {proj.projectUrl.replace(/^https?:\/\/(www\.)?/, "")}
                    </a>
                  )}
                </div>
                {proj.technologies && (
                  <p className="italic text-neutral-600 text-[11px]">
                    Technologies: {proj.technologies}
                  </p>
                )}
                {proj.description && (
                  <p className="text-neutral-800 mt-0.5 leading-relaxed">{proj.description}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Additional Credentials: Certifications, Languages, Honors */}
      {certifications && certifications.length > 0 && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-900 border-b border-neutral-400 pb-0.5 mb-1.5">
            Certifications & Licenses
          </h2>
          <ul className="text-xs text-neutral-800 space-y-1 list-disc list-outside ml-4">
            {certifications.map((c) => (
              <li key={c.id}>
                {c.url ? (
                  <a href={c.url} target="_blank" rel="noreferrer" className="hover:underline">
                    <span className="font-bold">{c.name}</span>
                  </a>
                ) : (
                  <span className="font-bold">{c.name}</span>
                )}
                {c.issuer && ` – ${c.issuer}`} {c.date && `(${c.date})`}
              </li>
            ))}
          </ul>
        </section>
      )}

      {languages && languages.length > 0 && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-900 border-b border-neutral-400 pb-0.5 mb-1.5">
            Languages
          </h2>
          <p className="text-xs text-neutral-800">
            {languages
              .map((l) => (l.proficiency ? `${l.language} (${l.proficiency})` : l.language))
              .join("   ♦   ")}
          </p>
        </section>
      )}

      {((awards && awards.length > 0) || (achievements && achievements.length > 0)) && (
        <section className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-900 border-b border-neutral-400 pb-0.5 mb-1.5">
            Honors & Distinctions
          </h2>
          <ul className="text-xs text-neutral-800 space-y-1 list-disc list-outside ml-4">
            {awards?.map((a) => (
              <li key={a.id}>
                <span className="font-bold">{a.title}</span>
                {a.issuer && ` – ${a.issuer}`}
                {a.date && ` (${a.date})`}
                {a.summary && `: ${a.summary}`}
              </li>
            ))}
            {achievements?.map((ach) => (
              <li key={ach.id}>
                <span className="font-bold">{ach.title}:</span> {ach.description}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};
