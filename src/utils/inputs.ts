const readInputAsync = (input: any): Promise<string> =>
    new Promise((res, rej) => {
        input.readInput((err: any, value: string) => {
            if (err) return rej(err);

            if (!value) return res('');

            return res(value);
        });
    });

export { readInputAsync };
