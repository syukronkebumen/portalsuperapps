import type { QueryInterface } from 'sequelize';
export interface Migration {
    name: string;
    up: (queryInterface: QueryInterface) => Promise<void>;
    down: (queryInterface: QueryInterface) => Promise<void>;
}
export interface Seeder {
    name: string;
    run: () => Promise<void>;
}
//# sourceMappingURL=types.d.ts.map