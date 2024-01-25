### Codegen
`yarn codegen`

### Build
`yarn build`

### Authenticate

`graph auth --product hosted-service {key}`

`npx graph auth --product hosted-service gho_CKdr0...UGJ`
`npx graph auth --studio 2416...c54``

### Deploy

`npx graph deploy --product hosted-service lu-derik/arec-port-celo-test`

For Celo Test Net:
`npx graph deploy --product hosted-service lu-derik/arec-port-celo`

For Polygon Mummai Testnet:
`npx graph deploy --product hosted-service lu-derik/arec-port-mumbi`
`npx graph deploy --product hosted-service lu-derik/greenbtc-mumbai-dev`


For Polygon Mainnet:
`npx graph deploy --product hosted-service lu-derik/arec-graph`
`npx graph deploy --studio arec-graph`

`npx graph deploy --studio greenbtc-mumbai-dev`

`npx graph deploy <subgraph-name> --debug-fork <subgraph-id> --ipfs http://localhost:5001 --node http://localhost:8020`