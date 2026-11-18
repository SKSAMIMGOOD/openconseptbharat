"use client";

import React from "react";
import { ResumeData } from "@/types/resume";
import { getPhotoDimensions } from "@/lib/resume/resume-photo";
import { Mail, Phone, MapPin, Globe, Linkedin, Github, Twitter, Award as AwardIcon, Briefcase, GraduationCap, Code2, FolderGit2, Languages as LangIcon } from "lucide-react";

export interface TemplateProps {
  data: ResumeData;
}

export const ModernTwoColumnTemplate: React.FC<TemplateProps> = ({ data }) => {
  const { personalInfo, summary, experiences, education, skills, projects, certifications, languages, awards, achievements } = data;

  const contactList: { label: string; url?: string; icon: React.ReactNode }[] = [];
  if (personalInfo.email) {
    contactList.push({
      label: personalInfo.email,
      url: `mailto:${personalInfo.email}`,
      icon: <Mail className="w-3.5 h-3.5 shrink-0 text-brand-600" />,
    });
  }
  if (personalInfo.phone) {
    contactList.push({
      label: personalInfo.phone,
      url: `tel:${personalInfo.phone.replace(/\s+/g, "")}`,
      icon: <Phone className="w-3.5 h-3.5 shrink-0 text-brand-600" />,
    });
  }
  if (personalInfo.location) {
    contactList.push({
      label: personalInfo.location,
      icon: <MapPin className="w-3.5 h-3.5 shrink-0 text-brand-600" />,
    });
  }
  if (personalInfo.linkedIn) {
    contactList.push({
      label: `LinkedIn: ${personalInfo.linkedIn.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, "")}`,
      url: personalInfo.linkedIn,
      icon: <Linkedin className="w-3.5 h-3.5 shrink-0 text-brand-600" />,
    });
  }
  if (personalInfo.github) {
    contactList.push({
      label: `GitHub: ${personalInfo.github.replace(/^https?:\/\/(www\.)?github\.com\//, "")}`,
      url: personalInfo.github,
      icon: <Github className="w-3.5 h-3.5 shrink-0 text-brand-600" />,
    });
  }
  if (personalInfo.portfolio) {
    contactList.push({
      label: personalInfo.portfolio.replace(/^https?:\/\/(www\.)?/, ""),
      url: personalInfo.portfolio,
      icon: <Globe className="w-3.5 h-3.5 shrink-0 text-brand-600" />,
    });
  }
  if (personalInfo.twitter) {
    contactList.push({
      label: personalInfo.twitter.replace(/^https?:\/\/(www\.)?(twitter|x)\.com\//, "@"),
      url: personalInfo.twitter,
      icon: <Twitter className="w-3.5 h-3.5 shrink-0 text-brand-600" />,
    });
  }

  return (
    <div className="w-full bg-white text-surface-900 font-sans p-6 sm:p-10 text-[13px] leading-relaxed select-text">
      {/* Top Header with Name and Title */}
      <header className="border-b-2 border-brand-600 pb-4 mb-6 flex items-start justify-between gap-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight">
            {personalInfo.fullName || "Your Full Name"}
          </h1>
          {personalInfo.jobTitle && (
            <p className="text-sm sm:text-base font-semibold text-brand-600 mt-1 uppercase tracking-wider">
              {personalInfo.jobTitle}
            </p>
          )}
        </div>

        {/* Profile photo in header (right aligned, responsive) */}
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

      {/* Two-Column Body */}
      <div className="flex flex-col md:flex-row gap-6 md:gap-8">
        {/* Left Column: Sidebar (Contact, Skills, Education, Languages, Certifications) */}
        <aside className="w-full md:w-[34%] shrink-0 space-y-5 border-b md:border-b-0 md:border-r border-surface-200 pb-5 md:pb-0 md:pr-6">
          {/* Contact Details */}
          {contactList.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider text-surface-900 border-b border-surface-300 pb-1 mb-2.5 flex items-center gap-1.5">
                <span>Contact</span>
              </h2>
              <div className="space-y-2 text-xs text-surface-700">
                {contactList.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 break-all">
                    {item.icon}
                    {item.url ? (
                      <a href={item.url} target="_blank" rel="noreferrer" className="hover:text-brand-600 hover:underline">
                        {item.label}
                      </a>
                    ) : (
                      <span>{item.label}</span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Education in Sidebar */}
          {education && education.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider text-surface-900 border-b border-surface-300 pb-1 mb-2.5 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-brand-600" />
                <span>Education</span>
              </h2>
              <div className="space-y-3 text-xs">
                {education.map((edu) => (
                  <div key={edu.id}>
                    <p className="font-bold text-surface-900">{edu.degree}</p>
                    {edu.fieldOfStudy && (
                      <p className="text-surface-700 font-medium">{edu.fieldOfStudy}</p>
                    )}
                    <p className="text-brand-700 font-medium text-[11.5px]">{edu.institution}</p>
                    {edu.graduationYear && (
                      <p className="text-surface-500 text-[11px] mt-0.5">{edu.graduationYear}</p>
                    )}
                    {edu.additionalDetails && (
                      <p className="text-surface-600 text-[11px] mt-1">{edu.additionalDetails}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Skills in Sidebar */}
          {(skills.technical?.length > 0 || skills.soft?.length > 0) && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider text-surface-900 border-b border-surface-300 pb-1 mb-2.5 flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-brand-600" />
                <span>Skills</span>
              </h2>
              {skills.technical?.length > 0 && (
                <div className="mb-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-surface-600 mb-1.5">
                    Technical
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.technical.map((sk, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-surface-100 text-surface-800 text-[11px] font-medium border border-surface-200"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {skills.soft?.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-surface-600 mb-1.5">
                    Soft Skills
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.soft.map((sk, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-brand-50 text-brand-800 text-[11px] font-medium border border-brand-100"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Certifications in Sidebar */}
          {certifications && certifications.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider text-surface-900 border-b border-surface-300 pb-1 mb-2.5 flex items-center gap-1.5">
                <AwardIcon className="w-3.5 h-3.5 text-brand-600" />
                <span>Certifications</span>
              </h2>
              <div className="space-y-2 text-xs">
                {certifications.map((c) => (
                  <div key={c.id}>
                    {c.url ? (
                      <a href={c.url} target="_blank" rel="noreferrer" className="font-semibold text-brand-600 hover:underline">
                        {c.name}
                      </a>
                    ) : (
                      <p className="font-semibold text-surface-900">{c.name}</p>
                    )}
                    <p className="text-[11px] text-surface-600">
                      {c.issuer} {c.date && `• ${c.date}`}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Languages in Sidebar */}
          {languages && languages.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider text-surface-900 border-b border-surface-300 pb-1 mb-2 flex items-center gap-1.5">
                <LangIcon className="w-3.5 h-3.5 text-brand-600" />
                <span>Languages</span>
              </h2>
              <div className="space-y-1 text-xs">
                {languages.map((l) => (
                  <div key={l.id} className="flex justify-between items-center text-surface-800">
                    <span className="font-medium">{l.language}</span>
                    {l.proficiency && (
                      <span className="text-[11px] text-surface-500 font-normal">
                        {l.proficiency}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </aside>

        {/* Right Column: Main Content (Summary, Experience, Projects, Awards) */}
        <main className="flex-1 min-w-0 space-y-5">
          {/* Summary */}
          {summary && summary.trim() && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider text-surface-900 border-b border-surface-300 pb-1 mb-2 flex items-center gap-1.5">
                <span>Profile</span>
              </h2>
              <p className="text-surface-700 leading-relaxed text-xs sm:text-[13px] text-justify">
                {summary}
              </p>
            </section>
          )}

          {/* Work Experience */}
          {experiences && experiences.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider text-surface-900 border-b border-surface-300 pb-1 mb-3 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-brand-600" />
                <span>Work Experience</span>
              </h2>
              <div className="space-y-4">
                {experiences.map((exp) => (
                  <div key={exp.id} className="relative pl-3 border-l-2 border-brand-200">
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between">
                      <h3 className="font-bold text-surface-900 text-xs sm:text-sm">
                        {exp.jobTitle || "Job Title"}
                      </h3>
                      <span className="text-xs font-semibold text-brand-700 shrink-0">
                        {exp.startDate} – {exp.current ? "Present" : exp.endDate || "Present"}
                      </span>
                    </div>
                    <div className="text-xs font-medium text-surface-600 mb-1.5">
                      {exp.company}
                      {exp.location && ` • ${exp.location}`}
                    </div>
                    {exp.responsibilities && (
                      <ul className="space-y-1 text-xs text-surface-700 list-disc list-outside ml-3.5">
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
                      <p className="text-xs text-surface-800 mt-1 pl-3.5">
                        <span className="font-semibold text-brand-700">Achievement:</span> {exp.achievements}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Key Projects */}
          {projects && projects.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider text-surface-900 border-b border-surface-300 pb-1 mb-3 flex items-center gap-1.5">
                <FolderGit2 className="w-3.5 h-3.5 text-brand-600" />
                <span>Key Projects</span>
              </h2>
              <div className="space-y-3">
                {projects.map((proj) => (
                  <div key={proj.id} className="p-2.5 rounded-lg bg-surface-50 border border-surface-200">
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                      <span className="font-bold text-surface-900 text-xs">{proj.title}</span>
                      {proj.projectUrl && (
                        <a
                          href={proj.projectUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-brand-600 hover:underline truncate max-w-[200px]"
                        >
                          {proj.projectUrl.replace(/^https?:\/\//, "")}
                        </a>
                      )}
                    </div>
                    {proj.technologies && (
                      <p className="text-[11px] font-medium text-brand-700 mt-0.5">
                        Tech: {proj.technologies}
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

          {/* Honors & Achievements */}
          {((awards && awards.length > 0) || (achievements && achievements.length > 0)) && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider text-surface-900 border-b border-surface-300 pb-1 mb-2.5 flex items-center gap-1.5">
                <AwardIcon className="w-3.5 h-3.5 text-brand-600" />
                <span>Honors & Achievements</span>
              </h2>
              <div className="space-y-1.5 text-xs text-surface-700">
                {awards?.map((a) => (
                  <div key={a.id}>
                    <span className="font-bold text-surface-900">{a.title}</span>
                    {a.issuer && ` – ${a.issuer}`} {a.date && `(${a.date})`}
                    {a.summary && <span className="text-surface-600">: {a.summary}</span>}
                  </div>
                ))}
                {achievements?.map((ach) => (
                  <div key={ach.id}>
                    <span className="font-bold text-surface-900">{ach.title}:</span> {ach.description}
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};
