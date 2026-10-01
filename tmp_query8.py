import sqlite3
import json

conn = sqlite3.connect(r'C:\Users\megra\.local\share\mimocode\mimocode.db')
cur = conn.cursor()

# Get the edit calls for dashboardController.js to understand what was changed
sid = 'ses_0c014dabfffeJOJxtBGIz7115p'

cur.execute("""
    SELECT m.time_created, p.data
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE m.session_id = ? 
    AND json_extract(m.data, '$.role') = 'assistant'
    AND json_extract(p.data, '$.tool') = 'edit'
    AND p.data LIKE '%dashboardController%'
    ORDER BY m.time_created
""", (sid,))
for row in cur.fetchall():
    tc, pdata = row
    try:
        pd = json.loads(pdata) if pdata else {}
        state = pd.get('state', {})
        inp = state.get('input', {})
        old = inp.get('old_string', '')[:300]
        new = inp.get('new_string', '')[:300]
        print(f"\n=== Edit at {tc} ===")
        print(f"OLD: {old}")
        print(f"NEW: {new}")
    except Exception as e:
        print(f"Error: {e}")

# Also check the last few messages for any dashboard-related discussions
print("\n\n=== LAST 10 MESSAGES IN MAIN SESSION ===")
cur.execute("""
    SELECT m.id, json_extract(m.data, '$.role') as role, m.time_created, p.data
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE m.session_id = ?
    ORDER BY m.time_created DESC
    LIMIT 20
""")
for row in cur.fetchall():
    mid, role, tc, pdata = row
    try:
        pd = json.loads(pdata) if pdata else {}
        text = pd.get('text', '')[:300]
        tool = pd.get('tool', '')
        if text.strip():
            print(f"\n--- {role} at {tc} ---")
            print(text)
    except:
        pass

conn.close()
