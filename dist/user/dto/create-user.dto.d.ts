import { Role } from '../entities/Role.enum';
export declare class CreateUserDto {
    email: string;
    password: string;
    username: string;
    dateOfBirth: string;
    role: Role;
}
