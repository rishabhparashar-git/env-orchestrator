"use client";

import { useEnvStore, EnvStore } from "@/store/useEnvStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, Download, Upload, ShieldEllipsis } from "lucide-react";
import Link from "next/link";
import { useState, useRef } from "react";
import { ExportBackupModal } from "@/components/ExportBackupModal";
import { ImportBackupModal } from "@/components/ImportBackupModal";

import { Trash2 as TrashIcon } from "lucide-react";

export default function Settings() {
  const { overrides, addOverride, updateOverride, deleteOverride, theme, setTheme, exportState, importState, clearAllData } = useEnvStore();

  const [newOverrideName, setNewOverrideName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importedFileContent, setImportedFileContent] = useState<string | null>(null);

  const handleAddOverride = () => {
    if (!newOverrideName.trim()) return;
    addOverride({ name: newOverrideName, options: [] });
    setNewOverrideName("");
  };

  const handleAddOption = (overrideId: string, currentOptions: string[], newOption: string) => {
    if (!newOption.trim() || currentOptions.includes(newOption.trim())) return;
    updateOverride(overrideId, { options: [...currentOptions, newOption.trim().toUpperCase()] });
  };

  const handleDeleteOption = (overrideId: string, currentOptions: string[], optionToDelete: string) => {
    updateOverride(overrideId, { options: currentOptions.filter(o => o !== optionToDelete) });
  };

  const handleExportBackup = () => {
    setIsExportOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setImportedFileContent(result);
        setIsImportOpen(true);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleConfirmImport = (jsonString: string) => {
    importState(jsonString);
    setIsImportOpen(false);
    setImportedFileContent(null);
  };

  const handleBackupFirst = () => {
    setIsImportOpen(false);
    setIsExportOpen(true);
  };

  const handleClearAll = () => {
    if (window.confirm("WARNING: Are you sure you want to completely erase this workspace? This will permanently delete all Projects, Matrix keys, and Overrides. Please make sure you have exported a Backup first!")) {
      clearAllData();
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-12 space-y-12">
      <header className="flex items-center gap-4 border-b border-border pb-6">
        <Link href="/">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Global Settings</h1>
          <p className="text-muted-foreground">Manage thematic preferences, system backups, and global overrides.</p>
        </div>
      </header>

      {/* Theming Section */}
      <section className="glass-panel p-6 rounded-xl animate-in fade-in duration-500">
        <h2 className="text-xl font-semibold mb-4 text-primary">UI Theme</h2>
        <div className="max-w-sm">
          <Label className="mb-2 block">Choose Active Theme</Label>
          <Select value={theme} onValueChange={(t: string) => setTheme(t as EnvStore["theme"])}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="liquid-glass-dark">Liquid Glass (Electric Purple / Dark)</SelectItem>
              <SelectItem value="liquid-glass-light">Liquid Glass (Fresh Mint / Light)</SelectItem>
              <SelectItem value="dark">Solid Clean (Dark Mode)</SelectItem>
              <SelectItem value="solid-light">Solid Minimal (Light Mode)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* Overrides Management */}
      <section className="glass-panel p-6 rounded-xl animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">
        <h2 className="text-xl font-semibold mb-6 flex items-center">
          <span className="w-2 h-6 bg-primary rounded-full mr-3"></span>
          Global Overrides
        </h2>

        <div className="grid gap-6 md:grid-cols-2">
          {overrides.map(ov => (
            <div key={ov.id} className="bg-black/10 dark:bg-white/5 border border-border p-4 rounded-lg relative group">
              <button
                onClick={() => deleteOverride(ov.id)}
                className="absolute top-2 right-2 p-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <h3 className="font-bold mb-4">{ov.name}</h3>

              <div className="flex flex-wrap gap-2 mb-4">
                {ov.options.map(opt => (
                  <div key={opt} className="bg-background border border-border px-2 py-1 flex items-center gap-2 rounded-md text-xs font-mono">
                    {opt}
                    <button onClick={() => handleDeleteOption(ov.id, ov.options, opt)} className="text-muted-foreground hover:text-destructive">×</button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="New Option (e.g. DEMO)"
                  className="h-8 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddOption(ov.id, ov.options, e.currentTarget.value);
                      e.currentTarget.value = "";
                    }
                  }}
                />
              </div>
            </div>
          ))}

          {/* Create New Override */}
          <div className="border-2 border-dashed border-border rounded-lg p-4 flex flex-col justify-center gap-3 bg-transparent">
            <h3 className="font-semibold text-muted-foreground">Create New Context</h3>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. CLIENT"
                value={newOverrideName}
                onChange={e => setNewOverrideName(e.target.value)}
              />
              <Button onClick={handleAddOverride} size="icon"><Plus className="w-4 h-4" /></Button>
            </div>
          </div>

        </div>
      </section>

      {/* Persistence / Backup */}
      <section className="glass-panel p-6 rounded-xl animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200">
        <h2 className="text-xl font-semibold mb-4 text-primary flex items-center gap-2">
          <ShieldEllipsis className="w-5 h-5" /> Data Persistence & Secure Backups
        </h2>
        <p className="text-muted-foreground text-sm mb-6 max-w-2xl">
          All data is stored purely within your browser&apos;s local storage. You should routinely export your configuration state to avoid data loss. Encrypt your backups with AES-256 for secure sharing.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={handleExportBackup} className="gap-2 flex-1 max-w-[200px]" variant="outline">
            <Download className="w-4 h-4" /> Export Config JSON
          </Button>

          <input
            type="file"
            accept=".json,.backup"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            id="import-backup"
          />
          <Button className="gap-2 flex-1 max-w-[200px]" variant="secondary" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4" /> Import Backup
          </Button>

          <Button className="gap-2 flex-1 max-w-[200px]" variant="destructive" onClick={handleClearAll}>
            <TrashIcon className="w-4 h-4" /> Clear Workspace
          </Button>
        </div>
      </section>

      <ExportBackupModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        rawJsonString={exportState()}
      />

      <ImportBackupModal
        isOpen={isImportOpen}
        onClose={() => { setIsImportOpen(false); setImportedFileContent(null); }}
        onImport={handleConfirmImport}
        onBackupFirst={handleBackupFirst}
        fileContent={importedFileContent}
      />

    </div>
  );
}
