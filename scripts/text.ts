import { writeActionIndex } from './action-index.ts';

try {
  console.log(await writeActionIndex(process.argv.slice(2)));
} catch (error) {
  console.error(
    error instanceof Error ? error.message : 'Action index generation failed.',
  );
  process.exitCode = 1;
}
