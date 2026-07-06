# ACCELQ QuickTrigger

A dashboard for triggering and monitoring ACCELQ CI job runs. Built with React + Tailwind CSS, available as a Chrome extension.

## Features

### CI Job Tiles
- Create tiles for each ACCELQ template job you want to trigger
- Configure Base URL, Tenant Code, Project Name, Template Job ID, User ID, and API Key
- Each tile has a unique UUID for easy identification and import/export
- Tiles are grouped by Tenant Code for organization

### Multiple Concurrent Jobs
- Trigger multiple test jobs from the same CI job tile
- Click **Run** as many times as needed to start concurrent jobs
- Each triggered job is tracked independently with its own status

### Real-time Job Monitoring
- Live status updates with configurable poll frequency (default 10s)
- Visual job count badges: **Running**, **Scheduled**, **Completed**
- Auto-stops polling when job reaches terminal status (completed, failed, aborted, etc.)
- Auto-resumes polling if you reload the page mid-run

### Job History & Metrics
- Click any tile to view all triggered jobs
- Each job shows: Job ID, status, pass/fail/not-run counts, duration
- Expand jobs to see detailed trigger results and run summaries
- Delete individual jobs or clear all history

### Paste-a-cURL
- Instead of filling forms manually, paste a curl command from ACCELQ
- Click **Fill fields from curl** to auto-populate all connection details
- Supports both "run template" and "job status" curl formats

### Export & Import
- **Export**: Download all tile configurations as JSON with curl commands included
- **Import**: Load tiles from JSON file with duplicate detection
- Existing tiles are detected by UUID — choose to skip or update them

### Details View
- Status, pass/fail/not-run counts, total test cases
- Scenario, dataset, agent, and platform information
- Test case list with individual results
- Link to full ACCELQ result page
- Raw request/response JSON for debugging

## Build

```bash
npm install
npm run build
```

- **Unpacked extension**: `plugin/build/`
- **Plugin zip**: `plugin/dist/`

## Install Extension

1. Open `chrome://extensions` and enable **Developer mode**
2. Click **Load unpacked** and select `plugin/build/`
3. Click the extension icon to open the dashboard
