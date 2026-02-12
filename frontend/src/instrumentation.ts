import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';
import { UserInteractionInstrumentation } from '@opentelemetry/instrumentation-user-interaction';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

if (import.meta.env.VITE_OTEL_ENABLED === 'true') {
    const provider = new WebTracerProvider({
        resource: resourceFromAttributes({
            [SemanticResourceAttributes.SERVICE_NAME]: 'questify-frontend',
        }),
    });

    const exporter = new OTLPTraceExporter({
        url: import.meta.env.VITE_OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
    });

    // @ts-ignore - addSpanProcessor might be missing in type definition in some versions but exists in runtime or class
    provider.addSpanProcessor(new BatchSpanProcessor(exporter));

    provider.register({
        contextManager: new ZoneContextManager(),
    });

    registerInstrumentations({
        instrumentations: [
            new FetchInstrumentation({
                propagateTraceHeaderCorsUrls: [/\/api\//, new RegExp(location.hostname)],
                ignoreUrls: [/\/@vite\//, /hot-update/i, /\/assets\/.*\.(js|css)/, /\/favicon\.ico/, /\.(png|svg|css)$/i],
            }),
            new UserInteractionInstrumentation(),
            new DocumentLoadInstrumentation(),
        ],
    });

    console.log('OpenTelemetry instrumentation initialized');
}
