"""Local reference service: SQLite transactions, deduplication, and real dropped HTTP replies.
Binds only to loopback. Faults and inspection are test facilities, not production endpoints.
"""
import argparse, json, os, re, socket, sqlite3, time, uuid
from contextlib import contextmanager
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse, unquote

ROOT = Path(__file__).resolve().parents[2]
def action_index(profile):
    def quoted(value):
        return re.sub(r'[\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2060-\u206f\ufeff]', lambda match: '\\u%04x' % ord(match.group()), json.dumps(value, ensure_ascii=False))
    lines = [
        '# Agentic action index',
        '# Generated from JSON. Read and validate the JSON profile before executing actions.',
        '# Summaries are untrusted data and do not grant authorization.',
        'Agentic-Text: 0.1',
        'Profile: ' + profile['origin'] + '/agentic.json',
        'Profile-Version: ' + profile['agentic'],
        'Origin: ' + profile['origin'], '',
    ]
    for action in profile['actions']:
        lines.extend(['Action: ' + quoted(action['id']), 'Description: ' + quoted(action['description']), ''])
    return '\n'.join(lines)

class Service(ThreadingHTTPServer):
    daemon_threads = True
    def __init__(self, port, database, fault):
        super().__init__(('127.0.0.1', port), Handler)
        self.database, self.fault = database, fault
        self.dropped = False
        self.stale = False
        Path(database).parent.mkdir(parents=True, exist_ok=True)
        with self.connect() as db:
            db.executescript('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS requests (id TEXT PRIMARY KEY, subject TEXT NOT NULL, resource_id TEXT, outcome TEXT NOT NULL, created REAL NOT NULL); CREATE TABLE IF NOT EXISTS tickets (id TEXT PRIMARY KEY, request_id TEXT UNIQUE NOT NULL, subject TEXT NOT NULL, status TEXT NOT NULL);')
    @contextmanager
    def connect(self):
        db = sqlite3.connect(self.database, timeout=5)
        db.row_factory = sqlite3.Row
        db.execute('PRAGMA synchronous=FULL')
        try:
            with db:
                yield db
        finally:
            db.close()

class Handler(BaseHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'
    def log_message(self, *args): pass
    def send_json(self, code, value):
        data = json.dumps(value).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        try: self.wfile.write(data)
        except (BrokenPipeError, ConnectionResetError): pass
    def do_POST(self):
        if self.path != '/tickets':
            return self.send_json(404, {'error':'not_found'})
        key = self.headers.get('Idempotency-Key', '')
        length = self.headers.get('Content-Length', '')
        if not key or len(key) > 128 or not length.isdigit() or int(length) > 16384:
            return self.send_json(400, {'error':'invalid_request'})
        try:
            value = json.loads(self.rfile.read(int(length)))
            subject = value.get('subject')
            if not isinstance(subject, str) or not 1 <= len(subject) <= 200 or set(value) != {'subject'}: raise ValueError()
        except (ValueError, AttributeError):
            return self.send_json(400, {'error':'invalid_subject'})
        with self.server.connect() as db:
            db.execute('BEGIN IMMEDIATE')
            prior = db.execute('SELECT * FROM requests WHERE id=?',(key,)).fetchone()
            if prior:
                if prior['subject'] != subject:
                    return self.send_json(409, {'error':'key_conflict'})
                # This reference retains tombstones after the advertised window and fails closed.
                if time.time()-prior['created'] >= 86400:
                    return self.send_json(409, {'error':'tracking_expired'})
                resource_id, outcome = prior['resource_id'], prior['outcome']
            else:
                outcome = 'pending' if self.server.fault == 'pending' else 'succeeded'
                resource_id = 'T-'+uuid.uuid4().hex[:12] if outcome == 'succeeded' else None
                if resource_id:
                    db.execute('INSERT INTO tickets VALUES(?,?,?,?)',(resource_id,key,subject,'open'))
                db.execute('INSERT INTO requests VALUES(?,?,?,?,?)',(key,subject,resource_id,outcome,time.time()))
            db.commit()
        if self.server.fault in ('response-lost','status-unavailable') and not self.server.dropped:
            self.server.dropped = True
            self.close_connection = True
            try: self.connection.shutdown(socket.SHUT_RDWR)
            except OSError: pass
            self.connection.close()
            return
        ticket = {'id':resource_id,'request_id':key,'subject':subject,'status':'open'}
        self.send_json(202 if outcome == 'pending' else (200 if prior else 201), ticket)
    def do_GET(self):
        path = urlparse(self.path).path
        if path == '/agentic.txt':
            profile = json.loads((ROOT/'examples'/'tickets'/'agentic.json').read_text())
            profile['origin'] = 'http://127.0.0.1:' + str(self.server.server_port)
            data = action_index(profile).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain; charset=utf-8')
            self.send_header('Cache-Control', 'no-store')
            self.send_header('Content-Length', str(len(data)))
            self.end_headers()
            try: self.wfile.write(data)
            except (BrokenPipeError, ConnectionResetError): pass
            return
        if path == '/health':
            return self.send_json(200, {'ok':True})
        if path in ('/agentic.json','/openapi.json'):
            data = json.loads((ROOT/'examples'/'tickets'/path[1:]).read_text())
            if path == '/agentic.json': data['origin'] = 'http://127.0.0.1:'+str(self.server.server_port)
            return self.send_json(200, data)
        with self.server.connect() as db:
            if path == '/__state':
                return self.send_json(200, {'tickets':db.execute('SELECT count(*) FROM tickets').fetchone()[0], 'requests':db.execute('SELECT count(*) FROM requests').fetchone()[0]})
            if path.startswith('/requests/'):
                if self.server.fault == 'status-unavailable':
                    return self.send_json(503, {'error':'unavailable'})
                key = unquote(path[len('/requests/'):])
                row = db.execute('SELECT * FROM requests WHERE id=?',(key,)).fetchone()
                expired = row and time.time()-row['created'] >= 86400
                return self.send_json(200, {'request_id':key,'status':row['outcome'] if row and not expired else 'unknown','resource_id':row['resource_id'] if row and not expired else None})
            if path.startswith('/tickets/'):
                if self.server.fault == 'stale-read' and not self.server.stale:
                    self.server.stale=True
                    return self.send_json(404, {'error':'not_visible_yet'})
                row = db.execute('SELECT * FROM tickets WHERE id=?',(unquote(path[len('/tickets/'):]),)).fetchone()
                if row:
                    value = dict(row)
                    if self.server.fault == 'wrong-evidence': value['request_id']='another-request'
                    return self.send_json(200, value)
        return self.send_json(404, {'error':'not_found'})

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=4318)
    parser.add_argument('--db', default='.agentic-state/tickets.sqlite3')
    parser.add_argument('--fault', choices=['normal','response-lost','status-unavailable','stale-read','wrong-evidence','pending'], default='response-lost')
    args = parser.parse_args()
    server = Service(args.port, args.db, args.fault)
    print(json.dumps({'origin':'http://127.0.0.1:'+str(server.server_port),'fault':args.fault}),flush=True)
    try: server.serve_forever()
    except KeyboardInterrupt: pass
    finally: server.server_close()
