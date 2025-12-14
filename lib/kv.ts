import { getCloudflareContext } from '@opennextjs/cloudflare'

export const createKV = () => getCloudflareContext().env.SEO_CHECKER_KV
