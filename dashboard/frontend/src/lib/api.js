const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok) {
    const message =
      payload?.error?.message ||
      payload?.error ||
      payload?.message ||
      `The request failed with status ${response.status}.`;
    throw new Error(message);
  }

  return payload;
}

export async function getHealth() {
  const response = await fetch(`${API_BASE}/health`);
  return parseResponse(response);
}

export async function getModelCard() {
  const response = await fetch(`${API_BASE}/model-card`);
  return parseResponse(response);
}

export async function analyzeVideo(file, includeGradcam = true) {
  const form = new FormData();
  form.append("file", file);
  form.append("include_gradcam", String(includeGradcam));

  const response = await fetch(`${API_BASE}/analyze`, {
    method: "POST",
    body: form,
  });

  const payload = await parseResponse(response);

  if (payload?.record_type !== "live_video_evidence") {
    throw new Error("The backend returned an unexpected analysis record.");
  }

  return payload;
}
