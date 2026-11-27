"use client";

import React from "react";
import { ResumeData } from "@/types/resume";
import { getPhotoDimensions } from "@/lib/resume/resume-photo";
import { Phone, Mail, Linkedin, MapPin, Globe, Twitter, Github } from "lucide-react";

export interface TemplateProps {
  data: ResumeData;
}

export const ElegantMinimalTemplate: React.FC<TemplateProps> = ({ data }) => {
  const {
    personalInfo,
    summary,
    experiences,
    education,
    skills,
    projects,
    certifications,
    languages,
    awards,
    achievements,
  } = data;

  // Build Contact Items with Lucide Icons
  const contactItems: { icon: React.ReactNode; label: string; url?: string }[] = [];

  if (personalInfo.phone && personalInfo.phone.trim()) {
    contactItems.push({
      icon: <Phone className="w-3 h-3 text-white" />,
      label: personalInfo.phone.trim(),
      url: `tel:${personalInfo.phone.replace(/\s+/g, "")}`,
    });
  }

  if (personalInfo.email && personalInfo.email.trim()) {
    contactItems.push({
      icon: <Mail className="w-3 h-3 text-white" />,
      label: personalInfo.email.trim(),
      url: `mailto:${personalInfo.email.trim()}`,
    });
  }

  if (personalInfo.linkedIn && personalInfo.linkedIn.trim()) {
    const raw = personalInfo.linkedIn.trim();
    const clean = raw.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//i, "linkedin.com/in/").replace(/\/$/, "");
    contactItems.push({
      icon: <Linkedin className="w-3 h-3 text-white" />,
      label: clean,
      url: raw,
    });
  }

  if (personalInfo.location && personalInfo.location.trim()) {
    contactItems.push({
      icon: <MapPin className="w-3 h-3 text-white" />,
      label: personalInfo.location.trim(),
    });
  }

  if (personalInfo.portfolio && personalInfo.portfolio.trim()) {
    const raw = personalInfo.portfolio.trim();
    const clean = raw.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "");
    contactItems.push({
      icon: <Globe className="w-3 h-3 text-white" />,
      label: clean || raw,
      url: raw,
    });
  }

  if (personalInfo.github && personalInfo.github.trim()) {
    const raw = personalInfo.github.trim();
    const clean = raw.replace(/^https?:\/\/(www\.)?github\.com\//i, "github.com/").replace(/\/$/, "");
    contactItems.push({
      icon: <Github className="w-3 h-3 text-white" />,
      label: clean,
      url: raw,
    });
  }

  if (personalInfo.twitter && personalInfo.twitter.trim()) {
    const raw = personalInfo.twitter.trim();
    const handle = raw.replace(/^https?:\/\/(www\.)?(twitter|x)\.com\//i, "@").replace(/\/$/, "");
    contactItems.push({
      icon: <Twitter className="w-3 h-3 text-white" />,
      label: handle,
      url: raw,
    });
  }

  // Combine Skills into a clean bullet list
  const combinedSkills: string[] = [
    ...(skills?.technical || []),
    ...(skills?.soft || []),
  ].filter(Boolean);

  // Check Personal Info items
  const hasPersonalInfo = Boolean(
    personalInfo.dob?.trim() ||
    personalInfo.nationality?.trim() ||
    personalInfo.maritalStatus?.trim()
  );

  return (
    <div className="w-full bg-white text-slate-800 font-sans p-6 sm:p-10 text-[12px] leading-relaxed select-text min-h-full">
      {/* 1. HEADER: FULL-WIDTH MUTED-BLUE BAND WITH WHITE NAME BOX */}
      <header className="relative w-full bg-[#94B0D5] flex items-start justify-between min-h-[46px] mb-5 pl-4 sm:pl-6 pr-4 shadow-2xs">
        {/* Left: Blue tab offset followed by white candidate name block */}
        <div className="flex-1 min-w-0 flex items-center my-1.5">
          <div className="bg-white px-5 sm:px-6 py-2 shadow-xs flex flex-col justify-center">
            <h1 className="text-base sm:text-lg font-bold tracking-wider text-slate-900 uppercase">
              {personalInfo.fullName?.trim() || "YOUR FULL NAME"}
            </h1>
            {personalInfo.jobTitle && (
              <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase mt-0.5">
                {personalInfo.jobTitle}
              </span>
            )}
          </div>
        </div>

        {/* Optional Profile Photo on the right if enabled */}
        {personalInfo.showPhoto && personalInfo.photoUrl && (() => {
          const photoDims = getPhotoDimensions(personalInfo.photoSize, personalInfo.photoShape);
          return (
            <div
              className={`shrink-0 overflow-hidden my-1 ${
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
                className="w-full h-full object-cover block"
                style={{
                  width: "100%",
                  height: "100%",
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

      {/* 2. FULL-WIDTH SUMMARY */}
      {summary && summary.trim() && (
        <section className="mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-1 border-b border-slate-300">
            SUMMARY
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed mt-2 text-justify">
            {summary}
          </p>
          <hr className="mt-4 border-slate-200" />
        </section>
      )}

      {/* 3. TWO-COLUMN LAYOUT: LEFT (~38%) & RIGHT (~62%) */}
      <div className="flex flex-col md:flex-row gap-6 sm:gap-7 items-start">
        {/* ================= LEFT COLUMN (~38%) ================= */}
        <div className="w-full md:w-[38%] shrink-0 space-y-5">
          {/* A. CONTACT CARD: Soft-blue rounded rectangle */}
          {contactItems.length > 0 && (
            <div className="bg-[#EBF2FA] rounded-lg p-3.5 sm:p-4 space-y-2.5 shadow-2xs border border-[#94B0D5]/20">
              {contactItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2.5 min-w-0">
                  <div className="w-5 h-5 rounded-xs bg-[#94B0D5] flex items-center justify-center shrink-0">
                    {item.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    {item.url ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-slate-700 hover:text-slate-900 hover:underline break-words block leading-snug font-medium"
                      >
                        {item.label}
                      </a>
                    ) : (
                      <span className="text-xs text-slate-700 break-words block leading-snug font-medium">
                        {item.label}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* B. SKILLS: Clean vertical bullet list */}
          {combinedSkills.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-1 border-b border-slate-300 mb-2.5">
                SKILLS
              </h2>
              <ul className="space-y-1.5 text-xs text-slate-700 pl-1">
                {combinedSkills.map((skill, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold">•</span>
                    <span>{skill}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* C. LANGUAGES: Clean vertical bullet list */}
          {languages && languages.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-1 border-b border-slate-300 mb-2.5">
                LANGUAGE
              </h2>
              <ul className="space-y-1.5 text-xs text-slate-700 pl-1">
                {languages.map((lang) => (
                  <li key={lang.id} className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold">•</span>
                    <span>
                      {lang.language}
                      {lang.proficiency ? ` (${lang.proficiency})` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* D. CERTIFICATIONS: Title & description underneath */}
          {certifications && certifications.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-1 border-b border-slate-300 mb-2.5">
                CERTIFICATIONS
              </h2>
              <div className="space-y-3.5">
                {certifications.map((cert) => (
                  <div key={cert.id} className="text-xs">
                    <div className="font-semibold text-slate-800">
                      {cert.url ? (
                        <a
                          href={cert.url}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline text-slate-800 hover:text-slate-950"
                        >
                          {cert.name}
                        </a>
                      ) : (
                        cert.name
                      )}
                    </div>
                    {(cert.issuer || cert.date) && (
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                        {cert.issuer}
                        {cert.date ? ` — ${cert.date}` : ""}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* E. AWARDS & HONORS (if present) */}
          {awards && awards.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-1 border-b border-slate-300 mb-2.5">
                AWARDS & HONORS
              </h2>
              <div className="space-y-2.5">
                {awards.map((aw) => (
                  <div key={aw.id} className="text-xs">
                    <div className="font-semibold text-slate-800">{aw.title}</div>
                    {aw.issuer && (
                      <div className="text-[11px] text-slate-500">
                        {aw.issuer} {aw.date ? `• ${aw.date}` : ""}
                      </div>
                    )}
                    {aw.summary && (
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{aw.summary}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* ================= RIGHT COLUMN (~62%) ================= */}
        <div className="w-full md:w-[62%] flex-1 space-y-6">
          {/* A. EDUCATION: Vertical Timeline Design */}
          {education && education.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-1 border-b border-slate-300 mb-3.5">
                EDUCATION
              </h2>
              <div className="relative pl-5 before:absolute before:left-[4px] before:top-2 before:bottom-2 before:w-[1.5px] before:bg-slate-300 space-y-4">
                {education.map((edu) => (
                  <div key={edu.id} className="relative group">
                    {/* Timeline Marker: Hollow Circle */}
                    <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full border-2 border-[#94B0D5] bg-white ring-2 ring-white" />

                    {/* Row 1: Institution on Left, Year on Right */}
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                        {edu.institution || "INSTITUTION"}
                      </h3>
                      {edu.graduationYear && (
                        <span className="text-xs font-semibold text-slate-600 shrink-0">
                          {edu.graduationYear}
                        </span>
                      )}
                    </div>

                    {/* Row 2: Degree on Left, Location on Right */}
                    <div className="flex items-baseline justify-between gap-2 mt-0.5">
                      <p className="text-xs font-semibold text-slate-700 uppercase">
                        {edu.degree}
                        {edu.fieldOfStudy ? ` — ${edu.fieldOfStudy}` : ""}
                      </p>
                      {edu.additionalDetails && edu.additionalDetails.includes(",") && (
                        <span className="text-[11px] italic text-slate-500 shrink-0">
                          {edu.additionalDetails.split("\n")[0]}
                        </span>
                      )}
                    </div>

                    {/* Additional Details / Coursework */}
                    {edu.additionalDetails && (
                      <div className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                        {edu.additionalDetails
                          .split("\n")
                          .slice(edu.additionalDetails.includes(",") ? 1 : 0)
                          .map((line, lIdx) => (
                            <p key={lIdx}>{line}</p>
                          ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* B. EXPERIENCE: Timeline Styling */}
          {experiences && experiences.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-1 border-b border-slate-300 mb-3.5">
                EXPERIENCE
              </h2>
              <div className="relative pl-5 before:absolute before:left-[4px] before:top-2 before:bottom-2 before:w-[1.5px] before:bg-slate-300 space-y-5">
                {experiences.map((exp) => (
                  <div key={exp.id} className="relative group">
                    {/* Timeline Marker: Hollow Circle */}
                    <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full border-2 border-[#94B0D5] bg-white ring-2 ring-white" />

                    {/* Row 1: Job Title on Left, Dates on Right */}
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                        {exp.jobTitle || "ROLE"}
                      </h3>
                      <span className="text-xs font-semibold text-slate-600 shrink-0">
                        {exp.startDate} {exp.startDate && (exp.endDate || exp.current) ? "–" : ""}{" "}
                        {exp.current ? "Present" : exp.endDate || ""}
                      </span>
                    </div>

                    {/* Row 2: Company on Left, Location on Right */}
                    <div className="flex items-baseline justify-between gap-2 mt-0.5">
                      <p className="text-xs font-semibold text-slate-700 uppercase">
                        {exp.company}
                      </p>
                      {exp.location && (
                        <span className="text-[11px] italic text-slate-500 shrink-0">
                          {exp.location}
                        </span>
                      )}
                    </div>

                    {/* Responsibilities Bullets */}
                    {exp.responsibilities && (
                      <ul className="mt-2 space-y-1 text-xs text-slate-600 list-disc list-outside ml-4">
                        {exp.responsibilities
                          .split("\n")
                          .map((r) => r.trim().replace(/^[-•*]\s*/, ""))
                          .filter(Boolean)
                          .map((bullet, bIdx) => (
                            <li key={bIdx} className="leading-relaxed">
                              {bullet}
                            </li>
                          ))}
                      </ul>
                    )}

                    {/* Key Achievement */}
                    {exp.achievements && (
                      <p className="text-[11px] italic text-slate-500 mt-1.5 leading-relaxed">
                        <span className="font-semibold text-slate-700 not-italic">Key Achievement:</span>{" "}
                        {exp.achievements}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* C. KEY PROJECTS (if present) */}
          {projects && projects.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-1 border-b border-slate-300 mb-3 font-sans">
                KEY PROJECTS
              </h2>
              <div className="space-y-3.5">
                {projects.map((proj) => (
                  <div key={proj.id} className="text-xs">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-bold text-slate-900">{proj.title}</span>
                      {proj.projectUrl && (
                        <a
                          href={proj.projectUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-[#557fae] hover:underline"
                        >
                          {proj.projectUrl.replace(/^https?:\/\/(www\.)?/, "")}
                        </a>
                      )}
                    </div>
                    {proj.technologies && (
                      <p className="text-[11px] text-slate-500 italic mt-0.5">
                        Technologies: {proj.technologies}
                      </p>
                    )}
                    {proj.description && (
                      <p className="text-slate-600 mt-1 leading-relaxed text-[11.5px]">
                        {proj.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* D. PERSONAL INFORMATION: Clean Label-Value Structure */}
          {hasPersonalInfo && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-1 border-b border-slate-300 mb-2.5">
                PERSONAL INFORMATION
              </h2>
              <div className="space-y-2 mt-1.5 text-xs">
                {personalInfo.dob && personalInfo.dob.trim() && (
                  <div>
                    <span className="text-[11.5px] italic font-semibold text-slate-800 block">
                      Date of Birth
                    </span>
                    <span className="text-xs text-slate-600">{personalInfo.dob.trim()}</span>
                  </div>
                )}
                {personalInfo.nationality && personalInfo.nationality.trim() && (
                  <div>
                    <span className="text-[11.5px] italic font-semibold text-slate-800 block">
                      Nationality
                    </span>
                    <span className="text-xs text-slate-600">{personalInfo.nationality.trim()}</span>
                  </div>
                )}
                {personalInfo.maritalStatus && personalInfo.maritalStatus.trim() && (
                  <div>
                    <span className="text-[11.5px] italic font-semibold text-slate-800 block">
                      Marital Status
                    </span>
                    <span className="text-xs text-slate-600">{personalInfo.maritalStatus.trim()}</span>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* E. ACHIEVEMENTS (if present) */}
          {achievements && achievements.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 pb-1 border-b border-slate-300 mb-2.5">
                ACHIEVEMENTS
              </h2>
              <div className="space-y-2">
                {achievements.map((ach) => (
                  <div key={ach.id} className="text-xs">
                    <span className="font-semibold text-slate-800">{ach.title}</span>
                    {ach.description && (
                      <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">
                        {ach.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
