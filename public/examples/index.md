# Ticket example

One synthetic record-creation action demonstrates the initial profile binding.

- [Complete profile](https://ruagentic.org/examples/tickets/agentic.json)
- [OpenAPI document](https://ruagentic.org/examples/tickets/openapi.json)
- [Illustrative receipt](https://ruagentic.org/examples/tickets/receipt.json)
- [Profile schema](https://ruagentic.org/schemas/agentic-0.1.schema.json)
- [Receipt schema](https://ruagentic.org/schemas/receipt-0.1.schema.json)

| Role | Operation ID | Endpoint |
| --- | --- | --- |
| Submit | createTicket | POST /tickets |
| Reconcile | getRequestStatus | GET /requests/{requestId} |
| Verify | getTicket | GET /tickets/{ticketId} |

The client uses `Idempotency-Key`, persists its request identity before sending, and correlates the resulting resource's ID, request ID, state, and subject. A successful HTTP submit response alone is insufficient for verified completion.

The receipt file is illustrative and does not record a real customer action. It includes a request identity, origin, observation timestamp, outcome, resource, and evidence pointer pairs.

Use [the generator](https://ruagentic.org/generate/) to customize the profile, [the validator](https://ruagentic.org/validate/) for structural checks, and [the recovery lab](https://ruagentic.org/lab/) to explore simulated failures. The [quick start](https://ruagentic.org/docs/QUICKSTART.md) runs a real local HTTP drop after a committed ticket.
