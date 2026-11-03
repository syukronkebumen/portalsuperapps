import 'dotenv/config';
export const config = {
    port: Number(process.env.PORT ?? 3000),
    jwtSecret: process.env.JWT_SECRET ?? '',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '8h',
    adminEmail: process.env.ADMIN_EMAIL ?? '',
    adminPassword: process.env.ADMIN_PASSWORD ?? '',
    database: {
        host: process.env.DB_HOST ?? 'localhost',
        port: Number(process.env.DB_PORT ?? 3306),
        name: process.env.DB_NAME ?? 'portalsuperapps',
        user: process.env.DB_USER ?? 'root',
        password: process.env.DB_PASSWORD ?? '',
    },
};
//# sourceMappingURL=config.js.map