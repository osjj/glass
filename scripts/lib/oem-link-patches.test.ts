import assert from "node:assert/strict";
import test from "node:test";
import { oemArticleSlugs, patchOemArticleLinks } from "./oem-link-patches";

const insertionHeadings: Record<string, string[]> = {
  [oemArticleSlugs.oem]: [
    "03Weight and hand feel",
    "07Compliance and market",
    "07Common Pitfalls and a Checklist",
  ],
  [oemArticleSlugs.spec]: ["Capacity: define the fill point before comparing millilitres"],
  [oemArticleSlugs.aql]: ["Inspect the finished pack, not only loose glass"],
  [oemArticleSlugs.packaging]: ["7. Use a launch approval checklist"],
};

type FixtureBlock = { id?: string; type: string; data: Record<string, unknown>; [field: string]: unknown };

function fixture(slug: string): { blocks: FixtureBlock[]; [field: string]: unknown } {
  return {
    time: 1794700000000,
    version: "2.31.1",
    customDocument: { revision: "keep-me", values: [1, null, true] },
    blocks: [
      { id: "intro", type: "paragraph", data: { text: "Original introduction.", custom: "retain" }, tunes: { alignment: "left" } },
      { id: "picture", type: "image", data: { file: { url: "/images/original.webp", width: 1200 }, caption: "Original image", custom: [1, 2] } },
      { id: "future-block", type: "future-tool", data: { nested: { preserve: true } }, unknownField: "retain" },
      { type: "list", data: { style: "unordered", items: [{ content: "Original item without a block ID.", items: [] }] } },
      ...insertionHeadings[slug].flatMap((text, index) => [
        { id: `context-${index}`, type: "paragraph", data: { text: `Original section ${index}.` } },
        { id: `heading-${index}`, type: "header", data: { text, level: slug === oemArticleSlugs.oem ? 3 : 2, custom: "retain" } },
      ]),
    ],
  };
}

for (const slug of Object.values(oemArticleSlugs)) {
  test(`${slug}: inserts only the planned contextual links and preserves every original block`, () => {
    const before = fixture(slug);
    const original = JSON.stringify(before, null, 2);
    const result = patchOemArticleLinks(slug, original);
    const after = JSON.parse(result.content);
    const expectedDestinations = slug === oemArticleSlugs.oem
      ? [oemArticleSlugs.spec, oemArticleSlugs.packaging, oemArticleSlugs.aql]
      : [oemArticleSlugs.oem];

    assert.equal(result.added, expectedDestinations.length);
    assert.deepEqual(result.links.map(link => link.to), expectedDestinations);
    assert.ok(result.links.every(link => link.from === slug && link.targetSlug === link.to && link.href === `/blog/${link.to}` && link.anchor.length > 10));
    assert.deepEqual({ ...after, blocks: [] }, { ...before, blocks: [] });
    assert.equal(after.blocks.length, before.blocks.length + result.added);

    const insertedBlocks: unknown[] = [];
    for (const [index, heading] of insertionHeadings[slug].entries()) {
      const headingIndex = after.blocks.findIndex((block: { type: string; data: { text?: string } }) => block.type === "header" && block.data.text === heading);
      const addition = after.blocks[headingIndex - 1];
      const auditLink = result.links[index];
      assert.equal(addition.type, "paragraph");
      assert.ok(addition.data.text.includes(`<a href="${auditLink.href}">${auditLink.anchor}</a>`));
      assert.equal(Object.keys(addition.data).length, 1);
      insertedBlocks.push(addition);
    }
    assert.deepEqual(after.blocks.filter((block: unknown) => !insertedBlocks.includes(block)), before.blocks);
    assert.equal(JSON.stringify(before, null, 2), original);
  });

  test(`${slug}: a second patch preserves the complete content string`, () => {
    const first = patchOemArticleLinks(slug, JSON.stringify(fixture(slug)));
    const second = patchOemArticleLinks(slug, first.content);
    assert.equal(second.added, 0);
    assert.equal(second.content, first.content);
    assert.deepEqual(second.links, first.links);
  });

  for (const heading of insertionHeadings[slug]) {
    test(`${slug}: refuses a missing insertion heading: ${heading}`, () => {
      const document = fixture(slug);
      document.blocks = document.blocks.filter(block => block.type !== "header" || block.data.text !== heading);
      assert.throws(() => patchOemArticleLinks(slug, JSON.stringify(document)), /Expected one insertion heading/);
    });

    test(`${slug}: refuses an ambiguous insertion heading: ${heading}`, () => {
      const document = fixture(slug);
      document.blocks.push({ id: "duplicate", type: "header", data: { text: heading, level: 2 } });
      assert.throws(() => patchOemArticleLinks(slug, JSON.stringify(document)), /Expected one insertion heading/);
    });
  }
}

test("rejects unsupported sources and content that is not existing EditorJS", () => {
  assert.throws(() => patchOemArticleLinks("another-post", JSON.stringify(fixture(oemArticleSlugs.spec))), /Unsupported OEM link source/);
  for (const content of ["not JSON", "{}", '{"blocks":[{"type":"paragraph"}]}']) {
    assert.throws(() => patchOemArticleLinks(oemArticleSlugs.spec, content), /Expected existing EditorJS content/);
  }
});

test("validates insertion headings even when the link paragraph is already present", () => {
  const first = patchOemArticleLinks(oemArticleSlugs.spec, JSON.stringify(fixture(oemArticleSlugs.spec)));
  const document = JSON.parse(first.content);
  document.blocks = document.blocks.filter((block: { type: string }) => block.type !== "header");
  assert.throws(() => patchOemArticleLinks(oemArticleSlugs.spec, JSON.stringify(document)), /Expected one insertion heading/);
});
