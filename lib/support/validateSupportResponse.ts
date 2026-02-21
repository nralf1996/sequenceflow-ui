import type { SupportGenerateResponse } from "@/types/support";

export function validateSupportResponse(
  data: any
): SupportGenerateResponse {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid response: not an object.");
  }

  if (!["DRAFT_OK", "NEEDS_HUMAN"].includes(data.status)) {
    throw new Error("Invalid response: status incorrect.");
  }

  if (typeof data.confidence !== "number") {
    throw new Error("Invalid response: confidence must be number.");
  }

  if (!data.draft || typeof data.draft !== "object") {
    throw new Error("Invalid response: draft missing.");
  }

  if (typeof data.draft.subject !== "string") {
    throw new Error("Invalid response: draft.subject missing.");
  }

  if (typeof data.draft.body !== "string") {
    throw new Error("Invalid response: draft.body missing.");
  }

  if (!Array.isArray(data.actions)) {
    throw new Error("Invalid response: actions must be array.");
  }

  if (!Array.isArray(data.reasons)) {
    throw new Error("Invalid response: reasons must be array.");
  }

  return data as SupportGenerateResponse;
}
