FROM dxflrs/garage:v1.3.1 AS garage-bin
FROM alpine:3.21
COPY --from=garage-bin /garage /usr/local/bin/garage
