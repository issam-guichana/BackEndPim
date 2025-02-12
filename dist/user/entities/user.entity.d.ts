import { Document } from 'mongoose';
import { Role } from './Role.enum';
export type UserDocument = User & Document;
export declare class User extends Document {
    email: string;
    password: string;
    username: string;
    dateOfBirth: Date;
    status: string;
    otp: string | null;
    otpExpires: Date | null;
    role: Role;
}
export declare const UserSchema: import("mongoose").Schema<User, import("mongoose").Model<User, any, any, any, Document<unknown, any, User> & User & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, User, Document<unknown, {}, import("mongoose").FlatRecord<User>> & import("mongoose").FlatRecord<User> & Required<{
    _id: unknown;
}> & {
    __v: number;
}>;
