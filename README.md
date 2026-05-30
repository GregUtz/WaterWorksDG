# WaterWorksDG
Small website for WaterWorks Disc Golf

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
