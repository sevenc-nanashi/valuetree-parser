import { parseValueTree } from "./parse.ts";
import { assertSnapshot } from "@std/testing/snapshot";

Deno.test("expla1n(self)", async (test) => {
  const tssln = await Deno.readFile("./testAssets/expla1n_self.tssln");

  const valueTree = parseValueTree(tssln);

  await assertSnapshot(test, valueTree);
});
