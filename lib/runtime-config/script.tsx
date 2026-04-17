import { getRuntimeConfig } from './get'
import { RUNTIME_CONFIG_WINDOW_KEY } from './types'

/**
 * Server component that emits an inline <script> setting `window[RUNTIME_CONFIG_WINDOW_KEY]`
 * before the React bundle loads. Must be rendered inside <body> near the top of the tree so
 * the assignment runs before any client component reads runtime config during hydration.
 */
export const RuntimeConfigScript = () => {
  const config = getRuntimeConfig()
  const serialized = JSON.stringify(config).replace(/</g, '\\u003c')

  return (
    <script
      id="runtime-config"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{
        __html: `window[${JSON.stringify(RUNTIME_CONFIG_WINDOW_KEY)}]=${serialized};`,
      }}
    />
  )
}
