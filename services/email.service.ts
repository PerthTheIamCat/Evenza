type JoinEventEmailRequest = {
  recipientEmail: string;
  eventTitle: string;
  eventDate?: string;
  eventLocation?: string;
  organizerEmail?: string;
};

type CancellationEmailRequest = {
  recipients: string[];
  eventTitle: string;
  eventDate?: string;
  eventLocation?: string;
  organizerEmail?: string;
};

const getEmailApiBaseUrl = () =>
  process.env.EXPO_PUBLIC_EMAIL_API_URL?.replace(/\/$/, "");

export async function sendJoinEventEmail(payload: JoinEventEmailRequest) {
  const baseUrl = getEmailApiBaseUrl();

  if (!baseUrl) {
    console.warn(
      "EXPO_PUBLIC_EMAIL_API_URL is not defined. Skipping join event email.",
    );
    return;
  }

  try {
    const response = await fetch(`${baseUrl}/email/join`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const message = await response.text();
      console.warn(
        `Failed to send join event email. Status: ${response.status}. Message: ${message}`,
      );
    }
  } catch (error) {
    console.warn("Unable to send join event email", error);
  }
}

export async function sendEventCancellationEmail(
  payload: CancellationEmailRequest,
) {
  const baseUrl = getEmailApiBaseUrl();

  if (!baseUrl) {
    console.warn(
      "EXPO_PUBLIC_EMAIL_API_URL is not defined. Skipping cancellation emails.",
    );
    return;
  }

  if (!payload.recipients || payload.recipients.length === 0) {
    return;
  }

  try {
    const response = await fetch(`${baseUrl}/email/cancellation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const message = await response.text();
      console.warn(
        `Failed to send cancellation email. Status: ${response.status}. Message: ${message}`,
      );
    }
  } catch (error) {
    console.warn("Unable to send cancellation email", error);
  }
}
