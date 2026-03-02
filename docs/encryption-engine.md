# The Advanced Two-Tier Encryption Engine

To safely port configurations between machines or share them with teammates
without relying on a central database server, Env Orchestrator utilizes a
totally obfuscated file extension (`.backup`) backed by a rigorous Dual-AES
structure.

## The Threat Model

If backups were plain JSON, a malicious actor or an accidental leak could expose
thousands of highly sensitive production keys (AWS, Stripe, Database URIs).
Conversely, if the entire file was just randomly encrypted, users wouldn't know
when the file was created or what project it belonged to until they unlocked it.

## The Two-Tier Solution

The system isolates the backup into two components: the **Metadata** (Version,
Timestamp, Description, Tags) and the **State Payload** (Your actual `.env`
variables).

### Export Flow

1. **User Key Phase (Inner Layer)**: If the user provides an export password,
   the State Payload is `AES-256` encrypted using their string password. If they
   leave it blank, the payload is transparently `AES-256` encrypted using an
   internal **System Key** defined in `.env.local`
   (`NEXT_PUBLIC_BACKUP_SYS_KEY_V1`).
2. **System Key Phase (Outer Layer)**: The system packages the Metadata, a
   boolean `encryptedByUser`, the `systemPasswordVersion`, and the fully
   encrypted Payload into a single JSON wrapper. It then encrypts this _entire_
   wrapper with the **System Key**.
3. **Obfuscation**: The resulting block of scrambled ciphertext is downloaded as
   `.backup`.

### Import Flow

1. An unknown `.backup` file is dropped into the interface.
2. The orchestrator iterates through the `BACKUP_SYSTEM_KEYS` map attempting to
   decrypt the outer layer.
3. Once decrypted, it accesses the Metadata and drops it into the UI. **Any user
   on the platform can safely read the Metadata without a password.**
4. To actually restore the data:
   - If `encryptedByUser` is `false`, the orchestrator automatically unlocks the
     State Payload using the known System Key matching the provided
     `systemPasswordVersion`.
   - If `encryptedByUser` is `true`, the user is prompted to input the original
     export password. If it is wrong, the inner payload remains locked and the
     restoration fails safely.

This guarantees total file integrity without sacrificing usability.
