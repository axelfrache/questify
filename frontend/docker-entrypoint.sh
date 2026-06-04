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

exec nginx -g 'daemon off;'
