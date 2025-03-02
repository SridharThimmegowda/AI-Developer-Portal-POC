import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import * as path from "path";
import * as fs from "fs";
import AWS from "aws-sdk"; // Add this import statement

const bedrockClient = new BedrockRuntimeClient({ region: "us-west-2" });

export const handler = async (event) => {
  console.log({ event });

  const { requestContext, body: requestBody } = event;
  const { routeKey, connectionId } = requestContext;
  const websocketEndpoint =
    event.requestContext.domainName + "/" + event.requestContext.stage;

  switch (routeKey) {
    case "$connect":
      return { statusCode: 200, body: "Connected." };

    case "$disconnect":
      return { statusCode: 200, body: "Disconnected." };

    default:
      const body = JSON.parse(requestBody || "{}");
      const promptText = buildPromptText(body);
      console.log("promptText: ", { promptText });
      const result = await bedrockQuery(promptText);

      // Send the response back to the WebSocket client
      await sendMessageToClient(connectionId, result, websocketEndpoint);

      return {
        statusCode: 200,
        body: JSON.stringify(result),
      };
  }
};

// Build the prompt text for grammatical correction
const buildPromptText = (body) => {
  let promptTextFormatted = "";
  if (body.migration_type === "inspiration") {
    const templatePath = path.join(
      "/var/task",
      "prompt-templates",
      `inspiration.txt`
    );

    const templateContent = fs.readFileSync(templatePath, "utf8");

    promptTextFormatted = templateContent
      .replace("{{INSPIRATIONS_NAME}}", body.inspirations_name)
      .replace("{{DESCRIPTION}}", body.description)
      .replace("{{STEPS_TO_EXECUTE}}", body.steps_to_execute)
      .replace("{{CONSIDERATIONS}}", body.considerations)
      .replace("{{EXAMPLE}}", body.example);
  } else if (body.migration_type === "scripthub") {
    const templatePath = path.join(
      "/var/task",
      "prompt-templates",
      `scripthub.txt`
    );

    const templateContent = fs.readFileSync(templatePath, "utf8");

    promptTextFormatted = templateContent
      .replace("{{SCRIPTHUB_NAME}}", body.scripthub_name)
      .replace("{{DESCRIPTION}}", body.description)
      .replace("{{PREREQUISITES}}", body.prerequisites)
      .replace("{{LIMITATIONS}}", body.limitations)
      .replace("{{STEPS_TO_RUN}}", body.steps_to_run)
      .replace("{{OUTPUT}}", body.output);
  }

  return promptTextFormatted;
};

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

const sendMessageToClient = async (
  connectionId,
  message,
  websocketEndpoint
) => {
  const apiGatewayManagementApi = new AWS.ApiGatewayManagementApi({
    apiVersion: "2018-11-29",
    endpoint: websocketEndpoint,
  });

  const params = {
    ConnectionId: connectionId,
    Data: message, //JSON.stringify({ message }),
  };

  try {
    await apiGatewayManagementApi.postToConnection(params).promise();
  } catch (error) {
    console.error(`Error sending message to client: ${error}`);
    if (error.code === "GoneException") {
      console.error("The connection is no longer available.");
    } else if (error.code === "LimitExceededException") {
      console.error("The rate limit has been exceeded.");
    } else if (error.code === "EndpointRequestTimeout") {
      console.error("The endpoint request timed out.");
    }
  }
};
