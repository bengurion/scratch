#!/bin/bash

# Generate self-signed SSL certificates for Scratch WWW Docker container
# This enables HTTPS access which is required for microphone functionality

echo "Generating self-signed SSL certificates for Scratch WWW..."

# Create a configuration file for the certificate
cat > ssl.conf << EOF
[req]
distinguished_name = req_distinguished_name
x509_extensions = v3_req
prompt = no

[req_distinguished_name]
C = US
ST = MA
L = Cambridge
O = Scratch Foundation
OU = Development
CN = scratch-www

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = scratch-www
DNS.3 = *.local
IP.1 = 127.0.0.1
IP.2 = 0.0.0.0
IP.3 = 192.168.1.1
IP.4 = 192.168.1.100
IP.5 = 192.168.1.101
IP.6 = 192.168.1.102
IP.7 = 192.168.1.103
IP.8 = 192.168.1.104
IP.9 = 192.168.1.105
IP.10 = 10.0.0.1
IP.11 = 172.17.0.1
EOF

# Generate private key
openssl genrsa -out server.key 2048

# Generate certificate signing request
openssl req -new -key server.key -out server.csr -config ssl.conf

# Generate self-signed certificate
openssl x509 -req -days 365 -in server.csr -signkey server.key -out server.crt -extensions v3_req -extfile ssl.conf

# Clean up
rm server.csr ssl.conf

echo "SSL certificates generated successfully!"
echo "Files created:"
echo "  - server.key (private key)"
echo "  - server.crt (certificate)"
echo ""
echo "Note: You'll need to accept the security warning in your browser when accessing via HTTPS"
echo "since this is a self-signed certificate."