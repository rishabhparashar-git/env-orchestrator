"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Lock, Download, Eye, EyeOff, Copy, Check, Shield } from "lucide-react";
import CryptoJS from "crypto-js";
import { BACKUP_SYSTEM_KEYS, CURRENT_BACKUP_KEY_VERSION } from "@/lib/backupKeys";

interface ExportBackupModalProps {
        isOpen: boolean;
        onClose: () => void;
        rawJsonString: string;
}

export function ExportBackupModal({ isOpen, onClose, rawJsonString }: ExportBackupModalProps) {
        const [filename, setFilename] = useState("");
        const [version, setVersion] = useState("1.0.0");
        const [description, setDescription] = useState("");
        const [tags, setTags] = useState("");
        const [password, setPassword] = useState("");
        const [showPassword, setShowPassword] = useState(false);
        const [copied, setCopied] = useState(false);

        useEffect(() => {
                if (isOpen) {
                        setFilename(`env-orchestrator-backup-${new Date().toISOString().split('T')[0]}`);
                        setVersion("1.0.0");
                        setDescription("");
                        setTags("");
                        setPassword("");
                        setShowPassword(false);
                        setCopied(false);
                }
        }, [isOpen]);

        if (!isOpen) return null;

        const handleCopyPassword = () => {
                if (!password) return;
                navigator.clipboard.writeText(password);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
        };

        const handleExport = () => {
                const rawState = JSON.parse(rawJsonString);
                let encryptedPayload = "";

                // Layer 1: Secure the Configuration Payload
                if (password) {
                        encryptedPayload = CryptoJS.AES.encrypt(JSON.stringify(rawState), password).toString();
                } else {
                        // If no user password, encrypt with the system key so the payload is fundamentally never plaintext.
                        const sysKey = BACKUP_SYSTEM_KEYS[CURRENT_BACKUP_KEY_VERSION];
                        encryptedPayload = CryptoJS.AES.encrypt(JSON.stringify(rawState), sysKey).toString();
                }

                // Prepare Metadata block
                const finalPayload = {
                        version,
                        description,
                        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
                        timestamp: new Date().toISOString(),
                        encryptedByUser: !!password,
                        systemPasswordVersion: CURRENT_BACKUP_KEY_VERSION,
                        payload: encryptedPayload
                };

                // Layer 2: Secure the ENTIRE Metadata + Payload Block inside a single System Block.
                const sysKeyOut = BACKUP_SYSTEM_KEYS[CURRENT_BACKUP_KEY_VERSION];
                const totallyEncryptedFile = CryptoJS.AES.encrypt(JSON.stringify(finalPayload), sysKeyOut).toString();

                const blob = new Blob([totallyEncryptedFile], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;

                // Always use .backup
                const safeName = filename.replace(/[^a-zA-Z0-9_-]/g, "") || `backup-${finalPayload.timestamp.split('T')[0]}`;
                a.download = `${safeName}.backup`;
                a.click();
                URL.revokeObjectURL(url);

                onClose();
        };

        return (
                <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-card w-full max-w-lg overflow-hidden rounded-xl border border-border shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">

                                {/* Header */}
                                <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
                                        <div>
                                                <h2 className="text-xl font-bold flex items-center gap-2">
                                                        <Shield className="w-5 h-5 text-primary" />
                                                        Secure Backup
                                                </h2>
                                                <p className="text-muted-foreground text-sm mt-1">2-Layer Cryptographic Export</p>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
                                </div>

                                {/* Content */}
                                <div className="p-6 space-y-5">

                                        <div className="space-y-2">
                                                <Label>Filename</Label>
                                                <div className="flex relative">
                                                        <Input
                                                                value={filename}
                                                                onChange={e => setFilename(e.target.value)}
                                                                placeholder="Filename"
                                                                autoComplete="none"
                                                                autoCorrect="off"
                                                                spellCheck="false"
                                                                className="pr-[70px]"
                                                        />
                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium pointer-events-none">
                                                                .backup
                                                        </span>
                                                </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                        <Label>Version</Label>
                                                        <Input
                                                                value={version}
                                                                onChange={e => setVersion(e.target.value)}
                                                                placeholder="e.g. 1.0.0"
                                                                autoComplete="none"
                                                        />
                                                </div>
                                                <div className="space-y-2">
                                                        <Label>Tags (comma separated)</Label>
                                                        <Input
                                                                value={tags}
                                                                onChange={e => setTags(e.target.value)}
                                                                placeholder="e.g. prod, initial"
                                                                autoComplete="none"
                                                        />
                                                </div>
                                        </div>

                                        <div className="space-y-2">
                                                <Label>Description</Label>
                                                <Input
                                                        value={description}
                                                        onChange={e => setDescription(e.target.value)}
                                                        placeholder="What does this backup contain?"
                                                        autoComplete="none"
                                                        autoCorrect="off"
                                                        spellCheck="false"
                                                />
                                        </div>

                                        <div className="space-y-2 pt-4 border-t border-border">
                                                <Label className="flex items-center gap-2">
                                                        <Lock className="w-4 h-4 text-primary" /> Configuration Password (Optional)
                                                </Label>
                                                <div className="relative">
                                                        <Input
                                                                type={showPassword ? "text" : "password"}
                                                                value={password}
                                                                onChange={e => setPassword(e.target.value)}
                                                                placeholder="Leave blank for automatic System Key"
                                                                className="pr-20"
                                                                autoComplete="new-password"
                                                                autoCorrect="off"
                                                                spellCheck="false"
                                                        />
                                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                                                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)}>
                                                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                                </Button>
                                                                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={handleCopyPassword}>
                                                                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                                                </Button>
                                                        </div>
                                                </div>
                                                {password ? (
                                                        <p className="text-xs text-yellow-500 font-medium mt-1">
                                                                The payload configuration will be encrypted via your custom AES-256 key. If you lose this password, the configuration cannot be recovered.
                                                        </p>
                                                ) : (
                                                        <p className="text-xs text-muted-foreground font-medium mt-1">
                                                                The payload will be secured using the internal orchestrator System Key. Any user on this App can restore it without a password.
                                                        </p>
                                                )}
                                        </div>

                                </div>

                                {/* Footer */}
                                <div className="p-6 border-t border-border bg-muted/30 flex justify-end gap-3">
                                        <Button variant="ghost" onClick={onClose}>Cancel</Button>
                                        <Button onClick={handleExport} className="gap-2 min-w-[140px]">
                                                <Download className="w-4 h-4" /> Export Encrypted File
                                        </Button>
                                </div>

                        </div>
                </div>
        );
}
