import { Model } from 'sequelize';
import type { InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
export declare class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
    id: CreationOptional<number>;
    name: CreationOptional<string | null>;
    email: string;
    password: string;
    readonly createdAt: CreationOptional<Date>;
    readonly updatedAt: CreationOptional<Date>;
}
//# sourceMappingURL=user.d.ts.map