import { fetch } from 'cross-fetch';
import Debug from 'debug';
import { argon2id } from 'hash-wasm';
import * as u8a from 'uint8arrays';

import { AnswerNonce, ChallengeBody, ChallengeResult } from './types';

const debug = Debug('sphereon:ion:pow');

export class IonProofOfWork {
  private readonly solutionEndpoint: string;
  private readonly challengeEndpoint: string;
  constructor(
    { challengeEndpoint, solutionEndpoint } = {
      challengeEndpoint: 'https://beta.ion.msidentity.com/api/v1.0/proof-of-work-challenge',
      solutionEndpoint: 'https://beta.ion.msidentity.com/api/v1.0/operations',
    }
  ) {
    this.challengeEndpoint = challengeEndpoint;
    this.solutionEndpoint = solutionEndpoint;
  }

  async submit(requestJson: string): Promise<string> {
    const challengeResult = await this.retrieveChallenge();
    const answerNonce = await this.generateAnswerNonce({ requestJson, challengeResult });
    return await this.supplySolution({ requestJson, challengeNonce: challengeResult.challengeNonce, answerNonce });
  }

  private async supplySolution({
    requestJson,
    challengeNonce,
    answerNonce,
  }: {
    requestJson: string;
    challengeNonce: string;
    answerNonce: AnswerNonce;
  }) {
    const solutionResponse = await fetch(this.solutionEndpoint, {
      method: 'POST',
      mode: 'cors',
      body: requestJson,
      headers: {
        'Challenge-Nonce': challengeNonce,
        'Answer-Nonce': answerNonce.base10,
        'Content-Type': 'application/json',
      },
    });

    // Unfortunately we do not always get a JSON response back from the above endpoint, so we resort to .text()
    const solutionBody = await solutionResponse.text();
    if (!solutionResponse.ok) {
      throw Error(`${solutionResponse.status}: ${solutionResponse.statusText}. Body: ${JSON.stringify(solutionBody, null, 2)}`);
    }

    debug(`Successful registration`);
    debug(solutionBody);
    return solutionBody;
  }

  private async generateAnswerNonce({
    requestJson,
    challengeResult,
  }: {
    requestJson: string;
    challengeResult: ChallengeResult;
  }): Promise<AnswerNonce> {
    const { challengeNonce, validDurationInMilliseconds, validDurationInMinutes, largestAllowedHash } = challengeResult;
    debug(`Solving for body:\n${requestJson}`);
    const startTime = Date.now();
    let answerHash = '';
    let answerNonce: AnswerNonce = { base16: '', base10: '' };

    do {
      answerNonce = this.generateNonce();
      answerHash = await argon2id({
        password: answerNonce.base16 + requestJson,
        salt: u8a.fromString(challengeNonce, 'base16'),
        parallelism: 1,
        iterations: 1,
        memorySize: 1000,
        hashLength: 32, // output size = 32 bytes
        outputType: 'hex',
      });
      debug(`computed answer hash: ${answerHash}`);
    } while (answerHash > largestAllowedHash && Date.now() - startTime < validDurationInMilliseconds);

    if (Date.now() - startTime > validDurationInMilliseconds) {
      throw Error(`Valid duration of ${validDurationInMinutes} minutes has been exceeded since ${startTime}`);
    }

    debug(`largest allowed: ${largestAllowedHash}`);
    debug(`valid answer hash: ${answerHash}`);
    return answerNonce;
  }

  private async retrieveChallenge(): Promise<ChallengeResult> {
    debug(`Getting challenge from: ${this.challengeEndpoint}`);
    const challengeResponse = await fetch(this.challengeEndpoint, {
      mode: 'cors',
    });
    if (!challengeResponse.ok) {
      throw Error(`Get challenge service not available at ${this.challengeEndpoint}`);
    }
    const challengeBody: ChallengeBody = await challengeResponse.json();
    debug(`challenge body:\r\n${JSON.stringify(challengeBody, null, 2)}`);

    const validDurationInMilliseconds: number = challengeBody.validDurationInMinutes * 60 * 1000;
    return { validDurationInMilliseconds, ...challengeBody };
  }

  private generateNonce(): AnswerNonce {
    const size = Math.floor(Math.random() * Math.floor(500));
    const base16Nonce = [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    return { base16: base16Nonce, base10: this.toBase10String(base16Nonce) };
  }

  private toBase10String(base16String: string): string {
    return u8a.fromString(base16String).reduce(function (memo, i) {
      return memo + ('0' + i.toString(16)).slice(-2);
    }, '');
  }
}
