# Add a Project Tile

Hand this file to any assistant (or follow it yourself) to add a new project to
the portfolio. Everything here is self-contained. Do not change the site layout,
CSS, or JavaScript. You only create one folder and edit one list.

## How the site works

- Plain HTML, CSS, and JavaScript. No build step, no framework, no install.
- Every project lives in its own folder under `content/<slug>/`.
- That folder holds one `project.js` file (all the text and settings) and the
  project's images.
- `content/manifest.js` lists the project slugs and their order. The home page
  cards and the individual project pages are generated automatically from these
  files by `assets/js/render.js`. You never edit the HTML or the renderer.

## Steps to add a project

1. Pick a **slug**: lowercase words joined by dashes, for example
   `six-axis-force-sensor`. This is the folder name and the URL id.
2. Create the folder `content/<slug>/`.
3. Create `content/<slug>/project.js` using the template below and fill it in.
4. Put the project's images in the same folder. Set `cover` (and usually
   `hero`) to an image file name. If there are no images yet, leave `cover: ""`
   and the card shows a clean placeholder.
5. Add the slug to the list in `content/manifest.js`, in the position where you
   want the card to appear (top of the list shows first).

That is the whole task. Do not touch `index.html`, `project.html`,
`assets/`, or any other project's folder.

## Writing style rules

- Professional and factual. No marketing voice, no filler, no hype.
- **Do not use em dashes** anywhere. Use a period or restructure the sentence.
  For a number range write "2024 to 2026", not "2024 to 2026" with a dash.
- Use **present tense for work that is ongoing** ("I design", "I am building")
  and past tense only for work that is finished.
- Only state facts you were given. Do not invent numbers, results, tools, or
  links. If a detail is unknown, leave it out or leave the field empty.

## The template

Copy this into `content/<slug>/project.js` and replace the values. Keep the
field names exactly as written.

```js
window.Portfolio = window.Portfolio || {};
window.Portfolio["REPLACE-WITH-SLUG"] = {

  title:   "Project Title",
  kicker:  "Category shown above the title",   // e.g. "Mechanical Design and Analysis"
  featured: false,                             // true = large full-width card on the home page (use for at most one project)

  blurb:   "One or two sentences for the home-page card.",
  tagline: "One sentence shown under the title on the project page.",

  cover:   "",   // image file in this folder for the card, e.g. "cover.jpg". Empty = clean placeholder.
  coverVideo: "", // optional short clip that plays when the pointer is over the card, e.g. "demo.mp4". See below.
  hero:    "",   // large image at the top of the project page. Usually the same as cover.

  tags:    ["Tag One", "Tag Two", "Tag Three"],  // the first two are highlighted; put the most important disciplines first

  // Facts box at the top of the project page. Each row is [label, value].
  spec: [
    ["Role",     "Your role"],
    ["Timeline", "2026 or 2025 to Present"],
    ["Tools",    "SolidWorks, Python"]
  ],

  // Buttons at the top of the project page. Leave a href empty ("") to hide that button.
  links: [
    { label: "GitHub", href: "" },
    { label: "Video",  href: "" }
  ],

  // Each section becomes one titled block on the project page.
  // "body" is one or more paragraphs. "list" (optional) is bullet points.
  // "figures" (optional) is images: one shows large, two show side by side.
  sections: [
    {
      id: "overview",           // short lowercase id, used for on-page navigation
      heading: "Overview",
      body: [
        "First paragraph.",
        "Second paragraph."
      ]
    },
    {
      id: "design",
      heading: "Design",
      body: [ "What you designed and why." ],
      list: [
        "A key decision or constraint.",
        "Another one."
      ],
      figures: [
        { src: "render.jpg", caption: "A short caption." }
      ]
    },
    {
      id: "result",
      heading: "Result",
      body: [ "What the outcome is or where it stands now." ]
    }
  ]
};
```

## Field reference

| Field | Required | What it is |
| --- | --- | --- |
| `title` | yes | The project name. |
| `kicker` | yes | Small label above the title (a discipline or category). |
| `featured` | yes | `true` makes a large home card. Keep at most one `true` across all projects. |
| `blurb` | yes | One or two sentences on the home card. |
| `tagline` | yes | One sentence under the title on the project page. |
| `cover` | no | Card image file name in this folder. Empty shows a placeholder. |
| `coverVideo` | no | Short clip that plays on hover over the card. Requires `cover` as the still. |
| `hero` | no | Large image at the top of the project page. |
| `tags` | yes | Short discipline labels. First two are visually highlighted. |
| `spec` | no | Rows of `[label, value]` facts shown in a box. |
| `links` | no | Buttons. Empty `href` hides the button. |
| `sections` | yes | The body of the project page. Each has `id`, `heading`, `body`, optional `list`, optional `figures`. |

## Optional: a video that plays on hover

A card can show a short clip while the pointer is over it. The still `cover`
image stays the resting state, so the page still looks calm.

1. Put the clip in the project folder, for example
   `content/<slug>/demo.mp4`.
2. Set both fields in `project.js`:

```js
cover:      "cover.jpg",   // the still, always required
coverVideo: "demo.mp4",    // plays on hover
```

Guidelines for the clip:

- **Format:** MP4 with H.264 video. That plays everywhere. WebM also works.
- **Length:** 2 to 5 seconds, looping seamlessly.
- **Size:** aim under 2 MB. Nothing downloads until someone hovers, but keep it small.
- **No audio.** The clip is always muted. Strip the audio track to save space.
- **Framing:** cropped near 16:10, since the card crops to that.
- **No baked-in text.** It is a background, not a slide.

Behavior that is already handled, so no code is needed:

- Nothing is downloaded until the pointer enters the card.
- Leaving the card pauses the clip and rewinds it.
- Touch devices show only the still, because tapping the card opens the project.
- Visitors who ask for reduced motion never see it play.
- A small play badge appears on the card so people know there is motion.

Use this on one or two cards at most. If every card moves, the page reads as busy.

## Then update the order

Open `content/manifest.js` and add the slug to `window.PORTFOLIO_ORDER`. Example:

```js
window.PORTFOLIO_ORDER = [
  "fiber-reinforced-printing",
  "your-new-slug",          // add it where you want it to appear
  "parol6-robotic-arm"
];
```

## Quick checklist before finishing

- [ ] Folder `content/<slug>/` exists with `project.js` inside.
- [ ] The slug in `project.js` matches the folder name and the manifest entry.
- [ ] No em dashes anywhere. Ongoing work is in the present tense.
- [ ] Images referenced by `cover`, `hero`, and `figures` exist in the folder
      (or those fields are empty).
- [ ] The slug is listed in `content/manifest.js`.
