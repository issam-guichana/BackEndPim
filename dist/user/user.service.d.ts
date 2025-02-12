import { Model } from 'mongoose';
import { User, UserDocument } from './entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { TokenDocument } from './entities/Token.entity';
export declare class UserService {
    private readonly userModel;
    private readonly tokenModel;
    private readonly jwtService;
    constructor(userModel: Model<UserDocument>, tokenModel: Model<TokenDocument>, jwtService: JwtService);
    create(createUserDto: any): Promise<User>;
    login(loginDto: LoginDto): Promise<{
        access_token?: string;
        user?: Partial<User>;
    }>;
    findAll(): Promise<User[]>;
    findOne(id: string): Promise<User>;
    findOneBy(username: string): Promise<{
        id: string;
    }>;
    update(id: string, updateUserDto: any): Promise<any>;
    remove(id: string): Promise<User>;
    forgetPassword(email: string): Promise<void>;
    private generateStrongPassword;
    private getRandomCharacter;
    private shuffle;
    validateToken(token: string): Promise<boolean>;
    logout(token: string): Promise<void>;
    fetchUserDetails(userId: string): Promise<User>;
    updatePassword(userId: string, newPassword: string): Promise<{
        message: string;
    }>;
    findByEmail(email: string): Promise<User | null>;
    private isValidObjectId;
    sendOtpToUser(email: string): Promise<void>;
    verifyOtp(identifier: string, otp: string): Promise<{
        success: boolean;
        message: string;
    }>;
    checkStatus(identifier: string): Promise<{
        status: string;
    }>;
    resendOtp(email: string): Promise<void>;
}
