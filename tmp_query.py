import sqlite3
import json
import sys

conn = sqlite3.connect(r'C:\Users\megra\.local\share\mimocode\mimocode.db')
cur = conn.cursor()

# Get all sessions for this project, sorted by time_created DESC
print("=== ALL PROJECT SESSIONS ===")
cur.execute('SELECT id, title, time_created FROM session WHERE project_id = ? ORDER BY time_created DESC',
            ('ed602370-9e4b-4369-9c89-366865a62924',))
for row in cur.fetchall():
    sid, title, tc = row
    title_short = (title[:80] if title else 'None')
    print(f"  {sid} | {title_short} | {tc}")

# Get message counts per session
print("\n=== MESSAGE COUNTS ===")
cur.execute('SELECT session_id, COUNT(*) FROM message GROUP BY session_id ORDER BY COUNT(*) DESC')
for row in cur.fetchall():
    print(f"  {row[0]}: {row[1]} messages")

# Get recent sessions (last 7 days = ~604800000ms)
import time
seven_days_ago_ms = int(time.time() * 1000) - (7 * 24 * 60 * 60 * 1000)
print(f"\n=== SESSIONS FROM LAST 7 DAYS (since {seven_days_ago_ms}) ===")
cur.execute('SELECT id, title, time_created FROM session WHERE project_id = ? AND time_created >= ? ORDER BY time_created DESC',
            ('ed602370-9e4b-4369-9c89-366865a62924', seven_days_ago_ms))
for row in cur.fetchall():
    sid, title, tc = row
    title_short = (title[:80] if title else 'None')
    print(f"  {sid} | {title_short} | {tc}")

conn.close()
