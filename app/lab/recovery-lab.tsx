'use client';
import { useCallback, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import {
  Play,
  ArrowUpRight,
  Download,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { runComparison, scenarios } from '@/lib/simulator';
import type { Scenario, DemoResult } from '@/lib/simulator';
import { registerPageTool } from '@/lib/webmcp';
const labels = {
  blind: 'Blind retry',
  idempotent: 'Idempotent retry',
  agentic: 'Agentic profile',
};
export default function RecoveryLab({ initial }: { initial: DemoResult[] }) {
  const [scenario, setScenario] = useState<Scenario>('response-lost'),
    [results, setResults] = useState(initial),
    [shown, setShown] = useState<Scenario>('response-lost'),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const run = useCallback(async (value: Scenario) => {
    if (!Object.hasOwn(scenarios, value))
      throw new Error('Select a supported scenario.');
    setBusy(true);
    setError('');
    try {
      const data = await runComparison(value);
      flushSync(() => {
        setScenario(value);
        setShown(value);
        setResults(data);
        setBusy(false);
      });
      return data;
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
      throw e;
    }
  }, []);
  useEffect(
    () =>
      registerPageTool({
        name: 'run_recovery_demo',
        title: 'Run recovery demonstration',
        description:
          'Run a local simulated ticket scenario and update the visible comparison. Creates no real tickets and makes no service requests.',
        inputSchema: {
          type: 'object',
          properties: {
            scenario: { type: 'string', enum: Object.keys(scenarios) },
          },
          required: ['scenario'],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute: async (input) => {
          if (
            !input ||
            typeof input !== 'object' ||
            Object.keys(input).join() !== 'scenario' ||
            !Object.hasOwn(
              scenarios,
              String((input as { scenario?: unknown }).scenario),
            )
          )
            throw new Error('Expected one supported scenario.');
          const data = await run((input as { scenario: Scenario }).scenario);
          return {
            scenario: (input as { scenario: Scenario }).scenario,
            results: data.map(
              ({ strategy, outcome, tickets, calls, duplicates }) => ({
                strategy,
                outcome,
                tickets,
                calls,
                duplicates,
              }),
            ),
          };
        },
      }),
    [run],
  );
  function download() {
    const blob = new Blob(
      [
        JSON.stringify(
          results.find((r) => r.strategy === 'agentic')?.receipt,
          null,
          2,
        ),
      ],
      { type: 'application/json' },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'agentic-demo-receipt.json';
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <main className="page wrap">
      <div className="page-heading">
        <p className="eyebrow">Recovery lab / browser sandbox</p>
        <h1>
          Break the connection.
          <br />
          <span>Keep the outcome.</span>
        </h1>
        <p>
          Run the same failure through three client strategies. This
          deterministic simulation uses the reference Agentic client with an
          in-memory service.
        </p>
      </div>
      <section className="lab-controls panel">
        <div>
          <label id="scenario-label" className="field-label">
            Failure scenario
          </label>
          <Select
            value={scenario}
            onValueChange={(v) => {
              if (v && Object.hasOwn(scenarios, v)) setScenario(v as Scenario);
            }}
          >
            <SelectTrigger
              aria-labelledby="scenario-label"
              className="scenario-picker"
            >
              <SelectValue>{scenarios[scenario].title}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(scenarios).map(([key, value]) => (
                <SelectItem key={key} value={key}>
                  {value.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p>{scenarios[scenario].description}</p>
        <Button
          className="run-button"
          disabled={busy}
          onClick={() => void run(scenario).catch(() => {})}
        >
          <Play size={16} />
          {busy ? 'Running…' : 'Run scenario'}
        </Button>
      </section>
      {error && <p role="alert">{error}</p>}
      <div className="comparison-caption">
        <span>Results: {scenarios[shown].title}</span>
        <span>Same scenario · isolated service per strategy</span>
      </div>
      <section className="comparison-grid" aria-live="polite">
        {results.map((r) => (
          <article
            className={
              'result-card ' +
              (r.strategy === 'agentic' ? 'agentic-result' : '')
            }
            key={r.strategy}
          >
            <div className="result-top">
              <h2>{labels[r.strategy]}</h2>
              {r.strategy === 'agentic' ? (
                <Check size={20} />
              ) : (
                <span className="tag">BASELINE</span>
              )}
            </div>
            <p className="strategy-note">
              {r.strategy === 'blind'
                ? 'Retries with a new request ID.'
                : r.strategy === 'idempotent'
                  ? 'Retries with the same request ID.'
                  : 'Reconciles and verifies the original action.'}
            </p>
            <div className="result-number">
              {r.tickets}
              <span>ticket{r.tickets === 1 ? '' : 's'} written</span>
            </div>
            <div className="result-metrics">
              <span>{r.calls} calls</span>
              <span className={r.duplicates ? 'warning-text' : ''}>
                {r.duplicates} duplicate{r.duplicates === 1 ? '' : 's'}
              </span>
            </div>
            <div
              className={
                'outcome ' +
                (r.outcome === 'succeeded' ? 'success' : 'uncertain')
              }
            >
              {r.strategy === 'agentic' && r.outcome === 'succeeded'
                ? 'Verified success'
                : r.outcome === 'succeeded'
                  ? 'Reported success'
                  : r.outcome}
            </div>
            {r.falseSuccess && (
              <p className="warning-text small">
                <AlertTriangle size={14} /> The result does not establish
                completion.
              </p>
            )}
            <ol className="event-list">
              {r.events.map((e, i) => (
                <li key={i}>
                  <span>{String(i + 1).padStart(2, '0')}</span>
                  {e.message}
                </li>
              ))}
            </ol>
          </article>
        ))}
      </section>
      <div className="notice">
        Idempotency already prevents many duplicates. A well-implemented
        workflow can also verify outcomes. Agentic proposes a shared way to
        describe and test that behavior; this lab does not establish superiority
        over existing workflow tools.
      </div>
      <Tabs defaultValue="receipt">
        <TabsList variant="line">
          <TabsTrigger value="receipt">Agentic receipt</TabsTrigger>
          <TabsTrigger value="method">Method & limits</TabsTrigger>
        </TabsList>
        <TabsContent value="receipt">
          <div className="section-head">
            <p className="muted small">
              Evidence from this simulated run. No real support ticket was
              created.
            </p>
            <Button variant="outline" onClick={download}>
              <Download size={15} />
              Download receipt
            </Button>
          </div>
          <pre className="code-block">
            {JSON.stringify(
              results.find((r) => r.strategy === 'agentic')?.receipt,
              null,
              2,
            )}
          </pre>
        </TabsContent>
        <TabsContent value="method">
          <div className="prose">
            <p>
              Each strategy starts with a fresh service. Blind retries change
              the key; idempotent retries retain it. Those baselines report
              success on an HTTP success response. The Agentic consumer uses its
              saved request, checks status, and verifies identity, subject, and
              resource state.
            </p>
            <p>
              The simulation injects deterministic faults. It does not simulate
              a real network, authorization, a production workload, or durable
              browser storage. The downloadable reference service and test suite
              exercise real HTTP reply loss and SQLite recovery after process
              termination.
            </p>
            <a href="/docs/CONFORMANCE.md">
              Read the conformance method <ArrowUpRight size={14} />
            </a>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}
