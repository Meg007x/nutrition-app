import sqlite3
import json

conn = sqlite3.connect(r'C:\Users\megra\.local\share\mimocode\mimocode.db')
cur = conn.cursor()

# Get all user messages from main session - need to get full text
sid = 'ses_0c014dabfffeJOJxtBGIz7115p'

print("=== ALL USER MESSAGES (full text) FROM MAIN SESSION ===")
cur.execute("""
    SELECT m.id, m.time_created, p.data
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE m.session_id = ? AND json_extract(m.data, '$.role') = 'user'
    ORDER BY m.time_created
""", (sid,))
for row in cur.fetchall():
    mid, tc, pdata = row
    try:
        pd = json.loads(pdata) if pdata else {}
        text = pd.get('text', '')
    except:
        text = str(pdata)
    if text.strip():
        print(f"\n{'='*80}")
        print(f"User message {mid} at {tc}")
        print(f"{'='*80}")
        print(text[:2000])
        if len(text) > 2000:
            print(f"\n... [truncated, total {len(text)} chars]")

conn.close()
