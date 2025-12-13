## Core interaction principles

- **Low effort:** classroom interactions must be fast and require minimal attention. One-tap input reduces motor and cognitive effort compared to more precise interactions (e.g., sliders) [@fitts1954information].
- **Peripheral awareness:** teachers need information “at a glance” without switching away from teaching materials.
- **Actionable signals:** the system should not only describe the state (“many confused”) but support plausible responses (slow down, clarify, short pause).

## Student input design

We used four discrete, semantically clear states derived from the exploratory study:

1. OK / continue
2. Too fast / confused
3. Overloaded / need break
4. Tired / low energy

## Teacher dashboard design

Two teacher views were designed to support different classroom workflows:

- A compact status bar to keep the signal visible on the main teaching device.
- A full-screen dashboard intended for a secondary/external display so the teacher can monitor the class climate in peripheral vision.

External displays can reduce disruptive task switching compared to dashboards embedded in the same workspace [@czerwinski2004diary].

## Visual style

Exploratory interviews suggested that the tool must feel supportive rather than supervisory. We used:

- Calm layouts with restrained colours (traffic-light-inspired but non-alarming).
- Short, neutral wording (no judgmental phrasing).
- Minimal animations and no attention-grabbing pop-ups by default.

## Privacy-by-design

Privacy and trust were treated as first-order requirements:

- No logins and no personal identifiers.
- Only aggregated, session-level information (no individual histories).
- Optional environment sensing is room-level only and never linked to individuals.

