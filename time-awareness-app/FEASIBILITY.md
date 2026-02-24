# Time Awareness iOS App — Feasibility Research

## App Concept

1. **Lock screen visualization**: Show how much time is left today, this week, and this year
2. **On-unlock task prompt**: When unlocking, ask the user what task they want to do and for how long
3. **Calendar recording**: Save the task to the system calendar
4. **Timer check-in**: When the allotted time passes, check in with the user

---

## Feature-by-Feature Feasibility

### 1. Lock Screen Time Visualization — FEASIBLE ✓

**Technology**: WidgetKit (iOS 16+) with `accessoryCircular` widget family

- The `Gauge` view with `.accessoryCircularCapacity` style is purpose-built for this exact use case
- Three circular gauges can show day/week/year progress on the lock screen
- The `accessoryRectangular` family can show all three together with labels
- Widgets update on a timeline — WidgetKit lets you define a `TimelineProvider` that returns entries at specific dates
- For time-remaining data, a timeline can be pre-computed (e.g., update every 15 minutes) since the values are deterministic

**Limitations**:
- Lock screen widgets render in a monochrome/tinted style (iOS vibrant rendering mode)
- Widget refresh frequency is budget-limited by the system (typically 40-70 refreshes/day)
- For a time-remaining widget this is fine — updates every 15-30 minutes are sufficient

**Recommendation**: Use `accessoryCircular` for individual day/week/year gauges, or `accessoryRectangular` for a combined view. Also offer home screen widgets in `systemSmall` and `systemMedium` sizes with full color.

---

### 2. On-Unlock Task Prompt — NOT DIRECTLY FEASIBLE ✗

**This is the hardest feature. iOS does NOT provide:**
- A reliable API to detect device unlock from background/terminated state
- Any mechanism to present UI automatically upon device unlock
- Any way to intercept or augment the unlock flow

**What exists**:
- `UIApplication.isProtectedDataAvailable` + notifications — approximation of lock state with ~10s delay, only works when app is in foreground/background (not terminated)
- Darwin notification `com.apple.springboard.lockstate` — private API, will get rejected from App Store
- `applicationWillEnterForeground` — only fires when the user manually opens your app, not on every unlock

**Viable Alternatives**:

| Alternative | How it works | Tradeoff |
|---|---|---|
| **A. Interactive Lock Screen Widget** | User taps a widget button that deep-links into the app's task-entry screen | Requires user to tap widget; not automatic |
| **B. Live Activity as persistent prompt** | Show a persistent Live Activity on lock screen with a "Start a task" button | Visible but still requires tap; Live Activities expire after 8-12 hours |
| **C. Full-screen app on launch** | Make the task prompt the app's main screen so it's the first thing seen when opening the app | Only works when user opens the app |
| **D. Shortcut/Automation** | Use iOS Shortcuts app to create a "When I open [app]" automation that triggers the prompt | Requires user to set up the automation manually |
| **E. Morning notification** | Send a daily notification at a configured time asking to plan the day | Passive; user may dismiss it |

**Recommendation**: Option A (interactive lock screen widget) is the most natural iOS-native approach. The widget shows time-remaining gauges AND has a tap target that opens the app directly to the task entry screen. This turns two features into one cohesive experience.

---

### 3. Calendar Recording — FEASIBLE ✓

**Technology**: EventKit framework (iOS 6+, modern API on iOS 17+)

- Full read/write access to the system calendar via `EKEventStore`
- On iOS 17+: use `requestFullAccessToEvents()` (async/await)
- Create `EKEvent` with title, start/end dates, and save to default or custom calendar
- Can also create a dedicated app calendar (e.g., "Focus Tasks") so entries are visually distinct
- `EventKitUI` provides `EKEventEditViewController` if you want to let users edit before saving

**Requirements**:
- `NSCalendarsFullAccessUsageDescription` in Info.plist
- User must grant calendar permission

**Recommendation**: Create a dedicated "Focus Tasks" calendar. Save events silently after the user confirms the task and duration. Optionally allow editing via EventKitUI.

---

### 4. Timer Check-In — FEASIBLE ✓

**Technology**: Combination of Local Notifications + Live Activities

**Local Notifications** (`UNUserNotificationCenter`):
- Schedule a `UNTimeIntervalNotificationTrigger` for when the task duration expires
- Add custom actions (e.g., "Done", "Need more time", "Switched tasks") via `UNNotificationAction` and `UNNotificationCategory`
- Works even when app is backgrounded or terminated
- Notification responses re-launch the app with context about which action was taken

**Live Activities** (optional enhancement):
- Show a countdown timer on the lock screen while a task is active
- Use `Text(timerInterval:countsDown:)` and `ProgressView(timerInterval:countsDown:)` for automatic countdown rendering
- The timer updates on the lock screen without app refresh
- When time is up, the Live Activity can display a "Time's up!" state

**Recommendation**: Use local notifications as the reliable check-in mechanism. Layer Live Activities on top for a visual countdown on the lock screen during active tasks. This gives users both a passive glanceable timer and an active notification when time expires.

---

## Recommended Architecture

