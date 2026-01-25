import type {
  EmbeddingFunction,
  ChromaClient,
} from "chromadb";
import * as E from "fp-ts/Either"
import { sequenceS } from "fp-ts/lib/Apply";
import { pipe } from "fp-ts/lib/function";
import * as P from "fp-ts/Predicate"
import * as O from "fp-ts/Option"

const isString: P.Predicate<any> = (v) => typeof v === "string";

const isPositiveNumber: P.Predicate<any> = (v) =>
  typeof v === "number" && v > 0;

const isNonNegativeNumber: P.Predicate<any> = (v) =>
  typeof v === "number" && v >= 0;

const isFunction: P.Predicate<any> = (v) => typeof v === "function";

/**
 * Validates a required field.
 * Returns Left if value is undefined/null or fails predicate.
 */
const validateRequiredField = <T>(predicate: P.Predicate<T>) => (name: keyof OpenAIEmbeddingConfig) => (value: T) =>
  pipe(
    E.fromNullable(new Error(`${name} is required`))(value), // fail if undefined/null
    E.chain((v: T) => E.fromPredicate(predicate, () => new Error(`${name} is invalid`))(v))
  );

/**
 * Validates an optional field.
 * Returns Right(value) if value is undefined/null.
 * Returns Left if value is defined but fails predicate.
 */
const validateOptionalField = <T>(predicate: P.Predicate<T>) => (name: keyof OpenAIEmbeddingConfig) => (value: T) =>
pipe(
    O.fromNullable(value),
    O.match(
        ()=>{
            return E.right(value);
        },
        (val: T)=>{
            return E.fromPredicate(predicate, () => new Error(`${name} is invalid`))(val);
        }
    )
)

/**
 * Validates if a field can be modified.
 * Returns Left if value cant be modified
 */
const validateFieldUpdate = <T>(name: keyof OpenAIEmbeddingConfig) => (value: T) => {
    return pipe(
        O.fromNullable(value),
        O.match(
            ()=> E.right(value),
            ()=> E.left(new Error(`Updating ${name} is not allowed`))
        )
    )
}

interface OpenAIEmbeddingConfig {
  aiServiceUrl: string;
  model: string;
  encodingFormat: string;
  chunkSize: number;
  chunkOverlap: number;
  chunkStrategy: string;
  splitter: (text: string) => string[];
}

export class OpenAIEmbeddingFunction implements EmbeddingFunction {
  name = "openai-embedding-with-chunking";

  private config!: OpenAIEmbeddingConfig;

  constructor(config?: OpenAIEmbeddingConfig) {
    if (config) {
      this.validateConfig(config);
      this.config = config;
    }
  }

  async generate(texts: string[]): Promise<number[][]> {
    // 1. Split all texts into chunks
    const chunks: string[] = [];

    for (const text of texts) {
      const split = this.config.splitter(text);
      chunks.push(...split);
    }

    // 2. Batch embedding calls
    const embeddings: number[][] = [];

    for (let i = 0; i < chunks.length; i += this.config.chunkSize) {
      const batch = chunks.slice(i, i + this.config.chunkSize);

      const response = await fetch(this.config.aiServiceUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.config.model,
          input: batch,
          encoding_format: this.config.encodingFormat,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Embedding request failed: ${response.status} ${response.statusText}`
        );
      }

      const json = await response.json();
      embeddings.push(...json.data.map((d: any) => d.embedding));
    }

    return embeddings;
  }

  async generateForQueries(texts: string[]): Promise<number[][]> {
    return this.generate(texts);
  }

  buildFromConfig(
    config: Record<string, any>,
    _client?: ChromaClient
  ): EmbeddingFunction {
    return new OpenAIEmbeddingFunction(config as OpenAIEmbeddingConfig);
  }

  getConfig(): Record<string, any> {
    return {
      aiServiceUrl: this.config.aiServiceUrl,
      model: this.config.model,
      encodingFormat: this.config.encodingFormat,
      chunkSize: this.config.chunkSize,
      chunkOverlap: this.config.chunkOverlap,
      chunkStrategy: this.config.chunkStrategy,
    };
  }

  validateConfig(config: Record<string, any>): void {
    const seq: {
        [K in keyof OpenAIEmbeddingConfig]: E.Either<Error, OpenAIEmbeddingConfig[K] | undefined>
    } = {
        aiServiceUrl: validateRequiredField(isString)("aiServiceUrl")(config.aiServiceUrl),
        model: validateRequiredField(isString)("model")(config.model),
        encodingFormat: validateOptionalField(isString)("encodingFormat")(config.encodingFormat),
        chunkSize: validateOptionalField(isPositiveNumber)("chunkSize")(config.chunkSize),
        chunkOverlap: validateOptionalField(isNonNegativeNumber)("chunkOverlap")(config.chunkOverlap),
        chunkStrategy: validateOptionalField(isString)("chunkStrategy")(config.chunkStrategy),
        splitter: validateOptionalField(isFunction)("splitter")(config.splitter),
    }
    pipe(
        sequenceS(E.Apply)(seq),
        E.match(
            (err)=>{throw err},
            ()=>{}
        )
    );
    }

  validateConfigUpdate(newConfig: Record<string, any>): void {
    const seq: {
        [K in keyof OpenAIEmbeddingConfig]: E.Either<Error, OpenAIEmbeddingConfig[K] | undefined>
    } = {
    model: validateFieldUpdate<string>("model")(newConfig.model),
    encodingFormat: validateFieldUpdate<string>("encodingFormat")(newConfig.encodingFormat),
    chunkStrategy: validateFieldUpdate<string>("chunkStrategy")(newConfig.chunkStrategy),
    chunkOverlap: validateFieldUpdate<number>("chunkOverlap")(newConfig.chunkOverlap),
    chunkSize: validateOptionalField(isPositiveNumber)("chunkSize")(newConfig.chunkSize),
    aiServiceUrl: validateFieldUpdate<string>("aiServiceUrl")(newConfig.aiServiceUrl),
    splitter: validateOptionalField(isFunction)("splitter")(newConfig.splitter),
  }
  pipe(
    sequenceS(E.Apply)(seq),
    E.match(
      (err) => { throw err },
      () => undefined
    )
  );
  }
}
