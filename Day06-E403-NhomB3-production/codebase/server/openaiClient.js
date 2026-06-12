function normalizeToolName(toolName = "") {
  return String(toolName).replace(/^functions\./, "");
}

function extractOutputText(raw) {
  if (raw.output_text) return raw.output_text;

  return (raw.output || [])
    .flatMap((item) => item.content || [])
    .filter((content) => content.type === "output_text" && content.text)
    .map((content) => content.text)
    .join("\n")
    .trim();
}

function extractGeminiText(raw) {
  return (raw.candidates || [])
    .flatMap((candidate) => candidate.content?.parts || [])
    .map((part) => part.text || "")
    .join("\n")
    .trim();
}

function parseJsonText(text, fallback = {}) {
  const cleaned = String(text || "")
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return fallback;
  }
}

function historyMessages(request) {
  return Array.isArray(request.history)
    ? request.history
        .filter(
          (item) => ["user", "assistant"].includes(item.role) && item.content,
        )
        .map((item) => ({ role: item.role, content: String(item.content) }))
    : [];
}

function geminiContents(request, shape, userPayload) {
  const history = historyMessages(request).map((item) => ({
    role: item.role === "assistant" ? "model" : "user",
    parts: [{ text: item.content }],
  }));
  return [
    ...history,
    {
      role: "user",
      parts: [
        {
          text: [
            "Return only valid JSON. Do not use markdown.",
            `JSON shape: ${shape}`,
            JSON.stringify(userPayload),
          ].join("\n"),
        },
      ],
    },
  ];
}

async function callGeminiJson({ env, system, contents }) {
  const model = env.GOOGLE_MODEL || "gemini-2.0-flash";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(env.GOOGLE_API_KEY)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents,
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      }),
    },
  );
  const raw = await response.json();
  return { ok: response.ok, raw, text: extractGeminiText(raw) };
}

async function callGoogleAIForToolSelection({ env, request }) {
  const shape =
    '{"intent":"...","tool":"...","arguments":{},"assistantMessage":"...","cards":[]}';
  const { ok, raw, text } = await callGeminiJson({
    env,
    system: [
      request.system,
      "Available tools:",
      JSON.stringify(request.tools),
      "Choose a tool only when useful. If no tool is needed, omit tool and return assistantMessage.",
    ].join("\n"),
    contents: geminiContents(request, shape, request.user),
  });

  if (!ok) {
    return {
      intent: "google_ai_error",
      assistantMessage:
        "Mình chưa gọi được Google AI API. Server sẽ fallback sang mock routing.",
      raw,
    };
  }

  const parsed = parseJsonText(text, {
    intent: "small_talk_or_help",
    assistantMessage: text || "Mình chưa hiểu rõ yêu cầu.",
  });
  return { ...parsed, tool: normalizeToolName(parsed.tool), raw };
}

async function callGoogleAIFinalResponse({ env, request }) {
  const shape = '{"assistantMessage":"...","cards":[]}';
  const { ok, raw, text } = await callGeminiJson({
    env,
    system: request.system,
    contents: geminiContents(request, shape, request.user),
  });

  if (!ok) {
    return {
      assistantMessage: "",
      cards: [],
      error: { code: "google_ai_final_failed", raw },
    };
  }

  return {
    ...parseJsonText(text, { assistantMessage: text, cards: [] }),
    raw,
  };
}

async function callOpenAIForToolSelection({ env, request }) {
  const model = env.OPENAI_MODEL || "gpt-4.1-mini";
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        { role: "system", content: request.system },
        ...historyMessages(request),
        {
          role: "user",
          content: [
            "Return only JSON with shape:",
            '{"intent":"...","tool":"...","arguments":{...},"assistantMessage":"...","cards":[]}',
            JSON.stringify(request.user),
          ].join("\n"),
        },
      ],
      tools: request.tools,
      tool_choice: "auto",
    }),
  });

  const raw = await response.json();
  if (!response.ok) {
    return {
      intent: "openai_error",
      assistantMessage:
        "Mình chưa gọi được OpenAI API. Server sẽ dùng mock routing.",
      raw,
    };
  }

  const functionCall = (raw.output || []).find(
    (item) => item.type === "function_call",
  );
  if (functionCall) {
    return {
      intent: normalizeToolName(functionCall.name),
      tool: normalizeToolName(functionCall.name),
      arguments: JSON.parse(functionCall.arguments || "{}"),
      raw,
    };
  }

  const text = extractOutputText(raw);
  try {
    const parsed = JSON.parse(text);
    return { ...parsed, tool: normalizeToolName(parsed.tool), raw };
  } catch {
    return {
      intent: "small_talk_or_help",
      assistantMessage: text || "Mình chưa hiểu rõ yêu cầu.",
      raw,
    };
  }
}

async function callOpenAIFinalResponse({ env, request }) {
  const model = env.OPENAI_MODEL || "gpt-4.1-mini";
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        { role: "system", content: request.system },
        ...historyMessages(request),
        {
          role: "user",
          content: [
            "Return only JSON with shape:",
            '{"assistantMessage":"...","cards":[]}',
            JSON.stringify(request.user),
          ].join("\n"),
        },
      ],
    }),
  });

  const raw = await response.json();
  if (!response.ok) {
    return {
      assistantMessage: "",
      cards: [],
      error: { code: "openai_final_failed", raw },
    };
  }

  const text = extractOutputText(raw);
  try {
    return { ...JSON.parse(text), raw };
  } catch {
    return {
      assistantMessage: text,
      cards: [],
      raw,
    };
  }
}

module.exports = {
  callGoogleAIForToolSelection,
  callGoogleAIFinalResponse,
  callOpenAIForToolSelection,
  callOpenAIFinalResponse,
  normalizeToolName,
};
