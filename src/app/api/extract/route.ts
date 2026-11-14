import { ExtractedPlanSchema } from "@/lib/domain/plan";
import { toExtractedPlan } from "@/lib/extract/normalize";
import { ExtractError, readPlanFromPdf } from "@/lib/extract/openai";

/**
 * POST /api/extract
 *
 * Request:  multipart/form-data with one field `file` (an SBC PDF, max 10 MB).
 * Response: 200 { plan: ExtractedPlan, warnings: WarningPath[] }
 *           4xx/5xx { error: string, message: string }
 *
 * `warnings` lists ExtractedPlan field paths ("deductible.family",
 * "services.imaging", ...) that the document did not contain or the model was
 * unsure about. Those fields hold a placeholder and must be confirmed by the
 * user on the review screen.
 *
 * The model only reads numbers out of the document. All cost math lives in
 * src/lib/calc and never touches the model.
 */
export const maxDuration = 120;

const MAX_BYTES = 10 * 1024 * 1024;

const fail = (status: number, error: string, message: string) =>
  Response.json({ error, message }, { status });

const STATUS_BY_CODE: Record<ExtractError["code"], number> = {
  unreadable_document: 422,
  model_busy: 503,
  model_timeout: 504,
  model_unavailable: 502,
};

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");

  if (!(file instanceof File)) {
    return fail(400, "bad_request", "Attach the plan's SBC as a PDF in the `file` field.");
  }
  if (file.type !== "application/pdf") {
    return fail(415, "unsupported_file", "Only PDF files are supported.");
  }
  if (file.size > MAX_BYTES) {
    return fail(413, "file_too_large", "The PDF must be 10 MB or smaller.");
  }
  if (!process.env.OPENAI_API_KEY) {
    return fail(
      500,
      "not_configured",
      "The document reader is not set up on this server. Enter the numbers by hand and continue.",
    );
  }

  let raw;
  try {
    raw = await readPlanFromPdf(file);
  } catch (error) {
    if (error instanceof ExtractError) {
      return fail(STATUS_BY_CODE[error.code], error.code, error.message);
    }
    throw error;
  }

  if (!raw.isSbc) {
    return fail(
      422,
      "not_an_sbc",
      "This file does not look like a health plan's Summary of Benefits and Coverage. Upload the SBC, or enter the numbers by hand.",
    );
  }

  const { plan, warnings } = toExtractedPlan(raw, file.name.replace(/\.pdf$/i, ""));
  const checked = ExtractedPlanSchema.safeParse(plan);
  if (!checked.success) {
    return fail(
      502,
      "invalid_extraction",
      "We could not read this plan reliably. Enter the numbers by hand and continue.",
    );
  }

  return Response.json({ plan: checked.data, warnings });
}
