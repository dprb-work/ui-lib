const containers: Record<string, true | undefined> = {
  tabs: true,
  disclosure: true,
  evidence: true,
  recommendation: true,
  decision: true,
  code: true,
  diff: true,
  math: true,
  notice: true,
  callout: true,
};

export function normalizeMdc(content: string): string {
  const lines = content.split("\n");
  const stack: Array<{ index: number; depth: number }> = [];
  let fence: { marker: string; length: number } | undefined;
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index] ?? "";
    const token = /^\s*(`{3,}|~{3,})/.exec(line)?.[1];
    if (fence) {
      if (
        token?.[0] === fence.marker &&
        token.length >= fence.length &&
        line.trim() === token
      )
        fence = undefined;
      continue;
    }
    if (token) {
      fence = { marker: token[0] ?? "`", length: token.length };
      continue;
    }
    const name = /^::([a-z][\w-]*)(?:\[.*\])?(?:\{.*\})?\s*$/.exec(line)?.[1];
    if (name && Object.hasOwn(containers, name))
      stack.push({ index, depth: stack.length });
    else if (line.trim() === "::" && stack.length) {
      const opening = stack.pop();
      if (!opening) continue;
      const marker = ":".repeat(4 + opening.depth);
      lines[opening.index] = marker + (lines[opening.index] ?? "").slice(2);
      lines[index] = marker;
    }
  }
  for (const opening of stack)
    lines[opening.index] = `\\${lines[opening.index] ?? ""}`;
  return lines.join("\n");
}
