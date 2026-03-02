export const BACKUP_SYSTEM_KEYS: Record<string, string> = {
  v1:
    process.env.NEXT_PUBLIC_BACKUP_SYS_KEY_V1 ||
    "env-orchestrator-fallback-sys-key-v1-84a9e2d71b",
  // In the future, if the system key is compromised or needs rotating, add "v2": process.env.NEXT_PUBLIC_BACKUP_SYS_KEY_V2 here
  // The system will try decrypting with the latest first, then fallback to older keys.
};

export const CURRENT_BACKUP_KEY_VERSION = "v1";
