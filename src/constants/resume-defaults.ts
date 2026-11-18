import type {
  ResumeData,
  ResumeTemplateMeta,
  ResumeFontFamily,
  ResumeTypography,
  ResumeThemeColors,
  ResumeColorPreset,
  ResumeTemplateId,
} from "../types/resume.ts";

export const RESUME_COLOR_PRESETS: ResumeColorPreset[] = [
  {
    id: "royal-blue",
    name: "Royal Blue",
    primary: "#4338CA",
    colors: {
      primaryAccent: "#4338CA",
      nameColor: "#0F172A",
      titleColor: "#4338CA",
      headingColor: "#312E81",
      bodyColor: "#334155",
      secondaryColor: "#64748B",
      dividerColor: "#4338CA",
    },
  },
  {
    id: "navy",
    name: "Navy",
    primary: "#17365D",
    colors: {
      primaryAccent: "#17365D",
      nameColor: "#0F172A",
      titleColor: "#17365D",
      headingColor: "#17365D",
      bodyColor: "#334155",
      secondaryColor: "#64748B",
      dividerColor: "#17365D",
    },
  },
  {
    id: "emerald",
    name: "Emerald",
    primary: "#047857",
    colors: {
      primaryAccent: "#047857",
      nameColor: "#064E3B",
      titleColor: "#047857",
      headingColor: "#065F46",
      bodyColor: "#1F2937",
      secondaryColor: "#4B5563",
      dividerColor: "#047857",
    },
  },
  {
    id: "burgundy",
    name: "Burgundy",
    primary: "#8B2942",
    colors: {
      primaryAccent: "#8B2942",
      nameColor: "#4C0519",
      titleColor: "#8B2942",
      headingColor: "#8B2942",
      bodyColor: "#1F2937",
      secondaryColor: "#4B5563",
      dividerColor: "#8B2942",
    },
  },
  {
    id: "teal",
    name: "Teal",
    primary: "#0F766E",
    colors: {
      primaryAccent: "#0F766E",
      nameColor: "#134E4A",
      titleColor: "#0F766E",
      headingColor: "#115E59",
      bodyColor: "#1F2937",
      secondaryColor: "#4B5563",
      dividerColor: "#0F766E",
    },
  },
  {
    id: "charcoal",
    name: "Charcoal",
    primary: "#252525",
    colors: {
      primaryAccent: "#252525",
      nameColor: "#171717",
      titleColor: "#252525",
      headingColor: "#252525",
      bodyColor: "#262626",
      secondaryColor: "#737373",
      dividerColor: "#252525",
    },
  },
  {
    id: "purple",
    name: "Purple",
    primary: "#7C3AED",
    colors: {
      primaryAccent: "#7C3AED",
      nameColor: "#2E1065",
      titleColor: "#7C3AED",
      headingColor: "#5B21B6",
      bodyColor: "#1F2937",
      secondaryColor: "#4B5563",
      dividerColor: "#7C3AED",
    },
  },
  {
    id: "black",
    name: "Black",
    primary: "#000000",
    colors: {
      primaryAccent: "#000000",
      nameColor: "#000000",
      titleColor: "#171717",
      headingColor: "#000000",
      bodyColor: "#171717",
      secondaryColor: "#525252",
      dividerColor: "#000000",
    },
  },
];

