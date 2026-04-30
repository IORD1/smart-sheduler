// Pulls the first balanced JSON object/array out of free-form model output.
// Handles ```json fences and prose around the JSON.
export function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const slice = sliceFirstJson(candidate);
  if (!slice) throw new Error('No JSON object or array found in response');
  return JSON.parse(slice);
}

function sliceFirstJson(s) {
  const startIdx = s.search(/[{[]/);
  if (startIdx === -1) return null;
  const open = s[startIdx];
  const close = open === '{' ? '}' : ']';
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = startIdx; i < s.length; i++) {
    const c = s[i];
    if (escape) { escape = false; continue; }
    if (c === '\\') { escape = true; continue; }
    if (c === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (c === open) depth++;
    else if (c === close) {
      depth--;
      if (depth === 0) return s.slice(startIdx, i + 1);
    }
  }
  return null;
}
