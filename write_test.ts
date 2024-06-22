import { parseValueTree } from "./parse.ts";
import { writeValueTree } from "./write.ts";
import { assertEquals } from "@std/assert/assert-equals";

Deno.test("expla1n(self)", async () => {
  const tssln = await Deno.readFile("./testAssets/expla1n_self.tssln");

  const valueTree = parseValueTree(tssln);

  const written = writeValueTree(valueTree);

  const reParsed = parseValueTree(written);

  assertEquals(valueTree, reParsed);
});
