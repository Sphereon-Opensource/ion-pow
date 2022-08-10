<h1 align="center">
  <br>
  <a href="https://www.sphereon.com"><img src="https://sphereon.com/content/themes/sphereon/assets/img/logo.svg" alt="Sphereon" width="400"></a>
  <br>ION Proof of Work
  <br>
</h1>

[![CI](https://github.com/Sphereon-Opensource/ion-pow/actions/workflows/main.yaml/badge.svg)](https://github.com/Sphereon-Opensource/ion-pow/actions/workflows/main.yaml)  [![codecov](https://codecov.io/gh/Sphereon-Opensource/ion-pow/branch/develop/graph/badge.svg)](https://codecov.io/gh/Sphereon-Opensource/ion-pow) [![NPM Version](https://img.shields.io/npm/v/@sphereon/ion-pow.svg)](https://npm.im/@sphereon/ion-pow)

### ION-pow
The ION Proof of Work client allows to submit ION create, update and delete requests to an ION node which is using a
challenge response system.

The IonPoW object will get the challenge from an IoN node, solve the challenge, and submit the request for you.


It can be used with [@decentralized-identity/ION-SDK](https://github.com/decentralized-identity/ion-sdk)
and [Veramo's DID ION Provider](https://github.com/uport-project/veramo)

This project is based on [ion-pow-sdk](https://github.com/isaacJChen/ion-pow-sdk), but refactored, using Typescript and tested.

````typescript

import {IonPoW} from '@sphereon/ion-pow'

const request =
    '{"type":"create","suffixData":{"deltaHash":"EiDDJlgKebcp0_HrRrZj9A_8v0YBKRJHG5EGeQMmho0mUA","recoveryCommitment":"EiArC3NQTIvxYAm2_FGQMQMq_d_48tlBegDo6XbvFLoemw"},"delta":{"updateCommitment":"EiB2CU2JHjzNMFo06ab-FLotoB5ve_c3wYskDvm5sf8z1Q","patches":[{"action":"replace","document":{"publicKeys":[{"id":"did1-test","type":"EcdsaSecp256k1VerificationKey2019","publicKeyJwk":{"kty":"EC","crv":"secp256k1","x":"6eRI9ckwdZjr6vs-1CBS-HlEtDY41fTuWBg-CViTc_Y","y":"Xu6d7wi_fKqaBGZBlui1GoSuxdjEdcfk0C3E88_dLOo"},"purposes":["authentication","assertionMethod"]},{"id":"did2-test","type":"EcdsaSecp256k1VerificationKey2019","publicKeyJwk":{"kty":"EC","crv":"secp256k1","x":"vVImkG7In_evljP-ZvbkqMKviGWlQ1l_4GbQvI_UdZ8","y":"ClZmXtTFnDdARDtsMe50z1ge7nB7yyoyIDaOI5ODPDU"},"purposes":["keyAgreement"]}],"services":[{"id":"bar","type":"LinkedDomains","serviceEndpoint":"https://bar.example.com"}]}}]}}';

// If params are not provided it will default to Microsoft's ION endpoints
const ionPoW = new IonPoW({
    challengeEndpoint: 'https://ion-node/api/v1.0/proof-of-work-challenge',
    solutionEndpoint: 'https://ion-node/api/v1.0/operations'
})
const result = await ionPow.submit(request)
````

## Enable debug logging
This package uses the [debug](https://www.npmjs.com/package/debug) NPM package.
See it's documentation on how to enable debugging. 

The short version is to add an environment variable called DEBUG with value `sphereon:ion:*`

### Install NPM package

```npm install @sphereon/ion-pow```

### Build

```shell
yarn build
```

### Test

The test command runs:

* `eslint`
* `prettier`
* `unit`
* `coverage`

You can also run only a single section of these tests, using for example `yarn test:unit`.

```shell
yarn test
```

### Utility scripts

There are several other utility scripts that help with development.

* `yarn fix` - runs `eslint --fix` as well as `prettier` to fix code style.
* `yarn cov` - generates code coverage report.
