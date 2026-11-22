# Visual design principles

Use this guide with [Frontend Design](frontend-design.md) when building or revising SpeakSteps screens. Start with a phone-sized layout and the user's next action. Use the proportions below as starting points and adjust them for the content and device.

## Whitespace

Use space to show which elements belong together. Start with 4–8 points between a label and its content, 12–16 points inside a group, and 16–24 points between distinct groups. Align the left and right edges of related sections. Let short screens scroll and use safe-area insets. On taller screens, keep related content together so extra height doesn't create gaps between a prompt and its action.

On the check-in result, keep the practice recommendation and its explanation together. Give the findings their own space, then place the actions where they are easy to find.

## Rule of thirds

Imagine two lines dividing the visible area into three equal bands. Use them to explore where the main subject should sit and how much visual weight should surround it. On a phone, the upper third is often a good place for the task or prompt, the middle for supporting content, and the lower area for the next action. Judge this against the actual screen, including navigation and the keyboard.

On Practice, make the buddy and sound visible near the top. Keep the watch and microphone controls in the order the child uses them.

## Hierarchy

Give each screen one clear focal point and one primary action. Use size, weight, contrast, and spacing together. Secondary actions should still be easy to find and tap. Use labels and icons alongside color when conveying meaning or state.

On Play, the sound should be the easiest thing to spot on a card. The syllable and star rating support it, and the play icon shows what happens when the card is tapped.

## Golden ratio

The golden ratio is approximately 1.618 to 1. It can help compare a larger element with a smaller supporting element, such as a 26-point heading with 16-point body text. Try it as a composition aid when two elements compete for attention. Prefer equal widths for peer controls and size elements around readable text and comfortable touch targets.

## Typography scale

Use the screen's established type family. On child-facing screens, use Sour Gummy Bold for headings and important actions and Sour Gummy Medium for supporting text.

| Role | Starting size |
| --- | ---: |
| Hero sound or word | 30–34 |
| Screen title | 24–28 |
| Section heading | 18–22 |
| Body and action labels | 16–18 |
| Supporting labels | 14–16 |

Sizes are in React Native logical units. Give multi-line copy room to wrap at the user's text size. Titles should remain legible on small phones without pushing key controls off screen unnecessarily.

## Color theory and the 60–30–10 rule

Choose a dominant color, a supporting surface, and an accent. As a visual starting point, let the dominant color cover roughly 60% of the composition, supporting surfaces 30%, and accents 10%. Think in terms of what the eye sees first. Color roles and contrast matter more than exact pixel counts.

For Play and Practice, pale blue `#E7F2FA` is the dominant field, white `#FFFFFF` defines readable cards and panels, and blue `#0865AD` marks key controls. Gold can signal earned stars and coral can indicate an active microphone. Reserve each of those colors for its purpose so they complement the main palette.

## Review on a phone

- Check a narrow phone and a taller one. Confirm headings and controls still fit with larger text.
- Check where the eye lands first, then follow the screen in the order a child or parent would use it.
- Confirm related sections have consistent gaps and align to common edges.
- Check text contrast, touch targets, focus, and pressed or selected states.
