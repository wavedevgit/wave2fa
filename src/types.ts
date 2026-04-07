export type TotpItem = {
    uuid: string;
    name: string;
    secret: string;
    algorithm: string;
    digits: number;
    period: number;
};
export type SecretEncrypted = { iv: string; data: string };

export type TotpItemRaw = {
    uuid: string;
    name: string;
    secret: SecretEncrypted;
    algorithm: string;
    digits: number;
    period: number;
};
