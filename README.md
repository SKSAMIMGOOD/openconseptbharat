# Browser Utility Studio

> **Privacy-First, Browser-Only Document & Photo Processing Platform**

Browser Utility Studio is a modern web application designed for fast, professional document and image processing workflows. Inspired by the utility concepts of card cropping and print-sheet generation (such as Open Concept Bangla), Browser Utility Studio re-architects the entire paradigm around **100% client-side privacy**, a modern user interface, and zero server uploads.

---

## 🛡️ Core Privacy Guarantee

- **Zero Server Uploads:** Your photos, PDFs, PAN scans, and Aadhaar documents never touch a backend server or remote storage bucket.
- **No Database:** No remote database, user accounts, or server-side persistent files.
- **In-Memory Lifecycles:** Files exist purely as transient memory objects within your browser tab and are discarded when you close or refresh the window.
- **Zero Third-Party Trackers:** No analytics SDKs, advertising tags, or telemetry beacons.

---

## 🚀 Technology Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript 5 (Strict Mode)
- **Styling:** Tailwind CSS + PostCSS
- **Component Primitives:** React 18, Lucide React
- **Document Processing:** PDF.js (`pdfjs-dist`) & `pdf-lib`
- **Graphics Pipeline:** HTML Canvas API & Web Workers
- **AI Processing (Future Phases):** Transformers.js / ONNX Runtime Web via local WebAssembly/WebGPU

---

## 📂 Project Architecture

```
openconseptbharat/
├── public/                 # Static brand assets & icons
├── src/
│   ├── app/                # Next.js App Router pages & routes
│   │   ├── layout.tsx      # Global root layout with header & footer
│   │   ├── page.tsx        # Dashboard with search & category filters
│   │   ├── error.tsx       # Shared client error boundary
│   │   ├── loading.tsx     # Workspace transition state
│   │   ├── not-found.tsx   # 404 handler
│   │   ├── privacy/        # Privacy guarantee & verification page
│   │   ├── about/          # About the platform
│   │   └── tools/          # Independent tool module routes
│   │       ├── photo-studio/
│   │       ├── multiple-photos/
│   │       ├── background-remover/
│   │       ├── photo-editor/
│   │       ├── pan-card-crop/
│   │       ├── aadhaar-card-crop/
│   │       ├── ration-card-crop/
│   │       └── resume-maker/
│   ├── components/
│   │   ├── common/         # Button, Badge, Card, FileDropzone, ErrorAlert, Toast
│   │   ├── layout/         # Header, Footer, PrivacyBadge, ModuleLayout
│   │   └── dashboard/      # ToolCard, CategorySection, PrivacyHighlights
│   ├── constants/          # Tool metadata, card specs, privacy rules, limits
│   ├── hooks/              # useObjectUrl, useNotification, useFileDropzone
│   ├── lib/
│   │   ├── ai/             # Browser AI inference contracts
│   │   ├── crop/           # Card coordinate calculations & millimeter ratios
│   │   ├── image/          # Canvas filters, blob exports, file downloaders
│   │   ├── pdf/            # PDF.js render contracts & pdf-lib generators
│   │   ├── utils/          # Class mergers (cn) and memory cleanup
│   │   └── validation/     # Magic bytes, MIME types, and size constraints
│   ├── types/              # Strongly typed TypeScript contracts
│   └── workers/            # Multi-threaded Web Worker image filters
├── ARCHITECTURE.md         # Technical architecture documentation
├── PRIVACY.md              # Detailed privacy enforcement documentation
├── DEVELOPMENT_ROADMAP.md  # Multi-phase engineering roadmap
└── package.json
```

---

## 🛠️ Getting Started

### Prerequisites

- Node.js 18.17+ or Node.js 20+
- npm 9+

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd openconseptbharat

# Install dependencies
npm install
```

### Running Locally

```bash
# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
# Compile and build Next.js production bundle
npm run build

# Start production server
npm start
```

---

## 📋 Tool Catalog (8 Core Modules)

| Module | Category | Primary Output | Route |
| :--- | :--- | :--- | :--- |
| **Professional Photo Studio** | Studio | Passport & Visa Photos (300 DPI) | `/tools/photo-studio` |
| **Multiple Photo Maker** | Studio | A4 / 4x6 Multi-Copy Tiling Sheets | `/tools/multiple-photos` |
| **Background Remover** | Editing | Subject Isolation via Local AI | `/tools/background-remover` |
| **Advanced Photo Editor** | Editing | Crop, Exposure, & Target Size | `/tools/photo-editor` |
| **PAN Card Crop** | Cards | ISO/IEC 7810 ID-1 (85.6 × 53.98 mm) | `/tools/pan-card-crop` |
| **Aadhaar Card Crop** | Cards | UIDAI Standard Dual-Side Print | `/tools/aadhaar-card-crop` |
| **Ration Card Crop** | Cards | High-Contrast Digitized Card | `/tools/ration-card-crop` |
| **Resume / CV Maker** | Documents | ATS-Optimized Vector PDF | `/tools/resume-maker` |

---

## 🔒 Security & Privacy Verification

You can confirm that zero data leaves your machine at any time:
1. Open DevTools (`F12`) -> **Network** tab -> Filter **Fetch/XHR**.
2. Drag and drop any image or PDF.
3. Observe that zero network requests transmit your payload.

---

## 📄 License

MIT License. Designed with privacy, performance, and accessibility as first principles.
