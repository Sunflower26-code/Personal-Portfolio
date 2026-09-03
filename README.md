# Caitlin Fields, Portfolio

A minimal, professional portfolio site. Plain HTML, CSS, and JavaScript with no
build step, so it can be edited directly on GitHub and hosted on GitHub Pages.

The site is built so that every project is a self-contained folder. You edit one
file to change a project, and copy one folder to add a project. You never have to
touch the layout code.

## How the site is organized

```
index.html            Home page (hero, work, about, experience, toolbox, education, contact)
project.html          The template that displays a single project
export.html           Unlisted print version of the whole portfolio, used to make the PDF
assets/
  css/site.css        All styling
  css/print.css       Styling for the PDF export only
  js/site.js          Navigation, header, scroll-spy, image lightbox
  js/motion.js        Scroll reveals, staggered entrances, count-ups (respects reduced motion)
  js/render.js        Builds the project cards and project pages from /content
  js/export.js        Builds the print version from index.html and /content
content/
  manifest.js         The list of projects and their order
  <project>/          One folder per project
    project.js        All of that project's text and settings
    *.jpg / *.png     That project's images
tools/export-pdf.mjs  Renders export.html to a PDF
Caitlin-Fields-Resume.pdf
```

## Edit a project

1. Open `content/<project>/project.js`.
2. Change the text between the quotes or backticks. Each field is labeled.
3. Commit. The home card and the project page both update automatically.

## Add a photo to a project

1. Put the image file in that project's folder, for example
   `content/custom-slitting-saw-arbor/arbor.jpg`.
2. In that folder's `project.js`, set `cover` (and usually `hero`) to the file
   name, for example `cover: "arbor.jpg"`.

Until a `cover` is set, the card shows a clean placeholder, so nothing looks broken.

## Add a new project

1. Copy an existing folder in `content/` (for example `custom-macro-pad`) and
   rename it to your project's slug, using lowercase-with-dashes.
2. Edit the `project.js` inside it and drop in the images.
3. Add the slug to the list in `content/manifest.js`.

## Remove or reorder projects

Edit the list in `content/manifest.js`. Delete a line to remove a project, or
change the order of the lines to reorder the cards.

## What a project.js looks like

```js
window.Portfolio["my-project"] = {
  title:   "My Project",
  kicker:  "Category shown above the title",
  featured: false,              // true makes it the large card on the home page
  blurb:   "One or two sentences for the home page card.",
  tagline: "One sentence shown under the title on the project page.",
  cover:   "photo.jpg",         // image file in this folder; leave "" for a placeholder
  hero:    "photo.jpg",         // large image at the top of the project page
  tags:    ["Tag One", "Tag Two"],
  spec:    [ ["Role", "..."], ["Timeline", "..."] ],   // facts box on the project page
  links:   [ { label: "GitHub", href: "" } ],          // empty href hides the button
  sections: [
    {
      id: "overview",           // used for the on-page navigation
      heading: "Overview",
      body: [ "A paragraph.", "Another paragraph." ],
      list: [ "An optional bullet." ],
      figures: [ { src: "photo.jpg", caption: "An optional image caption." } ]
    }
  ]
};
```

## Export the portfolio as a PDF

`export.html` is a print version of the whole portfolio: a cover page, the
profile sections, and every project in full with its images. It is not linked
anywhere on the site and is marked `noindex`, so visitors never see it. It reads
its content from `index.html` and the files in `content/`, so it always matches
the live site with nothing to keep in sync.

**The easy way.** In the Actions tab, run **Build Portfolio PDF**. It renders the
PDF and attaches it to the run as a download, and by default also commits
`Caitlin-Fields-Portfolio.pdf` to the branch. Nothing to install.

**Locally**, if you have Node:

```bash
npm install
npx playwright install chromium
npm run pdf                       # writes Caitlin-Fields-Portfolio.pdf
npm run pdf -- some-name.pdf      # or choose the file name
```

**By hand**, with no tooling at all: start a local server (see below), open
`http://localhost:8000/export.html`, then print and choose Save as PDF. Turn on
background graphics in the print dialog.

Text stays selectable and searchable, and photos are embedded at full
resolution, so the quality matches the website.

## Local preview

The site loads project files with JavaScript, so open it through a local server
rather than double-clicking the file.

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Hosting

Served by GitHub Pages from the repository root. In Settings, Pages, choose the
branch to publish.
