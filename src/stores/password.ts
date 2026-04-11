class PasswordStore {
    private password: string;
    constructor() {
        this.password = '';
    }
    getPassword() {
        return this.password;
    }
    setPassword(password: string) {
        return (this.password = password);
    }
}

export default PasswordStore;
