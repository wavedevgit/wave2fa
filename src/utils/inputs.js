const readInputAsync = (input) =>
    new Promise((res, rej) => {
        input.readInput((err, value) => {
            if (err) rej(err);
            if (!err) res(value);
            return;
        });
    });
export { readInputAsync };
