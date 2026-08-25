import sqlite3
import json

conn = sqlite3.connect(r'C:\Users\megra\.local\share\mimocode\mimocode.db')
cur = conn.cursor()

sid = 'ses_0c014dabfffeJOJxtBGIz7115p'

# Get the last edit to dashboardController - full new_string
cur.execute("""
    SELECT m.time_created, p.data
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE m.session_id = ? 
    AND json_extract(m.data, '$.role') = 'assistant'
    AND json_extract(p.data, '$.tool') = 'edit'
    AND p.data LIKE '%dashboardController%'
    ORDER BY m.time_created DESC
    LIMIT 1
""", (sid,))
row = cur.fetchone()
if row:
    tc, pdata = row
    try:
        pd = json.loads(pdata) if pdata else {}
        state = pd.get('state', {})
        inp = state.get('input', {})
        old = inp.get('old_string', '')
        new = inp.get('new_string', '')
        print(f"=== Dashboard controller edit at {tc} ===")
        print(f"OLD ({len(old)} chars):")
        print(old[:1000])
        print(f"\nNEW ({len(new)} chars):")
        print(new[:1000])
    except Exception as e:
        print(f"Error: {e}")

# Check step5-1.styles.ts fix attempt
print("\n\n=== STEP5-1 STYLES EDIT (duplicate key fix) ===")
cur.execute("""
    SELECT m.time_created, p.data
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE m.session_id = ? 
    AND json_extract(m.data, '$.role') = 'assistant'
    AND json_extract(p.data, '$.tool') = 'edit'
    AND p.data LIKE '%step5-1.styles%'
    ORDER BY m.time_created DESC
    LIMIT 1
""", (sid,))
row = cur.fetchone()
if row:
    tc, pdata = row
    try:
        pd = json.loads(pdata) if pdata else {}
        state = pd.get('state', {})
        inp = state.get('input', {})
        old = inp.get('old_string', '')
        new = inp.get('new_string', '')
        print(f"OLD ({len(old)} chars): {old[:500]}")
        print(f"\nNEW ({len(new)} chars): {new[:500]}")
    except Exception as e:
        print(f"Error: {e}")

# Get the last few text messages from the session
print("\n\n=== LAST TEXT MESSAGES IN MAIN SESSION ===")
cur.execute("""
    SELECT json_extract(m.data, '$.role') as role, m.time_created, p.data
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE m.session_id = ?
    AND json_extract(p.data, '$.type') = 'text'
    ORDER BY m.time_created DESC
    LIMIT 10
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
