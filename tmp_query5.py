import sqlite3
import json

conn = sqlite3.connect(r'C:\Users\megra\.local\share\mimocode\mimocode.db')
cur = conn.cursor()

# Get the last assistant message in the code review session (should contain the plan)
sid = 'ses_072566bfcffe5kFkRAsI18Ee56'

cur.execute("""
    SELECT m.id, m.time_created, p.data
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE m.session_id = ? AND json_extract(m.data, '$.role') = 'assistant'
    ORDER BY m.time_created DESC
    LIMIT 1
""", (sid,))
row = cur.fetchone()
if row:
    mid, tc, pdata = row
    try:
        pd = json.loads(pdata) if pdata else {}
        text = pd.get('text', '')
    except:
        text = str(pdata)
    print(f"=== LAST ASSISTANT MESSAGE (plan) ===")
    print(text[:5000])
    if len(text) > 5000:
        print(f"\n... [total {len(text)} chars]")

# Also check for tool calls in assistant messages that wrote files
print("\n\n=== TOOL CALLS (write/edit) FROM ALL SESSIONS ===")
cur.execute("""
    SELECT m.session_id, p.data
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE json_extract(m.data, '$.role') = 'assistant'
    AND json_extract(p.data, '$.type') = 'tool'
    ORDER BY m.time_created DESC
    LIMIT 30
""")
for row in cur.fetchall():
    sid, pdata = row
    try:
        pd = json.loads(pdata) if pdata else {}
        tool_name = pd.get('tool', '')
        state = pd.get('state', {})
        inp = state.get('input', {})
        if tool_name in ('write', 'edit', 'writeFile', 'editFile'):
            file_path = inp.get('file_path', inp.get('path', ''))
            print(f"  [{sid[-12:]}] {tool_name}: {file_path}")
    except:
        pass

conn.close()
