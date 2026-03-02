"use client";

import { useEnvStore } from "@/store/useEnvStore";
import { Button } from "@/components/ui/button";
import { Settings, Plus, Folder, Trash2, BookOpen } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export default function Home() {
  const { projects, addProject, deleteProject } = useEnvStore();
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    addProject({
      name: newProjectName,
      description: newProjectDesc,
      tags: "",
      technology: [],
    });
    setNewProjectName("");
    setNewProjectDesc("");
  };

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-12 space-y-8">
      <header className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent inline-block">
            OmniEnv
          </h1>
          <p className="text-muted-foreground mt-2">
            The only Zero-persistence environment orchestrator tool you will
            ever need.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/docs">
            <Button
              variant="ghost"
              className="glass-panel text-muted-foreground hover:text-primary"
            >
              <BookOpen className="w-4 h-4 mr-2" /> Documentation
            </Button>
          </Link>
          <Link href="/settings">
            <Button variant="outline" className="glass-panel">
              <Settings className="w-4 h-4 mr-2" /> Global Settings
            </Button>
          </Link>
        </div>
      </header>

      <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-xl flex flex-col justify-center h-full border-dashed border-2 bg-transparent hover:bg-white/5 transition-colors">
          <form onSubmit={handleCreateProject} className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center mb-4">
              <Plus className="w-5 h-5 mr-2 text-primary" /> New Project
            </h3>
            <Input
              placeholder="Project Name (e.g. NextJs-Portal)"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              required
            />
            <Input
              placeholder="Description..."
              value={newProjectDesc}
              onChange={(e) => setNewProjectDesc(e.target.value)}
            />
            <Button type="submit" className="w-full">
              Create
            </Button>
          </form>
        </div>

        {projects.map((proj) => (
          <div
            key={proj.id}
            className="glass-panel p-6 rounded-xl flex flex-col relative group"
          >
            <button
              onClick={() => deleteProject(proj.id)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <div className="flex items-center mb-2">
              <div className="p-2 bg-primary/10 rounded-lg mr-3">
                <Folder className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-xl">{proj.name}</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6 flex-1">
              {proj.description || "No description provided."}
            </p>

            <div className="flex gap-2">
              <Link href={`/projects/${proj.id}`} className="flex-1">
                <Button variant="outline" className="w-full">
                  Edit Schema
                </Button>
              </Link>
              <Link href={`/projects/${proj.id}/matrix`} className="flex-1">
                <Button className="w-full">Generator</Button>
              </Link>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
