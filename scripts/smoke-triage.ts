import { runTriage } from "../src/lib/agent/triage";
import { mockRawFeed } from "../src/lib/sources/mock";

async function main() {
  const out = await runTriage(mockRawFeed(), (t) => process.stdout.write(t));
  console.log("\n--- RESULTS ---");
  console.log(JSON.stringify(out, null, 2));
  const tasks = out.results.filter((r) => r.tag === "Task").length;
  if (out.results.length === 0) throw new Error("no results produced");
  console.log(`\nresults=${out.results.length} tasks=${tasks} todos=${out.todos.length}`);
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
