const DEFAULT_REPO = 'atra-consulting/coding-with-ai-lab';

/**
 * Fires a GitHub repository_dispatch event.
 * GitHub returns 204 No Content on success.
 */
export async function dispatchWorkflow(
  eventType: string,
  clientPayload: Record<string, unknown>,
): Promise<void> {
  const token = process.env['GH_DISPATCH_TOKEN'];
  if (!token) {
    throw new Error('GH_DISPATCH_TOKEN is not set — cannot dispatch GitHub workflow');
  }

  const repo = process.env['GH_DISPATCH_REPO'] ?? DEFAULT_REPO;
  const url = `https://api.github.com/repos/${repo}/dispatches`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      event_type: eventType,
      client_payload: clientPayload,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `GitHub dispatch failed: HTTP ${response.status} — ${text}`,
    );
  }
}
