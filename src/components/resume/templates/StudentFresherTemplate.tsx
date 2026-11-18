"use client";

import React from "react";
import { ResumeData } from "@/types/resume";
import { getPhotoDimensions } from "@/lib/resume/resume-photo";
import { Mail, Phone, MapPin, Globe, Linkedin, Github, GraduationCap, Code, FolderKanban, Award, BookOpen } from "lucide-react";

export interface TemplateProps {
  data: ResumeData;
}

export const StudentFresherTemplate: React.FC<TemplateProps> = ({ data }) => {
  const { personalInfo, summary, experiences, education, skills, projects, certifications, languages, awards, achievements } = data;

  const contactItems: { label: string; url?: string; icon: React.ReactNode }[] = [];
  if (personalInfo.email) contactItems.push({ label: personalInfo.email, url: `mailto:${personalInfo.email}`, icon: <Mail className="w-3.5 h-3.5 text-teal-600" /> });
  if (personalInfo.phone) contactItems.push({ label: personalInfo.phone, url: `tel:${personalInfo.phone.replace(/\s+/g, "")}`, icon: <Phone className="w-3.5 h-3.5 text-teal-600" /> });
  if (personalInfo.location) contactItems.push({ label: personalInfo.location, icon: <MapPin className="w-3.5 h-3.5 text-teal-600" /> });
  if (personalInfo.linkedIn) contactItems.push({ label: "LinkedIn", url: personalInfo.linkedIn, icon: <Linkedin className="w-3.5 h-3.5 text-teal-600" /> });
  if (personalInfo.github) contactItems.push({ label: "GitHub", url: personalInfo.github, icon: <Github className="w-3.5 h-3.5 text-teal-600" /> });
  if (personalInfo.portfolio) contactItems.push({ label: "Portfolio", url: personalInfo.portfolio, icon: <Globe className="w-3.5 h-3.5 text-teal-600" /> });

  return (
    <div className="w-full bg-white text-surface-900 font-sans p-8 sm:p-12 text-[13px] leading-relaxed select-text">
      {/* Header */}
      <header className="border-b-2 border-teal-600 pb-4 mb-6 flex items-start justify-between gap-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight">
            {personalInfo.fullName || "Your Full Name"}
          </h1>
          {personalInfo.jobTitle && (
            <p className="text-sm sm:text-base font-semibold text-teal-700 mt-0.5">
              {personalInfo.jobTitle}
            </p>
          )}

          {contactItems.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-surface-600 mt-2.5">
              {contactItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  {item.icon}
                  {item.url ? (
                    <a href={item.url} target="_blank" rel="noreferrer" className="hover:text-teal-700 hover:underline">
                      {item.label}
                    </a>
                  ) : (
                    <span>{item.label}</span>
                  )}
                </div>
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

      {/* Career Objective / Summary */}
      {summary && summary.trim() && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-teal-800 border-b border-teal-200 pb-1 mb-2 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-teal-600" />
            <span>Career Objective</span>
          </h2>
          <p className="text-surface-700 leading-relaxed text-xs sm:text-[13px] text-justify">
            {summary}
          </p>
        </section>
      )}

      {/* Education (Placed First for Students / Freshers) */}
      {education && education.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-teal-800 border-b border-teal-200 pb-1 mb-2.5 flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-teal-600" />
            <span>Education & Academic Background</span>
          </h2>
          <div className="space-y-3">
            {education.map((edu) => (
              <div key={edu.id} className="p-2.5 rounded-lg bg-teal-50/40 border border-teal-100">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between">
                  <span className="font-bold text-surface-900 text-xs sm:text-sm">
                    {edu.degree} {edu.fieldOfStudy && `in ${edu.fieldOfStudy}`}
                  </span>
                  {edu.graduationYear && (
                    <span className="text-xs font-semibold text-teal-800 shrink-0">
                      Class of {edu.graduationYear}
                    </span>
                  )}
                </div>
                <p className="text-xs font-semibold text-teal-700 mt-0.5">{edu.institution}</p>
                {edu.additionalDetails && (
                  <p className="text-xs text-surface-600 mt-1">{edu.additionalDetails}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {(skills.technical?.length > 0 || skills.soft?.length > 0) && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-teal-800 border-b border-teal-200 pb-1 mb-2 flex items-center gap-1.5">
            <Code className="w-3.5 h-3.5 text-teal-600" />
            <span>Technical & Interpersonal Skills</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {skills.technical?.length > 0 && (
              <div>
                <span className="font-bold text-surface-800 block mb-1">Technical Skills:</span>
                <p className="text-surface-700">{skills.technical.join(", ")}</p>
              </div>
            )}
            {skills.soft?.length > 0 && (
              <div>
                <span className="font-bold text-surface-800 block mb-1">Professional Skills:</span>
                <p className="text-surface-700">{skills.soft.join(", ")}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Key Academic & Capstone Projects */}
      {projects && projects.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-teal-800 border-b border-teal-200 pb-1 mb-2.5 flex items-center gap-1.5">
            <FolderKanban className="w-3.5 h-3.5 text-teal-600" />
            <span>Academic & Practical Projects</span>
          </h2>
          <div className="space-y-3">
            {projects.map((proj) => (
              <div key={proj.id} className="border-l-2 border-teal-400 pl-3">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-bold text-surface-900 text-xs sm:text-sm">{proj.title}</h3>
                  {proj.projectUrl && (
                    <a
                      href={proj.projectUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-teal-700 hover:underline shrink-0"
                    >
                      View Project
                    </a>
                  )}
                </div>
                {proj.technologies && (
                  <p className="text-[11px] font-semibold text-teal-700 mt-0.5">
                    Technologies: {proj.technologies}
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

      {/* Work / Internship Experience */}
      {experiences && experiences.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-teal-800 border-b border-teal-200 pb-1 mb-2.5 flex items-center gap-1.5">
            <span>Internships & Work Experience</span>
          </h2>
          <div className="space-y-3.5">
            {experiences.map((exp) => (
              <div key={exp.id}>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between">
                  <h3 className="font-bold text-surface-900 text-xs sm:text-sm">
                    {exp.jobTitle || "Intern"} – <span className="font-semibold text-teal-700">{exp.company}</span>
                  </h3>
                  <span className="text-xs font-medium text-surface-500 shrink-0">
                    {exp.startDate} – {exp.current ? "Present" : exp.endDate || "Present"}
                  </span>
                </div>
                {exp.responsibilities && (
                  <ul className="space-y-1 text-xs text-surface-700 list-disc list-outside ml-4 mt-1">
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
                  <p className="text-xs text-teal-900 mt-1 ml-4 font-medium">
                    Key Result: {exp.achievements}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Certifications, Awards & Languages */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        {certifications && certifications.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-teal-800 border-b border-teal-200 pb-0.5 mb-1.5">
              Certifications & Training
            </h2>
            <ul className="text-xs text-surface-700 space-y-1 list-disc list-outside ml-4">
              {certifications.map((c) => (
                <li key={c.id}>
                  <strong>{c.name}</strong> {c.issuer && `– ${c.issuer}`} {c.date && `(${c.date})`}
                </li>
              ))}
            </ul>
          </section>
        )}

        {languages && languages.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-teal-800 border-b border-teal-200 pb-0.5 mb-1.5">
              Languages
            </h2>
            <p className="text-xs text-surface-700">
              {languages
                .map((l) => (l.proficiency ? `${l.language} (${l.proficiency})` : l.language))
                .join("  •  ")}
            </p>
          </section>
        )}
      </div>

      {((awards && awards.length > 0) || (achievements && achievements.length > 0)) && (
        <section className="mt-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-teal-800 border-b border-teal-200 pb-0.5 mb-1.5 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-teal-600" />
            <span>Honors & Extracurricular Activities</span>
          </h2>
          <ul className="text-xs text-surface-700 space-y-1 list-disc list-outside ml-4">
            {awards?.map((a) => (
              <li key={a.id}>
                <strong>{a.title}</strong> {a.issuer && `– ${a.issuer}`} {a.date && `(${a.date})`}
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
