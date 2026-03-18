import type { Mutation, Query, QueryKey } from "@tanstack/react-query";
import { getErrorMessage } from "./errors";

type LogLevel = "info" | "warn" | "error";
type SerializableRecord = Record<string, unknown>;
type ReactQuery = Query<unknown, unknown, unknown, QueryKey>;
type ReactQueryMutation = Mutation<unknown, unknown, unknown, unknown>;

const isDevelopment = process.env.NODE_ENV !== "production";

function getConsoleMethod(level: LogLevel) {
  switch (level) {
    case "warn":
      return console.warn;
    case "error":
      return console.error;
    default:
      return console.info;
  }
}

function truncateValue(value: string, maxLength = 60) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;
}

function formatKeyPart(part: unknown) {
  if (part === null) {
    return "null";
  }

  if (part === undefined) {
    return "undefined";
  }

  if (
    typeof part === "string" ||
    typeof part === "number" ||
    typeof part === "boolean"
  ) {
    return truncateValue(String(part));
  }

  try {
    return truncateValue(JSON.stringify(part));
  } catch {
    return "[unserializable]";
  }
}

export function formatReactQueryKey(key: QueryKey | undefined) {
  if (!key || key.length === 0) {
    return "unknown";
  }

  return key.map((part) => formatKeyPart(part)).join(".");
}

function writeLog(level: LogLevel, message: string, details?: SerializableRecord) {
  if (!isDevelopment) {
    return;
  }

  const log = getConsoleMethod(level);

  if (details && Object.keys(details).length > 0) {
    log(`[app] ${message}`, details);
    return;
  }

  log(`[app] ${message}`);
}

function getErrorDetails(error: unknown): SerializableRecord {
  if (error instanceof Error) {
    const errorWithMetadata = error as Error & {
      code?: string;
      details?: string;
      hint?: string;
      status?: number;
    };

    return {
      code: errorWithMetadata.code,
      details: errorWithMetadata.details,
      hint: errorWithMetadata.hint,
      message: getErrorMessage(error),
      name: error.name,
      status: errorWithMetadata.status,
    };
  }

  return {
    message: getErrorMessage(error),
  };
}

function sanitizeDetails(details: SerializableRecord) {
  return Object.fromEntries(
    Object.entries(details).filter(([, value]) => value !== undefined),
  );
}

function getMutationLabel(mutation: ReactQueryMutation) {
  return formatReactQueryKey(mutation.options.mutationKey);
}

function getQueryLabel(query: ReactQuery) {
  return formatReactQueryKey(query.queryKey);
}

export function logInfo(message: string, details?: SerializableRecord) {
  writeLog("info", message, details);
}

export function logWarn(message: string, details?: SerializableRecord) {
  writeLog("warn", message, details);
}

export function logError(message: string, details?: SerializableRecord) {
  writeLog("error", message, details);
}

export function logReactQueryMutationStart(mutation: ReactQueryMutation) {
  logInfo(`react-query mutation started: ${getMutationLabel(mutation)}`);
}

export function logReactQueryMutationSuccess(mutation: ReactQueryMutation) {
  logInfo(`react-query mutation succeeded: ${getMutationLabel(mutation)}`);
}

export function logReactQueryMutationError(
  mutation: ReactQueryMutation,
  error: unknown,
) {
  logError(
    `react-query mutation failed: ${getMutationLabel(mutation)}`,
    sanitizeDetails({
      failureCount: mutation.state.failureCount,
      ...getErrorDetails(error),
    }),
  );
}

export function logReactQueryQueryError(query: ReactQuery, error: unknown) {
  logError(
    `react-query query failed: ${getQueryLabel(query)}`,
    sanitizeDetails({
      failureCount: query.state.fetchFailureCount,
      ...getErrorDetails(error),
    }),
  );
}
