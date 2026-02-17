import { AzureOpenAI } from "openai";

const globalForAzure = globalThis as unknown as {
  azureOpenAI: AzureOpenAI | undefined;
};

function createClient() {
  return new AzureOpenAI({
    endpoint: process.env.AZURE_OPENAI_ENDPOINT!,
    apiKey: process.env.AZURE_OPENAI_API_KEY!,
    apiVersion: process.env.AZURE_OPENAI_API_VERSION!,
    deployment: process.env.AZURE_OPENAI_DEPLOYMENT!,
  });
}

export const azureOpenAI =
  globalForAzure.azureOpenAI ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForAzure.azureOpenAI = azureOpenAI;
}
