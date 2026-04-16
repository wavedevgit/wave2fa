export type TotpItem = {
    date: number;
    // used for migration
    version?: number;
    uuid: string;
    name: string;
    secret: string;
    algorithm: string;
    digits: number;
    period: number;
};
export type SecretEncrypted = {
    iv: string;
    data: string;
    tag?: string;
    salt?: string;
};

export type TotpItemRaw = {
    date: number;
    // used for migration
    version?: number;
    uuid: string;
    name: string;
    secret: SecretEncrypted;
    algorithm: string;
    digits: number;
    period: number;
};
