FROM dxflrs/garage:v1.3.1 AS garage-bin
FROM alpine:3.21
RUN addgroup -g 1000 garage && adduser -u 1000 -G garage -s /bin/sh -D garage
COPY --from=garage-bin /garage /usr/local/bin/garage
USER garage
