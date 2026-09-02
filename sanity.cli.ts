import { loadEnvConfig } from '@next/env'
import { defineCliConfig } from 'sanity/cli'

loadEnvConfig(__dirname, process.env.NODE_ENV !== 'production', { info: () => null, error: console.error })

export default defineCliConfig({
  api: {
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  },
  // Registered via `sanity deploy --external --url https://sanity-mf-demo.vercel.app/studio`
  // so Canvas / the dashboard's Content Agent can find this embedded studio as
  // an application. Without this, `sanity deploy`/`sanity schemas deploy`
  // prompts for the application id (or creates a duplicate registration).
  deployment: {
    appId: 'uphy9cv0xkgn5qxb5zwgpnf5',
  },
})
