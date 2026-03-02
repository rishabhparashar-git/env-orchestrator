# High-Level Architecture

**OmniEnv** is built entirely as a client-side serverless application. All heavy lifting, data persistence, and cryptographic signing occurs natively within the browser environment. 

## Technology Selection

* **Framework**: Next.js 15 (App Router). Configured for Static Export (`output: export`), meaning it can be hosted on S3, Vercel, or any static CDN without a traditional Node backend.
* **State Management**: Zustand, integrated with `zustand/middleware` for automatic reactive syncing to the browser's `localStorage` engine.
* **Styling & UI**: Tailwind CSS paired with Framer Motion for Liquid Glass and Neon accents. The UI is pieced together using customized Radix UI Primitives (Shadcn UI).
* **Cryptography**: `crypto-js` used for raw AES-256 wrapping and hashing.

## The Waterfall Resolution Engine

The core feature of the application is transforming abstract 3D matrices (Projects → Variable Schemas → Overrides [Dev, Stage, Prod]) into flat, 1D `.env` text files.

When you click "Generate .env", the `EnvGenerator` utility kicks off:
1. It looks at every single `Key` modeled in the Project's schema.
2. It checks what override tags the user selected for the export (e.g. `Stage: Prod`, `Region: US-East`).
3. It recursively looks up the hashed value keys (`projectID_keyID_overrideID`) in the State store.
4. **Resolution Rule**: If an override value exists, it wins. If multiple overrides are selected for a key, the most specific (latest in the array) wins. If no override value exists, it falls back to the `Global Default` value.

## Related Documentation

* Discover how data is persisted securely entirely off-server: [Local Storage Engine](./local-storage.md)
* Learn about the export mechanisms: [Two-Tier Encryption Model](./encryption-engine.md)
* Understand data corruption mitigation: [Single-Tab Guard](./single-tab-guard.md)