export const TEMPLATE_DEFAULT_COLORS: Record<ResumeTemplateId, ResumeThemeColors> = {
  "modern-professional": {
    primaryAccent: "#1A4799",
    nameColor: "#0F172A",
    titleColor: "#1A4799",
    headingColor: "#14264D",
    bodyColor: "#262E3D",
    secondaryColor: "#667385",
    dividerColor: "#3373CC",
  },
  "minimal-ats": {
    primaryAccent: "#0D0D0D",
    nameColor: "#000000",
    titleColor: "#262626",
    headingColor: "#050505",
    bodyColor: "#1A1A1A",
    secondaryColor: "#4D4D4D",
    dividerColor: "#262626",
  },
  "classic-corporate": {
    primaryAccent: "#1F1F24",
    nameColor: "#171717",
    titleColor: "#404040",
    headingColor: "#0D0D14",
    bodyColor: "#26262E",
    secondaryColor: "#595961",
    dividerColor: "#171717",
  },
  "modern-two-column": {
    primaryAccent: "#1E40AF",
    nameColor: "#0F172A",
    titleColor: "#1E40AF",
    headingColor: "#1E3A8A",
    bodyColor: "#334155",
    secondaryColor: "#64748B",
    dividerColor: "#1E40AF",
  },
  "executive": {
    primaryAccent: "#0F172A",
    nameColor: "#020617",
    titleColor: "#334155",
    headingColor: "#0A0F1F",
    bodyColor: "#262E3D",
    secondaryColor: "#59667A",
    dividerColor: "#0F172A",
  },
  "creative": {
    primaryAccent: "#7C3AED",
    nameColor: "#1E1B4B",
    titleColor: "#7C3AED",
    headingColor: "#3B1A66",
    bodyColor: "#292933",
    secondaryColor: "#706685",
    dividerColor: "#7C3AED",
  },
  "student-fresher": {
    primaryAccent: "#0D9488",
    nameColor: "#042F2E",
    titleColor: "#0D9488",
    headingColor: "#0D524D",
    bodyColor: "#243338",
    secondaryColor: "#59737A",
    dividerColor: "#0D9488",
  },
  "elegant-minimal": {
    primaryAccent: "#292524",
    nameColor: "#1C1917",
    titleColor: "#57534E",
    headingColor: "#292524",
    bodyColor: "#3D3A38",
    secondaryColor: "#7A7570",
    dividerColor: "#D6D3D1",
  },
};

export const DEFAULT_RESUME_COLORS: ResumeThemeColors = {
  ...TEMPLATE_DEFAULT_COLORS["modern-professional"],
};

export function getTemplateDefaultColors(templateId?: ResumeTemplateId): ResumeThemeColors {
  if (templateId && TEMPLATE_DEFAULT_COLORS[templateId]) {
    return { ...TEMPLATE_DEFAULT_COLORS[templateId] };
  }
  return { ...DEFAULT_RESUME_COLORS };
}

export function isValidHexColor(hex: string): boolean {
  if (!hex || typeof hex !== "string") return false;
  return /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex.trim());
}

export const RESUME_FONT_FAMILIES: {
  id: ResumeFontFamily;
  name: string;
  category: "Sans-Serif" | "Serif";
  cssFont: string;
}[] = [
  { id: "Inter", name: "Inter", category: "Sans-Serif", cssFont: "'Inter', sans-serif" },
  { id: "Roboto", name: "Roboto", category: "Sans-Serif", cssFont: "'Roboto', sans-serif" },
  { id: "Arial", name: "Arial", category: "Sans-Serif", cssFont: "Arial, Helvetica, sans-serif" },
  { id: "Lato", name: "Lato", category: "Sans-Serif", cssFont: "'Lato', sans-serif" },
  { id: "Open Sans", name: "Open Sans", category: "Sans-Serif", cssFont: "'Open Sans', sans-serif" },
  { id: "Georgia", name: "Georgia", category: "Serif", cssFont: "Georgia, 'Times New Roman', serif" },
  { id: "Merriweather", name: "Merriweather", category: "Serif", cssFont: "'Merriweather', Georgia, serif" },
  { id: "Poppins", name: "Poppins", category: "Sans-Serif", cssFont: "'Poppins', sans-serif" },
];

export const DEFAULT_TYPOGRAPHY: ResumeTypography = {
  fontFamily: "Inter",
  nameSize: 24,
  titleSize: 14,
  headingSize: 13,
  bodySize: 12,
  contactSize: 11,
  lineSpacing: 1.3,
  sectionSpacing: 16,
  paragraphSpacing: 6,
};

