"use client";

import { useEnvStore } from "@/store/useEnvStore";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useParams } from "next/navigation";
import { useState, useMemo } from "react";
import {
  ArrowLeft,
  ArrowRightLeft,
  Plus,
  MoveRight,
  MoveLeft,
  Eye,
  EyeOff,
  Save,
} from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";

type DiffType = "equal" | "missing-left" | "missing-right" | "different";

interface DiffResult {
  keyName: string;
  keyId: string;
  leftVal: string;
  rightVal: string;
  leftHash: string;
  rightHash: string;
  diffType: DiffType;
}

export default function EnvCompare() {
  const { id } = useParams() as { id: string };
  const {
    projects,
    schemas,
    overrides,
    presets,
    values,
    setValue,
    privacyMode,
    setPrivacyMode,
  } = useEnvStore();

  const project = projects.find((p) => p.id === id);
  const schema = schemas.find((s) => s.projectId === id) || { keys: [] };
  const projectPresets = presets.filter((p) => p.projectId === id);

  // States for Left Pane (Env 1)
  const [leftPresetId, setLeftPresetId] = useState<string>("custom");
  const [leftSelections, setLeftSelections] = useState<Record<string, string>>(
    {},
  );

  // States for Right Pane (Env 2)
  const [rightPresetId, setRightPresetId] = useState<string>("custom");
  const [rightSelections, setRightSelections] = useState<
    Record<string, string>
  >({});

  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});

  // Diff Computation Logic
  const diffs = useMemo<DiffResult[]>(() => {
    const results: DiffResult[] = [];

    schema.keys.forEach((k) => {
      // Resolve Left
      let leftVal = values[`${id}_${k.id}_global_default`] || "";
      let leftHash = `${id}_${k.id}_global_default`;

      k.overrides.forEach((ovId) => {
        const option = leftSelections[ovId];
        if (option) {
          const checkHash = `${id}_${k.id}_${ovId}_${option}`;
          const checkVal = values[checkHash];
          if (checkVal !== undefined && checkVal !== "") {
            leftVal = checkVal;
            leftHash = checkHash;
          }
        }
      });

      // Resolve Right
      let rightVal = values[`${id}_${k.id}_global_default`] || "";
      let rightHash = `${id}_${k.id}_global_default`;

      k.overrides.forEach((ovId) => {
        const option = rightSelections[ovId];
        if (option) {
          const checkHash = `${id}_${k.id}_${ovId}_${option}`;
          const checkVal = values[checkHash];
          if (checkVal !== undefined && checkVal !== "") {
            rightVal = checkVal;
            rightHash = checkHash;
          }
        }
      });

      // Determine Diff Type
      let diffType: DiffType = "equal";
      if (!leftVal && rightVal) diffType = "missing-left";
      else if (leftVal && !rightVal) diffType = "missing-right";
      else if (leftVal !== rightVal) diffType = "different";

      results.push({
        keyName: k.name,
        keyId: k.id,
        leftVal,
        rightVal,
        leftHash,
        rightHash,
        diffType,
      });
    });

    // Sort: Differences first, then equals
    return results.sort((a, b) => {
      if (a.diffType === "equal" && b.diffType !== "equal") return 1;
      if (a.diffType !== "equal" && b.diffType === "equal") return -1;
      return a.keyName.localeCompare(b.keyName);
    });
  }, [schema.keys, values, leftSelections, rightSelections, id]);

  const handleLeftPresetChange = (presetId: string) => {
    setLeftPresetId(presetId);
    if (presetId !== "custom") {
      const p = presets.find((pr) => pr.id === presetId);
      if (p) setLeftSelections(p.selections);
    } else {
      setLeftSelections({});
    }
  };

  const handleRightPresetChange = (presetId: string) => {
    setRightPresetId(presetId);
    if (presetId !== "custom") {
      const p = presets.find((pr) => pr.id === presetId);
      if (p) setRightSelections(p.selections);
    } else {
      setRightSelections({});
    }
  };

  const renderConfigSelector = (
    label: string,
    presetId: string,
    setPreset: (val: string) => void,
    selections: Record<string, string>,
    setSelections: (val: Record<string, string>) => void,
  ) => (
    <div className="glass-panel p-6 rounded-xl space-y-4">
      <h3 className="font-bold text-lg flex items-center gap-2">{label}</h3>
      <div>
        <label className="text-xs text-muted-foreground uppercase mb-1 block">
          Load Preset
        </label>
        <Select value={presetId} onValueChange={setPreset}>
          <SelectTrigger>
            <SelectValue placeholder="Custom Configuration" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="custom">-- Custom Selection --</SelectItem>
            {projectPresets.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="pt-2">
        <label className="text-xs text-muted-foreground uppercase mb-2 block">
          Active Overrides
        </label>
        <div className="space-y-3">
          {overrides.map((ov) => (
            <div
              key={ov.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <span className="text-sm border-l-2 border-primary/50 pl-2">
                {ov.name}
              </span>
              <Select
                value={selections[ov.id] || "none"}
                onValueChange={(val) => {
                  setPreset("custom"); // Override preset if manual tweaks are made
                  if (val === "none") {
                    const next = { ...selections };
                    delete next[ov.id];
                    setSelections(next);
                  } else {
                    setSelections({ ...selections, [ov.id]: val });
                  }
                }}
              >
                <SelectTrigger className="w-[160px] h-8 text-xs">
                  <SelectValue placeholder="No Override" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-muted-foreground">
                    Global/Base
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
      </div>
    </div>
  );

  const toggleReveal = (keyName: string) => {
    setRevealedIds((prev) => ({ ...prev, [keyName]: !prev[keyName] }));
  };

  const isVisible = (keyName: string) => {
    if ((privacyMode as unknown) === false || privacyMode === "show")
      return true;
    if ((privacyMode as unknown) === true || privacyMode === "hide")
      return false;
    return !!revealedIds[keyName]; // partial
  };

  const handleSyncToRight = (diff: DiffResult) => {
    setValue(diff.rightHash, diff.leftVal);
  };

  const handleSyncToLeft = (diff: DiffResult) => {
    setValue(diff.leftHash, diff.rightVal);
  };

  if (!project) return <div>Project not found</div>;

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <Link href={`/projects/${project.id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              Deep Compare <ArrowRightLeft className="w-6 h-6 text-primary" />
            </h1>
            <p className="text-muted-foreground">
              Compare and synchronize overrides.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
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

      {/* Selectors */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {renderConfigSelector(
          "Left Environment",
          leftPresetId,
          handleLeftPresetChange,
          leftSelections,
          setLeftSelections,
        )}
        {renderConfigSelector(
          "Right Environment",
          rightPresetId,
          handleRightPresetChange,
          rightSelections,
          setRightSelections,
        )}
      </div>

      {/* Diff Table */}
      <div className="glass-panel rounded-xl overflow-hidden border border-border">
        <div className="bg-black/20 dark:bg-white/5 p-4 flex items-center justify-between border-b border-border">
          <h3 className="font-bold flex items-center gap-2">
            Variables Matrix
          </h3>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500"></span>{" "}
              Missing Right
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-blue-500/20 border border-blue-500"></span>{" "}
              Missing Left
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500"></span>{" "}
              Mismatch
            </span>
          </div>
        </div>

        <div className="divide-y divide-border min-w-[800px] overflow-x-auto">
          {diffs.map((diff) => (
            <div
              key={diff.keyId}
              className="grid grid-cols-12 items-center p-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors gap-4"
            >
              {/* Key Name */}
              <div className="col-span-3 font-mono text-sm break-all font-semibold flex items-center justify-between group">
                <span
                  className={`px-2 py-1 rounded-md ${
                    diff.diffType === "missing-right"
                      ? "bg-green-500/10 text-green-500"
                      : diff.diffType === "missing-left"
                        ? "bg-blue-500/10 text-blue-500"
                        : diff.diffType === "different"
                          ? "bg-yellow-500/10 text-yellow-500"
                          : "text-foreground"
                  }`}
                >
                  {diff.keyName}
                </span>
                {(privacyMode === "partial" ||
                  (privacyMode as unknown) === "partial") && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={() => toggleReveal(diff.keyName)}
                  >
                    {revealedIds[diff.keyName] ? (
                      <EyeOff className="w-3 h-3" />
                    ) : (
                      <Eye className="w-3 h-3" />
                    )}
                  </Button>
                )}
              </div>

              {/* Left Input */}
              <div className="col-span-4 flex items-center gap-2">
                <Input
                  type={isVisible(diff.keyName) ? "text" : "password"}
                  value={diff.leftVal}
                  onChange={(e) => setValue(diff.leftHash, e.target.value)}
                  className={`font-mono text-xs ${diff.diffType === "missing-right" ? "border-green-500/50" : diff.diffType === "different" ? "border-yellow-500/50" : ""}`}
                  placeholder="Left Empty..."
                />
              </div>

              {/* Action Buttons */}
              <div className="col-span-1 flex flex-col items-center justify-center gap-1 px-2">
                {diff.diffType !== "equal" ? (
                  <>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 rounded-full hover:bg-primary/20 hover:text-primary"
                      onClick={() => handleSyncToRight(diff)}
                      title="Sync Left to Right"
                    >
                      <MoveRight className="w-3 h-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 rounded-full hover:bg-primary/20 hover:text-primary"
                      onClick={() => handleSyncToLeft(diff)}
                      title="Sync Right to Left"
                    >
                      <MoveLeft className="w-3 h-3" />
                    </Button>
                  </>
                ) : (
                  <span className="text-muted-foreground/50">
                    <ArrowRightLeft className="w-4 h-4" />
                  </span>
                )}
              </div>

              {/* Right Input */}
              <div className="col-span-4 flex items-center gap-2">
                <Input
                  type={isVisible(diff.keyName) ? "text" : "password"}
                  value={diff.rightVal}
                  onChange={(e) => setValue(diff.rightHash, e.target.value)}
                  className={`font-mono text-xs ${diff.diffType === "missing-left" ? "border-blue-500/50" : diff.diffType === "different" ? "border-yellow-500/50" : ""}`}
                  placeholder="Right Empty..."
                />
              </div>
            </div>
          ))}

          {diffs.length === 0 && (
            <div className="p-12 text-center text-muted-foreground">
              No variables defined in this project schema yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
