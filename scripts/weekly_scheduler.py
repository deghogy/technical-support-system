#!/usr/bin/env python3
"""
Weekly Scheduler for Supabase Export

This script runs continuously and executes the export every week.
Useful for environments where you can't use cron or Task Scheduler.

Usage:
    python weekly_scheduler.py

To run in background:
    - Linux/Mac: nohup python weekly_scheduler.py > scheduler.log 2>&1 &
    - Windows: Use pythonw.exe or run as service
"""

import time
import subprocess
import sys
from datetime import datetime
from pathlib import Path

try:
    import schedule
except ImportError:
    print("Installing schedule library...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "schedule"])
    import schedule


def run_export():
    """Execute the export script."""
    print(f"[{datetime.now()}] Starting weekly export...")

    script_path = Path(__file__).parent / "export_to_excel.py"

    try:
        result = subprocess.run(
            [sys.executable, str(script_path)],
            capture_output=True,
            text=True
        )

        # Always print stdout (for info messages)
        if result.stdout:
            print(result.stdout)

        if result.returncode == 0:
            print(f"[{datetime.now()}] Export completed successfully")
        else:
            print(f"[{datetime.now()}] Export failed (exit code: {result.returncode}):")
            if result.stderr:
                print("STDERR:", result.stderr)
            else:
                print("No error details available")

    except Exception as e:
        print(f"[{datetime.now()}] Error running export: {e}")
        import traceback
        traceback.print_exc()


def main():
    """Main scheduler loop."""
    print("=" * 60)
    print("SUPABASE WEEKLY EXPORT SCHEDULER")
    print("=" * 60)
    print()
    print("Schedule: Every Sunday at 00:00")
    print("Press Ctrl+C to stop")
    print()

    # Schedule for every Sunday at midnight
    schedule.every().sunday.at("00:00").do(run_export)

    # Run immediately on first start (optional - comment out if not needed)
    print("Running initial export...")
    run_export()
    print()

    print("Scheduler running. Waiting for next scheduled run...")

    while True:
        schedule.run_pending()
        time.sleep(60)  # Check every minute


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nScheduler stopped by user")
        sys.exit(0)
