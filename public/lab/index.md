# Recovery lab

The [recovery lab](https://ruagentic.org/lab/) is an in-memory browser simulation. Select a scenario and run it to compare blind retry, idempotent retry, and Agentic verification. Inspect calls, duplicate resources, outcome, and trace; download the Agentic receipt for the selected run.

Scenarios include a lost response, unavailable status, stale resource read, mismatched evidence, pending work, an expired tracking window, and a fresh successful action. The scenario list in the interface is authoritative for its available controls.

The deterministic [comparison report](https://ruagentic.org/reports/benchmark.json) also includes a competent existing verification workflow. That workflow can achieve the same result. The benefit of a shared profile must be tested as reduced integration or maintenance effort, not assumed from the simulation.

For actual HTTP disconnection and persistent SQLite recovery, run the [quick start](https://ruagentic.org/docs/QUICKSTART.md). For an independently written consumer, use the [compatibility runner](https://ruagentic.org/docs/COMPATIBILITY.md). Browser simulation results are not production reliability estimates or independent adoption.
