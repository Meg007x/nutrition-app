import sqlite3
import json

conn = sqlite3.connect(r'C:\Users\megra\.local\share\mimocode\mimocode.db')
cur = conn.cursor()

# Check the other checkpoint-writing sessions for any unique insights
# ses_0c0045cdbffe6UgS06t9EfukbR has 74 messages
sid = 'ses_0c0045cdbffe6UgS06t9EfukbR'

print("=== MESSAGES FROM ses_0c0045cdbffe6UgS06t9EfukbR ===")
cur.execute("""
    SELECT json_extract(m.data, '$.role') as role, m.time_created, p.data
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE m.session_id = ?
    AND json_extract(p.data, '$.type') = 'text'
    ORDER BY m.time_created
""", (sid,))
for row in cur.fetchall():
    role, tc, pdata = row
    try:
        pd = json.loads(pdata) if pdata else {}
        text = pd.get('text', '')[:500]
        if text.strip():
            print(f"\n--- {role} at {tc} ---")
            print(text)
    except:
        pass

conn.close()
