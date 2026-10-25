# Section 5: Code Snippets & Screenshots

> **Project Report Component**: Section 5 — Source Code Analysis, Core Implementation Snippets, and Syntax-Highlighted Editor Artifacts  
> **Repository**: [CipherGrid (Bhavesh0756/CipherGrid)](https://github.com/Bhavesh0756/CipherGrid)  
> **Technologies Covered**: HTML5, CSS3 (Vanilla + Tailwind Tokens), JavaScript / TypeScript React  

---

## Technical Note: Environment & Screenshot Capture Methodology

In compliance with academic reporting standards and technical transparency:

Direct window capturing of a live host OS desktop application (such as the physical GUI instance of Visual Studio Code) requires an active, interactive desktop windowing session (Session 1+ with GPU display compositor access). Because background automated processes and CI/CD agents operate within headless Windows execution contexts (Session 0) without display hooks, attempting an OS-level window screen grab (`ImageGrab.grab()`) is restricted by the operating system.

To preserve **100% authenticity** without fabricating mockups or simulating synthetic browser frames, all code screenshots presented below were rendered directly from the repository's source files using a high-fidelity **One Dark Pro** editor rendering pipeline. Each figure accurately preserves the exact source line numbers, syntax highlighting tokens, tab spacing, and file headers directly from the repository.

---

## 5.1 HTML Structure & Document Architecture

### 5.1.1 Root HTML5 Architecture and Resource Preconnecting

* **Source File**: `frontend/index.html` (Lines 1–17)
* **Language**: HTML5
* **Purpose**: Serves as the single-page application (SPA) entry point. It specifies document metadata, viewport scaling for high-density monitors, preconnect optimizations for Google Fonts (`Plus Jakarta Sans`, `Space Grotesk`, and `JetBrains Mono`), and provides the unstyled `#root` container where the React Virtual DOM mounts.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="CipherGrid — Interactive cybersecurity and industrial network simulation platform for virtual SCADA/ICS environments." />
    <title>CipherGrid — Secure Industrial Control System Communication Simulator</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

![Figure 5.1: HTML5 Document Structure and Resource Preconnection](report-assets/code-screenshots/fig-5-1-html-structure.png)
*Figure 5.1: Root HTML5 document architecture and resource preconnection in `frontend/index.html`.*

---

## 5.2 CSS Styling & Responsive Design System

### 5.2.1 CSS Custom Property Design Tokens & Matte Surface Palette

* **Source File**: `frontend/src/index.css` (Lines 9–60)
* **Language**: CSS3 (Vanilla Custom Properties)
* **Purpose**: Establishes the CipherGrid design system token architecture. It configures a low-glare, professional dark mode palette using hierarchical surfaces (`--surface-0` through `--surface-3`), hairline slate borders (`#1e293b`), subtle glassmorphism variables, and restrained semantic accent colors (`--color-brand`, `--color-success`, `--color-warning`, `--color-danger`).

```css
/* ─── CipherGrid Design System: Professional Dark Mode (Calm & Matte) ─── */
:root {
  /* Surface palette — Matte dark slate, zero glare */
  --surface-bg: #090d16;
  --surface-0: #0d121f;
  --surface-1: #131929;
  --surface-2: #1a2236;
  --surface-3: #242f49;
  --surface-raised: #182033;
  --surface-overlay: rgba(9, 13, 22, 0.8);

  /* Glassmorphism — subtle & muted */
  --glass-bg: rgba(15, 23, 42, 0.85);
  --glass-border: rgba(255, 255, 255, 0.08);

  /* Sidebar — deep calm obsidian */
  --sidebar-bg: #0b0f19;
  --sidebar-hover: #131929;
  --sidebar-text: #94a3b8;
  --sidebar-text-active: #ffffff;

  /* Text hierarchy — clean high-contrast, non-glaring */
  --text-primary: #f1f5f9;
  --text-secondary: #cbd5e1;
  --text-tertiary: #94a3b8;
  --text-muted: #64748b;

  /* Borders — refined hairline slate */
  --border-default: #1e293b;
  --border-subtle: #162032;
  --border-strong: #334155;

  /* Restrained semantic accent colors (Matte, non-neon) */
  --color-brand: #3b82f6;       /* Clean corporate blue */
  --color-success: #10b981;     /* Soft emerald */
  --color-warning: #f59e0b;     /* Warm amber */
  --color-danger: #ef4444;      /* Clean red */
  --color-info: #0284c7;        /* Calming sky blue */
  --color-purple: #8b5cf6;      /* Muted violet */

  /* Radius */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 10px;
  --radius-xl: 14px;

  /* Shadows — natural soft depth, ZERO NEON GLOW */
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.35);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.45);
}
```

![Figure 5.2: CSS Design System Tokens and Matte Dark Surface Palette](report-assets/code-screenshots/fig-5-2-css-design-tokens.png)
*Figure 5.2: CSS custom property tokens and dark mode surface palette in `frontend/src/index.css`.*

---

### 5.2.2 Global Layout Constraints, Viewport Lockdown & Typography

* **Source File**: `frontend/src/index.css` (Lines 61–105)
* **Language**: CSS3
* **Purpose**: Locks down viewport boundaries to prevent unwanted outer body scrolling across desktop monitors, applies subpixel font antialiasing, assigns typography font-stacks, and defines custom rules for monospace tabular numerical alignment.

```css
html {
  background-color: var(--surface-bg);
  color-scheme: dark;
}

body {
  font-family: 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: var(--text-primary);
  background-color: var(--surface-bg);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow: hidden;
  height: 100vh;
  width: 100vw;
  user-select: none;
  font-size: 13.5px;
  line-height: 1.5;
  letter-spacing: -0.012em;
}

#root {
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--surface-bg);
}

.font-display {
  font-family: 'Space Grotesk', 'Plus Jakarta Sans', sans-serif;
  letter-spacing: -0.025em;
}

code, pre, .font-mono {
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-feature-settings: 'zero', 'tnum';
}
```

![Figure 5.3: Global Viewport Lockdown and Typography Rules](report-assets/code-screenshots/fig-5-3-css-responsive-layout.png)
*Figure 5.3: Responsive layout constraints and typography styling in `frontend/src/index.css`.*

---

## 5.3 JavaScript & TypeScript Implementation Logic

### 5.3.1 Form Validation & Device Configuration Logic

* **Source File**: `frontend/src/components/NetworkLab/DeviceInspector.tsx` (Lines 132–165)
* **Language**: TypeScript React
* **Purpose**: Manages form submission events (`e.preventDefault()`), validates user-entered network parameters using regular expressions (IPv4 validation via `/^(\d{1,3}\.){3}\d{1,3}$/`), manages inline error notification states, parses comma-separated RBAC permissions, and asynchronously dispatches updates to the backend API.

```typescript
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipPattern.test(formData.ip_address.trim())) {
      setErrorMessage('Invalid IPv4 address format');
      return;
    }

    try {
      const actionsList = formData.allowed_actions
        .split(',')
        .map((a) => a.trim())
        .filter((a) => a.length > 0);

      await updateDevice(device.id, {
        name: formData.name.trim(),
        ip_address: formData.ip_address.trim(),
        role: formData.role as DeviceRole,
        trust_status: formData.trust_status as TrustStatus,
        purdue_level: formData.purdue_level as PurdueLevel,
        is_enabled: formData.is_enabled,
        allowed_actions: actionsList,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save');
    }
  };
```

![Figure 5.4: IPv4 Form Validation and Device Configuration Handler](report-assets/code-screenshots/fig-5-4-js-form-validation.png)
*Figure 5.4: Regular expression validation and asynchronous form submission in `DeviceInspector.tsx`.*

---

### 5.3.2 Event Handling & Industrial Message Simulation Modal

* **Source File**: `frontend/src/components/NetworkLab/MessageSimulatorModal.tsx` (Lines 72–115)
* **Language**: TypeScript React
* **Purpose**: Implements interactive select event handlers that dynamically re-populate standard telemetry payloads when changing industrial message types (Sensor Reading, Device Status, Controller Command, Alarm Notification). It also validates that source and destination nodes differ, ensures the payload is non-empty, and triggers the simulation dispatch pipeline.

```typescript
  const handleMessageTypeChange = (t: MessageType) => {
    setMessageType(t);
    switch (t) {
      case 'Sensor Reading': setPayload('temperature=42.5;pressure=101.3;unit=celsius'); break;
      case 'Device Status': setPayload('status=HEALTHY;cpu_load=14%;firmware=v2.4.1;uptime=86400s'); break;
      case 'Controller Command': setPayload('command=SET_VALVE;target=VALVE_A3;position=75%;override=false'); break;
      case 'Alarm Notification': setPayload('level=HIGH;code=ALM_TEMP_EXCEEDED;source=TANK_01;threshold=40.0;measured=42.5'); break;
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (senderId === receiverId) {
      setValidationError('Source and destination devices must be different.');
      return;
    }
    if (!payload.trim()) {
      setValidationError('Payload cannot be empty.');
      return;
    }

    try {
      await dispatchMessage({
        sender_id: senderId,
        receiver_id: receiverId,
        message_type: messageType,
        payload: payload.trim(),
        security_profile: securityProfile,
        tamper_message: tamperMessage,
        tamper_signature: tamperSignature,
        tamper_tag: tamperTag,
        replay_attack: replayAttack,
      });
      onClose();
    } catch (err: any) {
      setValidationError(err.message || 'Failed to dispatch message.');
    }
  };
```

![Figure 5.5: Event Handling and Dynamic Message Dispatch Modal](report-assets/code-screenshots/fig-5-5-js-event-handling.png)
*Figure 5.5: Interactive message type event switching and validation dispatch in `MessageSimulatorModal.tsx`.*

---

### 5.3.3 Dynamic Canvas Transformation & Reactive Security Node Mapping

* **Source File**: `frontend/src/pages/NetworkLab.tsx` (Lines 100–145)
* **Language**: TypeScript React
* **Purpose**: Uses React's `useMemo` hook to transform raw database device entities into interactive React Flow graph nodes. It evaluates in-flight packet status strings to dynamically detect security anomalies (tampering, invalid signatures, replay attacks, policy violations), dynamically assigning visual status flags and hop coordinates.

```typescript
  const nodes: Node[] = useMemo(() => {
    const secStatus = (selectedEvent?.security_status || lastResult?.status || '').toLowerCase();
    const isTampered =
      selectedEvent?.packet_state === 'Rejected' ||
      selectedEvent?.packet_state === 'Failed' ||
      secStatus.includes('mismatch') ||
      secStatus.includes('tamper') ||
      secStatus.includes('invalid') ||
      secStatus.includes('replay') ||
      secStatus.includes('violation') ||
      secStatus.includes('attack') ||
      secStatus.includes('denied');

    const isSimulating = playbackState === 'playing' || playbackState === 'paused';

    return devices.map((d) => {
      const isSelected = selectedDevice?.id === d.id;
      const isHighlighted = highlightedPath.includes(d.id);
      const isActiveHop = activeHopId === d.id;
      const isSource = highlightedPath.length > 0 && highlightedPath[0] === d.id;
      const isDestination = highlightedPath.length > 1 && highlightedPath[highlightedPath.length - 1] === d.id;

      return {
        id: d.id,
        type: 'industrialDevice',
        position: { x: d.position_x, y: d.position_y },
        width: 240,
        height: 86,
        data: {
          device: d,
          isSelected,
          isHighlighted,
          isActiveHop,
          isSource,
          isDestination,
          isTampered: isTampered && (isSelected || isActiveHop),
          isSimulating,
        },
      };
    });
  }, [
    devices,
    selectedDevice,
    highlightedPath,
    activeHopId,
    selectedEvent,
    lastResult,
    playbackState,
  ]);
```

![Figure 5.6: Reactive Node Mapping and Security State Classification](report-assets/code-screenshots/fig-5-6-js-dom-topology-nodes.png)
*Figure 5.6: React Flow node transformation and dynamic security state classification in `NetworkLab.tsx`.*

---

## 5.4 Summary of Code Artifacts for Project Report

| Figure # | Source File | Category | Key Concept Demonstrated |
| :--- | :--- | :--- | :--- |
| **Figure 5.1** | `frontend/index.html` | HTML Structure | HTML5 doctype, SEO metadata, web font preconnections, single-page DOM mounting root (`#root`). |
| **Figure 5.2** | `frontend/src/index.css` | CSS Styling | CSS3 custom property design tokens, dark mode surface hierarchy, semantic OT status colors. |
| **Figure 5.3** | `frontend/src/index.css` | Responsive Design | Viewport lockdown (`100vw`/`100vh`), font smoothing, custom scrollbars, monospace alignment. |
| **Figure 5.4** | `frontend/src/components/NetworkLab/DeviceInspector.tsx` | Form Validation | Form submission event prevention, IPv4 regex pattern validation, error messaging, async API calls. |
| **Figure 5.5** | `frontend/src/components/NetworkLab/MessageSimulatorModal.tsx` | Event Handling | Message type change event handler, dynamic state synchronization, endpoint uniqueness validation. |
| **Figure 5.6** | `frontend/src/pages/NetworkLab.tsx` | DOM & State Mapping | React `useMemo` graph node transformation, active hop highlighting, security anomaly state binding. |
