import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
export declare class UserController {
    private readonly userService;
    constructor(userService: UserService);
    create(createUserDto: CreateUserDto): Promise<import("./entities/user.entity").User>;
    login(loginDto: LoginDto): Promise<{
        access_token?: string;
        user?: Partial<import("./entities/user.entity").User>;
    }>;
    sendOtp(email: string): Promise<{
        message: string;
    }>;
    verifyOtp(body: {
        identifier: string;
        otp: string;
    }): Promise<{
        message: string;
    }>;
    logout(req: Request): Promise<{
        message: string;
    }>;
    resendOtp(email: string): Promise<{
        message: string;
    }>;
    findAll(): Promise<import("./entities/user.entity").User[]>;
    findOne(id: string): Promise<import("./entities/user.entity").User>;
    update(id: string, updateUserDto: any): Promise<any>;
    remove(id: string): Promise<import("./entities/user.entity").User>;
    checkStatus(identifier: string): Promise<{
        status: string;
    }>;
    forgetPassword(email: string): Promise<{
        message: string;
    }>;
    updatePassword(id: string, password: string): Promise<{
        message: string;
    }>;
}
