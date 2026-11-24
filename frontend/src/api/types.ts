// Short names for the generated backend types. Never write these by hand — they come from
// schema.d.ts, which `make api-types` regenerates from the backend.
import type { components } from './schema'

type Schemas = components['schemas']

export type Me = Schemas['Me']
