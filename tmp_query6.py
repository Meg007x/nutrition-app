import sqlite3
import json

conn = sqlite3.connect(r'C:\Users\megra\.local\share\mimocode\mimocode.db')
cur = conn.cursor()

# Get all tool calls from main session that involve file operations
sid = 'ses_0c014dabfffeJOJxtBGIz7115p'

print("=== ALL TOOL CALLS (write/edit) FROM MAIN SESSION ===")
cur.execute("""
    SELECT m.time_created, json_extract(p.data, '$.tool') as tool, p.data
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE m.session_id = ? 
    AND json_extract(m.data, '$.role') = 'assistant'
    AND json_extract(p.data, '$.type') = 'tool'
    ORDER BY m.time_created
""", (sid,))
for row in cur.fetchall():
    tc, tool, pdata = row
    try:
        pd = json.loads(pdata) if pdata else {}
        tool_name = pd.get('tool', '')
        state = pd.get('state', {})
        inp = state.get('input', {})
        if tool_name in ('write', 'edit'):
            file_path = inp.get('file_path', inp.get('path', ''))
            # Only show project files
            if 'nutrition-app' in file_path or 'my-app' in file_path or 'nutrition-backend' in file_path:
                print(f"  [{tc}] {tool_name}: {file_path}")
    except:
        pass

# Also get bash tool calls
print("\n=== BASH TOOL CALLS FROM MAIN SESSION ===")
cur.execute("""
    SELECT m.time_created, p.data
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE m.session_id = ? 
    AND json_extract(m.data, '$.role') = 'assistant'
    AND json_extract(p.data, '$.type') = 'tool'
    AND json_extract(p.data, '$.tool') = 'bash'
    ORDER BY m.time_created
""", (sid,))
for row in cur.fetchall():
    tc, pdata = row
    try:
        pd = json.loads(pdata) if pdata else {}
        state = pd.get('state', {})
        inp = state.get('input', {})
        cmd = inp.get('command', '')[:200]
        print(f"  [{tc}] bash: {cmd}")
    except:
        pass

# Check for any subagent (non-empty agent_id) in main session
print("\n=== SUBAGENT MESSAGES ===")
cur.execute("""
    SELECT m.agent_id, json_extract(m.data, '$.role'), COUNT(*)
    FROM message m
    WHERE m.session_id = ? AND m.agent_id != '' AND m.agent_id IS NOT NULL
    GROUP BY m.agent_id, json_extract(m.data, '$.role')
""", (sid,))
for row in cur.fetchall():
    print(f"  agent={row[0]}, role={row[1]}, count={row[2]}")

conn.close()
