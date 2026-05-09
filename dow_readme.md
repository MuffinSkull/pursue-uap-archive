---
license: other
license_name: u-s-government-public-domain
license_link: https://www.usa.gov/government-copyright
pretty_name: "DOW UFO/UAP Release 01 (May 2026)"
tags:
  - uap
  - ufo
  - government-records
  - declassified
  - foia
language:
  - en
size_categories:
  - n<1K
---

# Department of War — UFO/UAP "Release 01" (May 8, 2026)

Mirror of the files published at <https://www.war.gov/UFO/> as part of the U.S.
Department of War's "Presidential Unsealing and Reporting System for UAP
Encounters" (PURSUE) initiative — the first batch of records released under
President Trump's directive for transparency on Unidentified Anomalous Phenomena
(UAP).

The original site is gated by Akamai bot protection, which makes scripted bulk
downloads inconvenient. This dataset is a complete, unmodified mirror of every
file referenced by the page's master CSV, organized for easy browsing and
analysis.

## Contents

| Folder           | Files | Description                                              |
|------------------|-------|----------------------------------------------------------|
| `pdfs/`          | 116   | FBI case file 62-HQ-83894 sections, NASA reports, DoS, DoW reports |
| `videos/`        | 28    | DOW UAP encounter videos + NASA Gemini 7 audio (mp4, sourced via DVIDS) |
| `images/`        | 26    | FBI evidence photos and other imagery (full-resolution)  |
| `thumbnails/`    | 130   | Modal/carousel thumbnails for each record                |
| `csv/uap-csv.csv`|   1   | Original master CSV from the war.gov page                |
| `metadata/manifest.json` | 1 | Cleaned, structured manifest for all 161 records  |
| `metadata/dvids_videos.json` | 1 | Resolved DVIDS video IDs → CloudFront mp4 URLs |

Total: **161 records**, ~**3.6 GB**.

## Agencies represented

- Department of War — 82 records
- Federal Bureau of Investigation — 57 records
- NASA — 15 records
- Department of State — 7 records

## How it was collected

1. Fetched the master CSV referenced by the page: `https://www.war.gov/Portals/1/Interactive/2026/UFO/uap-csv.csv`
2. Downloaded each `PDF | Image Link` and `Modal Image` URL.
3. For records with `Type == VID`, scraped the public DVIDS video page
   (`https://www.dvidshub.net/video/{ID}`) for the direct CloudFront `.mp4` URL
   and downloaded it.
4. Used `curl_cffi` with Chrome TLS impersonation to bypass Akamai bot
   protection on `war.gov`.

The full scraping script is included alongside this dataset in the companion
GitHub repo (link in the dataset card if available) or can be reproduced from
the description above.

## File naming

Files are named after the `Title` field in the source CSV with characters
sanitized (e.g. `65_HS1-834228961_62-HQ-83894_Section_10.pdf`,
`DOW-UAP-PR42_Unresolved_UAP_Report_Middle_East_2020.mp4`).

## License / Source

These are U.S. government records released to the public by the Department of
War. U.S. government works are generally not subject to copyright in the United
States. See <https://www.usa.gov/government-copyright>.

Original source: <https://www.war.gov/UFO/> (PURSUE — Presidential Unsealing and
Reporting System for UAP Encounters), released 2026-05-08.

## Caveats

- One CSV row had a corrupted PDF URL
  (`65_HS1-834228961_62-HQ-83894_Serial_153`); the correct file path was
  inferred from the naming pattern and downloaded successfully.
- Per the source page: "The materials archived here are unresolved cases,
  meaning the government is unable to make a definitive determination on the
  nature of the observed phenomena."
