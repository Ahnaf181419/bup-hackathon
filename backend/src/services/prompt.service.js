export function buildPrompt(prompt, options = {}) {
  const text = options.systemPrompt
    ? `${options.systemPrompt}\n\n${prompt}`
    : prompt;
  return [{ role: "user", parts: [{ text }] }];
}
