import nock from 'nock';

import { IonPoW } from '../lib';

const request =
  '{"type":"create","suffixData":{"deltaHash":"EiDDJlgKebcp0_HrRrZj9A_8v0YBKRJHG5EGeQMmho0mUA","recoveryCommitment":"EiArC3NQTIvxYAm2_FGQMQMq_d_48tlBegDo6XbvFLoemw"},"delta":{"updateCommitment":"EiB2CU2JHjzNMFo06ab-FLotoB5ve_c3wYskDvm5sf8z1Q","patches":[{"action":"replace","document":{"publicKeys":[{"id":"did1-test","type":"EcdsaSecp256k1VerificationKey2019","publicKeyJwk":{"kty":"EC","crv":"secp256k1","x":"6eRI9ckwdZjr6vs-1CBS-HlEtDY41fTuWBg-CViTc_Y","y":"Xu6d7wi_fKqaBGZBlui1GoSuxdjEdcfk0C3E88_dLOo"},"purposes":["authentication","assertionMethod"]},{"id":"did2-test","type":"EcdsaSecp256k1VerificationKey2019","publicKeyJwk":{"kty":"EC","crv":"secp256k1","x":"vVImkG7In_evljP-ZvbkqMKviGWlQ1l_4GbQvI_UdZ8","y":"ClZmXtTFnDdARDtsMe50z1ge7nB7yyoyIDaOI5ODPDU"},"purposes":["keyAgreement"]}],"services":[{"id":"bar","type":"LinkedDomains","serviceEndpoint":"https://bar.example.com"}]}}]}}';
const solutionResponse = {
  '@context': 'https://w3id.org/did-resolution/v1',
  didDocument: {
    id: 'did:ion:EiCSlP0V1sBlSGu02oJzZnCfWbpGX9xsT7iox6lvU4gcdA',
    '@context': ['https://www.w3.org/ns/did/v1', { '@base': 'did:ion:EiCSlP0V1sBlSGu02oJzZnCfWbpGX9xsT7iox6lvU4gcdA' }],
    service: [{ id: '#bar', type: 'LinkedDomains', serviceEndpoint: 'https://bar.example.com' }],
    verificationMethod: [
      {
        id: '#did1-test',
        controller: 'did:ion:EiCSlP0V1sBlSGu02oJzZnCfWbpGX9xsT7iox6lvU4gcdA',
        type: 'EcdsaSecp256k1VerificationKey2019',
        publicKeyJwk: {
          kty: 'EC',
          crv: 'secp256k1',
          x: '6eRI9ckwdZjr6vs-1CBS-HlEtDY41fTuWBg-CViTc_Y',
          y: 'Xu6d7wi_fKqaBGZBlui1GoSuxdjEdcfk0C3E88_dLOo',
        },
      },
      {
        id: '#did2-test',
        controller: 'did:ion:EiCSlP0V1sBlSGu02oJzZnCfWbpGX9xsT7iox6lvU4gcdA',
        type: 'EcdsaSecp256k1VerificationKey2019',
        publicKeyJwk: {
          kty: 'EC',
          crv: 'secp256k1',
          x: 'vVImkG7In_evljP-ZvbkqMKviGWlQ1l_4GbQvI_UdZ8',
          y: 'ClZmXtTFnDdARDtsMe50z1ge7nB7yyoyIDaOI5ODPDU',
        },
      },
    ],
    authentication: ['#did1-test'],
    assertionMethod: ['#did1-test'],
    keyAgreement: ['#did2-test'],
  },
  didDocumentMetadata: {
    method: {
      published: false,
      recoveryCommitment: 'EiArC3NQTIvxYAm2_FGQMQMq_d_48tlBegDo6XbvFLoemw',
      updateCommitment: 'EiB2CU2JHjzNMFo06ab-FLotoB5ve_c3wYskDvm5sf8z1Q',
    },
    canonicalId: 'did:ion:EiCSlP0V1sBlSGu02oJzZnCfWbpGX9xsT7iox6lvU4gcdA',
  },
};
describe('ION Pow', () => {
  it('should return DID resolution response on valid DID Ion create request without challenges enabled', async () => {
    nock('https://beta.ion.msidentity.com').post('/api/v1.0/operations').reply(200, solutionResponse);

    const ionPow = new IonPoW({ challengeEnabled: false });
    await expect(ionPow.submit(request)).resolves.toEqual(JSON.stringify(solutionResponse));
  });

  it('should return DID resolution response on valid DID Ion create request with challenges enabled', async () => {
    nock('https://beta.ion.msidentity.com').get('/api/v1.0/proof-of-work-challenge').reply(200, {
      challengeNonce: '4541d4a5c3e8bca920ba4ff96311e002d9491715415f8e85dfa40f93215926a7',
      validDurationInMinutes: 10,
      largestAllowedHash: '0fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
    });

    nock('https://beta.ion.msidentity.com').post('/api/v1.0/operations').reply(200, solutionResponse);

    const ionPow = new IonPoW();
    await expect(ionPow.submit(request)).resolves.toEqual(JSON.stringify(solutionResponse));
  });

  it('should throw an error in case the challenge endpoint is not returning 200', async () => {
    nock('https://beta.ion.msidentity.com').get('/api/v1.0/proof-of-work-challenge').reply(400, {
      error: 'Bad Request',
    });

    const ionPow = new IonPoW();
    await expect(ionPow.submit(request)).rejects.toThrow(
      'Get challenge service not available at https://beta.ion.msidentity.com/api/v1.0/proof-of-work-challenge'
    );
  });

  it('should throw an error in case the operations endpoint is not returning 200', async () => {
    nock('https://beta.ion.msidentity.com').get('/api/v1.0/proof-of-work-challenge').reply(200, {
      challengeNonce: '4541d4a5c3e8bca920ba4ff96311e002d9491715415f8e85dfa40f93215926a7',
      validDurationInMinutes: 10,
      largestAllowedHash: '0fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
    });

    nock('https://beta.ion.msidentity.com').post('/api/v1.0/operations').reply(500, { error: 'server error' });

    const ionPow = new IonPoW();
    await expect(ionPow.submit(request)).rejects.toThrow('500: Internal Server Error.');
  });

  it('should throw an error in case the challenge duration has passed', async () => {
    nock('https://beta.ion.msidentity.com').get('/api/v1.0/proof-of-work-challenge').reply(200, {
      challengeNonce: '4541d4a5c3e8bca920ba4ff96311e002d9491715415f8e85dfa40f93215926a7',
      validDurationInMinutes: 0,
      largestAllowedHash: '0fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
    });

    const ionPow = new IonPoW();
    await expect(ionPow.submit(request)).rejects.toThrow('Valid duration of 0 minutes has been exceeded since');
  });
});
