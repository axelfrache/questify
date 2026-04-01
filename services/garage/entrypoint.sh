#!/bin/sh

if [ "$(id -u)" -eq 0 ]; then
    mkdir -p /var/lib/garage/meta /var/lib/garage/data
    chown -R 1000:1000 /var/lib/garage
    exec su-exec garage /bin/sh "$0" "$@"
fi

garage -c /etc/garage.toml server &

echo "Waiting for Garage to be ready..."
until garage -c /etc/garage.toml status >/dev/null 2>&1; do
    sleep 2
done

if [ ! -f /var/lib/garage/meta/.setup-done ]; then
    echo "Running initial setup..."

    NODE_ID=$(garage -c /etc/garage.toml node id | awk '{print $1}')
    garage -c /etc/garage.toml layout assign "$NODE_ID" -z dc1 -c 1G || true
    garage -c /etc/garage.toml layout apply --version 1 || true

    garage -c /etc/garage.toml bucket create questify-profiles || true

    garage -c /etc/garage.toml key import \
        --yes \
        -n questify-key \
        "$GARAGE_ACCESS_KEY_ID" \
        "$GARAGE_SECRET_ACCESS_KEY" || true

    garage -c /etc/garage.toml bucket allow \
        --read --write --owner questify-profiles \
        --key questify-key || true

    touch /var/lib/garage/meta/.setup-done
    echo "Garage setup complete"
fi

touch /tmp/garage-ready
wait
