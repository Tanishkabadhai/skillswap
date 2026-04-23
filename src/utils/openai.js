const OPENAI_API_URL = "https://api.openai.com/v1/responses";

const getOpenAIConfig = () => ({
  apiKey: process.env.OPENAI_API_KEY || "",
  model: process.env.OPENAI_MODEL || "gpt-4o-mini"
});

const hasOpenAI = () => Boolean(getOpenAIConfig().apiKey);

const extractOutputText = (data) => {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  if (Array.isArray(data.output)) {
    return data.output
      .flatMap((item) => item.content || [])
      .filter((item) => item.type === "output_text" && item.text)
      .map((item) => item.text)
      .join("\n")
      .trim();
  }

  return "";
};

const createResponse = async ({ instructions, input }) => {
  const { apiKey, model } = getOpenAIConfig();
  if (!apiKey) {
    throw new Error("OpenAI API key is not configured.");
  }

  const modelsToTry = [model, "gpt-4o-mini", "gpt-4.1-mini"].filter(
    (value, index, array) => value && array.indexOf(value) === index
  );

  let lastError = "OpenAI request failed.";

  for (const currentModel of modelsToTry) {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: currentModel,
        instructions,
        input
      })
    });

    const data = await response.json();
    if (response.ok) {
      return extractOutputText(data);
    }

    lastError = data.error?.message || lastError;
  }

  throw new Error(lastError);
};

module.exports = {
  hasOpenAI,
  createResponse
};
