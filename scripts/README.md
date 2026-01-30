# Supabase to Excel Exporter

Python script to export Supabase database to Excel format on a weekly basis.

## Excel Output Format

The exported Excel file contains **two sheets**:

### Sheet 1: Site Visit Requests
All site visit request data with styled headers (blue)

### Sheet 2: Customer Quotas
Customer quota information with:
- Total Hours Quota
- Used Hours
- **Available Hours** (calculated automatically)
- Green styled headers

## Setup

### 1. Install Dependencies

```bash
cd scripts
pip install -r requirements.txt
```

Or using Python module:
```bash
py -m pip install -r requirements.txt
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

Or on Windows with `py`:
```bash
py export_to_excel.py
```

Exports will be saved to `scripts/exports/` folder with timestamps.

## Running on Another Computer

To run this on a different machine:

1. **Copy the `scripts/` folder** to the new computer
2. **Install Python 3.10+** if not already installed
3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
4. **Create the `.env` file** with your Supabase credentials:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIs...
   ```
5. **Run the script:**
   ```bash
   python export_to_excel.py
   ```

**That's it!** No need to copy the entire project - just the `scripts/` folder with:
- `export_to_excel.py`
- `weekly_scheduler.py` (optional - for continuous scheduling)
- `requirements.txt`
- `.env` (you'll create this with your credentials)

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

Or on Windows:
```bash
py weekly_scheduler.py
```

To run in background:
- **Linux/Mac:** `nohup python weekly_scheduler.py > scheduler.log 2>&1 &`
- **Windows:** Use pythonw.exe or run as service

## Output

Files created in `exports/` folder:
- `site_visit_requests_YYYYMMDD_HHMMSS.xlsx` - Timestamped exports with both sheets
- `site_visit_requests_latest.xlsx` - Always the most recent export

## Excel Styling

Both sheets include:
- Styled header rows (blue for requests, green for quotas)
- Auto-sized columns
- Frozen header row
- Borders on all cells
- Readable column names
- Calculated "Available Hours" in quotas sheet
