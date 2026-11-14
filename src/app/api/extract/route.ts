import { ExtractedPlanSchema } from "@/lib/domain/plan";

/**
 * POST /api/extract
 *
 * Request:  multipart/form-data with one field `file` (an SBC PDF, max 10 MB).
 * Response: 200 { plan: ExtractedPlan, warnings: string[] }
 *           4xx/5xx { error: string, message: string }
 *
 * The model only reads numbers out of the document. All cost math lives in
 * src/lib/calc and never touches the model.
 *
 * TODO(extraction lane): send the PDF to the OpenAI API with a JSON schema
 * built from ExtractedPlanSchema, validate the answer with
 * ExtractedPlanSchema.safeParse, and return fields the model was unsure
 * about in `warnings` so the user can confirm them on the review screen.
 */
export const maxDuration = 60;

const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");

  if (!(file instanceof File)) {
    return Response.json(
      { error: "bad_request", message: "Attach the plan's SBC as a PDF in the `file` field." },
      { status: 400 },
    );
  }
  if (file.type !== "application/pdf") {
    return Response.json(
      { error: "unsupported_file", message: "Only PDF files are supported." },
      { status: 415 },
    );
  }
  if (file.size > MAX_BYTES) {
    return Response.json(
      { error: "file_too_large", message: "The PDF must be 10 MB or smaller." },
      { status: 413 },
    );
  }
  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      { error: "not_configured", message: "OPENAI_API_KEY is not set on the server." },
      { status: 500 },
    );
  }

  // Keeps the contract visible to the frontend until extraction is wired up.
  void ExtractedPlanSchema;
  return Response.json(
    { error: "not_implemented", message: "SBC extraction is not wired up yet." },
    { status: 501 },
  );
}
