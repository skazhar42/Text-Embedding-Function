import { describe, it, expect } from "vitest";
import { OpenAIEmbeddingFunction } from "./embedding-function";

const validConfig = {
  aiServiceUrl: "https://example.com/embeddings",
  model: "text-embedding-3-large",
  encodingFormat: "float",
  chunkSize: 64,
  chunkOverlap: 10,
  chunkStrategy: "token",
  splitter: (text: string) => [text],
};

describe("buildFromConfig", () => {
  it("should build a new OpenAIEmbeddingFunction from config", () => {
    const embedding = new OpenAIEmbeddingFunction();

    const built = embedding.buildFromConfig(validConfig);

    expect(built).toBeInstanceOf(OpenAIEmbeddingFunction);
  });

  it("should throw if config is invalid", () => {
    const embedding = new OpenAIEmbeddingFunction();

    expect(() =>
      embedding.buildFromConfig({
        ...validConfig,
        model: 123, // invalid
      })
    ).toThrow("model is invalid");
  });
});

describe("getConfig", () => {
  it("should return persisted config values", () => {
    const embedding = new OpenAIEmbeddingFunction(validConfig);

    const config = embedding.getConfig();

    expect(config).toEqual({
      aiServiceUrl: validConfig.aiServiceUrl,
      model: validConfig.model,
      encodingFormat: validConfig.encodingFormat,
      chunkSize: validConfig.chunkSize,
      chunkOverlap: validConfig.chunkOverlap,
      chunkStrategy: validConfig.chunkStrategy,
    });
  });
});

describe("validateConfig", () => {
  it("should not throw for a valid config", () => {
    const embedding = new OpenAIEmbeddingFunction();

    expect(() => embedding.validateConfig(validConfig)).not.toThrow();
  });

  it("should throw if a required field is missing", () => {
    const embedding = new OpenAIEmbeddingFunction();

    expect(() =>
      embedding.validateConfig({
        ...validConfig,
        aiServiceUrl: undefined,
      })
    ).toThrow("aiServiceUrl is required");
  });

  it("should throw if a field has an invalid type", () => {
    const embedding = new OpenAIEmbeddingFunction();

    expect(() =>
      embedding.validateConfig({
        ...validConfig,
        chunkSize: -1,
      })
    ).toThrow("chunkSize is invalid");
  });

  it("should throw if splitter is not a function", () => {
    const embedding = new OpenAIEmbeddingFunction();

    expect(() =>
      embedding.validateConfig({
        ...validConfig,
        splitter: "not-a-function",
      })
    ).toThrow("splitter is invalid");
  });
});

describe("validateConfigUpdate", () => {
  it("should allow valid updates to chunkSize", () => {
    const embedding = new OpenAIEmbeddingFunction(validConfig);

    expect(() =>
      embedding.validateConfigUpdate({
        chunkSize: 128,
      })
    ).not.toThrow();
  });

  it("should allow valid updates to splitter", () => {
    const embedding = new OpenAIEmbeddingFunction(validConfig);

    expect(() =>
      embedding.validateConfigUpdate({
        splitter: (text: string) => text.split(" "),
      })
    ).not.toThrow();
  });

  it("should throw when updating model", () => {
    const embedding = new OpenAIEmbeddingFunction(validConfig);

    expect(() =>
      embedding.validateConfigUpdate({
        model: "new-model",
      })
    ).toThrow("Updating model is not allowed");
  });

  it("should throw when updating encodingFormat", () => {
    const embedding = new OpenAIEmbeddingFunction(validConfig);

    expect(() =>
      embedding.validateConfigUpdate({
        encodingFormat: "int8",
      })
    ).toThrow("Updating encodingFormat is not allowed");
  });

  it("should throw when updating chunkStrategy", () => {
    const embedding = new OpenAIEmbeddingFunction(validConfig);

    expect(() =>
      embedding.validateConfigUpdate({
        chunkStrategy: "sentence",
      })
    ).toThrow("Updating chunkStrategy is not allowed");
  });

  it("should throw when chunkSize update is invalid", () => {
    const embedding = new OpenAIEmbeddingFunction(validConfig);

    expect(() =>
      embedding.validateConfigUpdate({
        chunkSize: -10,
      })
    ).toThrow("chunkSize is invalid");
  });

  it("should ignore undefined fields", () => {
    const embedding = new OpenAIEmbeddingFunction(validConfig);

    expect(() =>
      embedding.validateConfigUpdate({
        chunkSize: undefined,
        model: undefined,
      })
    ).not.toThrow();
  });
});

