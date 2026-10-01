import sqlite3
import json

conn = sqlite3.connect(r'C:\Users\megra\.local\share\mimocode\mimocode.db')
cur = conn.cursor()

# Focus on the main substantive session (ses_0c014dabfffeJOJxtBGIz7115p) with 77 messages
# Get all user messages to find rules/decisions
sid = 'ses_0c014dabfffeJOJxtBGIz7115p'

print("=== USER MESSAGES FROM MAIN SESSION ===")
cur.execute("""
    SELECT m.id, m.time_created, json_extract(m.data, '$.role') as role, p.data
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE m.session_id = ? AND json_extract(m.data, '$.role') = 'user'
    ORDER BY m.time_created
""", (sid,))
for row in cur.fetchall():
    mid, tc, role, pdata = row
    try:
        pd = json.loads(pdata) if pdata else {}
        text = pd.get('text', '')[:500]
    except:
        text = str(pdata)[:500]
    if text.strip():
        print(f"\n--- User message {mid} at {tc} ---")
        print(text)

conn.close()
