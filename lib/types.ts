export type Json =
  | null
  | boolean
  | number
  | string
  | Json[]
  | { [key: string]: Json };
export type Outcome = 'succeeded' | 'failed' | 'pending' | 'unknown';
export interface Action {
  id: string;
  description: string;
  openapi: string;
  submit: string;
  status: string;
  verify: string;
  request: {
    header: 'Idempotency-Key';
    scope: 'principal-action';
    retentionSeconds: number;
  };
  bindings: { statusRequestId: string; verifyResourceId: string };
  evidence: {
    resourceIdPointer: string;
    requestIdPointer: string;
    statePointer: string;
    successValues: string[];
    inputBindings: { inputPointer: string; resourcePointer: string }[];
  };
  recovery: {
    maxChecks: number;
    checkDelayMs: number;
    timeoutMs: number;
    retry: 'never-automatically';
  };
}
export interface Profile {
  $schema?: string;
  agentic: '1.0.0';
  origin: string;
  actions: Action[];
}
export interface Receipt {
  agentic: '1.0.0';
  request_id: string;
  action_id: string;
  origin: string;
  outcome: Outcome;
  observed_at: string;
  resource_id: string | null;
  reason: string;
  evidence?: {
    url: string;
    resource_id: string;
    request_id: string;
    state: string;
    matched: Action['evidence']['inputBindings'];
  };
}
export interface Operation {
  method: 'GET' | 'POST';
  path: string;
  jsonBody?: boolean;
  parameters?: { name: string; in: string; required?: boolean }[];
}
export interface Trace {
  kind: 'save' | 'submit' | 'interrupted' | 'status' | 'verify' | 'result';
  message: string;
}
export interface LedgerEntry {
  requestId: string;
  identity: string;
  input: string;
  createdAt: number;
  phase: 'prepared' | 'sent';
  receipt?: Receipt;
}
export interface Ledger {
  exclusive<T>(key: string, fn: () => Promise<T>): Promise<T>;
  get(key: string): Promise<LedgerEntry | undefined>;
  put(key: string, entry: LedgerEntry): Promise<void>;
}
export interface Transport {
  request(
    url: string,
    init: {
      method: string;
      headers?: Record<string, string>;
      body?: string;
      timeoutMs: number;
    },
  ): Promise<{ status: number; body: unknown }>;
}
