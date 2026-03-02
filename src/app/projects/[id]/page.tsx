"use client";

import { useEnvStore, SchemaKey } from "@/store/useEnvStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Import,
  ArrowRightLeft,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import Link from "next/link";
import { ImportProjectModal } from "@/components/ImportProjectModal";

export default function ProjectSchemaBuilder() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const { projects, schemas, overrides, updateSchema } = useEnvStore();
  const project = projects.find((p) => p.id === id);
  const existingSchema = schemas.find((s) => s.projectId === id);

  const [keys, setKeys] = useState<SchemaKey[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  useEffect(() => {
    if (existingSchema) setKeys(existingSchema.keys);
  }, [existingSchema]);

  if (!project)
    return (
      <div className="p-12 text-center text-destructive">
        Project not found.
      </div>
    );

  const handleAddKey = () => {
    setKeys([
      ...keys,
      { id: uuidv4(), name: "", description: "", overrides: [] },
    ]);
  };

  const handleUpdateKey = (keyId: string, updates: Partial<SchemaKey>) => {
    setKeys(keys.map((k) => (k.id === keyId ? { ...k, ...updates } : k)));
  };

  const handleDeleteKey = (keyId: string) => {
    setKeys(keys.filter((k) => k.id !== keyId));
  };

  const handleToggleOverride = (
    keyId: string,
    overrideId: string,
    checked: boolean,
  ) => {
    setKeys(
      keys.map((k) => {
        if (k.id !== keyId) return k;

        const newOverrides = checked
          ? [...k.overrides, overrideId]
          : k.overrides.filter((id) => id !== overrideId);

        return { ...k, overrides: newOverrides };
      }),
    );
  };

  const handleSave = () => {
    // Only save keys with a name
    const validKeys = keys.filter((k) => k.name.trim() !== "");
    updateSchema(id, validKeys);
    router.push("/");
  };

  const handleImportKeys = (importedKeys: SchemaKey[]) => {
    setKeys((prev) => {
      const next = [...prev];
      importedKeys.forEach((importedKey) => {
        const existingIndex = next.findIndex(
          (k) => k.name === importedKey.name,
        );
        if (existingIndex >= 0) {
          // If the key exists, preserve its original ID to keep existing values intact,
          // but overwrite the description and overrides array
          next[existingIndex] = {
            ...next[existingIndex],
            description:
              importedKey.description || next[existingIndex].description,
            overrides: importedKey.overrides,
          };
        } else {
          // If it's a completely new key, simply append it
          next.push(importedKey);
        }
      });
      return next;
    });
  };

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{project.name} - Schema</h1>
            <p className="text-muted-foreground">
              Define required ENV keys and attach overrides.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href={`/projects/${id}/compare`}>
            <Button
              variant="ghost"
              className="gap-2 text-muted-foreground hover:text-primary"
            >
              <ArrowRightLeft className="w-4 h-4" /> Compare
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={() => setIsImportModalOpen(true)}
            className="gap-2"
          >
            <Import className="w-4 h-4" /> Import
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="w-4 h-4" /> Save Schema
          </Button>
        </div>
      </header>

      <div className="space-y-6">
        {keys.length === 0 && (
          <div className="text-center p-12 glass-panel rounded-xl">
            <h3 className="text-xl font-bold mb-2">No Schema Defined</h3>
            <p className="text-muted-foreground mb-6">
              Start building your environment configuration from scratch or
              import from another project.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button onClick={handleAddKey}>
                <Plus className="w-4 h-4 mr-2" /> Add Key Manually
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsImportModalOpen(true)}
              >
                <Import className="w-4 h-4 mr-2" /> Import Project
              </Button>
            </div>
          </div>
        )}

        {keys.map((keyObj) => (
          <div
            key={keyObj.id}
            className="glass-panel p-6 rounded-xl animate-in slide-in-from-bottom-2 flex flex-col md:flex-row gap-6 relative"
          >
            <button
              onClick={() => handleDeleteKey(keyObj.id)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <div className="flex-1 space-y-4">
              <div>
                <Label>Key Name</Label>
                <Input
                  value={keyObj.name}
                  onChange={(e) =>
                    handleUpdateKey(keyObj.id, {
                      name: e.target.value.toUpperCase().replace(/\s+/g, "_"),
                    })
                  }
                  placeholder="e.g. AWS_ACCESS_KEY_ID"
                  className="font-mono text-primary mt-1"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={keyObj.description}
                  onChange={(e) =>
                    handleUpdateKey(keyObj.id, { description: e.target.value })
                  }
                  placeholder="What is this used for?"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex-1 bg-black/10 dark:bg-white/5 p-4 rounded-lg">
              <Label className="mb-3 block text-muted-foreground">
                Attach Overrides
              </Label>
              {overrides.length === 0 ? (
                <p className="text-sm text-yellow-500">
                  No global overrides defined yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {overrides.map((ov) => (
                    <div
                      key={ov.id}
                      className="flex items-center justify-between"
                    >
                      <Label
                        htmlFor={`switch-${keyObj.id}-${ov.id}`}
                        className="cursor-pointer font-normal"
                      >
                        {ov.name}
                      </Label>
                      <Switch
                        id={`switch-${keyObj.id}-${ov.id}`}
                        checked={keyObj.overrides.includes(ov.id)}
                        onCheckedChange={(c) =>
                          handleToggleOverride(keyObj.id, ov.id, c)
                        }
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {keys.length > 0 && (
          <Button
            variant="outline"
            onClick={handleAddKey}
            className="w-full py-8 border-dashed glass-panel"
          >
            <Plus className="w-5 h-5 mr-2" /> Add Environment Key
          </Button>
        )}
      </div>

      <ImportProjectModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportKeys}
        currentKeys={keys}
      />
    </div>
  );
}
