# Contributing
Start with docs/PRIOR-ART.md and docs/SPEC.md. Open a focused issue with the problem, existing alternatives, a concrete client behavior, and the evidence needed to test it.

For code changes:
1. Use Node 24 and Python 3.11+.
2. Run npm ci and python -m pip install -r reference/python/requirements.txt.
3. Run npm test, npm run typecheck, and npm run build.
4. If behavior changes, update its normative text and tests. Run npm run benchmark when the scenario behavior or comparison changes.
5. Keep generated schemas, public documentation, and validator code synchronized through npm run prepare:artifacts.

Do not claim independent adoption for project-authored reference clients. Include implementation ownership and exact versions with compatibility results. Avoid adding protocol bindings or fields without a concrete consumer.

Original contributions are accepted under the repository's Apache-2.0 license. Keep third-party attribution and licensing intact.
