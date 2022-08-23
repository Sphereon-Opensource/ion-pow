import { Argon2, Argon2Mode, HashResult } from '@sphereon/isomorphic-argon2';
import { fetch } from 'cross-fetch';
import Debug from 'debug';
import * as u8a from 'uint8arrays';

import { AnswerNonce, ChallengeBody, ChallengeResult } from './types';

const debug = Debug('sphereon:ion:pow');

export class IonProofOfWork {
  private readonly solutionEndpoint: string;
  private readonly challengeEndpoint: string;
  private readonly challengeEnabled: boolean;

  constructor(opts?: { challengeEnabled?: boolean; challengeEndpoint?: string; solutionEndpoint?: string }) {
    this.challengeEnabled = opts?.challengeEnabled === undefined ? true : opts.challengeEnabled;
    this.challengeEndpoint = opts?.challengeEndpoint || 'https://beta.ion.msidentity.com/api/v1.0/proof-of-work-challenge';
    this.solutionEndpoint = opts?.solutionEndpoint || 'https://beta.ion.msidentity.com/api/v1.0/operations';
  }

  async submit(requestJson: string): Promise<string> {
    if (this.challengeEnabled) {
      const challengeResult = await this.retrieveChallenge();
      const answerNonce = await this.generateAnswerNonce({ requestJson, challengeResult });
      return await this.supplySolution({
        requestJson,
        challengeNonce: challengeResult.challengeNonce,
        answerNonce,
      });
    } else {
      return await this.supplySolution({ requestJson });
    }
  }

  private async supplySolution({
    requestJson,
    challengeNonce,
    answerNonce,
  }: {
    requestJson: string;
    challengeNonce?: string;
    answerNonce?: AnswerNonce;
  }) {
    if (this.challengeEnabled && (!challengeNonce || !answerNonce)) {
      throw new Error('When using a challenge the challenge and answer nonce need to be present');
    }
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };
    const headers =
      this.challengeEnabled && answerNonce && challengeNonce
        ? {
            ...defaultHeaders,
            'Challenge-Nonce': challengeNonce!,
            'Answer-Nonce': answerNonce.base10,
          }
        : { ...defaultHeaders };

    const solutionResponse = await fetch(this.solutionEndpoint, {
      method: 'POST',
      mode: 'cors',
      body: requestJson,
      headers,
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
    let currentHash: HashResult;
    let answerNonce: AnswerNonce = { base16: '', base10: '' };

    do {
      answerNonce = this.generateNonce();
      const password = answerNonce.base16 + requestJson;
      const salt = u8a.fromString(challengeNonce, 'base16');
      currentHash = await Argon2.hash(password, salt, {
        iterations: 1,
        parallelism: 1,
        memory: 1000,
        hashLength: 32, // output size = 32 bytes
        mode: Argon2Mode.Argon2id,
      });
      debug(`computed answer hash: ${currentHash}`);
    } while (currentHash.hex > largestAllowedHash && Date.now() - startTime < validDurationInMilliseconds);

    if (Date.now() - startTime > validDurationInMilliseconds) {
      throw Error(`Valid duration of ${validDurationInMinutes} minutes has been exceeded since ${startTime}`);
    }

    debug(`largest allowed: ${largestAllowedHash}`);
    debug(`valid answer hash: ${currentHash.hex}`);
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
