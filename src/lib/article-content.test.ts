import assert from "node:assert/strict";
import test from "node:test";
import { markdownToArticleEditorData } from "./article-content";

function paragraph(markdown: string) {
  return markdownToArticleEditorData(markdown).blocks[0].data.text;
}

test("preserves real reference URLs and query strings through inline formatting", () => {
  const ista = "https://www.ista.org/getting_started_with_design.php";
  const hario = "https://global.hario.com/faq/glass_1_en.pdf";
  assert.equal(paragraph(`[ISTA](${ista}) and [Hario](${hario})`),
    `<a href="${ista}">ISTA</a> and <a href="${hario}">Hario</a>`);
  assert.equal(paragraph("[spec](/specs/file_a_b?model=a_b&format=pdf)"),
    '<a href="/specs/file_a_b?model=a_b&amp;format=pdf">spec</a>');
});

test("retains emphasis while protecting code, including code in link labels", () => {
  assert.equal(paragraph("**Check** _fit_ and `glass_1_en.pdf` [**read** `a_b_c`](/a_b_c)"),
    '<b>Check</b> <i>fit</i> and <code>glass_1_en.pdf</code> <a href="/a_b_c"><b>read</b> <code>a_b_c</code></a>');
});

test("escapes injected markup and does not create javascript links", () => {
  const html = String(paragraph('<script>alert(1)</script> [unsafe](javascript:alert) [safe](/x?value="bad")'));
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('href="javascript:'));
  assert.ok(html.includes('href="/x?value=&quot;bad&quot;"'));
});
