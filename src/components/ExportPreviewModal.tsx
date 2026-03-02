import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Copy,
  Download,
  Check,
  FileJson,
  FileText,
  BookmarkPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { useEnvStore } from "@/store/useEnvStore";

export function ExportPreviewModal({
  isOpen,
  onClose,
  projectName,
  projectId,
  envText,
  jsonText,
  currentSelections,
}: {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  projectId: string;
  envText: string;
  jsonText: string;
  currentSelections: Record<string, string>;
}) {
  const [activeTab, setActiveTab] = useState<"env" | "json">("env");
  const [copied, setCopied] = useState(false);
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [presetName, setPresetName] = useState("");
  const { addPreset } = useEnvStore();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        activeTab === "env" ? envText : jsonText,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const handleDownload = () => {
    const content = activeTab === "env" ? envText : jsonText;
    const ext = activeTab === "env" ? "env" : "json";
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `.${ext}.${projectName.toLowerCase().replace(/\s+/g, "-")}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) return;
    addPreset({
      projectId,
      name: presetName.trim(),
      selections: currentSelections,
    });
    setIsSavingPreset(false);
    setPresetName("");
  };

  // Check if currentSelections exactly match any existing preset for this project
  const existingPreset = useEnvStore((s) => s.presets).find((p) => {
    if (p.projectId !== projectId) return false;
    const pKeys = Object.keys(p.selections);
    const cKeys = Object.keys(currentSelections);
    if (pKeys.length !== cKeys.length) return false;
    return pKeys.every((k) => p.selections[k] === currentSelections[k]);
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-[#0a0a0a]/95 backdrop-blur-xl border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            Environment Generated
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Review your configurations before extracting them from the browser.
          </p>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Action Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
            <div className="flex bg-black/40 p-1 rounded-lg border border-border">
              <button
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm transition-all ${activeTab === "env" ? "bg-primary text-black font-semibold" : "text-muted-foreground hover:text-white"}`}
                onClick={() => setActiveTab("env")}
              >
                <FileText className="w-4 h-4" /> .env
              </button>
              <button
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm transition-all ${activeTab === "json" ? "bg-primary text-black font-semibold" : "text-muted-foreground hover:text-white"}`}
                onClick={() => setActiveTab("json")}
              >
                <FileJson className="w-4 h-4" /> JSON
              </button>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="flex-1 sm:flex-none"
              >
                {copied ? (
                  <Check className="w-4 h-4 mr-2 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 mr-2" />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button
                size="sm"
                onClick={handleDownload}
                className="flex-1 sm:flex-none"
              >
                <Download className="w-4 h-4 mr-2" /> Download
              </Button>
            </div>
          </div>

          {/* Code Viewer */}
          <div className="bg-black/50 border border-white/10 rounded-xl p-4 overflow-x-auto max-h-[50vh] overflow-y-auto font-mono text-sm shadow-inner shrink-0 relative">
            <pre className="text-gray-300">
              {activeTab === "env" ? envText : jsonText}
            </pre>
          </div>

          {/* Preset Saving Block */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
            {existingPreset ? (
              <div className="flex items-center gap-3 w-full justify-between">
                <div className="flex items-center gap-3">
                  {/* <div className="p-2 bg-green-500/20 rounded-full">
                                                                                <BookmarkPlus className="w-5 h-5 text-green-500" />
                                                                        </div> */}
                  <div>
                    <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                      Active Preset Match
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      This configuration matches your saved{" "}
                      <strong className="text-green-500">
                        {existingPreset.name}
                      </strong>{" "}
                      preset.
                    </p>
                  </div>
                </div>
              </div>
            ) : isSavingPreset ? (
              <div className="flex items-center gap-2 w-full">
                <Input
                  placeholder="e.g. Prod + Region EU"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  className="bg-black/40 border-primary/30 h-9"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleSavePreset()}
                />
                <Button
                  size="sm"
                  onClick={handleSavePreset}
                  disabled={!presetName.trim()}
                >
                  Save Preset
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSavingPreset(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-full">
                    <BookmarkPlus className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">
                      Save Configuration Preset
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Save these specific override options to recreate this
                      environment instantly later.
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSavingPreset(true)}
                  className="whitespace-nowrap shrink-0 border-primary/30 text-primary hover:bg-primary/20"
                >
                  Create Preset
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
