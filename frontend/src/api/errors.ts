// Turns an error body from the backend into one sentence for the user.
// FastAPI sends `{detail: "..."}` for our own errors and `{detail: [{msg}]}` for invalid input.
export function errorText(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'detail' in error) {
    const { detail } = error
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) {
      const first: unknown = detail[0]
      if (typeof first === 'object' && first !== null && 'msg' in first) return String(first.msg)
    }
  }
  return 'Something went wrong. Please try again.'
}
