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
    primaryAccent: "#94B0D5",
    nameColor: "#1A202C",
    titleColor: "#4A5568",
    headingColor: "#2D3748",
    bodyColor: "#334155",
    secondaryColor: "#64748B",
    dividerColor: "#CBD5E1",
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
      "Two-column layout featuring a muted-blue header band, soft-blue contact card, and structured education timeline.",
    badge: "Editorial",
    features: [
      "Muted-blue header band",
      "Soft-blue contact card",
      "Dynamic education timeline",
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
    dob: "",
    nationality: "",
    maritalStatus: "",
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
    dob: "18 April 2004",
    nationality: "Indian",
    maritalStatus: "Single",
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
      title: "Print Ready Designs",
      description:
        "High-performance client-side document cropping, photo editing, and PDF utility suite running completely in local browser RAM without cloud servers.",
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

// =========================================================================
// QUICK PRESETS: CAREER OBJECTIVE / PROFESSIONAL SUMMARY SAMPLES
// =========================================================================
export interface CareerObjectiveOption {
  id: string;
  label: string;
  text: string;
}

export interface CareerObjectiveCategory {
  category: string;
  options: CareerObjectiveOption[];
}

export const CAREER_OBJECTIVE_CATEGORIES: CareerObjectiveCategory[] = [
  {
    category: "A. Fresher",
    options: [
      {
        id: "fresher-general",
        label: "Fresher — General Job",
        text: "Motivated and quick-learning graduate seeking an entry-level position where I can apply my skills, grow professionally, and contribute to the organization's success. Known for a strong work ethic, adaptability, and a positive attitude toward new challenges.",
      },
      {
        id: "fresher-back-office",
        label: "Fresher — Office / Back Office",
        text: "Detail-oriented and organized fresher looking for a Back Office role to support daily operations with accuracy and efficiency. Proficient in MS Office and data entry, with a commitment to meeting deadlines and maintaining confidentiality.",
      },
      {
        id: "fresher-sales-customer-service",
        label: "Fresher — Sales / Customer Service",
        text: "Enthusiastic and communicative fresher aspiring to build a career in Sales and Customer Service. Skilled in active listening, problem-solving, and building rapport, with a genuine drive to deliver great customer experiences and help achieve sales targets.",
      },
      {
        id: "fresher-tech-it-support",
        label: "Fresher — Technical / IT Support",
        text: "Tech-savvy fresher with a solid foundation in computer hardware, software troubleshooting, and networking basics. Eager to join an IT Support team where I can resolve technical issues quickly and keep learning new technologies.",
      },
    ],
  },
  {
    category: "B. Experienced",
    options: [
      {
        id: "exp-general",
        label: "Experienced — General",
        text: "Results-driven professional with a proven track record of delivering quality work, meeting deadlines, and collaborating effectively with teams. Seeking a challenging role to leverage my experience, leadership qualities, and problem-solving skills for organizational growth.",
      },
      {
        id: "exp-admin-office",
        label: "Experienced — Admin / Office",
        text: "Reliable Administrative professional experienced in managing office operations, documentation, scheduling, and vendor coordination. Strong in MS Office, record keeping, and multitasking, with a focus on improving workflow efficiency and supporting management.",
      },
      {
        id: "exp-sales-customer-service",
        label: "Experienced — Sales / Customer Service",
        text: "Dynamic Sales and Customer Service professional with experience in lead generation, client relationship management, and consistently achieving targets. Excellent communicator committed to boosting customer satisfaction, retention, and revenue growth.",
      },
      {
        id: "exp-tech",
        label: "Experienced — Technical",
        text: "Skilled technical professional with hands-on experience in troubleshooting, system maintenance, and delivering reliable technical solutions. Passionate about continuous improvement, minimizing downtime, and supporting teams with efficient, well-documented fixes.",
      },
    ],
  },
  {
    category: "C. Software / Web Development",
    options: [
      {
        id: "swe-fresher",
        label: "Fresher",
        text: "Passionate computer science graduate with hands-on knowledge of HTML, CSS, JavaScript, and modern frameworks. Eager to build clean, responsive applications and grow as a developer through real-world projects.",
      },
      {
        id: "swe-exp",
        label: "Experienced",
        text: "Skilled Software Developer with experience in building scalable web applications, writing clean code, and collaborating in agile teams. Focused on delivering high-performance, user-friendly solutions.",
      },
    ],
  },
  {
    category: "D. Graphic / UI-UX Design",
    options: [
      {
        id: "design-fresher",
        label: "Fresher",
        text: "Creative design graduate with a strong eye for color, layout, and typography. Proficient in Photoshop, Illustrator, and Figma, and eager to turn ideas into visually engaging designs.",
      },
      {
        id: "design-exp",
        label: "Experienced",
        text: "Creative Designer with proven experience in branding, social media creatives, and user-centered interface design. Skilled at translating client briefs into polished, impactful visuals.",
      },
    ],
  },
  {
    category: "E. Digital Marketing",
    options: [
      {
        id: "marketing-fresher",
        label: "Fresher",
        text: "Energetic marketing enthusiast with knowledge of SEO, social media, and content creation. Looking to start a career in Digital Marketing and help brands grow their online presence.",
      },
      {
        id: "marketing-exp",
        label: "Experienced",
        text: "Results-oriented Digital Marketer experienced in SEO, paid campaigns, and social media strategy. Proven ability to increase traffic, engagement, and conversions through data-driven decisions.",
      },
    ],
  },
  {
    category: "F. Teaching / Education",
    options: [
      {
        id: "teaching-fresher",
        label: "Fresher",
        text: "Dedicated and patient graduate aspiring to become a teacher who inspires curiosity. Strong communication skills and a passion for making learning simple and enjoyable.",
      },
      {
        id: "teaching-exp",
        label: "Experienced",
        text: "Committed Educator with experience in lesson planning, classroom management, and student mentoring. Passionate about creating an engaging learning environment and improving student outcomes.",
      },
    ],
  },
  {
    category: "G. Banking / Finance",
    options: [
      {
        id: "banking-fresher",
        label: "Fresher",
        text: "Numerically strong and disciplined graduate seeking a role in Banking and Finance. Eager to learn financial operations while delivering accuracy, integrity, and excellent customer service.",
      },
      {
        id: "banking-exp",
        label: "Experienced",
        text: "Reliable Banking professional with experience in customer account handling, transactions, and compliance. Known for accuracy, trustworthiness, and building long-term client relationships.",
      },
    ],
  },
  {
    category: "I. Healthcare / Nursing",
    options: [
      {
        id: "health-fresher",
        label: "Fresher",
        text: "Compassionate and responsible healthcare graduate committed to patient care and safety. Eager to apply my clinical training in a professional medical environment.",
      },
      {
        id: "health-exp",
        label: "Experienced",
        text: "Caring healthcare professional with hands-on experience in patient care, record keeping, and working with medical teams. Dedicated to delivering safe, empathetic, and quality service.",
      },
    ],
  },
  {
    category: "J. Human Resources (HR)",
    options: [
      {
        id: "hr-fresher",
        label: "Fresher",
        text: "People-focused graduate with strong communication and organizational skills, seeking an HR role in recruitment and employee engagement while building a career in people management.",
      },
      {
        id: "hr-exp",
        label: "Experienced",
        text: "HR professional experienced in recruitment, onboarding, and employee relations. Skilled at building positive workplace culture and aligning talent with business goals.",
      },
    ],
  },
  {
    category: "M. Hospitality / Hotel",
    options: [
      {
        id: "hosp-fresher",
        label: "Fresher",
        text: "Courteous and well-groomed candidate with strong interpersonal skills, seeking a role in Hospitality to provide warm, memorable guest experiences.",
      },
      {
        id: "hosp-exp",
        label: "Experienced",
        text: "Hospitality professional with experience in front desk, guest relations, and service operations. Committed to exceptional service and guest satisfaction.",
      },
    ],
  },
];

// =========================================================================
// QUICK PRESETS: SUGGESTED SKILLS
// =========================================================================
export const QUICK_TECHNICAL_SKILLS: string[] = [
  "Computer Basics",
  "MS Word",
  "MS Excel",
  "MS PowerPoint",
  "Internet & Email",
  "Data Entry",
  "Typing",
  "Tally / Accounting Basics",
  "Basic Hardware / Technical Support",
];

export const QUICK_SOFT_SKILLS: string[] = [
  "Communication",
  "Teamwork",
  "Time Management",
  "Problem Solving",
  "Quick Learner",
  "Leadership",
  "Multitasking",
  "Customer Service",
  "Sales & Marketing",
  "Office Administration",
];
