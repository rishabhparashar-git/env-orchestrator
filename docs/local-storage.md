# State & Local Storage Engine

Because this env orchestrator does not utilize a backend Database (Postgres, MongoDB, etc), absolute confidence in the client-side state is paramount.

## The Zustand Matrix

The raw application state is defined centrally in `src/store/useEnvStore.ts`.
It uses the `persist` middleware configured for the `localStorage` bridge.

### The Problem with Depth
Deeply nested objects in global state layers are notoriously difficult to mutate reactively without expensive deep-cloning operations. 
If we had modeled:
`Project -> Keys -> Overrides -> Values` directly, modifying a single value would require slicing through 4 layers of arrays.

### The Flat "Values" Dictionary
To heavily optimize performance and mitigate accidental renders, the core `values` state is separated from the Schemas.
`values` is a massive, flat `Record<string, string>`.

We use deterministic hashing to link inputs to values.
Every input relies on a composite ID: `[ProjectID]_[KeyID]_[OverrideID]`.
When you type into the "Dev" input for the "API_BASE" key, Zustand instantly updates `values["prj123_key456_ovr789"] = "http://dev.api"` with O(1) performance.

## Privacy Mode
The store also tracks a fundamental `privacyMode` flag. When enabled globally, the UI intercepts renders traversing the `values` map and replaces them with a string of password dots `••••`. 
Components are built to respect focus-events, temporarily replacing the dots with the actual text inside the state store while a user is actively typing, ensuring "shoulder-surfing" attacks are mitigated without impacting the user's ability to edit keys.
