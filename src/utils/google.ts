import protobufjs from 'protobufjs';
import { base32Encode } from './base32.js';
import { normalizeBase32 } from './otp.js';
import { TotpItem } from '../types.js';
import { randomUUID } from 'node:crypto';

const { parse } = protobufjs;

const PROTOBUF_MIGRATION_PAYLOAD = `/*
   Google Authenticator offline migration parser
   https://alexbakker.me/post/parsing-google-auth-export-qr-code.html
 */

syntax = "proto3";

message MigrationPayload {
  enum Algorithm {
    ALGORITHM_UNSPECIFIED = 0;
    ALGORITHM_SHA1 = 1;
    ALGORITHM_SHA256 = 2;
    ALGORITHM_SHA512 = 3;
    ALGORITHM_MD5 = 4;
  }

  enum DigitCount {
    DIGIT_COUNT_UNSPECIFIED = 0;
    DIGIT_COUNT_SIX = 1;
    DIGIT_COUNT_EIGHT = 2;
  }

  enum OtpType {
    OTP_TYPE_UNSPECIFIED = 0;
    OTP_TYPE_HOTP = 1;
    OTP_TYPE_TOTP = 2;
  }

  message OtpParameters {
    bytes secret = 1;
    string name = 2;
    string issuer = 3;
    Algorithm algorithm = 4;
    DigitCount digits = 5;
    OtpType type = 6;
    int64 counter = 7;
  }

  repeated OtpParameters otp_parameters = 1;
  int32 version = 2;
  int32 batch_size = 3;
  int32 batch_index = 4;
  int32 batch_id = 5;
}`;
const { root } = parse(PROTOBUF_MIGRATION_PAYLOAD);

const Algorithm = {
    0: 'ALGORITHM_UNSPECIFIED',
    1: 'SHA1',
    2: 'SHA256',
    3: 'SHA512',
    4: 'MD5',
} as const;

const DigitCount = {
    0: null, // unspecified
    1: 6,
    2: 8,
} as const;

const OtpType = {
    0: null,
    1: 'HOTP',
    2: 'TOTP',
} as const;

export type MigrationPayloadOtpParameters = {
    secret: Uint8Array;
    name: string;
    issuer: string;
    algorithm: keyof typeof Algorithm; // numeric key
    digits: keyof typeof DigitCount; // numeric key
    type: keyof typeof OtpType; // numeric key
    counter?: bigint | number; // counter only for HOTP
};

export type MigrationPayloadType = {
    otpParameters: MigrationPayloadOtpParameters[];
    version?: number;
    batchSize?: number;
    batchIndex?: number;
    batchId?: number;
};

export function parseUri(uri: string): { err: string } | TotpItem[] {
    const url = new URL(uri);
    if (url.protocol !== 'otpauth-migration:')
        return {
            err: 'Invalid Qr code, this is not a google authenticator migration qr code!',
        };
    if (url.hostname !== 'offline')
        return {
            err: 'Invalid Qr code, this is not a google authenticator migration qr code!',
        };

    const dataParam = url.searchParams.get('data');
    if (!dataParam) return { err: 'Invalid Qr code, missing data parameter' };

    try {
        const data = Buffer.from(dataParam, 'base64');
        const MigrationPayload = root.lookupType('MigrationPayload');
        const decoded = MigrationPayload.decode(
            data,
        ) as any as MigrationPayloadType;
        return decoded.otpParameters.map((otpParam) => ({
            uuid: randomUUID(),
            name: `${otpParam.name} ${otpParam.issuer}`,
            algorithm: Algorithm[otpParam.algorithm],
            type: OtpType[otpParam.type],
            digits: DigitCount[otpParam.digits] || 6,
            secret: normalizeBase32(base32Encode(otpParam.secret)),
            period: 30,
        }));
    } catch (err) {
        return {
            err: 'Failed to parse qr code data: ' + (err as Error).toString(),
        };
    }
}
