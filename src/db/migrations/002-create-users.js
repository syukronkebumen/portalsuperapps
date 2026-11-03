import { DataTypes } from 'sequelize';
export const createUsersTable = {
    name: '002-create-users',
    async up(queryInterface) {
        if (await queryInterface.tableExists('users'))
            return;
        await queryInterface.createTable('users', {
            id: {
                type: DataTypes.BIGINT.UNSIGNED,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false,
            },
            name: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },
            email: {
                type: DataTypes.STRING(255),
                allowNull: false,
                unique: true,
            },
            password: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            created_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
            updated_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
        });
    },
    async down(queryInterface) {
        await queryInterface.dropTable('users');
    },
};
//# sourceMappingURL=002-create-users.js.map