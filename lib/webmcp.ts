export interface PageTool {
  name: string;
  title: string;
  description: string;
  inputSchema: object;
  annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
  execute: (input: unknown) => unknown | Promise<unknown>;
}
export function registerPageTool(tool: PageTool): () => void {
  const context = (
    document as Document & {
      modelContext?: {
        registerTool: (
          tool: PageTool,
          options: { signal: AbortSignal },
        ) => void | Promise<void>;
      };
    }
  ).modelContext;
  if (!context?.registerTool) return () => {};
  const lifecycle = new AbortController();
  try {
    void Promise.resolve(
      context.registerTool(tool, { signal: lifecycle.signal }),
    ).catch(() => {
      /* Optional browser capability. The visible UI remains available. */
    });
  } catch {
    /* Unsupported registry version. */
  }
  return () => lifecycle.abort();
}