```
┌─────────────────────────────────────────────────┐
│                   Main App                       │
│  ┌─────────────┐  ┌──────────┐  ┌────────────┐ │
│  │ Task Entry   │  │ Timer    │  │ Settings   │ │
│  │ Screen       │  │ Screen   │  │ Screen     │ │
│  └──────┬───────┘  └────┬─────┘  └────────────┘ │
│         │               │                        │
│  ┌──────┴───────────────┴──────────────────────┐ │
│  │         Shared Data Layer (App Group)        │ │
│  │  - Current task state                        │ │
│  │  - Time progress data                        │ │
│  │  - Recent tasks (for smart suggestions)      │ │
│  └──────┬───────────────┬──────────────────────┘ │
│         │               │                        │
│  ┌──────┴───────┐  ┌────┴─────────────────────┐ │
│  │  EventKit    │  │ UNUserNotificationCenter │ │
│  │  (Calendar)  │  │ (Check-in alerts)        │ │
│  └──────────────┘  └──────────────────────────┘ │
└─────────────────────┬───────────────────────────┘
                      │ App Group (shared UserDefaults)
┌─────────────────────┴───────────────────────────┐
│              Widget Extension                     │
│  ┌──────────────────┐  ┌──────────────────────┐ │
│  │ Lock Screen      │  │ Home Screen          │ │
│  │ Widgets          │  │ Widgets              │ │
│  │ - Concentric     │  │ (systemSmall/Medium) │ │
│  │   rings (D/W/Y)  │  │                      │ │
│  │ - Dot matrix     │  │                      │ │
│  │   (year grid)    │  │                      │ │
│  └──────────────────┘  └──────────────────────┘ │
│  ┌──────────────────────────────────────────────┐│
│  │ Live Activity (active task countdown)        ││
│  └──────────────────────────────────────────────┘│
└──────────────────────────────────────────────────┘
```

### Key Technologies

| Component | Framework | Min iOS |
|---|---|---|
| Lock screen gauges | WidgetKit + SwiftUI `Gauge` | iOS 16 |
| Interactive widget buttons | WidgetKit (interactive) | iOS 17 |
| Calendar integration | EventKit | iOS 17+ (new API) |
| Timer notifications | UserNotifications | iOS 10+ |
| Live countdown on lock screen | ActivityKit + WidgetKit | iOS 16.1 |
| Shared data between app/widget | App Groups + UserDefaults | iOS 8+ |

### Recommended Minimum Deployment Target: **iOS 17**

This gives access to interactive widgets (tap to open task entry), modern EventKit API, and all WidgetKit features.

---

## Key Risk: The "On Unlock" Prompt

The original concept of automatically prompting on every device unlock is **not possible** within iOS App Store guidelines. The recommended pivot is:

> Replace "auto-prompt on unlock" with an **always-visible interactive lock screen widget** that the user taps to start a task session. This is arguably a better UX anyway — it's visible but not intrusive.

The lock screen widget serves double duty:
1. Shows time remaining (day/week/year) — the visualization feature
2. Tapping it opens the app to the task entry screen — the task prompt feature

---

## Summary

| Feature | Feasible? | Approach |
|---|---|---|
| Time-remaining visualization on lock screen | **Yes** | WidgetKit `accessoryCircular` with `Gauge` |
| Auto-prompt on every unlock | **No** | Not possible on iOS |
| Task prompt via lock screen interaction | **Yes** | Interactive widget → deep link to app |
| Record task in calendar | **Yes** | EventKit `EKEvent` |
| Timer check-in when time expires | **Yes** | `UNTimeIntervalNotificationTrigger` + Live Activity |

The app is buildable with one design adjustment: the unlock prompt becomes a tap-to-start widget interaction instead of an automatic popup.

---

## Confirmed PRD Requirements

### Lock Screen Widgets

**Widget 1 — Concentric Rings** (`accessoryCircular`):
- 3 concentric rings sharing the same center point
- Outermost ring = **Year** remaining
- Middle ring = **Week** remaining
- Innermost ring = **Day** remaining
- Tapping opens the app to the task entry screen
- Monochrome rendering (iOS lock screen constraint)

**Widget 2 — Year Dot Matrix** (`accessoryRectangular`):
- GitHub-style contribution grid layout (365 dots)
- Elapsed days are dimmed/filled, remaining days are bright
- Shows exact position in the year at a glance

### Task Entry Flow

1. User taps lock screen widget → app opens to task entry screen
2. **Smart suggestions**: App shows recent/frequent task names at the top for quick selection
3. User can also type a free-text task name
4. **Duration**: Preset buttons — 15m, 25m (pomodoro), 30m, 45m, 60m, Custom
5. **Calendar picker**: User selects which calendar to save to (defaults to last used)
6. Task starts immediately after confirmation

### Calendar Integration

- Auto-save task as calendar event (task name → event title, now → start, now + duration → end)
- Show brief confirmation toast with "Edit" button
- "Edit" opens `EKEventEditViewController` for adding notes, location, etc.
- User can choose any of their calendars (not locked to a single dedicated calendar)

### Timer & Check-In

- While task is active: Live Activity countdown on lock screen (optional, nice-to-have for v1)
- When time expires: local notification with actions:
  - **"Done"** — marks task complete, ends session
  - **"5 more min"** — extends the timer, reschedules notification
  - **"Abandon"** — ends session, optionally deletes the calendar event

### Device Target

- **iPhone only** (iOS 17+)
- iPad and Apple Watch deferred to future versions

### Monetization

- Free at launch
- Monetization strategy TBD for later

### What the App Does NOT Do

- No in-app task history or analytics (calendar is the record of truth)
- No auto-prompt on unlock (not possible on iOS)
- No Apple Watch or iPad support in v1
