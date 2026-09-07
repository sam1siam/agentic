"""Second reference consumer. Same project authorship; not independent adoption."""
import ctypes, json, os, re, sqlite3, sys, time, urllib.request, urllib.error, uuid
from pathlib import Path
from urllib.parse import urlparse, quote
import jsonschema

ROOT = Path(__file__).resolve().parents[2]
def canonical(value): return json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(',',':'))
def pointer(value, path):
    for key in path[1:].split('/'):
        key = key.replace('~1','/').replace('~0','~')
        if isinstance(value, list):
            if not re.fullmatch(r'0|[1-9][0-9]*', key) or int(key) >= len(value): return None
            value = value[int(key)]
        elif isinstance(value, dict) and key in value: value=value[key]
        else: return None
    return value

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs): return None
def request(url, timeout, payload=None, key=None):
    headers = {'Accept':'application/json'}
    if key: headers['Idempotency-Key']=key
    if payload is not None: headers['Content-Type']='application/json'
    req=urllib.request.Request(url,data=json.dumps(payload).encode() if payload is not None else None,headers=headers)
    opener=urllib.request.build_opener(NoRedirect())
    try: response=opener.open(req,timeout=timeout/1000)
    except urllib.error.HTTPError as exc: response=exc
    with response:
        raw=response.read(65537)
        if len(raw)>65536: raise ValueError('Response exceeds 64 KiB')
        try: body=json.loads(raw)
        except ValueError: body=None
        return response.code,body

def alive(pid):
    if os.name!='nt':
        try: os.kill(pid,0); return True
        except ProcessLookupError: return False
        except PermissionError: return True
    from ctypes import wintypes
    kernel=ctypes.WinDLL('kernel32',use_last_error=True)
    kernel.OpenProcess.argtypes=[wintypes.DWORD,wintypes.BOOL,wintypes.DWORD]
    kernel.OpenProcess.restype=wintypes.HANDLE
    kernel.GetExitCodeProcess.argtypes=[wintypes.HANDLE,ctypes.POINTER(wintypes.DWORD)]
    kernel.CloseHandle.argtypes=[wintypes.HANDLE]
    handle=kernel.OpenProcess(0x1000,False,pid)
    if not handle: return ctypes.get_last_error()!=87
    try:
        code=wintypes.DWORD()
        return not kernel.GetExitCodeProcess(handle,ctypes.byref(code)) or code.value==259
    finally: kernel.CloseHandle(handle)

