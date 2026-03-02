# Single-Tab Anti-Corruption Mechanism

Given that total application state relies entirely on the browser's native
`localStorage`, data consistency is at a massive risk of race conditions if
multiple tabs were open simultaneously.

For example, Tab A creates a Key and persists it. Tab B, which was statically
loaded beforehand, never got the update. If Tab B makes a change and persists,
it would entirely overwrite and delete Tab A's new Key.

## The TabGuard System

To enforce aggressive consistency without constantly utilizing heavy polling
scripts, we built a React `TabGuard` component bridging the natively provided
`BroadcastChannel` API.

1. **HELO Phase**: When `root/layout.tsx` is mounted, the TabGuard hooks into a
   channel named `env_lock`. It screams a `'session_active'` message across the
   entire browser execution context.
2. **Ping-Pong Feedback**: If another tab has the exact same application open,
   its specific TabGuard listener intercepts the `'session_active'` message. It
   immediately replies on the channel with `session_takeover`.
3. **Lockdown**: Whichever tab was the "Original" tab receives this takeover
   ping. It immediately flips an internal `isLocked` state to `true`.

### The Resulting User Experience

When a tab is locked, the UI fires a full-viewport blur overlay directly over
the application z-index stack. It forcefully unmounts all interactive DOM
elements behind it, halting any possible Zustand persistence cycles dead in
their tracks.

The user sees an "Active Session Detected" warning. They are given a button:
"Click Here to Take Over", which simply flips the lock and broadcasts a reverse
takeover ping to instantly lock the _other_ tab.
