export interface AnswerNonce {
  base16: string;
  base10: string;
}

export interface ChallengeBody {
  validDurationInMinutes: number;
  challengeNonce: string;
  largestAllowedHash: string;
}

export interface ChallengeResult extends ChallengeBody {
  validDurationInMilliseconds: number;
}
