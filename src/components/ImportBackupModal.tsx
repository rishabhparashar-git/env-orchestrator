"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Lock, FileJson, AlertTriangle, ShieldCheck } from "lucide-react";
import CryptoJS from "crypto-js";
import { BACKUP_SYSTEM_KEYS } from "@/lib/backupKeys";

interface ImportBackupModalProps {
        isOpen: boolean;
        onClose: () => void;
        onImport: (jsonString: string) => void;
        onBackupFirst: () => void;
        fileContent: string | null;
}

export function ImportBackupModal({ isOpen, onClose, onImport, onBackupFirst, fileContent }: ImportBackupModalProps) {
        const [password, setPassword] = useState("");
        const [error, setError] = useState<string | null>(null);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const [metadata, setMetadata] = useState<any>(null);
        const [isLegacy, setIsLegacy] = useState<"v0" | "v1" | false>(false);
        const [needsPassword, setNeedsPassword] = useState(false);
        const [invalidFile, setInvalidFile] = useState(false);

        useEffect(() => {
                if (!isOpen || !fileContent) return;

                // Reset UX state on mount
                setPassword("");
                setError(null);
                setMetadata(null);
                setIsLegacy(false);
                setNeedsPassword(false);
                setInvalidFile(false);

                let parsedState = null;

                // Try V2 Total Obfuscation (Outer Layer System Decryption)
                let isV2 = false;
                for (const sysKey of Object.values(BACKUP_SYSTEM_KEYS)) {
                        try {
                                const bytes = CryptoJS.AES.decrypt(fileContent.trim(), sysKey);
                                const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
                                if (decryptedStr) {
                                        parsedState = JSON.parse(decryptedStr);
                                        if (parsedState.systemPasswordVersion) {
                                                isV2 = true;
                                                break;
                                        }
                                }
                        } catch {
                                // Skip
                        }
                }

                if (isV2 && parsedState) {
                        setMetadata(parsedState);
                        if (parsedState.encryptedByUser) {
                                setNeedsPassword(true);
                        }
                        return; // Successfully loaded V2
                }

                // Fallback: Check if it's Legacy V1 or V0
                try {
                        const parsed = JSON.parse(fileContent);
                        if (parsed.encrypted === true && !parsed.systemPasswordVersion) {
                                // Legacy V1 (Metadata plaintext, payload encrypted by user)
                                setMetadata(parsed);
                                setIsLegacy("v1");
                                setNeedsPassword(true);
                        } else if (parsed.projects && parsed.schemas) {
                                // Legacy V0 (Pure plaintext)
                                setMetadata({
                                        version: "Legacy",
                                        description: "An older, unencrypted backup format.",
                                        tags: [],
                                        timestamp: new Date().toISOString(),
                                        payload: parsed
                                });
                                setIsLegacy("v0");
                        } else if (parsed.payload && !parsed.encrypted) {
                                // V1 unencrypted
                                let extract = null;
                                try { extract = JSON.parse(decodeURIComponent(escape(atob(parsed.payload)))); } catch { extract = parsed.payload; }
                                setMetadata({
                                        version: parsed.version,
                                        description: parsed.description,
                                        tags: parsed.tags,
                                        timestamp: parsed.timestamp,
                                        payload: extract
                                });
                                setIsLegacy("v0");
                        } else {
                                setInvalidFile(true);
                        }
                } catch {
                        setInvalidFile(true);
                }

        }, [isOpen, fileContent]);

        if (!isOpen || !fileContent) return null;

        if (invalidFile || !metadata) {
                return (
                        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
                                <div className="bg-card w-full max-w-lg p-6 rounded-xl border border-border shadow-2xl flex flex-col items-center text-center">
                                        <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
                                        <h2 className="text-xl font-bold mb-2">Invalid Backup File</h2>
                                        <p className="text-muted-foreground mb-6">The uploaded file could not be parsed or decrypted by the system.</p>
                                        <Button onClick={onClose} variant="secondary">Close</Button>
                                </div>
                        </div>
                );
        }

        const handleConfirmImport = () => {
                setError(null);
                let payloadToImport = null;

                if (isLegacy === "v0") {
                        payloadToImport = typeof metadata.payload === 'string' ? metadata.payload : JSON.stringify(metadata.payload);
                } else if (isLegacy === "v1") {
                        if (!password) { setError("Password is required."); return; }
                        try {
                                const bytes = CryptoJS.AES.decrypt(metadata.payload, password);
                                payloadToImport = bytes.toString(CryptoJS.enc.Utf8);
                                if (!payloadToImport) throw new Error("Empty");
                                JSON.parse(payloadToImport); // Health Check
                        } catch {
                                setError("Incorrect password or corrupted legacy payload.");
                                return;
                        }
                } else {
                        // It is V2
                        if (metadata.encryptedByUser) {
                                if (!password) { setError("Password is required."); return; }
                                try {
                                        const bytes = CryptoJS.AES.decrypt(metadata.payload, password);
                                        payloadToImport = bytes.toString(CryptoJS.enc.Utf8);
                                        if (!payloadToImport) throw new Error("Empty");
                                        JSON.parse(payloadToImport);
                                } catch {
                                        setError("Incorrect password for this secure payload.");
                                        return;
                                }
                        } else {
                                // System Encrypted Payload
                                try {
                                        const sysKey = BACKUP_SYSTEM_KEYS[metadata.systemPasswordVersion];
                                        const bytes = CryptoJS.AES.decrypt(metadata.payload, sysKey);
                                        payloadToImport = bytes.toString(CryptoJS.enc.Utf8);
                                        if (!payloadToImport) throw new Error("Empty");
                                        JSON.parse(payloadToImport);
                                } catch {
                                        setError("Failed to unlock automatically via System Key.");
                                        return;
                                }
                        }
                }

                if (payloadToImport) {
                        onImport(payloadToImport);
                        onClose();
                }
        };

        const isFormValid = !needsPassword || (needsPassword && password.length > 0);

        return (
                <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-card w-full max-w-lg overflow-hidden rounded-xl border border-border shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">

                                {/* Header */}
                                <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
                                        <div>
                                                <h2 className="text-xl font-bold flex items-center gap-2">
                                                        {needsPassword ? <Lock className="w-5 h-5 text-primary" /> : <ShieldCheck className="w-5 h-5 text-green-500" />}
                                                        Import Configuration
                                                </h2>
                                                <p className="text-muted-foreground text-sm mt-1">Review the backup attributes before restoring.</p>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
                                </div>

                                {/* Content */}
                                <div className="p-6 space-y-6">

                                        {/* Metadata Display is ALWAYS visible */}
                                        <div className="bg-black/5 dark:bg-white/5 border border-border p-5 rounded-xl space-y-4">
                                                <div className="flex items-center justify-between border-b border-border/50 pb-3">
                                                        <span className="text-sm text-muted-foreground">Version: <strong className="text-foreground tracking-wider">{metadata.version || "Unknown"}</strong></span>
                                                        <span className="text-sm text-muted-foreground font-mono">{metadata.timestamp ? new Date(metadata.timestamp).toLocaleString() : "Unknown"}</span>
                                                </div>

                                                <div>
                                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block tracking-widest">Description</Label>
                                                        <p className="text-sm font-medium">{metadata.description || "No description provided."}</p>
                                                </div>

                                                {metadata.tags && metadata.tags.length > 0 && (
                                                        <div className="flex flex-wrap gap-2 pt-2">
                                                                {metadata.tags.map((t: string) => (
                                                                        <span key={t} className="px-2.5 py-1 bg-primary/10 border border-primary/20 text-primary font-semibold text-xs rounded-md shadow-sm">{t}</span>
                                                                ))}
                                                        </div>
                                                )}
                                        </div>

                                        {/* Encryption Handling specifically for Configuration Extraction */}
                                        {needsPassword ? (
                                                <div className="space-y-3 pt-2">
                                                        <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-500 font-medium">
                                                                <ShieldCheck className="w-4 h-4" /> This configuration is cryptographically locked.
                                                        </div>
                                                        <Label>Configuration Password</Label>
                                                        <Input
                                                                type="password"
                                                                value={password}
                                                                onChange={e => { setPassword(e.target.value); setError(null); }}
                                                                onKeyDown={e => e.key === "Enter" && handleConfirmImport()}
                                                                placeholder="Enter the password used during export"
                                                                className={error ? "border-destructive focus-visible:ring-destructive" : ""}
                                                                autoComplete="new-password"
                                                                autoCorrect="off"
                                                                spellCheck="false"
                                                        />
                                                        {error && <p className="text-xs text-destructive">{error}</p>}
                                                </div>
                                        ) : (
                                                <div className="space-y-3 pt-2">
                                                        <div className="flex items-center gap-2 text-green-600 dark:text-green-500 font-medium text-sm">
                                                                <FileJson className="w-4 h-4" /> This file does not require a password to be imported.
                                                        </div>
                                                </div>
                                        )}

                                        {/* Warning Message */}
                                        <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg flex items-start gap-3 mt-6">
                                                <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                                                <div className="text-sm">
                                                        <strong className="text-destructive block mb-1">Warning: Destructive Action</strong>
                                                        Restoring from this backup will completely overwrite your current browser Configuration State (Projects, Variables, Overrides, etc).
                                                </div>
                                        </div>

                                </div>

                                {/* Footer */}
                                <div className="p-6 border-t border-border bg-muted/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <Button variant="outline" onClick={onBackupFirst} className="w-full sm:w-auto text-xs">
                                                Backup Current State First
                                        </Button>

                                        <div className="flex items-center gap-3 w-full sm:w-auto">
                                                <Button variant="ghost" onClick={onClose} className="flex-1 sm:flex-none">Cancel</Button>
                                                <Button
                                                        onClick={handleConfirmImport}
                                                        disabled={!isFormValid}
                                                        variant="destructive"
                                                        className="gap-2 flex-1 sm:flex-none"
                                                >
                                                        Restore
                                                </Button>
                                        </div>
                                </div>

                        </div>
                </div>
        );
}
