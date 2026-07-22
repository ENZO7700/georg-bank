type ProcessPaymentPayload = {
  transactionId: string
  senderId: string
  recipientId?: string | null
  amount: string
  description?: string
}

export function triggerProcessPaymentWebhook(payload: ProcessPaymentPayload) {
  try {
    const baseUrl = process.env.BETTER_AUTH_URL || 'http://localhost:3030'
    fetch(`${baseUrl}/api/webhooks/process-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transactionId: payload.transactionId,
        senderId: payload.senderId,
        recipientId: payload.recipientId ?? null,
        amount: payload.amount,
        description: payload.description,
      }),
    }).catch((err) => console.error('Background worker trigger failed:', err))
  } catch (e) {
    console.error('Failed to initiate background task:', e)
  }
}