def execute(origin, request_id, subject, db_path):
    if not re.fullmatch(r'[A-Za-z0-9_-]{8,128}',request_id): raise ValueError('Invalid request ID')
    p=json.loads((ROOT/'examples/tickets/agentic.json').read_text())
    api=json.loads((ROOT/'examples/tickets/openapi.json').read_text())
    p['origin']=origin
    jsonschema.Draft202012Validator(json.loads((ROOT/'schemas/agentic-0.1.schema.json').read_text())).validate(p)
    parsed=urlparse(origin)
    if parsed.username or parsed.password or parsed.path or parsed.query or parsed.fragment or parsed.scheme not in ('http','https'): raise ValueError('Invalid origin')
    if parsed.scheme=='http' and parsed.hostname not in ('localhost','127.0.0.1','::1'): raise ValueError('HTTP is loopback-only')
    action=p['actions'][0]
    operations={}
    for path,item in api['paths'].items():
        for method,op in item.items():
            operations[op['operationId']]=(method,path)
    # This consumer intentionally supports only the shipped ticket binding.
    if operations!={'createTicket':('post','/tickets'),'getRequestStatus':('get','/requests/{requestId}'),'getTicket':('get','/tickets/{ticketId}')}: raise ValueError('Unsupported ticket binding')
    payload={'subject':subject}
    if not isinstance(subject,str) or not 1<=len(subject)<=200: raise ValueError('Invalid subject')
    identity=canonical({'profile':p,'openapi':api,'actionId':action['id']})
    Path(db_path).parent.mkdir(parents=True,exist_ok=True)
    db=sqlite3.connect(db_path,timeout=5,isolation_level=None)
    db.executescript('PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; CREATE TABLE IF NOT EXISTS records (key TEXT PRIMARY KEY,value TEXT NOT NULL); CREATE TABLE IF NOT EXISTS locks (key TEXT PRIMARY KEY,pid INTEGER NOT NULL,token TEXT NOT NULL);')
    token=uuid.uuid4().hex
    db.execute('BEGIN IMMEDIATE')
    try:
        owner=db.execute('SELECT pid FROM locks WHERE key=?',(request_id,)).fetchone()
        if owner and alive(owner[0]): raise ValueError('Request locked by active process')
        db.execute('INSERT OR REPLACE INTO locks VALUES(?,?,?)',(request_id,os.getpid(),token))
        db.execute('COMMIT')
    except BaseException:
        db.execute('ROLLBACK');db.close();raise
    def put(entry): db.execute('INSERT OR REPLACE INTO records VALUES(?,?)',(request_id,json.dumps(entry,ensure_ascii=False)))
    try:
        row=db.execute('SELECT value FROM records WHERE key=?',(request_id,)).fetchone()
        fresh=row is None
        entry=json.loads(row[0]) if row else {'requestId':request_id,'identity':identity,'input':canonical(payload),'createdAt':int(time.time()*1000),'phase':'prepared'}
        if entry['identity']!=identity or entry['input']!=canonical(payload): raise ValueError('Request ID bound to different input or profile')
        if entry.get('receipt',{}).get('outcome')=='succeeded': return entry['receipt']
        if fresh: put(entry)
        def finish(outcome,reason,resource_id=None,evidence=None):
            receipt={'agentic':'0.1.0-draft','request_id':request_id,'action_id':action['id'],'origin':origin,'outcome':outcome,'observed_at':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'resource_id':resource_id,'reason':reason}
            if evidence: receipt['evidence']=evidence
            jsonschema.Draft202012Validator(json.loads((ROOT/'schemas/receipt-0.1.schema.json').read_text())).validate(receipt)
            entry['receipt']=receipt;put(entry);return receipt
        def expired():
            age=time.time()*1000-entry['createdAt']
            return age<0 or age>=action['request']['retentionSeconds']*1000
        if expired(): return finish('unknown','Request tracking expired or clock moved backwards. Handoff required.')
        timeout=action['recovery']['timeoutMs']
        if fresh:
            entry['phase']='sent';put(entry)
            try: request(origin+'/tickets',timeout,payload,request_id)
            except (OSError,ValueError): pass
            if os.environ.get('AGENTIC_TEST_CRASH')=='1': os._exit(86)
        outcome,reason='unknown','No authoritative outcome was verified. Handoff required.'
        for attempt in range(action['recovery']['maxChecks']):
            if attempt: time.sleep(action['recovery']['checkDelayMs']/1000)
            if expired(): return finish('unknown','Request tracking expired. Handoff required.')
            try:
                code,state=request(origin+'/requests/'+quote(request_id,safe=''),timeout)
                if code!=200 or not isinstance(state,dict) or state.get('request_id')!=request_id: continue
                if state.get('status')=='failed': return finish('failed','The service reports that this request failed.')
                if state.get('status')=='pending':
                    outcome,reason='pending','The service still reports this request as pending.'
                    continue
                outcome,reason='unknown','No authoritative outcome was verified. Handoff required.'
                rid=state.get('resource_id')
                if state.get('status')!='succeeded' or not isinstance(rid,str) or not rid: continue
                url=origin+'/tickets/'+quote(rid,safe='')
                code,resource=request(url,timeout)
                e=action['evidence']
                if code==200 and pointer(resource,e['resourceIdPointer'])==rid and pointer(resource,e['requestIdPointer'])==request_id and pointer(resource,e['statePointer']) in e['successValues'] and all(pointer(resource,b['resourcePointer'])==pointer(payload,b['inputPointer']) for b in e['inputBindings']):
                    return finish('succeeded','The original action was verified against the persisted resource.',rid,{'url':url,'resource_id':rid,'request_id':request_id,'state':pointer(resource,e['statePointer']),'matched':e['inputBindings']})
            except (OSError,ValueError,TypeError):
                outcome,reason='unknown','Verification was interrupted. Handoff required.'
        return finish(outcome,reason)
    finally:
        db.execute('DELETE FROM locks WHERE key=? AND token=?',(request_id,token))
        db.close()

if __name__=='__main__':
    args=sys.argv[1:]
    try:
        receipt=execute(args[0] if args else 'http://127.0.0.1:4318',args[1] if len(args)>1 else 'python-request-001',args[2] if len(args)>2 else 'Please help with my account',args[3] if len(args)>3 else '.agentic-state/python.sqlite3')
        print(json.dumps(receipt,indent=2))
        sys.exit(0 if receipt['outcome']=='succeeded' else 2)
    except Exception as exc:
        print(str(exc),file=sys.stderr)
        sys.exit(1)
