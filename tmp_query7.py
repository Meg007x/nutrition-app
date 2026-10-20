import sqlite3
import json

conn = sqlite3.connect(r'C:\Users\megra\.local\share\mimocode\mimocode.db')
cur = conn.cursor()

# Search for key decision/rule statements in user messages across ALL sessions
keywords = ['ต้อง', 'ห้าม', 'ต้องการ', 'บังคับ', '-rule', 'decision', 'always', 'never', 'remember',
            'ธีม', 'สีส้ม', 'ฟอนต์', 'ภาษาไทย', 'theme', 'font', '#F5A400']

for kw in keywords:
    cur.execute("""
        SELECT m.session_id, m.time_created, p.data
        FROM message m
        JOIN part p ON p.message_id = m.id
        WHERE json_extract(m.data, '$.role') = 'user'
        AND p.data LIKE ?
        LIMIT 3
    """, (f'%{kw}%',))
    rows = cur.fetchall()
    if rows:
        print(f"\n=== Keyword: '{kw}' ===")
        for sid, tc, pdata in rows:
            try:
                pd = json.loads(pdata) if pdata else {}
                text = pd.get('text', '')
                # Find the sentence containing the keyword
                for sentence in text.split('\n'):
                    if kw.lower() in sentence.lower():
                        print(f"  [{sid[-12:]}] {sentence[:200]}")
                        break
            except:
                pass

conn.close()
