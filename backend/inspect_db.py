import sqlite3
conn = sqlite3.connect('db.sqlite3')
for row in conn.execute("PRAGMA table_info(posts_post);"):
    print(row)
