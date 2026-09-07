"""Local compatibility runner for an independently supplied client process.
Never interprets a manifest as a shell command. Adapter configuration is locally trusted code.
"""
import argparse, importlib.util, json, platform, subprocess, sys, tempfile, threading
from datetime import datetime, timezone
from pathlib import Path
from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parents[1]
module_spec = importlib.util.spec_from_file_location('agentic_reference_service', ROOT/'reference/service/server.py')
service_module = importlib.util.module_from_spec(module_spec)
module_spec.loader.exec_module(service_module)
SCENARIOS = {
    'normal': 'succeeded', 'response-lost': 'succeeded', 'status-unavailable': 'unknown',
    'stale-read': 'succeeded', 'wrong-evidence': 'unknown', 'pending': 'pending',
    'restart-after-submit': 'succeeded',
}

def run_case(name, command):
    calls = []
    class RecordingHandler(service_module.Handler):
        def do_POST(self):
            calls.append(('POST', self.path))
            return super().do_POST()
        def do_GET(self):
            calls.append(('GET', self.path))
            return super().do_GET()
    checks = {}
    with tempfile.TemporaryDirectory(prefix='agentic-pilot-') as directory:
        fault = 'response-lost' if name == 'restart-after-submit' else name
        service = service_module.Service(0, str(Path(directory)/'service.sqlite3'), fault)
        service.RequestHandlerClass = RecordingHandler
        thread = threading.Thread(target=service.serve_forever, daemon=True)
        thread.start()
        try:
            origin = 'http://127.0.0.1:' + str(service.server_port)
            profile = json.loads((ROOT/'examples/tickets/agentic.json').read_text(encoding='utf-8'))
            profile['origin'] = origin
            request_id = 'pilot-' + name
            payload = {
                'profile': profile,
                'openapi': json.loads((ROOT/'examples/tickets/openapi.json').read_text(encoding='utf-8')),
                'request_id': request_id, 'input': {'subject': 'Synthetic compatibility test: ' + name},
                'ledger_path': str(Path(directory)/'client.sqlite3'),
                'test_crash_after_submit': name == 'restart-after-submit',
            }
            def invoke():
                return subprocess.run(command, input=json.dumps(payload), text=True, capture_output=True, cwd=ROOT, timeout=25, shell=False)
            if name == 'restart-after-submit':
                crashed = invoke()
                checks['crash_hook_exit_86'] = crashed.returncode == 86
                checks['one_write_before_crash'] = sum(method == 'POST' for method, _ in calls) == 1
                with service.connect() as db:
                    checks['resource_committed_before_crash'] = db.execute('SELECT count(*) FROM tickets').fetchone()[0] == 1
                payload['test_crash_after_submit'] = False
                writes_before_resume = sum(method == 'POST' for method, _ in calls)
            result = invoke()
            checks['adapter_exit_zero'] = result.returncode == 0
            receipt = json.loads(result.stdout)
            schema = json.loads((ROOT/'schemas/receipt-0.1.schema.json').read_text(encoding='utf-8'))
            checks['receipt_schema'] = not list(Draft202012Validator(schema).iter_errors(receipt))
            checks['expected_outcome'] = receipt.get('outcome') == SCENARIOS[name]
            checks['request_identity'] = receipt.get('request_id') == request_id
            checks['action_identity'] = receipt.get('action_id') == profile['actions'][0]['id']
            checks['origin_identity'] = receipt.get('origin') == origin
            checks['exactly_one_submit'] = sum(method == 'POST' for method, _ in calls) == 1
            checks['status_read'] = any(method == 'GET' and path.startswith('/requests/') for method, path in calls)
            with service.connect() as db:
                tickets = [dict(row) for row in db.execute('SELECT * FROM tickets')]
            checks['expected_resource_count'] = len(tickets) == (0 if name == 'pending' else 1)
            if name == 'restart-after-submit':
                checks['no_write_on_resume'] = sum(method == 'POST' for method, _ in calls) == writes_before_resume
            if SCENARIOS[name] == 'succeeded':
                ticket = tickets[0] if tickets else {}
                evidence = receipt.get('evidence', {})
                checks['resource_read'] = any(method == 'GET' and path == '/tickets/' + str(ticket.get('id')) for method, path in calls)
                checks['resource_identity'] = receipt.get('resource_id') == ticket.get('id') and bool(ticket.get('id'))
                checks['evidence_identity'] = evidence.get('resource_id') == ticket.get('id') and evidence.get('request_id') == request_id
                checks['evidence_source'] = evidence.get('url') == origin + '/tickets/' + str(ticket.get('id'))
                checks['evidence_state'] = evidence.get('state') == ticket.get('status')
                checks['evidence_bindings'] = evidence.get('matched') == profile['actions'][0]['evidence']['inputBindings']
                checks['stored_input'] = ticket.get('subject') == payload['input']['subject']
            return {'scenario': name, 'passed': all(checks.values()), 'checks': checks, 'outcome': receipt.get('outcome'), 'resources': len(tickets), 'http_calls': len(calls)}
        except (ValueError, OSError, subprocess.TimeoutExpired, IndexError, AttributeError, TypeError) as error:
            return {'scenario': name, 'passed': False, 'checks': checks, 'error': type(error).__name__ + ': ' + str(error)[:300]}
        finally:
            service.shutdown()
            service.server_close()
            thread.join(timeout=5)

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--adapter', required=True, help='Locally trusted JSON adapter configuration')
    parser.add_argument('--out', help='Report output path; parent must exist')
    parser.add_argument('--revision', default='unspecified', help='Tested implementation commit or version')
    parser.add_argument('--scenario', choices=list(SCENARIOS), help='Run just one scenario')
    args = parser.parse_args()
    config = json.loads(Path(args.adapter).read_text(encoding='utf-8'))
    command = config.get('command')
    if not isinstance(command, list) or not command or not all(isinstance(arg, str) and arg for arg in command):
        parser.error('command must be a nonempty array of strings; shell command strings are not accepted')
    if config.get('authorship') not in ('project', 'external-self-declared'):
        parser.error('authorship must be project or external-self-declared')
    cases = [args.scenario] if args.scenario else list(SCENARIOS)
    rows = [run_case(name, command) for name in cases]
    report = {
        'format': 'agentic-pilot-report-0.1', 'profile_version': '0.1.0-draft',
        'observed_at': datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
        'implementation': config.get('name', 'Unnamed'), 'revision': args.revision,
        'authorship': config['authorship'], 'independence_verified': False,
        'environment': {'python': platform.python_version(), 'platform': platform.system()},
        'scope': 'Local synthetic single-principal behavior subset; not certification or production evidence.',
        'passed': all(row['passed'] for row in rows), 'scenarios': rows,
    }
    encoded = json.dumps(report, indent=2) + '\n'
    if args.out: Path(args.out).write_text(encoded, encoding='utf-8')
    print(encoded, end='')
    return 0 if report['passed'] else 1

if __name__ == '__main__':
    raise SystemExit(main())
