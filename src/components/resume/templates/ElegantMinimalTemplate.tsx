"use client";

import React from "react";
import { ResumeData } from "@/types/resume";
import { getPhotoDimensions } from "@/lib/resume/resume-photo";

export interface TemplateProps {
  data: ResumeData;
}

export const ElegantMinimalTemplate: React.FC<TemplateProps> = ({ data }) => {
  const { personalInfo, summary, experiences, education, skills, projects, certifications, languages, awards, achievements } = data;

  const contactParts: { label: string; url?: string }[] = [];
  if (personalInfo.email) contactParts.push({ label: personalInfo.email, url: `mailto:${personalInfo.email}` });
  if (personalInfo.phone) contactParts.push({ label: personalInfo.phone, url: `tel:${personalInfo.phone.replace(/\s+/g, "")}` });
  if (personalInfo.location) contactParts.push({ label: personalInfo.location });
  if (personalInfo.linkedIn) contactParts.push({ label: `LinkedIn: ${personalInfo.linkedIn.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, "")}`, url: personalInfo.linkedIn });
  if (personalInfo.portfolio) contactParts.push({ label: personalInfo.portfolio.replace(/^https?:\/\/(www\.)?/, ""), url: personalInfo.portfolio });
  if (personalInfo.github) contactParts.push({ label: `GitHub: ${personalInfo.github.replace(/^https?:\/\/(www\.)?github\.com\//, "")}`, url: personalInfo.github });
  if (personalInfo.twitter) contactParts.push({ label: `Twitter: ${personalInfo.twitter.replace(/^https?:\/\/(www\.)?(twitter|x)\.com\//, "@")}`, url: personalInfo.twitter });

  return (
    <div className="w-full bg-white text-stone-900 font-sans p-8 sm:p-14 text-[12.5px] leading-relaxed select-text">
      {/* Editorial Header */}
      <header className="border-b border-stone-300 pb-5 mb-7 flex items-start justify-between gap-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-stone-900">
            {personalInfo.fullName ? (
              <>
                <span className="font-semibold">{personalInfo.fullName.split(" ")[0]}</span>{" "}
                <span className="font-light">{personalInfo.fullName.split(" ").slice(1).join(" ")}</span>
              </>
            ) : (
              "Your Full Name"
            )}
          </h1>
          {personalInfo.jobTitle && (
            <p className="text-xs uppercase tracking-[0.2em] font-medium text-stone-500 mt-1">
              {personalInfo.jobTitle}
            </p>
          )}

          {contactParts.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500 mt-3 font-normal">
              {contactParts.map((item, idx) => (
                <React.Fragment key={idx}>
                  {item.url ? (
                    <a href={item.url} target="_blank" rel="noreferrer" className="hover:text-stone-900 hover:underline">
                      {item.label}
                    </a>
                  ) : (
                    <span>{item.label}</span>
                  )}
                  {idx < contactParts.length - 1 && <span className="text-stone-300">•</span>}
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

      {/* Summary / Introduction */}
      {summary && summary.trim() && (
        <section className="mb-6">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400 mb-2">
            Profile
          </h2>
          <p className="text-stone-700 leading-relaxed text-xs sm:text-[13px] text-justify font-light">
            {summary}
          </p>
        </section>
      )}

      {/* Experience */}
      {experiences && experiences.length > 0 && (
        <section className="mb-6">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400 mb-3 border-b border-stone-200 pb-1">
            Experience
          </h2>
          <div className="space-y-4">
            {experiences.map((exp) => (
              <div key={exp.id}>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between text-xs sm:text-sm">
                  <span className="font-semibold text-stone-900">{exp.jobTitle || "Job Title"}</span>
                  <span className="text-xs font-light text-stone-400 sm:text-right shrink-0">
                    {exp.startDate} — {exp.current ? "Present" : exp.endDate || "Present"}
                  </span>
                </div>
                <div className="text-xs text-stone-600 font-medium mb-1.5">
                  <span>{exp.company}</span>
                  {exp.location && <span className="text-stone-400 font-light">, {exp.location}</span>}
                </div>
                {exp.responsibilities && (
                  <ul className="space-y-1 text-xs text-stone-600 list-disc list-outside ml-4 font-light">
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
                  <p className="text-xs text-stone-800 mt-1 pl-4 italic font-light">
                    — {exp.achievements}
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
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400 mb-3 border-b border-stone-200 pb-1">
            Education
          </h2>
          <div className="space-y-3">
            {education.map((edu) => (
              <div key={edu.id} className="flex flex-col sm:flex-row sm:items-baseline justify-between text-xs">
                <div>
                  <span className="font-semibold text-stone-900">{edu.degree}</span>
                  {edu.fieldOfStudy && <span className="font-light">, {edu.fieldOfStudy}</span>}
                  <span className="text-stone-500 block text-[12px] font-light">{edu.institution}</span>
                  {edu.additionalDetails && (
                    <span className="text-stone-400 text-[11px] block mt-0.5">{edu.additionalDetails}</span>
                  )}
                </div>
                {edu.graduationYear && (
                  <span className="text-stone-400 font-light text-xs shrink-0">{edu.graduationYear}</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {(skills.technical?.length > 0 || skills.soft?.length > 0) && (
        <section className="mb-6">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400 mb-2 border-b border-stone-200 pb-1">
            Expertise
          </h2>
          <div className="space-y-1.5 text-xs text-stone-700 font-light">
            {skills.technical?.length > 0 && (
              <p>
                <span className="font-semibold text-stone-900">Technical:</span> {skills.technical.join("  •  ")}
              </p>
            )}
            {skills.soft?.length > 0 && (
              <p>
                <span className="font-semibold text-stone-900">Capabilities:</span> {skills.soft.join("  •  ")}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Projects */}
      {projects && projects.length > 0 && (
        <section className="mb-6">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400 mb-3 border-b border-stone-200 pb-1">
            Selected Works
          </h2>
          <div className="space-y-3 text-xs">
            {projects.map((proj) => (
              <div key={proj.id}>
                <div className="flex items-baseline justify-between">
                  <span className="font-semibold text-stone-900">{proj.title}</span>
                  {proj.projectUrl && (
                    <a
                      href={proj.projectUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-stone-400 hover:text-stone-900 hover:underline"
                    >
                      {proj.projectUrl.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                </div>
                {proj.technologies && (
                  <p className="text-[11px] text-stone-500 font-light italic">{proj.technologies}</p>
                )}
                {proj.description && (
                  <p className="text-stone-700 mt-0.5 leading-relaxed font-light">{proj.description}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Certifications, Languages, Awards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-stone-200 text-xs">
        {certifications && certifications.length > 0 && (
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400 mb-1.5">
              Certificates
            </h3>
            <ul className="space-y-1 text-stone-700 font-light">
              {certifications.map((c) => (
                <li key={c.id}>
                  <span className="font-medium text-stone-900">{c.name}</span>
                  {c.issuer && <span className="block text-[11px] text-stone-400">{c.issuer}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {languages && languages.length > 0 && (
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400 mb-1.5">
              Languages
            </h3>
            <ul className="space-y-1 text-stone-700 font-light">
              {languages.map((l) => (
                <li key={l.id}>
                  <span className="font-medium text-stone-900">{l.language}</span>
                  {l.proficiency && <span className="text-stone-400 text-[11px]"> ({l.proficiency})</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {((awards && awards.length > 0) || (achievements && achievements.length > 0)) && (
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400 mb-1.5">
              Honors
            </h3>
            <ul className="space-y-1 text-stone-700 font-light">
              {awards?.map((a) => (
                <li key={a.id}>
                  <span className="font-medium text-stone-900">{a.title}</span>
                  {a.issuer && <span className="block text-[11px] text-stone-400">{a.issuer}</span>}
                </li>
              ))}
              {achievements?.map((ach) => (
                <li key={ach.id}>
                  <span className="font-medium text-stone-900">{ach.title}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
