# WaterWorksDG
Small website for WaterWorks Disc Golf

## TODO

- Audit remaining UDisc-era schedule gaps after direct UDisc import. Known
  pending weeks remain where no Thursday Water Works event was found in UDisc,
  especially the delayed 2020 season and skipped weeks in 2021-2023.

## Deploying to the live bucket

The live site appears to be served from the Google Cloud Storage bucket
`gs://www.waterworksdg.com`, with Cloudflare in front of it for DNS/proxying.

Install the Google Cloud CLI and sign in once:

```powershell
gcloud auth login
```

Preview what would be uploaded:

```powershell
.\tools\deploy-gcs.ps1
```

Deploy the current site files:

```powershell
.\tools\deploy-gcs.ps1 -Deploy
```

Deploy and remove bucket objects that no longer exist locally:

```powershell
.\tools\deploy-gcs.ps1 -Deploy -Delete
```

The deploy script excludes repo/dev files such as `.git`, `tools`, server logs,
`README.md`, `.gitignore`, and the old `test.html`/`test1.html` pages.

After deploying, the script sets HTML files to `Cache-Control: no-cache,
max-age=0, must-revalidate`. If Cloudflare still shows stale content at
`https://www.waterworksdg.com/`, purge Cloudflare's cache for both:

```text
https://www.waterworksdg.com/
https://www.waterworksdg.com/index.html
```
