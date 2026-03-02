"use client";

import { useEnvStore } from "@/store/useEnvStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useParams } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  Download,
  Eye,
  EyeOff,
  Copy,
  Check,
  Bookmark,
  X,
  Import,
  ArrowRightLeft,
} from "lucide-react";
import Link from "next/link";
import { ExportPreviewModal } from "@/components/ExportPreviewModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function EnvMatrixForm() {
  const { id } = useParams() as { id: string };
  const {
    projects,
    schemas,
    overrides,
    presets,
    deletePreset,
    values,
    setValue,
    privacyMode,
    setPrivacyMode,
  } = useEnvStore();

  const project = projects.find((p) => p.id === id);
  const schema = schemas.find((s) => s.projectId === id) || { keys: [] };
  const projectPresets = presets.filter((p) => p.projectId === id);

  const [viewMode, setViewMode] = useState<"byKey" | "byOverride">("byKey");
  const [selectedOverrideId, setSelectedOverrideId] = useState<string>(
    overrides[0]?.id || "",
  );
  const [exportSelections, setExportSelections] = useState<
    Record<string, string>
  >({}); // { overrideId: option }

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [generatedEnvText, setGeneratedEnvText] = useState("");
  const [generatedJsonText, setGeneratedJsonText] = useState("");

  const [revealedGroups, setRevealedGroups] = useState<Record<string, boolean>>(
    {},
  );
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

  const currentActivePreset = projectPresets.find((p) => {
    const pKeys = Object.keys(p.selections);
    const cKeys = Object.keys(exportSelections);
    if (pKeys.length !== cKeys.length) return false;
    return pKeys.every((k) => p.selections[k] === exportSelections[k]);
  });

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates((prev) => ({ ...prev, [id]: true }));
      setTimeout(() => {
        setCopiedStates((prev) => ({ ...prev, [id]: false }));
      }, 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const toggleGroupPrivacy = (groupId: string) => {
    setRevealedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const getInputType = (groupId: string, inputId: string) => {
    const mode =
      (privacyMode as unknown) === false
        ? "show"
        : (privacyMode as unknown) === true
          ? "hide"
          : privacyMode;
    if (mode === "show") return "text";
    if (mode === "hide") return "password";
    if (mode === "partial") {
      if (revealedGroups[groupId]) return "text";
      if (focusedInput === inputId) return "text";
      return "password";
    }
    return "text";
  };

  const handleValueChange = (
    keyId: string,
    overrideId: string,
    option: string,
    val: string,
  ) => {
    const hash = `${id}_${keyId}_${overrideId}_${option}`;
    setValue(hash, val);
  };

  const getHashValue = (keyId: string, overrideId: string, option: string) => {
    return values[`${id}_${keyId}_${overrideId}_${option}`] || "";
  };

  const getMappedSelections = (presetToImport: {
    selections: Record<string, string>;
  }) => {
    const newSelections: Record<string, string> = {};
    Object.entries(presetToImport.selections).forEach(
      ([foreignOverrideId, foreignOptionValue]) => {
        const localOverrideExists = overrides.find(
          (o) => o.id === foreignOverrideId,
        );
        if (
          localOverrideExists &&
          localOverrideExists.options.includes(foreignOptionValue)
        ) {
          newSelections[foreignOverrideId] = foreignOptionValue;
        }
      },
    );
    return newSelections;
  };

  const handleImportPreset = (presetToImport: {
    name: string;
    selections: Record<string, string>;
  }) => {
    const newSelections = getMappedSelections(presetToImport);

    useEnvStore.getState().addPreset({
      projectId: id,
      name: `${presetToImport.name} (Imported)`,
      selections: newSelections,
    });
  };

  // 1. Group by Key
  const renderByKey = () => {
    return schema.keys.map((k) => (
      <div key={k.id} className="glass-panel p-6 rounded-xl space-y-4 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h3
              className="text-xl font-bold group font-mono text-primary flex items-center gap-2 cursor-pointer hover:underline decoration-primary underline-offset-4"
              onClick={() => copyToClipboard(k.name, `name_${k.id}`)}
              title="Click to copy key name"
            >
              <span>{k.name}</span>{" "}
              {copiedStates[`name_${k.id}`] ? (
                <Check className="w-4 h-4 text-green-500 opacity-100 transition-opacity" />
              ) : (
                <Copy
                  className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity hover:text-primary"
                  onClick={() => copyToClipboard(k.name, `name_${k.id}`)}
                />
              )}
            </h3>
            <p className="text-sm text-muted-foreground">{k.description}</p>
          </div>
          {(privacyMode === "partial" ||
            (privacyMode as unknown) === "partial") && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleGroupPrivacy(k.id)}
              title="Toggle Group Visibility"
            >
              {revealedGroups[k.id] ? (
                <EyeOff className="w-5 h-5 text-muted-foreground" />
              ) : (
                <Eye className="w-5 h-5 text-muted-foreground" />
              )}
            </Button>
          )}
        </div>

        {k.overrides.length === 0 ? (
          <div>
            <Label>Global Default Value</Label>
            <div className="relative">
              <Input
                type={getInputType(k.id, `${k.id}_global_default`)}
                value={getHashValue(k.id, "global", "default")}
                onChange={(e) =>
                  handleValueChange(k.id, "global", "default", e.target.value)
                }
                onFocus={() => setFocusedInput(`${k.id}_global_default`)}
                onBlur={() => setFocusedInput(null)}
                placeholder="Base value..."
                className="pr-10"
              />
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-muted rounded-md text-muted-foreground focus:outline-none"
                onClick={() =>
                  copyToClipboard(
                    getHashValue(k.id, "global", "default"),
                    `val_${k.id}_global_default`,
                  )
                }
                title="Copy value"
              >
                {copiedStates[`val_${k.id}_global_default`] ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="border-b border-border pb-4">
              <Label className="text-foreground">Global Default Base</Label>
              <div className="relative mt-2">
                <Input
                  type={getInputType(k.id, `${k.id}_global_default`)}
                  value={getHashValue(k.id, "global", "default")}
                  onChange={(e) =>
                    handleValueChange(k.id, "global", "default", e.target.value)
                  }
                  onFocus={() => setFocusedInput(`${k.id}_global_default`)}
                  onBlur={() => setFocusedInput(null)}
                  placeholder="Fallback value if no override matches"
                  className="pr-10"
                />
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-muted rounded-md text-muted-foreground focus:outline-none"
                  onClick={() =>
                    copyToClipboard(
                      getHashValue(k.id, "global", "default"),
                      `val_${k.id}_global_default_nested`,
                    )
                  }
                  title="Copy value"
                >
                  {copiedStates[`val_${k.id}_global_default_nested`] ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            {k.overrides.map((ovId) => {
              const ov = overrides.find((o) => o.id === ovId);
              if (!ov) return null;

              return (
                <div key={ov.id} className="pl-4 border-l-2 border-primary/50">
                  <h4 className="font-semibold mb-3">{ov.name} Overrides</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ov.options.map((opt) => (
                      <div key={opt}>
                        <Label className="text-xs text-muted-foreground uppercase">
                          {opt}
                        </Label>
                        <div className="relative mt-1">
                          <Input
                            type={getInputType(k.id, `${k.id}_${ov.id}_${opt}`)}
                            value={getHashValue(k.id, ov.id, opt)}
                            onChange={(e) =>
                              handleValueChange(
                                k.id,
                                ov.id,
                                opt,
                                e.target.value,
                              )
                            }
                            onFocus={() =>
                              setFocusedInput(`${k.id}_${ov.id}_${opt}`)
                            }
                            onBlur={() => setFocusedInput(null)}
                            placeholder={`Value for ${opt}`}
                            className="pr-10"
                          />
                          <button
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-muted rounded-md text-muted-foreground focus:outline-none"
                            onClick={() =>
                              copyToClipboard(
                                getHashValue(k.id, ov.id, opt),
                                `val_${k.id}_${ov.id}_${opt}`,
                              )
                            }
                            title="Copy value"
                          >
                            {copiedStates[`val_${k.id}_${ov.id}_${opt}`] ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    ));
  };

  // 2. Group by Override
  const renderByOverride = () => {
    const ov = overrides.find((o) => o.id === selectedOverrideId);
    if (!ov) return <p>Please select an override above.</p>;

    // Find all keys that use this override
    const keysUsingOverride = schema.keys.filter((k) =>
      k.overrides.includes(ov.id),
    );

    if (keysUsingOverride.length === 0) {
      return (
        <p className="text-muted-foreground p-6 text-center">
          No keys in this project use the {ov.name} override.
        </p>
      );
    }

    return ov.options.map((opt) => (
      <div key={opt} className="glass-panel p-6 rounded-xl mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold bg-primary/20 text-primary inline-block px-3 py-1 rounded-md uppercase">
            {opt}
          </h3>
          {(privacyMode === "partial" ||
            (privacyMode as unknown) === "partial") && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleGroupPrivacy(opt)}
              title="Toggle Group Visibility"
            >
              {revealedGroups[opt] ? (
                <EyeOff className="w-5 h-5 text-muted-foreground" />
              ) : (
                <Eye className="w-5 h-5 text-muted-foreground" />
              )}
            </Button>
          )}
        </div>
        <div className="space-y-4">
          {keysUsingOverride.map((k) => (
            <div
              key={k.id}
              className="p-4 border border-border rounded-lg bg-black/5 dark:bg-white/5 space-y-3"
            >
              <Label className="font-mono text-sm group flex items-center gap-2 w-fit">
                <span
                  className="cursor-pointer hover:underline decoration-primary underline-offset-4"
                  onClick={() => copyToClipboard(k.name, `name_ov_${k.id}`)}
                  title="Click to copy key name"
                >
                  {k.name}
                </span>
                {copiedStates[`name_ov_${k.id}`] ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy
                    className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity hover:text-primary"
                    onClick={() => copyToClipboard(k.name, `name_ov_${k.id}`)}
                  />
                )}
              </Label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Global Base
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      type={getInputType(opt, `${k.id}_global_default_${opt}`)}
                      value={getHashValue(k.id, "global", "default")}
                      onChange={(e) =>
                        handleValueChange(
                          k.id,
                          "global",
                          "default",
                          e.target.value,
                        )
                      }
                      onFocus={() =>
                        setFocusedInput(`${k.id}_global_default_${opt}`)
                      }
                      onBlur={() => setFocusedInput(null)}
                      placeholder={`Base value`}
                      className="pr-10"
                    />
                    <button
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-muted rounded-md text-muted-foreground focus:outline-none"
                      onClick={() =>
                        copyToClipboard(
                          getHashValue(k.id, "global", "default"),
                          `val_ov_${k.id}_global_default`,
                        )
                      }
                      title="Copy value"
                    >
                      {copiedStates[`val_ov_${k.id}_global_default`] ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-primary uppercase">
                    {opt} Override
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      type={getInputType(opt, `${k.id}_${ov.id}_${opt}`)}
                      value={getHashValue(k.id, ov.id, opt)}
                      onChange={(e) =>
                        handleValueChange(k.id, ov.id, opt, e.target.value)
                      }
                      onFocus={() => setFocusedInput(`${k.id}_${ov.id}_${opt}`)}
                      onBlur={() => setFocusedInput(null)}
                      placeholder={`Set override for ${opt}`}
                      className="pr-10"
                    />
                    <button
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-muted rounded-md text-muted-foreground focus:outline-none"
                      onClick={() =>
                        copyToClipboard(
                          getHashValue(k.id, ov.id, opt),
                          `val_ov_${k.id}_${ov.id}_${opt}`,
                        )
                      }
                      title="Copy value"
                    >
                      {copiedStates[`val_ov_${k.id}_${ov.id}_${opt}`] ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ));
  };

  const handleGenerateEnv = () => {
    let outputEnv = `# Generated by OmniEnv\n# Project: ${project?.name}\n`;
    outputEnv += `# Overrides: ${Object.entries(exportSelections)
      .map(([id, opt]) => {
        const name = overrides.find((o) => o.id === id)?.name;
        return `${name}=${opt}`;
      })
      .join(", ")}\n\n`;

    const jsonPayload: Record<string, string> = {};

    schema.keys.forEach((k) => {
      let finalValue = getHashValue(k.id, "global", "default"); // Start with Global Default

      // Waterfall resolution
      k.overrides.forEach((ovId) => {
        const selectedOption = exportSelections[ovId];
        if (selectedOption) {
          const overrideVal = getHashValue(k.id, ovId, selectedOption);
          if (overrideVal) {
            finalValue = overrideVal;
          }
        }
      });

      outputEnv += `${k.name}="${finalValue}"\n`;
      jsonPayload[k.name] = finalValue;
    });

    setGeneratedEnvText(outputEnv);
    setGeneratedJsonText(JSON.stringify(jsonPayload, null, 2));
    setIsPreviewOpen(true);
  };

  if (!project) return <div>Project not found</div>;

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{project.name} Matrix</h1>
            <p className="text-muted-foreground">
              Fill environment variables and resolve to .env file.
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

          <Select
            value={
              (privacyMode as unknown) === false
                ? "show"
                : (privacyMode as unknown) === true
                  ? "hide"
                  : privacyMode
            }
            onValueChange={(v: "show" | "hide" | "partial") =>
              setPrivacyMode(v)
            }
          >
            <SelectTrigger className="w-[180px] glass-panel bg-transparent !ring-0 focus:!ring-0">
              <SelectValue placeholder="Privacy Mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="show">
                <div className="flex items-center">
                  <Eye className="w-4 h-4 mr-2 text-primary" /> Show All
                </div>
              </SelectItem>
              <SelectItem value="hide">
                <div className="flex items-center">
                  <EyeOff className="w-4 h-4 mr-2 text-destructive" /> Hide All
                </div>
              </SelectItem>
              <SelectItem value="partial">
                <div className="flex items-center">
                  <Eye className="w-4 h-4 mr-2 opacity-50" /> Partial Show
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Side: Generator & Selection */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-panel p-6 rounded-xl sticky top-6">
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <Download className="w-5 h-5 mr-2 text-primary" /> Export
              Generator
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Select your target environment cascade to compute the final .env
              file.
            </p>

            <div className="space-y-4 mb-8">
              {overrides.map((ov) => (
                <div key={ov.id}>
                  <Label className="mb-1 block">{ov.name}</Label>
                  <Select
                    value={exportSelections[ov.id] || ""}
                    onValueChange={(v) =>
                      setExportSelections({ ...exportSelections, [ov.id]: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="No Override (Default)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem
                        value="none"
                        className="text-muted-foreground"
                      >
                        Skip Override
                      </SelectItem>
                      {ov.options.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            {currentActivePreset && (
              <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-md flex items-center gap-2 text-sm text-green-500">
                <Bookmark className="w-4 h-4" />
                <span>
                  Active Preset: <strong>{currentActivePreset.name}</strong>
                </span>
              </div>
            )}

            <Button onClick={handleGenerateEnv} size="lg" className="w-full">
              Compute Configurations
            </Button>

            <div className="mt-6 pt-6 border-t border-border text-xs text-muted-foreground">
              <strong>Waterfall Resolution:</strong>
              <br />
              1. Global Default (Lowest)
              <br />
              2. Overrides stack and replace values based on selection.
            </div>
          </div>

          {/* Quick Presets Menu */}
          <div className="glass-panel p-6 rounded-xl animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center">
                <Bookmark className="w-4 h-4 mr-2 text-primary" /> Saved Presets
              </h3>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-muted-foreground hover:text-primary"
                  >
                    <Import className="w-3 h-3 mr-1" /> Import
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-[300px]">
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Other Projects
                  </div>
                  <DropdownMenuSeparator />
                  {projects.filter((p) => p.id !== id).length === 0 && (
                    <div className="p-2 text-xs text-muted-foreground text-center">
                      No other projects found.
                    </div>
                  )}
                  {projects
                    .filter((p) => p.id !== id)
                    .map((otherProj) => {
                      const otherPresets = presets.filter(
                        (p) => p.projectId === otherProj.id,
                      );
                      if (otherPresets.length === 0) return null;
                      return (
                        <div key={otherProj.id} className="mb-2">
                          <div className="px-2 py-1 text-xs text-primary/70 bg-primary/5">
                            {otherProj.name}
                          </div>
                          {otherPresets.map((op) => {
                            const mappedSelections = getMappedSelections(op);
                            const isDup = projectPresets.some((p) => {
                              const pKeys = Object.keys(p.selections);
                              const mKeys = Object.keys(mappedSelections);
                              if (pKeys.length !== mKeys.length) return false;
                              return pKeys.every(
                                (k) => p.selections[k] === mappedSelections[k],
                              );
                            });

                            return (
                              <DropdownMenuItem
                                key={op.id}
                                onSelect={(e) => {
                                  if (isDup) e.preventDefault();
                                  else handleImportPreset(op);
                                }}
                                disabled={isDup}
                                className="cursor-pointer text-xs justify-between"
                              >
                                <span>
                                  {op.name}
                                  {/* {isDup && <span className="text-muted-foreground ml-1">(Duplicate)</span>} */}
                                </span>
                                <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                                  {Object.keys(op.selections).length} mappings
                                </span>
                              </DropdownMenuItem>
                            );
                          })}
                        </div>
                      );
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {projectPresets.length === 0 ? (
              <div className="text-sm text-muted-foreground p-4 text-center border border-dashed border-border rounded-lg bg-black/5">
                No presets saved yet.
                <br />
                <span className="text-xs">
                  Generate a configuration to save one.
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                {projectPresets.map((preset) => (
                  <div
                    key={preset.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-black/5 dark:bg-white/5 border border-border group hover:border-primary/50 transition-colors"
                  >
                    <button
                      onClick={() => setExportSelections(preset.selections)}
                      className="flex-1 text-left"
                    >
                      <div className="font-medium text-sm text-foreground">
                        {preset.name}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 truncate">
                        {Object.keys(preset.selections).length} Overrides Mapped
                      </div>
                    </button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 hover:bg-destructive/20 hover:text-destructive"
                      onClick={() => deletePreset(preset.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Matrix Input Form */}
        <div className="lg:col-span-8">
          <div className="flex items-center gap-4 mb-6 bg-black/10 dark:bg-white/5 p-2 rounded-lg w-fit">
            <Button
              variant={viewMode === "byKey" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("byKey")}
            >
              Group by Key
            </Button>
            <Button
              variant={viewMode === "byOverride" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("byOverride")}
            >
              Group by Override
            </Button>
          </div>

          {viewMode === "byOverride" && (
            <div className="mb-8">
              <Label className="mb-2 block">Choose Override Context</Label>
              <Select
                value={selectedOverrideId}
                onValueChange={setSelectedOverrideId}
              >
                <SelectTrigger className="w-full md:w-[300px]">
                  <SelectValue />
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
          )}

          <div className="animate-in fade-in duration-300">
            {viewMode === "byKey" ? renderByKey() : renderByOverride()}
          </div>
        </div>
      </div>

      <ExportPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        projectName={project.name}
        projectId={project.id}
        envText={generatedEnvText}
        jsonText={generatedJsonText}
        currentSelections={exportSelections}
      />
    </div>
  );
}
