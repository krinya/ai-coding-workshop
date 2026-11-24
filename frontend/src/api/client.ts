// Typed API client. The types come from the backend, so a backend change that breaks the
// frontend shows up in `make typecheck`. Regenerate them with `make api-types`.
//
//   const { data, error } = await api.GET('/api/health')
//   data?.status  // typed from the FastAPI response model
import createClient from 'openapi-fetch'

import type { paths } from './schema'

export const api = createClient<paths>({ baseUrl: '' })
