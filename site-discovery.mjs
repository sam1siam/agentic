// Public declarations must match tested, deployed runtime capabilities.
export default {
  version: '1.0',
  standard: 'https://agents-txt.com',
  site: {
    name: 'Agentic',
    url: 'https://ruagentic.org',
    description:
      'Experimental action-recovery profile, documentation, and developer tools.',
  },
  mcp: [{url:'https://ruagentic.org/mcp',type:'streamable-http'}],
  a2a: [{url:'https://ruagentic.org/.well-known/agent-card.json'}],
  authorization: {protocols:['agent-auth'],discovery:'/.well-known/agent-configuration'},
  webmcp: [
    {
      url: 'https://ruagentic.org/generate/',
      description: 'Generate an Agentic profile in a compatible browser.',
    },
    {
      url: 'https://ruagentic.org/validate/',
      description: 'Validate supplied profile and OpenAPI JSON locally.',
    },
    {
      url: 'https://ruagentic.org/lab/',
      description: 'Run the local browser recovery simulation.',
    },
  ],
};
