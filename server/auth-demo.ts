import { AgentAuthClient, MemoryStorage } from '@auth/agent';
import { publicOrigin } from './security.ts';
import { sandboxProfile, sandboxOpenapi, saveReport } from './sandbox.ts';

export async function runAuthDemo(ownerId: string) {
  const client = new AgentAuthClient({
    storage: new MemoryStorage(),
    urls: [publicOrigin()],
    allowDirectDiscovery: true,
  });
  const discovery = await client.discoverProvider(publicOrigin());
  const connection = await client.connectAgent({
    provider: publicOrigin(),
    mode: 'autonomous',
    name: 'Agentic public demonstration',
    capabilities: ['agentic.validate'],
  });
  let revoked = false;
  try {
    const execution = await client.executeCapability({
      agentId: connection.agentId,
      capability: 'agentic.validate',
      arguments: { profile: sandboxProfile(), openapi: sandboxOpenapi() },
    });
    const signed = await client.signJwt({ agentId: connection.agentId });
    await client.disconnectAgent(connection.agentId);
    revoked = true;
    const denied = await fetch(publicOrigin() + '/api/auth/agent/session', {
      headers: { authorization: 'Bearer ' + signed.token },
      redirect: 'error',
      signal: AbortSignal.timeout(8000),
    });
    return saveReport(ownerId, 'agent-auth', {
      reportVersion: '1',
      kind: 'agent-auth-demo',
      observedAt: new Date().toISOString(),
      agentId: connection.agentId,
      registrationStatus: connection.status,
      grants: connection.capabilityGrants,
      execution,
      revoked: true,
      afterRevocationStatus: denied.status,
      revocationEnforced: denied.status === 401 || denied.status === 403,
      steps: [
        'Discovered the live provider',
        'Registered an autonomous agent with a fresh keypair',
        'Granted profile validation',
        'Executed a signed capability request',
        'Revoked the agent',
        'Checked that its previously signed token is rejected',
      ],
      implementation:
        'Official @auth/agent client and @better-auth/agent-auth server over HTTP.',
      discoveryIssuer: discovery.issuer,
    });
  } finally {
    if (!revoked)
      await client.disconnectAgent(connection.agentId).catch(() => {});
  }
}
