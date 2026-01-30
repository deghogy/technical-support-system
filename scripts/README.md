# Supabase to Excel Exporter

Python script to export Supabase database to Excel format on a weekly basis.

## Setup

### 1. Install Dependencies

```bash
cd scripts
pip install -r requirements.txt
```

### 2. Set Environment Variables

Create a `.env` file in the `scripts` folder:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
```

**Note:** You need the **Service Role Key** (not anon key) to access all data.
- Get it from: Supabase Dashboard → Project Settings → API → Service Role Key

### 3. Test the Script

```bash
python export_to_excel.py
```

Exports will be saved to `scripts/exports/` folder with timestamps.

## Scheduling (Run Weekly)

### Option A: Windows Task Scheduler

1. Open Task Scheduler
2. Create Basic Task
3. Name: "Supabase Weekly Export"
4. Trigger: Weekly (choose day/time)
5. Action: Start a program
6. Program: `python` (or full path to python.exe)
7. Arguments: `C:\full\path\to\export_to_excel.py`
8. Start in: `C:\full\path\to\scripts`

### Option B: Linux/Mac (cron)

```bash
# Edit crontab
crontab -e

# Add line to run every Sunday at midnight
0 0 * * 0 cd /path/to/scripts && python export_to_excel.py >> export.log 2>&1
```

### Option C: Using Python Schedule Library

For a pure Python solution, use `weekly_scheduler.py` (included) which runs continuously.

```bash
python weekly_scheduler.py
```

## Output

Files created in `exports/` folder:
- `site_visit_requests_YYYYMMDD_HHMMSS.xlsx` - Timestamped exports
- `site_visit_requests_latest.xlsx` - Always the most recent export

## Excel Format

The exported Excel includes:
- Styled header row (blue background)
- Auto-sized columns
- Frozen header row
- Borders on all cells
- Readable column names
