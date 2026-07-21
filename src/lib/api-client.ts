export class ApiClientError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
  }
}

interface ApiErrorBody {
  error?: { message?: string; code?: string };
}

async function parseErrorBody(response: Response): Promise<ApiErrorBody> {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export async function apiFetch<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      ...(init?.body && !(init.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = await parseErrorBody(response);
    throw new ApiClientError(
      body.error?.message ?? "Request failed. Please try again.",
      response.status,
      body.error?.code
    );
  }

  return response.json() as Promise<T>;
}
