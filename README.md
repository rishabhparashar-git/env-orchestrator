# Introducing OmniEnv

> **"Because copying and pasting AWS keys across 40 different microservices at 2
> AM on a Tuesday isn't a strategy, it's a cry for help."**

Welcome to **OmniEnv**, a strictly client-side, zero-persistence (serverless)
environment management application designed to handle highly dynamic,
n-dimensional environment overrides for large-scale architectures.

---

## 🛑 The Problem: N-Dimensional Chaos

Let me paint a picture of modern infrastructure: Your organization is scaling.
You have _multiple_ Frontends (Next.js, React). You have _multiple_ Backends
(.NET, Node, Python). That's cute. But then you throw in **Stages**: Dev, Test,
Stage, Prelive, Prod.

Now, let's multiply that by **Clients** and **Features**: `FeatureA-Dev`,
`FeatureB-Dev`, `ClientA-Prelive`, `ClientB-Prod`.

Suddenly, your architecture isn't a straight line; it's a terrifying 3D Matrix.
What happens when your AWS Access Keys rotate on the `PROD` account? Do you ping
a junior dev to manually update 15 decoupled `Vercel` projects and 8 `ECS`
tasks?

In a complex architecture, the redundancy of managing environment variables is
the silent killer of productivity. When a global value shifts, it requires
surgical precision to update every dependent child deployment without breaking
something else.

## 🚀 The Solution: OmniEnv's Waterfall Architecture

**OmniEnv** stops the bleeding.

Instead of treating `.env` files as disparate text blobs, OmniEnv treats your
configurations as a **relational cascade**.

1. **Global Constants First**: Configure your keys once. Is it an AWS Key? Put
   it in the global vault. You can restrict it to specific projects if you have
   trust issues.
2. **Project Schemas**: A user outlines a project. For each required Variable
   (e.g. `NODE_SERVER_URL`), they select which Overrides matter (`STAGE`,
   `CLIENT`).
3. **The Matrix Generator**: OmniEnv creates an elegant 2D visualization matrix.
   You don't type anything. You just select the exact cascade you want:
   `NextJs-Patient` ➔ `AWS-ACCOUNT (DEV)` ➔ `STAGE (PRELIVE)` ➔
   `CLIENT (CLIENT-A)`

OmniEnv's **Waterfall Resolution Engine** instantly computes the exact
configuration needed by looking at the most specific override layer and falling
back to the Global Default if necessary.

### Why You Will Love This (Besides The Buzzwords)

- **Zero Infrastructure Costs**: We don't host an enterprise SaaS database that
  hackers can breach. We use advanced AES-256 Two-Tier Cryptography running
  entirely in the browser's LocalStorage. It's perfectly air-gapped security for
  free.
- **Instant Exporting**: Generate configurations as text or JSON, directly to
  the clipboard, without a single network request.
- **Saves 1000s of Developer Hours**: Stop debugging 502 Bad Gateway errors
  caused by a trailing space in a teammate's `.env.local` file.

---

## 📖 Documentation Map

OmniEnv's architecture is built entirely in the browser. Learn how we achieved
this black magic:

1. [High Level Architecture](./architecture.md)
2. [State & Local Storage Engine](./local-storage.md)
3. [The Advanced Two-Tier Encryption Engine](./encryption-engine.md)
4. [The Single-Tab Anti-Corruption mechanism](./single-tab-guard.md)

---

## 🛠 Quick Start Development

1. **Install Dependencies**:

   ```bash
   yarn install
   ```

2. **Set up Environment**: Duplicate the provided `.env.example` into a local
   `.env.local`

   ```bash
   cp .env.example .env.local
   ```

   > Generate a unique passphrase for your `NEXT_PUBLIC_BACKUP_SYS_KEY_V1` and
   > restart your dev server. This internal AES password protects all local
   > System Backups.

3. **Run Application server**:
   ```bash
   yarn dev
   ```

Wait for compilation, and access `http://localhost:3000`. You can also click the
"Documentation" button in the app to read this README right inside the platform!
