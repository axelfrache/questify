#!/bin/sh
set -e

cat > /tmp/config.js << JSEOF
window.__QUESTIFY_CONFIG__ = {
  oidcIssuerUrl: "${OIDC_ISSUER_URL:-}",
  oidcClientId: "${OIDC_CLIENT_ID:-}",
  oidcRedirectUri: "${OIDC_REDIRECT_URI:-}",
  oidcScopes: "${OIDC_SCOPES:-openid profile email roles}"
};
JSEOF

resolver_ip=$(awk '/^nameserver/{print $2; exit}' /etc/resolv.conf)
sed -i "s/^\(\s*resolver\) .*/\1 ${resolver_ip} valid=10s ipv6=off;/" /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