export const RESUME_TEMPLATES: ResumeTemplateMeta[] = [
  {
    id: "modern-professional",
    name: "Modern Professional",
    description:
      "Polished contemporary layout with crisp typography, subtle accent headers, and high legibility.",
    badge: "Recommended",
    features: [
      "Clean visual hierarchy",
      "Subtle primary accents",
      "Balanced multi-section spacing",
    ],
  },
  {
    id: "minimal-ats",
    name: "Minimal ATS",
    description:
      "Strict single-column monochrome design engineered specifically for applicant tracking systems.",
    badge: "100% ATS Friendly",
    features: [
      "Zero complex tables or columns",
      "High-contrast monochrome",
      "Standard semantic headings",
    ],
  },
  {
    id: "classic-corporate",
    name: "Classic Corporate",
    description:
      "Timeless executive style featuring elegant serif typography, formal rules, and balanced margins.",
    badge: "Corporate",
    features: [
      "Distinguished serif font",
      "Formal horizontal dividers",
      "Traditional corporate alignment",
    ],
  },
  {
    id: "modern-two-column",
    name: "Modern Two-Column",
    description:
      "Structured two-column architecture featuring a dedicated left sidebar for skills, contact, and credentials.",
    badge: "Two-Column",
    features: [
      "Dedicated credential sidebar",
      "Compact space efficiency",
      "Clear visual division",
    ],
  },
  {
    id: "executive",
    name: "Executive",
    description:
      "Authoritative senior leadership layout with rich navy accents, executive profile banner, and milestone callouts.",
    badge: "Leadership",
    features: [
      "Executive summary callout",
      "Core leadership competencies",
      "Distinguished deep navy tone",
    ],
  },
  {
    id: "creative",
    name: "Creative",
    description:
      "Dynamic and expressive aesthetic designed for designers, developers, and tech innovators with modern badge tags.",
    badge: "Portfolio & Tech",
    features: [
      "Modern vibrant tag pills",
      "Highlighted project cards",
      "Contemporary accent rules",
    ],
  },
  {
    id: "student-fresher",
    name: "Student / Fresher",
    description:
      "Optimized for students and early-career jobseekers, prioritizing education, coursework, and capstone projects.",
    badge: "Entry-Level",
    features: [
      "Education-first hierarchy",
      "Project & coursework focus",
      "Fresh approachable palette",
    ],
  },
  {
    id: "elegant-minimal",
    name: "Elegant Minimal",
    description:
      "Understated Swiss-inspired minimalism with generous whitespace, delicate dividers, and editorial typography.",
    badge: "Editorial",
    features: [
      "Refined micro-typography",
      "Generous breathing room",
      "Subtle hairline rules",
    ],
  },
];

export const EMPTY_RESUME_DATA: ResumeData = {
  personalInfo: {
    fullName: "",
    jobTitle: "",
    email: "",
    phone: "",
    location: "",
    linkedIn: "",
    github: "",
    portfolio: "",
    twitter: "",
    photoUrl: "",
    rawPhotoUrl: "",
    showPhoto: false,
    photoShape: "rectangle",
    photoSize: "standard",
  },
  summary: "",
  experiences: [],
  education: [],
  skills: {
    technical: [],
    soft: [],
  },
  projects: [],
  certifications: [],
  languages: [],
  awards: [],
  achievements: [],
  templateId: "modern-professional",
  typography: { ...DEFAULT_TYPOGRAPHY },
  colors: { ...DEFAULT_RESUME_COLORS },
};

