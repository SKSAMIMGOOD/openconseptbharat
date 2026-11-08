import type { ResumeData, ResumeTemplateMeta } from "../types/resume.ts";

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
    badge: "Executive",
    features: [
      "Distinguished serif font",
      "Formal horizontal dividers",
      "Traditional corporate alignment",
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
    portfolio: "",
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
};

export const SAMPLE_RESUME_DATA: ResumeData = {
  personalInfo: {
    fullName: "Sk Md Samim",
    jobTitle: "Lead Full-Stack Software Engineer",
    email: "socialmediasamim@gmail.com",
    phone: "+91 98765 43210",
    location: "Westbengal, India",
    linkedIn: "https://www.linkedin.com/in/skmdsamimgoodboy",
    portfolio: "https://sksamimgood.github.io/my_social_links",
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
};
