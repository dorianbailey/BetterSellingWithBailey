# Better Selling With Bailey

The website for bettersellingwithbailey.com, hosted on GitHub Pages from the `main` branch.

## Files

| Path | What it is |
| --- | --- |
| `index.html` | Homepage |
| `blog/` | Blog index and posts |
| `assets/site.css` | Styles shared by every page |
| `assets/site.js` | Mobile menu, shared by every page |
| `assets/photos/` | Sale photos (resized to 1,000–1,600 px) |
| `reviews.json` | Google reviews shown on the homepage |
| `og-image.jpg` | Picture shown when the site is shared on Facebook or in a text |

## Common updates

**Add an upcoming sale.** In `index.html`, find `var BSWB_EVENTS = [` and copy one of the entries. Past sales hide themselves, and the next sale also appears in a banner at the top of the page.

**Update reviews.** Edit `reviews.json`. Reviews with no written text are skipped, and the rating and review count in the badge come from `rating` and `userRatingsTotal`.

**Add a photo.** Resize it to about 1,000 px on the long side, put it in `assets/photos/`, and give it a short description in the `alt` text.

## Contact form

The form sends inquiries to bettersellingwithbailey@gmail.com through FormSubmit (formsubmit.co). The first message sent from the live site triggers a one-time confirmation email from FormSubmit; click its activation link and every later inquiry arrives in Gmail.