export const SAMPLE_RESUME_DATA: ResumeData = {
  personalInfo: {
    fullName: "Sk Md Samim",
    jobTitle: "Lead Full-Stack Software Engineer",
    email: "socialmediasamim@gmail.com",
    phone: "+91 98765 43210",
    location: "Westbengal, India",
    linkedIn: "https://www.linkedin.com/in/skmdsamimgoodboy",
    github: "https://github.com/sksamimgood",
    portfolio: "https://sksamimgood.github.io/my_social_links",
    twitter: "https://twitter.com/sksamim",
    photoUrl: "",
    rawPhotoUrl: "",
    showPhoto: false,
    photoShape: "rectangle",
    photoSize: "standard",
  },
  summary:
    "Dynamic and results-driven Software Engineer with 7+ years of experience designing, architecting, and deploying high-concurrency cloud applications and client-side web tools. Proven track record in TypeScript, React, Next.js, and Node.js microservices serving millions of active users with 99.99% uptime.",
  experiences: [
    {
      id: "exp-1",
      company: "Apex Cloud Technologies",
      jobTitle: "Lead Full-Stack Engineer",
      location: "Bengaluru, India",
      startDate: "2022-03",
      endDate: "Present",
      current: true,
      responsibilities:
        "• Spearheaded architecture and development of next-generation distributed document processing platform using Next.js, WebAssembly, and Node.js.\n• Mentored a high-performing engineering team of 8 frontend and backend developers across agile sprints.\n• Reduced frontend bundle load times by 42% through intelligent dynamic imports and memory management.",
      achievements:
        "Engineered zero-upload document rasterization pipeline saving $180,000 annually in cloud computing fees.",
    },
    {
      id: "exp-2",
      company: "FinScale Solutions",
      jobTitle: "Senior Software Engineer",
      location: "Hyderabad, India",
      startDate: "2019-06",
      endDate: "2022-02",
      current: false,
      responsibilities:
        "• Built resilient payment gateway integrations and real-time transaction processing microservices handling 25,000+ requests per minute.\n• Authored comprehensive unit and integration test suites boosting code coverage from 64% to 94%.\n• Designed scalable PostgreSQL database schemas with automated partition indexing.",
      achievements:
        "Awarded Engineering Innovator of the Year in 2021 for zero-downtime database migration.",
    },
    {
      id: "exp-3",
      company: "VentureCraft Labs",
      jobTitle: "Software Developer",
      location: "Pune, India",
      startDate: "2017-08",
      endDate: "2019-05",
      current: false,
      responsibilities:
        "• Developed responsive web applications and interactive dashboards using React, Redux, and RESTful APIs.\n• Collaborated closely with UI/UX designers to translate Figma prototypes into accessible pixel-perfect web interfaces.\n• Implemented client-side caching strategies improving application interactivity.",
      achievements:
        "Delivered 12 end-to-end client applications on schedule with zero critical post-release defects.",
    },
  ],
  education: [
    {
      id: "edu-1",
      institution: "National Institute of Technology (NIT)",
      degree: "Bachelor of Technology (B.Tech)",
      fieldOfStudy: "Computer Science and Engineering",
      graduationYear: "2017",
      additionalDetails:
        "First Class with Distinction (CGPA: 8.9/10). President of Coding & Algorithms Society.",
    },
    {
      id: "edu-2",
      institution: "Delhi Public School",
      degree: "Higher Secondary Certificate (CBSE Class XII)",
      fieldOfStudy: "Science (PCM with Computer Science)",
      graduationYear: "2013",
      additionalDetails:
        "Scored 95.4% aggregate. National Science Olympiad State Finalist.",
    },
  ],
  skills: {
    technical: [
      "TypeScript",
      "JavaScript (ES6+)",
      "React",
      "Next.js",
      "Node.js",
      "Tailwind CSS",
      "WebAssembly (WASM)",
      "PostgreSQL",
      "Redis",
      "Docker",
      "AWS",
      "Git & CI/CD",
    ],
    soft: [
      "Technical Leadership",
      "Cross-Functional Collaboration",
      "Agile Project Management",
      "System Architecture",
      "Problem Solving",
      "Mentorship",
    ],
  },
  projects: [
    {
      id: "proj-1",
      title: "Browser Utility Studio",
      description:
        "High-performance client-side image processing and document utility suite running completely in local browser RAM without cloud servers.",
      technologies:
        "Next.js, TypeScript, WebAssembly, Canvas API, Tailwind CSS",
      projectUrl: "https://github.com/openconseptbharat/browser-utility-studio",
    },
    {
      id: "proj-2",
      title: "E-Commerce Website",
      description:
        "A modern e-commerce website focused on online shopping and digital business",
      technologies: "Html, Css, Javascript, Vitest/Node Test",
      projectUrl: "https://github.com/SKSAMIMGOOD/iconic-masala--gpt",
    },
  ],
  certifications: [
    {
      id: "cert-1",
      name: "AWS Certified Solutions Architect – Associate",
      issuer: "Amazon Web Services",
      date: "2023",
      url: "https://aws.amazon.com/verification",
    },
    {
      id: "cert-2",
      name: "Meta Certified Front-End Developer",
      issuer: "Meta / Coursera",
      date: "2022",
      url: "https://coursera.org/verify/meta-frontend",
    },
  ],
  languages: [
    { id: "lang-1", language: "English", proficiency: "Conversational" },
    { id: "lang-2", language: "Hindi", proficiency: "Native / Bilingual" },
    { id: "lang-3", language: "Bengali", proficiency: "Full Professional" },
  ],
  awards: [
    {
      id: "award-1",
      title: "Best Architecture Innovation Award",
      issuer: "Apex Cloud Tech Annual Summit",
      date: "2023",
      summary:
        "Recognized for architecting client-side document processing reducing latency to <50ms.",
    },
  ],
  achievements: [
    {
      id: "ach-1",
      title: "Smart India Hackathon Finalist",
      description:
        "Ranked Top 5 nationally out of 10,000+ teams for automated citizen utility solution.",
    },
    {
      id: "ach-2",
      title: "Open Source Contributor",
      description:
        "Active contributor to popular web performance and canvas utilities with 1,200+ GitHub stars.",
    },
  ],
  templateId: "modern-professional",
  typography: { ...DEFAULT_TYPOGRAPHY },
  colors: { ...DEFAULT_RESUME_COLORS },
};
