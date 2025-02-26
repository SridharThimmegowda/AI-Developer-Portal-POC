import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import * as path from "path";
import * as fs from "fs";

interface Event {
  body?: string;
}

interface Body {
  migration_type?: string;
  inspirations_name?: string;
  description?: string;
  steps_to_execute?: string;
  considerations?: string;
  example?: string;
  scripthub_name?: string;
  prerequisites?: string;
  limitations?: string;
  steps_to_run?: string;
  output?: string;
}

export const handler = async (event: Event) => {
  console.log({ event });
  const body: Body = JSON.parse(event.body || "{}");
  const promptText = buildPromptText(body);
  console.log("promptText: ", { promptText });
  const result = await bedrockQuery(promptText);

  return {
    statusCode: 200,
    body: JSON.stringify(result),
  };
};

// Build the prompt text for grammatical correction
const buildPromptText = (body: Body): string => {
  let promptTextFormatted = "";
  if (body.migration_type === "inspiration") {
    const templatePath = path.join(
      "/var/task",
      "prompt-templates",
      `inspiration.txt`
    );

    const templateContent = fs.readFileSync(templatePath, "utf8");

    promptTextFormatted = templateContent
      .replace("{{INSPIRATIONS_NAME}}", body.inspirations_name || "")
      .replace("{{DESCRIPTION}}", body.description || "")
      .replace("{{STEPS_TO_EXECUTE}}", body.steps_to_execute || "")
      .replace("{{CONSIDERATIONS}}", body.considerations || "")
      .replace("{{EXAMPLE}}", body.example || "");
  } else if (body.migration_type === "scripthub") {
    const templatePath = path.join(
      "/var/task",
      "prompt-templates",
      `scripthub.txt`
    );

    const templateContent = fs.readFileSync(templatePath, "utf8");

    promptTextFormatted = templateContent
      .replace("{{SCRIPTHUB_NAME}}", body.scripthub_name || "")
      .replace("{{DESCRIPTION}}", body.description || "")
      .replace("{{PREREQUISITES}}", body.prerequisites || "")
      .replace("{{LIMITATIONS}}", body.limitations || "")
      .replace("{{STEPS_TO_RUN}}", body.steps_to_run || "")
      .replace("{{OUTPUT}}", body.output || "");
  }

  return promptTextFormatted;
};

const bedrockClient = new BedrockRuntimeClient({ region: "us-west-2" });

const bedrockQuery = async (promptText: string): Promise<string> => {
  const modelId = "anthropic.claude-3-opus-20240229-v1:0";
  const requestBody = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 5000,
    temperature: 0,
    messages: [
      {
        role: "user",
        content: [{ type: "text", text: promptText }],
      },
    ],
  };

  try {
    const params = {
      modelId,
      body: JSON.stringify(requestBody),
      accept: "*/*",
      contentType: "application/json",
    };
    console.log(params);
    const command = new InvokeModelCommand(params);
    console.log({ Command: command });
    const response = await bedrockClient.send(command);
    console.log("Response received");
    const responseData = new TextDecoder().decode(response.body);
    const finalOutput = JSON.parse(responseData);
    console.log({ CompleteBedRockeRes: JSON.stringify(finalOutput) });
    return finalOutput.content[0].text;
  } catch (error) {
    console.error(`Error querying Bedrock service: ${error}`);
    return "";
  }
};
