# Better Selling With Bailey

The website for bettersellingwithbailey.com, hosted on GitHub Pages from the `main` branch.

## Files

| Path | What it is |
| --- | --- |
| `index.html` | Homepage |
| `blog/` | Blog index and posts |
| `assets/site.css` | Styles shared by every page |
| `assets/site.js` | Mobile menu, lead-source tracking and the small forms, shared by every page |
| `assets/qr/` | QR codes for the sale-alert sign and the partner certificate |
| `sale-alerts/` | Sale-alert signup for shoppers (`sale-alerts/sign/` is the printable checkout sign) |
| `first-30-days/` | Free printable checklist for families, with an "email it to me" form |
| `for-realtors-and-attorneys/` | Partner page with the referral form (`certificate/` is the printable walkthrough certificate) |
| `assets/photos/` | Sale photos (resized to 1,000–1,600 px) |
| `reviews.json` | Google reviews shown on the homepage |
| `og-image.jpg` | Picture shown when the site is shared on Facebook or in a text |

## Common updates

**Add an upcoming sale.** In `index.html`, find `var BSWB_EVENTS = [` and copy one of the entries. Past sales hide themselves, and the next sale also appears in a banner at the top of the page.

**Update reviews.** Edit `reviews.json`. Reviews with no written text are skipped, and the rating and review count in the badge come from `rating` and `userRatingsTotal`.

**Add a photo.** Resize it to about 1,000 px on the long side, put it in `assets/photos/`, and give it a short description in the `alt` text.

**Change the price.** The price appears in the homepage hero tag, pricing section and FAQ, the side cards on the town, collection and partner pages, the blog posts' closing boxes, the cost table in `blog/estate-sale-cost-erie-pa/`, and the `priceRange` and `offers` lines in each page's structured data. Search the repo for `25%` to find them all.

## Forms

Every form sends to bettersellingwithbailey@gmail.com through FormSubmit (formsubmit.co), each with its own subject line so they're easy to filter in Gmail:

| Form | Subject starts with |
| --- | --- |
| Homepage walkthrough form | New sale inquiry from |
| Sale alerts (homepage and `sale-alerts/`) | New sale-alert signup |
| Partner referral | New referral |
| First-30-days checklist | Checklist request |

The walkthrough form and the checklist form also send the visitor an automatic confirmation email (FormSubmit's `_autoresponse`).

Every form includes `lead_source`, `first_page` and `first_visit`: how that visitor first found the site (a Google or Facebook referral, a `utm_source` tag, `ref: partner-certificate` from a certificate QR code, or `direct`). Add `?utm_source=...` to any link you post so its leads are labeled.

The first message sent from the live site triggers a one-time confirmation email from FormSubmit; click its activation link and every later message arrives in Gmail.
