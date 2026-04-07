const readInputAsync = (input: any): Promise<string> =>
    new Promise((res, rej) => {
        input.readInput((err: any, value: string) => {
            if (err) rej(err);
            if (!err) res(value);
            return;
        });
    });
export { readInputAsync };
