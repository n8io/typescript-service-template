/* v8 ignore start */
import { context } from '@opentelemetry/api'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { AsyncHooksContextManager } from '@opentelemetry/context-async-hooks'
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg'
import { ConsoleMetricExporter, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node'

const contextManager = new AsyncHooksContextManager()

context.setGlobalContextManager(contextManager.enable())

const sdk = new NodeSDK({
  instrumentations: [getNodeAutoInstrumentations(), new PgInstrumentation()],
  metricReader: new PeriodicExportingMetricReader({
    exporter: new ConsoleMetricExporter(),
  }),
  traceExporter: new ConsoleSpanExporter(),
})

sdk.start()
