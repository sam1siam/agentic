# Outreach feedback and evaluation changes

> Archived on 2026-09-07: the project owner retired the managed pilot program and further outreach. The text below is a historical record, not an active invitation or work plan. Use [Get started](https://ruagentic.org/adopt/) for direct access.

Reviewed against the public GitHub issues and comment APIs on 2026-09-07. Ten invitations have been delivered. Confirmed external pilots and verified independent implementations remain zero.

All ten invitations have since been withdrawn and the four proposal issues closed with account-owner approval. See the [verified submission updates](SUBMISSION-UPDATE-DRAFTS.md). The responses below describe the earlier review, before withdrawal.

## Responses at the earlier review

- **Mastra:** [the triage bot](https://github.com/mastra-ai/mastra/issues/23256#issuecomment-5573647122) acknowledges the proposal and requires waiting for maintainers to remove triage/approval labels before a PR. The issue remains open with `status: needs triage`. No follow-up or upstream PR is due now.
- **Pydantic AI Harness:** [automated triage](https://github.com/pydantic/pydantic-ai-harness/issues/814#issuecomment-5574154802) calls the issue non-actionable and describes the existing recovery semantics as intentional. It directs the optional service-side reconciliation question to maintainer discussion. The issue remains open; a bot recommendation to close is not a completed closure or a human maintainer decision. The bot excluded external artifacts from its evidence; its use of “untrusted” does not establish a security defect in this project. No independent pilot, compatible implementation, or acceptance is established by this automated investigation.
- **CrewAI:** [veriton-dev's comment](https://github.com/crewAIInc/crewAI/issues/5802#issuecomment-5574749095) proposes stable keys, a completion ledger, and a restart test. GitHub reports no repository association for the commenter. This is a contribution to an existing issue, not an agreement to evaluate Agentic. The paid review offer has not been accepted and would not itself demonstrate independent adoption.

## What the next evaluation must establish

Agentic does not replace a framework's durable execution or guarantee exactly-once effects. Its hypothesis is narrower: a common description of existing submit, request-status, and resource-read operations may reduce service integration and maintenance work.

1. Start with a willing service/tool author whose service already supports durable request identity, authorized status lookup, and resource reads. Agree on scope before asking for framework changes.
2. Compare an existing competent recovery integration with the same integration driven by the profile. Measure implementation effort, service-specific code, and maintenance when operation bindings change. Equal recovery outcomes alone do not establish benefit.
3. Keep a durable pre-submit claim and stable logical action ID across retries. A local completion cache cannot establish whether a remote effect committed before the client crashed. An unresolved claim must stay unresolved unless the provider offers trustworthy recovery evidence.
4. Test commit followed by response loss and client restart. Verify the original request and resource, one external side effect, and no second submission. Also test concurrent retries, unavailable status, incorrect evidence, and pending results.
5. Preserve intentional repeated actions: two identical inputs can represent two distinct requests. An arguments hash alone is not sufficient action identity.
6. Provide a small, self-contained reproducer and comparison in an agreed venue so reviewers need not rely on external marketing pages. Label project-authored artifacts and publish negative findings.

No further repository replies or PRs were posted as part of this feedback review. Future invitations should use a project's discussion or integration channel and follow its contribution process.
