// @ts-ignore `.open-next/worker.ts` is generated at build time
import { default as handler } from './.open-next/worker.js'

export default {
  fetch: handler.fetch
  // async scheduled(controller: ScheduledController, env: CloudflareEnv, ctx: ExecutionContext) {
  //   // You can run different tasks based on the cron expression here
  //   switch (controller.cron) {
  //     case '*/3 * * * *':
  //       // Runs every three minutes
  //       // eslint-disable-next-line no-console
  //       console.log('cron processed for:', controller.scheduledTime)
  //       break
  //     case '*/10 * * * *':
  //       // Runs every ten minutes
  //       // eslint-disable-next-line no-console
  //       console.log('cron processed for:', controller.scheduledTime)
  //       break
  //     case '*/45 * * * *':
  //       // Runs every forty-five minutes
  //       // eslint-disable-next-line no-console
  //       console.log('cron processed for:', controller.scheduledTime)
  //       break
  //   }
  // }
} satisfies ExportedHandler<CloudflareEnv>

// // @ts-ignore `.open-next/worker.ts` is generated at build time
// export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from './.open-next/worker.js'
// export { Counter } from './durable/counter.js'
