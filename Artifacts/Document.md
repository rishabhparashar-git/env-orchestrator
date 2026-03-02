Here is the complete architectural package for the **Env-Orchestrator** (Liquid Glass Edition). This markdown file contains the SRS, PRD, Technical Plan, and the specific AI Agent prompts to build the application.

---

# 🛠️ Product Artifacts: Environment Variable Orchestrator

## 1. Software Requirements Specification (SRS)

### **1.1 Overview**

A client-side, zero-persistence (serverless) environment management tool designed to handle n-dimensional environment overrides for large-scale architectures.

### **1.2 Functional Requirements**

* **Project Contexts**: Create, Read, Update, and Delete (CRUD) projects with metadata (Technology, Description, Tags).
* **Global Overrides**: Define custom override categories (e.g., `AWS_ACCOUNT`, `STAGE`, `CLIENT`, `REGION`).
* **Schema Mapping**: Assign specific overrides to individual ENV keys within a project.
* **Intelligent Form Generation**:
* **Group by Key**: Fill all override values for a single key (e.g., `API_URL` for Dev, Stage, and Prod).
* **Group by Override**: Fill all keys for a single override option (e.g., all variables for `Client-A`).


* **Waterfall Resolution**: Compute final values based on specificity: `Global Default` < `Level 1 Override` < `Level 2 Override`.
* **Data Portability**: Import/Export system state exclusively as opaque Two-Tier AES-256 encrypted `.backup` files to guarantee metadata and configuration integrity.
* **Session Management**: Prevent data corruption via a single-tab lock mechanism.

### **1.3 Data Security & Persistence**

* **No Backend**: No data leaves the browser unless manually exported by the user.
* **LocalStorage**: Real-time sync of state to browser storage.
* **Privacy Mode**: UI-level masking of sensitive strings with 'Show', 'Hide', and 'Partial (Reveal on Focus)' toggles.

---

## 2. Product Requirements Document (PRD)

### **2.1 Target Audience**

DevOps Engineers, Tech Leads, and Full-stack Developers managing multi-tenant or multi-stage microservices.

### **2.2 User Flow**

1. **Onboarding**: User creates "Global Overrides" (e.g., Stages: Dev, Prod).
2. **Project Definition**: User adds "NextJs-Patient-Portal" and defines its required keys (e.g., `BASE_URL`, `STRIPE_KEY`).
3. **Mapping**: User attaches the `Stage` override to `BASE_URL`.
4. **Value Entry**: User enters values for `Dev` and `Prod`.
5. **Export**: User selects "Project: Patient-Portal" + "Stage: Prod" and clicks "Generate .env".

### **2.3 Success Metrics**

* **Redundancy Reduction**: Updating a global key (like an AWS Access Key) updates all 50+ child project exports instantly.
* **Accuracy**: Zero manual copy-paste errors between `.env` files.

---

## 3. Technical Plan & Approach

### **3.1 Tech Stack**

* **Framework**: Next.js 15 (App Router, Static Export).
* **State**: Zustand + Persist Middleware.
* **Styling**: Tailwind CSS + Framer Motion (for Liquid Glass/Neon effects).
* **Components**: Shadcn/UI (modified for glassmorphism).
* **Validation**: Zod (for JSON import schema validation).

### **3.2 Architecture Diagram**

### **3.3 Implementation Details**

* **Tab Locking**: Use `BroadcastChannel('env_lock')`. On mount, a tab broadcasts a 'HELO'. If another tab responds, the current tab displays a "Session Active" overlay.
* **The Waterfall Resolver**:

$$FinalValue = \text{Map}(Key, SelectedOverrides) \parallel \text{GlobalDefault}$$



The logic traverses the selected override stack from least specific to most specific.

---

## 4. AI Agent Prompts (Code Generation)

### **Prompt 1: Core Layout & Theme (The "Liquid Glass" Foundation)**

```text
Act as a Senior Frontend Engineer. Initialize a Next.js 15 project with Tailwind CSS. 
Create a 'Liquid Glass' theme:
1. Background: Solid #050505.
2. Panels: Glassmorphism style (bg-white/5, backdrop-blur-md, border border-white/10).
3. Accents: Neon Emerald (#50fa7b) and Cyan (#8be9fd).
4. Implement a 'Single Tab Guard' using BroadcastChannel API. If a user opens a second tab, show a full-screen blurred overlay: "Active Session Detected. Switch to the original tab or Click Here to Take Over."

```

### **Prompt 2: The Matrix State Engine**

```text
Build a Zustand store to manage:
- Projects (Array of objects)
- Overrides (e.g., { name: 'Stage', options: ['Dev', 'Prod'] })
- Schema (Linking Project Keys to Overrides)
- Values (A flat lookup object: record<string, string> where the key is a hash of project_key_overrideOption).
Ensure the store is persisted to LocalStorage. Create a 'Privacy Mode' toggle ('show', 'hide', 'partial') that masks values, supporting focus-reveal and group-level toggling.

```

### **Prompt 3: Dynamic Form & Generator**

```text
Create a React component 'EnvMatrixForm'. It should allow users to toggle between two views:
1. 'By Key': Vertical list of Keys. Each key expands to show inputs for its assigned overrides.
2. 'By Override': Select an override (e.g., 'Prod'). Show all keys associated with it for quick filling.
Implement an 'Export' utility that takes a project ID and a list of selected override options, computes the waterfall logic, and triggers a download of a .env file.

```

---

## 5. Third-Party Research & Tradeoffs

| Service Category | Recommendation (Free) | Tradeoff |
| --- | --- | --- |
| **Icons** | **Lucide React** | Industry standard, lightweight, supports neon colors well. |
| **State Persistence** | **Zustand + LocalStorage** | Free and local. **Tradeoff:** Data is browser-specific. Use JSON export for team sharing. |
| **Deployment** | **Vercel (Hobby)** | 100% free for static sites. Fast global CDN. |
| **Backup Encryption** | **CryptoJS (AES-256)** | Two-Tier Obfuscation Strategy. Outer metadata layer is encrypted via versioned System Keys. Inner payload is encrypted via User Key or System Key. Outputs completely opaque `.backup` blobs to ensure zero-persistence integrity. |

---