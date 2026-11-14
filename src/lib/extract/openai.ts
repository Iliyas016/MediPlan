import OpenAI from "openai";
import { ContentFilterFinishReasonError, LengthFinishReasonError } from "openai/core/error";
import { zodTextFormat } from "openai/helpers/zod";
import { EXTRACTION_INSTRUCTIONS } from "./prompt";
import { ModelPlanSchema, type ModelPlan } from "./schema";

/** Default model; override with OPENAI_MODEL in the environment. */
const DEFAULT_MODEL = "gpt-6.1-sol";

export type ExtractFailure =
  | "model_unavailable"
  | "model_busy"
  | "model_timeout"
  | "unreadable_document";

export class ExtractError extends Error {
  constructor(
    readonly code: ExtractFailure,
    message: string,
  ) {
    super(message);
    this.name = "ExtractError";
  }
}

/**
 * Sends one SBC PDF to the OpenAI Responses API and returns the model's
 * reading of it, already shaped by ModelPlanSchema (strict structured output).
 * Throws ExtractError with a message that can be shown to the user.
 */
export async function readPlanFromPdf(file: File): Promise<ModelPlan> {
  const client = new OpenAI({ timeout: 110_000, maxRetries: 1 });
  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");

  try {
    const response = await client.responses.parse({
      model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
      instructions: EXTRACTION_INSTRUCTIONS,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_file",
              filename: file.name || "plan.pdf",
              file_data: `data:application/pdf;base64,${base64}`,
            },
            {
              type: "input_text",
              text: "Copy this plan's in-network terms into the schema.",
            },
          ],
        },
      ],
      text: { format: zodTextFormat(ModelPlanSchema, "sbc_plan") },
      store: false,
    });

    if (!response.output_parsed) {
      throw new ExtractError(
        "unreadable_document",
        "We could not read this document. Check that it is the plan's Summary of Benefits and Coverage, or enter the numbers by hand.",
      );
    }
    return response.output_parsed;
  } catch (error) {
    throw toExtractError(error);
  }
}

function toExtractError(error: unknown): ExtractError {
  if (error instanceof ExtractError) return error;
  console.error("SBC extraction failed:", error instanceof Error ? error.message : String(error));
  if (error instanceof OpenAI.APIConnectionTimeoutError) {
    return new ExtractError(
      "model_timeout",
      "Reading the document took too long. Try again, or enter the numbers by hand.",
    );
  }
  if (error instanceof OpenAI.RateLimitError) {
    return new ExtractError(
      "model_busy",
      "The document reader is busy right now. Try again in a minute, or enter the numbers by hand.",
    );
  }
  if (error instanceof OpenAI.BadRequestError) {
    return new ExtractError(
      "unreadable_document",
      "This PDF could not be processed. Try another copy of the file, or enter the numbers by hand.",
    );
  }
  if (error instanceof LengthFinishReasonError || error instanceof ContentFilterFinishReasonError) {
    return new ExtractError(
      "unreadable_document",
      "We could not read this document completely. Enter the numbers by hand or try another copy of the file.",
    );
  }
  return new ExtractError(
    "model_unavailable",
    "The document reader is unavailable right now. Enter the numbers by hand and continue.",
  );
}
