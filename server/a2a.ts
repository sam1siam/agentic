import { AgentCard, Task, TaskState } from '@a2a-js/sdk';
import {
  AgentEvent,
  DefaultRequestHandler,
  JsonRpcTransportHandler,
  ServerCallContext,
  type TaskStore,
  type AgentExecutor,
} from '@a2a-js/sdk/server';
import { waitUntil } from '@vercel/functions';
import { database } from './db.ts';
import { publicOrigin, HttpError } from './security.ts';
import { auditUrl } from './audit.ts';
import { runSandbox, saveReport } from './sandbox.ts';

export function agentCard() {
  return AgentCard.fromJSON({
    name: 'Agentic testing agent',
    description:
      'Run synthetic recovery checks or read-only public URL audits. Results are saved as task artifacts.',
    version: '0.1.0',
    documentationUrl: publicOrigin() + '/connect/',
    provider: { organization: 'Agentic project', url: publicOrigin() },
    supportedInterfaces: [
      {
        url: publicOrigin() + '/a2a',
        protocolBinding: 'JSONRPC',
        protocolVersion: '1.0',
      },
    ],
    capabilities: { streaming: false, pushNotifications: false },
    securitySchemes: {
      sandbox: {
        httpAuthSecurityScheme: {
          scheme: 'Bearer',
          bearerFormat: 'Agentic sandbox session',
        },
      },
    },
    securityRequirements: [{ schemes: { sandbox: [] } }],
    defaultInputModes: ['application/json'],
    defaultOutputModes: ['application/json'],
    skills: [
      {
        id: 'test-recovery',
        name: 'Test recovery',
        description:
          'Send a data part with {"kind":"recovery","scenario":"response-lost"}. Writes only synthetic data inside your sandbox.',
        tags: ['testing', 'recovery'],
      },
      {
        id: 'audit-profile',
        name: 'Audit profile URL',
        description:
          'Send {"kind":"audit","url":"https://your-service.example/agentic.json"}. Reads public files without submitting actions.',
        tags: ['audit', 'openapi'],
      },
    ],
  });
}
function contextOwner(context: ServerCallContext) {
  if (!context.user?.isAuthenticated)
    throw new HttpError(401, 'Sandbox session required.');
  return context.user.userName;
}
const taskStore: TaskStore = {
  async save(task, context) {
    await database().query(
      `INSERT INTO platform_a2a_tasks(owner_id,id,data) VALUES($1,$2,$3)
      ON CONFLICT(owner_id,id) DO UPDATE SET data=EXCLUDED.data,updated_at=now()`,
      [contextOwner(context), task.id, JSON.stringify(Task.toJSON(task))],
    );
  },
  async load(id, context) {
    const row = (
      await database().query(
        'SELECT data FROM platform_a2a_tasks WHERE owner_id=$1 AND id=$2',
        [contextOwner(context), id],
      )
    ).rows[0];
    return row ? Task.fromJSON(row.data) : undefined;
  },
  async list(params, context) {
    let tasks = (
      await database().query(
        'SELECT data FROM platform_a2a_tasks WHERE owner_id=$1 ORDER BY updated_at DESC LIMIT 200',
        [contextOwner(context)],
      )
    ).rows.map((row) => Task.fromJSON(row.data));
    if (params.contextId)
      tasks = tasks.filter((t) => t.contextId === params.contextId);
    if (params.status)
      tasks = tasks.filter((t) => t.status?.state === params.status);
    if (params.statusTimestampAfter)
      tasks = tasks.filter(
        (t) => (t.status?.timestamp ?? '') >= params.statusTimestampAfter!,
      );
    const offset = /^\d{1,4}$/.test(params.pageToken ?? '')
      ? Number(params.pageToken)
      : 0;
    const pageSize = Math.min(Math.max(params.pageSize || 20, 1), 100),
      totalSize = tasks.length;
    tasks = tasks
      .slice(offset, offset + pageSize)
      .map((t) => ({
        ...t,
        artifacts: params.includeArtifacts ? t.artifacts : [],
        history:
          params.historyLength === undefined
            ? t.history
            : t.history.slice(-params.historyLength),
      }));
    return {
      tasks,
      totalSize,
      pageSize,
      nextPageToken:
        offset + pageSize < totalSize ? String(offset + pageSize) : '',
    };
  },
};
export async function handleA2a(
  requestBody: any,
  ownerId: string,
  version: string,
) {
  const context = new ServerCallContext({
    user: { isAuthenticated: true, userName: ownerId },
    requestedVersion: version,
  });
  const executor: AgentExecutor = {
    execute: async (ctx, bus) => {
      const work = (async () => {
        bus.publish(
          AgentEvent.task({
            id: ctx.taskId,
            contextId: ctx.contextId,
            status: {
              state: TaskState.TASK_STATE_WORKING,
              timestamp: new Date().toISOString(),
              message: undefined,
            },
            history: [ctx.userMessage],
            artifacts: [],
            metadata: undefined,
          }),
        );
        try {
          const input = ctx.userMessage.parts.find(
            (p) => p.content?.$case === 'data',
          )?.content;
          if (
            !input ||
            input.$case !== 'data' ||
            !input.value ||
            typeof input.value !== 'object'
          )
            throw new Error(
              'Provide one JSON data part with kind recovery or audit.',
            );
          const data = input.value;
          const report =
            data.kind === 'audit' && typeof data.url === 'string'
              ? await saveReport(ownerId, 'audit', await auditUrl(data.url))
              : data.kind === 'recovery'
                ? await runSandbox(ownerId, {
                    ...data,
                    requestId: 'a2a-' + ctx.taskId,
                  })
                : (() => {
                    throw new Error('Unknown testing task kind.');
                  })();
          bus.publish(
            AgentEvent.artifactUpdate({
              taskId: ctx.taskId,
              contextId: ctx.contextId,
              artifact: {
                artifactId: report.id,
                name: 'Agentic evidence report',
                description:
                  'Project-authored test evidence; not certification.',
                parts: [
                  {
                    content: { $case: 'data', value: report },
                    mediaType: 'application/json',
                    filename: 'report.json',
                    metadata: undefined,
                  },
                ],
                extensions: [],
                metadata: undefined,
              },
              append: false,
              lastChunk: true,
              metadata: undefined,
            }),
          );
          bus.publish(
            AgentEvent.statusUpdate({
              taskId: ctx.taskId,
              contextId: ctx.contextId,
              status: {
                state: TaskState.TASK_STATE_COMPLETED,
                timestamp: new Date().toISOString(),
                message: undefined,
              },
              metadata: undefined,
            }),
          );
        } catch (error) {
          bus.publish(
            AgentEvent.statusUpdate({
              taskId: ctx.taskId,
              contextId: ctx.contextId,
              status: {
                state: TaskState.TASK_STATE_FAILED,
                timestamp: new Date().toISOString(),
                message: undefined,
              },
              metadata: {
                error:
                  error instanceof Error ? error.message : 'Testing failed.',
              },
            }),
          );
        } finally {
          bus.finished();
        }
      })();
      waitUntil(work);
      await work;
    },
    cancelTask: async () => {
      throw new Error(
        'These bounded tests cannot be canceled after dispatch. Retrieve the task result; do not repeat an ambiguous write.',
      );
    },
  };
  const handler = new JsonRpcTransportHandler(
    new DefaultRequestHandler(agentCard(), taskStore, executor),
  );
  const result = await handler.handle(requestBody, context);
  if (Symbol.asyncIterator in result)
    throw new HttpError(400, 'Streaming is not offered by this testing agent.');
  return result;
}
