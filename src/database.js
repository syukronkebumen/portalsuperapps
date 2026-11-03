import { Sequelize } from 'sequelize';
import { config } from './config.js';
export const sequelize = new Sequelize({
    dialect: 'mysql',
    host: config.database.host,
    port: config.database.port,
    database: config.database.name,
    username: config.database.user,
    password: config.database.password,
    logging: false,
    define: {
        timestamps: true,
        underscored: true,
    },
});
//# sourceMappingURL=database.js.map