import sqlite3
import json

conn = sqlite3.connect(r'C:\Users\megra\.local\share\mimocode\mimocode.db')
cur = conn.cursor()

# Code review session messages
sid = 'ses_072566bfcffe5kFkRAsI18Ee56'

print("=== ALL MESSAGES FROM CODE REVIEW SESSION ===")
cur.execute("""
    SELECT m.id, json_extract(m.data, '$.role') as role, m.time_created, p.data
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE m.session_id = ?
    ORDER BY m.time_created
""", (sid,))
for row in cur.fetchall():
    mid, role, tc, pdata = row
    try:
        pd = json.loads(pdata) if pdata else {}
        text = pd.get('text', '')
    except:
        text = str(pdata)
    if text.strip():
        print(f"\n--- {role} {mid} at {tc} ---")
        print(text[:1500])
        if len(text) > 1500:
            print(f"... [total {len(text)} chars]")

conn.close()
