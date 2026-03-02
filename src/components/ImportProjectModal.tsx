"use client";

import { useEnvStore, SchemaKey } from "@/store/useEnvStore";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Import,
  X,
  CheckSquare,
  Square,
  AlertTriangle,
  ListPlus,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";

export function ImportProjectModal({
  isOpen,
  onClose,
  onImport,
  currentKeys,
}: {
  isOpen: boolean;
  onClose: () => void;
  onImport: (keys: SchemaKey[]) => void;
  currentKeys: SchemaKey[];
}) {
  const { projects, schemas, overrides } = useEnvStore();
  const { id: currentProjectId } = useParams() as { id: string };
  const availableProjects = projects.filter((p) => p.id !== currentProjectId);

  const [sourceId, setSourceId] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<Record<string, boolean>>({});
  const [keyOverrides, setKeyOverrides] = useState<Record<string, string[]>>(
    {},
  );
  const [showExisting, setShowExisting] = useState(true);

  const sourceSchema = schemas.find((s) => s.projectId === sourceId);
  const existingKeyNames = new Set(currentKeys.map((k) => k.name));

  // Reset local state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSourceId("");
      setSelectedKeys({});
      setKeyOverrides({});
      setShowExisting(true);
    }
  }, [isOpen]);

  useEffect(() => {
    if (sourceSchema) {
      const initialSelected: Record<string, boolean> = {};
      const initialOverrides: Record<string, string[]> = {};
      sourceSchema.keys.forEach((k) => {
        initialSelected[k.id] = true;
        initialOverrides[k.id] = [...k.overrides];
      });
      setSelectedKeys(initialSelected);
      setKeyOverrides(initialOverrides);
    } else {
      setSelectedKeys({});
      setKeyOverrides({});
    }
  }, [sourceSchema]);

  if (!isOpen) return null;

  const handleImport = () => {
    if (!sourceSchema) return;
    const keysToImport = sourceSchema.keys
      .filter((k) => selectedKeys[k.id])
      .map((k) => ({
        name: k.name,
        description: k.description,
        id: uuidv4(),
        overrides: keyOverrides[k.id] || [],
      }));

    const overlappingCount = keysToImport.filter((k) =>
      existingKeyNames.has(k.name),
    ).length;
    if (overlappingCount > 0) {
      const confirmed = window.confirm(
        `You selected ${overlappingCount} variable(s) that already exist in your project.\n\nImporting them will OVERWRITE their configuration (description and overrides), but your stored values will remain safely intact.\n\nDo you want to proceed?`,
      );
      if (!confirmed) return;
    }

    onImport(keysToImport);
    onClose();
  };

  const handleApplyGlobalOverride = (ovId: string) => {
    if (!ovId) return;
    setKeyOverrides((prev) => {
      const next = { ...prev };
      Object.keys(selectedKeys).forEach((kId) => {
        if (selectedKeys[kId] && !next[kId].includes(ovId)) {
          next[kId] = [...next[kId], ovId];
        }
      });
      return next;
    });
  };

  const handleRemoveGlobalOverride = (ovId: string) => {
    if (!ovId) return;
    setKeyOverrides((prev) => {
      const next = { ...prev };
      Object.keys(selectedKeys).forEach((kId) => {
        if (selectedKeys[kId]) {
          next[kId] = next[kId].filter((id) => id !== ovId);
        }
      });
      return next;
    });
  };

  const handleToggleSelectAll = (select: boolean) => {
    if (!sourceSchema) return;
    const next: Record<string, boolean> = {};
    sourceSchema.keys.forEach((k) => {
      // If we are hiding existing keys, don't affect them
      if (!showExisting && existingKeyNames.has(k.name)) {
        next[k.id] = selectedKeys[k.id]; // keep current
        return;
      }
      next[k.id] = select;
    });
    setSelectedKeys(next);
  };

  const handleSelectMissing = () => {
    if (!sourceSchema) return;
    const next: Record<string, boolean> = {};
    sourceSchema.keys.forEach((k) => {
      next[k.id] = !existingKeyNames.has(k.name);
    });
    setSelectedKeys(next);
  };

  const selectedCount = Object.values(selectedKeys).filter(Boolean).length;

  const displayKeys =
    sourceSchema?.keys.filter((k) => {
      if (!showExisting && existingKeyNames.has(k.name)) return false;
      return true;
    }) || [];

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-xl border border-border shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Import className="w-6 h-6 text-primary" /> Import Schema
            </h2>
            <p className="text-muted-foreground text-sm">
              Select a project to import environment variables and override
              configurations.
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <div className="space-y-4">
            <Label className="text-base">Source Project</Label>
            <div className="flex flex-col sm:flex-row gap-6 sm:items-center justify-between">
              <Select value={sourceId} onValueChange={setSourceId}>
                <SelectTrigger className="w-full md:w-[400px]">
                  <SelectValue placeholder="Select an existing project..." />
                </SelectTrigger>
                <SelectContent>
                  {availableProjects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {sourceSchema && (
                <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-md border border-border">
                  <Switch
                    id="show-existing"
                    checked={showExisting}
                    onCheckedChange={setShowExisting}
                  />
                  <Label
                    htmlFor="show-existing"
                    className="cursor-pointer text-sm"
                  >
                    Include Variables present in this Project
                  </Label>
                </div>
              )}
            </div>
          </div>

          {sourceSchema && sourceSchema.keys.length > 0 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              {/* Mass Actions */}
              <div className="glass-panel p-4 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-10 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleSelectAll(true)}
                  >
                    <CheckSquare className="w-4 h-4 mr-2" /> Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectMissing}
                  >
                    <ListPlus className="w-4 h-4 mr-2" /> Select Missing Only
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleSelectAll(false)}
                  >
                    <Square className="w-4 h-4 mr-2" /> Deselect All
                  </Button>
                  <span className="text-sm font-semibold text-primary ml-2 uppercase tracking-wider">
                    {selectedCount} Selected
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 border-t md:border-none pt-4 md:pt-0 border-border">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs whitespace-nowrap">
                      Add Override:
                    </Label>
                    <Select onValueChange={handleApplyGlobalOverride} value="">
                      <SelectTrigger className="h-8 w-[140px] text-xs">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {overrides.map((ov) => (
                          <SelectItem key={ov.id} value={ov.id}>
                            {ov.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs whitespace-nowrap">
                      Remove Override:
                    </Label>
                    <Select onValueChange={handleRemoveGlobalOverride} value="">
                      <SelectTrigger className="h-8 w-[140px] text-xs">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {overrides.map((ov) => (
                          <SelectItem key={ov.id} value={ov.id}>
                            {ov.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Keys List */}
              <div className="grid grid-cols-1 gap-4">
                {displayKeys.map((k) => {
                  const isSelected = selectedKeys[k.id];
                  const currentOverrides = keyOverrides[k.id] || [];
                  const isExisting = existingKeyNames.has(k.name);

                  return (
                    <div
                      key={k.id}
                      className={`p-4 rounded-lg border transition-colors ${isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-black/5 dark:bg-white/5 opacity-60"} ${isExisting && isSelected ? "border-yellow-500/50 bg-yellow-500/5" : ""}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="pt-1">
                          <Switch
                            checked={isSelected}
                            onCheckedChange={(c) =>
                              setSelectedKeys((prev) => ({
                                ...prev,
                                [k.id]: c,
                              }))
                            }
                          />
                        </div>
                        <div className="flex-1 space-y-4">
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <h4 className="font-mono font-bold text-lg">
                                {k.name}
                              </h4>
                              {isExisting && (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 uppercase tracking-widest">
                                  <AlertTriangle className="w-3 h-3" /> Already
                                  in Project
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {k.description || "No description provided."}
                            </p>

                            {isExisting && isSelected && (
                              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2 font-medium">
                                Importing this will overwrite your current
                                description and overrides for this variable.
                                Assigned values will not be lost.
                              </p>
                            )}
                          </div>

                          {/* Inner Overrides Toggle */}
                          {isSelected && overrides.length > 0 && (
                            <div className="bg-background/50 p-3 rounded-md space-y-2 border border-border/50">
                              <Label className="text-xs text-muted-foreground uppercase">
                                Overrides for this variable:
                              </Label>
                              <div className="flex flex-wrap gap-4">
                                {overrides.map((ov) => {
                                  const isOvAttached =
                                    currentOverrides.includes(ov.id);
                                  return (
                                    <Label
                                      key={ov.id}
                                      className="flex items-center gap-2 cursor-pointer font-normal text-sm p-1"
                                    >
                                      <input
                                        type="checkbox"
                                        className="rounded border-input text-primary focus:ring-primary"
                                        checked={isOvAttached}
                                        onChange={(e) => {
                                          setKeyOverrides((prev) => {
                                            const current = prev[k.id] || [];
                                            if (e.target.checked)
                                              return {
                                                ...prev,
                                                [k.id]: [...current, ov.id],
                                              };
                                            return {
                                              ...prev,
                                              [k.id]: current.filter(
                                                (id) => id !== ov.id,
                                              ),
                                            };
                                          });
                                        }}
                                      />
                                      {ov.name}
                                    </Label>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {displayKeys.length === 0 && sourceSchema.keys.length > 0 && (
                  <div className="text-center p-8 text-muted-foreground border border-dashed rounded-xl">
                    All variables in the source project already exist in your
                    current project.
                    <br />
                    Toggle &quot;Include Variables present in this Project&quot;
                    to see them.
                  </div>
                )}
              </div>
            </div>
          )}

          {sourceSchema && sourceSchema.keys.length === 0 && (
            <div className="text-center p-8 text-muted-foreground">
              This project has no environment variables configured.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/30 flex justify-end gap-4">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!sourceSchema || selectedCount === 0}
            className="gap-2"
          >
            <Import className="w-4 h-4" /> Import {selectedCount} Variables
          </Button>
        </div>
      </div>
    </div>
  );
}
