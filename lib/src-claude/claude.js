// export const handler = async (event) => {
//   console.log({ event });
//   return {
//     statusCode: 200,
//     body: JSON.stringify({ message: "Hello World" }),
//   };
// };

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import * as path from "path";
import * as fs from "fs";

export const handler = async (event) => {
  console.log({ event });
  const body = JSON.parse(event.body || "{}");
  const promptText = buildPromptText(body);
  console.log("promptText: ", { promptText });
  const result = await bedrockQuery(promptText);

  return {
    statusCode: 200,
    body: JSON.stringify(result),
  };
};

// Build the prompt text for grammatical correction
const buildPromptText = (body) => {
  const templatePath = path.join("/var/task", "prompt-templates", `V4.txt`);

  const templateContent = fs.readFileSync(templatePath, "utf8");

  const promptTextFormatted = templateContent
    .replace("{{INSPIRATIONS_NAME}}", body.inspirations_name)
    .replace("{{DESCRIPTION}}", body.description)
    .replace("{{STEPS_TO_EXECUTE}}", body.steps_to_execute)
    .replace("{{CONSIDERATIONS}}", body.considerations)
    .replace("{{EXAMPLE}}", body.example);

  return promptTextFormatted;
};

const bedrockClient = new BedrockRuntimeClient({ region: "us-west-2" });

const bedrockQuery = async (promptText) => {
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
