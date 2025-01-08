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

export const handler = async (event) => {
  console.log({ event });
  const body = JSON.parse(event.body || "{}");
  const text = body.text;
  console.log(text);
  const result = await correctGrammar(text);

  return {
    statusCode: 200,
    body: JSON.stringify(result),
  };
};

// Function to correct grammar using Bedrock
const correctGrammar = async (text) => {
  const promptText = buildPromptText(text);
  const correctedText = await bedrockQuery(promptText);
  return correctedText;
};

// Build the prompt text for grammatical correction
const buildPromptText = (text) => {
  return `Please correct the grammar of the following text: ${text}`;
};

const bedrockClient = new BedrockRuntimeClient({ region: "us-west-2" });

const bedrockQuery = async (promptText) => {
  const modelId = "anthropic.claude-3-sonnet-20240229-v1:0";
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
    console.log({ CompleteBedRockeRes: finalOutput });
    return finalOutput.content[0].text;
  } catch (error) {
    console.error(`Error querying Bedrock service: ${error}`);
    return "";
  }
};
