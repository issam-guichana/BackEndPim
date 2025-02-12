"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_entity_1 = require("./entities/user.entity");
const jwt_1 = require("@nestjs/jwt");
const Token_entity_1 = require("./entities/Token.entity");
const mongoose_3 = require("mongoose");
const bcrypt = __importStar(require("bcrypt"));
const axios_1 = __importDefault(require("axios"));
let UserService = class UserService {
    constructor(userModel, tokenModel, jwtService) {
        this.userModel = userModel;
        this.tokenModel = tokenModel;
        this.jwtService = jwtService;
    }
    async create(createUserDto) {
        const existingUser = await this.userModel.findOne({ email: createUserDto.email }).exec();
        if (existingUser) {
            throw new common_1.BadRequestException('Email is already taken');
        }
        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
        const createdUser = new this.userModel({
            ...createUserDto,
            password: hashedPassword,
            dateOfBirth: new Date(createUserDto.dateOfBirth),
            role: createUserDto.role,
        });
        return createdUser.save();
    }
    async login(loginDto) {
        const { email, password } = loginDto;
        const user = await this.userModel.findOne({ $or: [{ email }, { username: email }] }).exec();
        console.log('Email:', email);
        console.log('Password:', password);
        if (!user || !(await bcrypt.compare(password, user.password))) {
            console.log('User not found');
            throw new common_1.BadRequestException('Invalid credentials');
        }
        const payload = {
            email: user.email,
            id: user._id,
            username: user.username,
            dateOfBirth: user.dateOfBirth,
            role: user.role
        };
        const access_token = this.jwtService.sign(payload, {
            expiresIn: '1h',
        });
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1);
        await this.tokenModel.create({
            userId: user._id,
            token: access_token,
            expiresAt,
        });
        return {
            access_token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        };
    }
    async findAll() {
        return this.userModel.find().exec();
    }
    async findOne(id) {
        if (!mongoose_3.Types.ObjectId.isValid(id)) {
            throw new common_1.BadRequestException('Invalid user ID format');
        }
        const user = await this.userModel.findById(id).exec();
        if (!user) {
            throw new common_1.NotFoundException('User with this ID not found');
        }
        return user;
    }
    async findOneBy(username) {
        const user = await this.userModel.findOne({ username }).exec();
        if (!user) {
            throw new common_1.NotFoundException('User with this username not found');
        }
        return { id: user.id.toString() };
    }
    async update(id, updateUserDto) {
        console.log('[UserService] Updating user with ID:', id);
        console.log('[UserService] Update Data:', updateUserDto);
        const existingUser = await this.userModel.findById(id).exec();
        if (!existingUser) {
            throw new common_1.NotFoundException('User not found');
        }
        if (!updateUserDto.password || updateUserDto.password.trim() === '') {
            delete updateUserDto.password;
        }
        else {
            if (typeof updateUserDto.password !== 'string') {
                throw new common_1.BadRequestException('Password must be a string');
            }
            updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
        }
        if (!updateUserDto.username || updateUserDto.username.trim() === '') {
            updateUserDto.username = existingUser.username;
        }
        const updatedUser = await this.userModel.findByIdAndUpdate(id, { $set: updateUserDto }, { new: true, runValidators: true }).exec();
        if (!updatedUser) {
            throw new common_1.NotFoundException('User not found');
        }
        const emailData = {
            sender: { name: 'Esprit', email: 'amira.gharbi2505@gmail.com' },
            to: [{ email: updatedUser.email }],
            subject: 'Your Account Information Has Been Updated',
            htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px; background-color: #f4f4f8;">
          <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #6a1b9a; font-size: 24px;">Account Update Successful</h1>
              <p style="color: #555;">Your account information has been successfully updated. If you did not make this change, please contact our support team immediately.</p>
          </div>
          
          <footer style="margin-top: 30px; text-align: center; color: #999; font-size: 12px;">
              <p>© 2024 Sante.</p>
              <p>123 Cosmic Avenue, Galaxy City</p>
          </footer>
      </div>
  `,
        };
        try {
            const response = await axios_1.default.post('https://api.brevo.com/v3/smtp/email', emailData, {
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': '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',
                },
            });
            console.log(`[UserService] Notification email sent successfully to: ${updatedUser.email}`, JSON.stringify(response.data, null, 2));
        }
        catch (error) {
            console.error('[UserService] Failed to send notification email:', error.response?.data || error.message);
        }
        if (!updatedUser) {
            console.log('[UserService] User not found for ID:', id);
            throw new common_1.NotFoundException('User not found');
        }
        console.log('[UserService] Successfully updated user:', updatedUser);
        return updatedUser;
    }
    async remove(id) {
        const deletedUser = await this.userModel.findByIdAndDelete(id).exec();
        if (!deletedUser) {
            throw new common_1.NotFoundException('User not found');
        }
        return deletedUser;
    }
    async forgetPassword(email) {
        const user = await this.userModel.findOne({ email }).exec();
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const tempPassword = this.generateStrongPassword(10);
        const hashedTempPassword = await bcrypt.hash(tempPassword, 10);
        user.password = hashedTempPassword;
        await user.save();
        const brevoUrl = 'https://api.brevo.com/v3/smtp/email';
        const emailData = {
            sender: { name: 'Esprit', email: 'amira.gharbi2505@gmail.com' },
            to: [{ email }],
            subject: 'Your Sante Temporary Password',
            htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px; background-color: #f4f4f8;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #6a1b9a; font-size: 24px;">Your Sante Temporary Password</h1>
                    <p style="color: #555;">You requested to reset your password. Use the temporary password below to log in and reset your password immediately.</p>
                </div>
                <div style="text-align: center; margin-bottom: 20px;">
                    <h2 style="color: #6a1b9a; font-size: 20px;">Temporary Password:</h2>
                    <p style="font-size: 18px; font-weight: bold; color: #333;">${tempPassword}</p>
                    <p style="color: #555;">This password is temporary. Please change it after logging in.</p>
                </div>
                <div style="margin-top: 20px;">
                    <p style="color: #555; font-size: 14px; text-align: center;">If you did not request this email, please contact our support team immediately.</p>
                </div>
                
                <footer style="margin-top: 30px; text-align: center; color: #999; font-size: 12px;">
                    <p>© 2024 Sante.</p>
                    <p>123 Cosmic Avenue, Galaxy City</p>
                </footer>
            </div>
        `,
        };
        await axios_1.default.post(brevoUrl, emailData, {
            headers: {
                'Content-Type': 'application/json',
                'api-key': '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',
            },
        });
        console.log(`Temporary password sent to ${email}`);
    }
    generateStrongPassword(length) {
        const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lower = 'abcdefghijklmnopqrstuvwxyz';
        const digits = '0123456789';
        const allChars = upper + lower + digits;
        let password = '';
        password += this.getRandomCharacter(upper);
        password += this.getRandomCharacter(lower);
        password += this.getRandomCharacter(digits);
        for (let i = 3; i < length; i++) {
            password += this.getRandomCharacter(allChars);
        }
        return this.shuffle(password);
    }
    getRandomCharacter(chars) {
        return chars[Math.floor(Math.random() * chars.length)];
    }
    shuffle(password) {
        return password.split('').sort(() => Math.random() - 0.5).join('');
    }
    async validateToken(token) {
        const storedToken = await this.tokenModel.findOne({ token }).exec();
        if (!storedToken) {
            throw new common_1.NotFoundException('Token not found');
        }
        if (storedToken.expiresAt < new Date()) {
            throw new common_1.BadRequestException('Token expired');
        }
        return true;
    }
    async logout(token) {
        const result = await this.tokenModel.findOneAndDelete({ token }).exec();
        if (!result) {
            throw new common_1.NotFoundException('Token not found or already invalidated');
        }
        console.log(`Token invalidated for user: ${result.userId}`);
    }
    async fetchUserDetails(userId) {
        if (!(0, mongoose_3.isValidObjectId)(userId)) {
            throw new common_1.BadRequestException('Invalid user ID');
        }
        const user = await this.userModel.findById(userId).exec();
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async updatePassword(userId, newPassword) {
        console.log('[UserService] Update Password called for User ID:', userId);
        const user = await this.userModel.findById(userId);
        if (!user) {
            console.log('[UserService] User not found.');
            throw new common_1.BadRequestException('User not found.');
        }
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        console.log('[UserService] New password hashed.');
        user.password = hashedNewPassword;
        await user.save();
        console.log('[UserService] Password updated successfully.');
        const emailData = {
            sender: { name: 'Esprit', email: 'amira.gharbi2505@gmail.com' },
            to: [{ email: user.email }],
            subject: 'Password Updated Successfully',
            htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px; background-color: #f4f4f8;">
              <div style="text-align: center; margin-bottom: 20px;">
                  <h1 style="color: #6a1b9a; font-size: 24px;">Your Password Has Been Updated</h1>
                  <p style="color: #555;">This is a confirmation that your password has been successfully updated.</p>
              </div>
              
              <footer style="margin-top: 30px; text-align: center; color: #999; font-size: 12px;">
                  <p>© 2024 sante.</p>
                  <p>123 Cosmic Avenue, Galaxy City</p>
              </footer>
          </div>
      `,
        };
        try {
            const response = await axios_1.default.post('https://api.brevo.com/v3/smtp/email', emailData, {
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': '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',
                },
            });
            console.log(`[UserService] Notification email sent successfully to: ${user.email}`, response.data);
        }
        catch (error) {
            console.error('[UserService] Failed to send notification email:', error.response?.data || error.message);
        }
        return { message: 'Password updated successfully.' };
    }
    async findByEmail(email) {
        return this.userModel.findOne({ email }).exec();
    }
    isValidObjectId(id) {
        const ObjectId = require('mongoose').Types.ObjectId;
        return ObjectId.isValid(id);
    }
    async sendOtpToUser(email) {
        const user = await this.userModel.findOne({ email }).exec();
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp;
        user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();
        const brevoUrl = 'https://api.brevo.com/v3/smtp/email';
        const emailData = {
            sender: { name: 'Esprit', email: 'amira.gharbi2505@gmail.com' },
            to: [{ email }],
            subject: 'Your OTP for Verification',
            htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px; background-color: #f4f4f8;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #6a1b9a; font-size: 24px;">Welcome </h1>
          <p style="color: #555;">Unlock the universe with us!</p>
        </div>
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #6a1b9a; font-size: 20px;">Your One-Time Password (OTP)</h2>
          <p style="font-size: 18px; font-weight: bold; color: #333;">${otp}</p>
          <p style="color: #555;">This code is valid for <strong>10 minutes</strong>.</p>
        </div>
        <div style="margin-top: 20px;">
          <p style="color: #555; font-size: 14px; text-align: center;">If you did not request this OTP, please ignore this email or contact our support team.</p>
        </div>
        
        <footer style="margin-top: 30px; text-align: center; color: #999; font-size: 12px;">
          <p>© 2024 sante.</p>
          <p>123 Cosmic Avenue, Galaxy City</p>
        </footer>
      </div>
    `,
        };
        try {
            const response = await axios_1.default.post(brevoUrl, emailData, {
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': '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',
                },
            });
            console.log('Email sent successfully:', response.data);
        }
        catch (error) {
            console.error('Failed to send email:', error.response?.data || error.message);
            throw new Error('Email sending failed');
        }
    }
    async verifyOtp(identifier, otp) {
        const user = await this.userModel.findOne({ email: identifier }).exec();
        if (!user) {
            console.warn('User not found during OTP verification');
            throw new common_1.NotFoundException('User not found');
        }
        if (user.otp !== otp || (user.otpExpires && user.otpExpires < new Date())) {
            console.warn(`Failed OTP verification for user: ${identifier}`);
            return { success: false, message: 'Invalid or expired OTP' };
        }
        user.status = 'verified';
        user.otp = null;
        user.otpExpires = null;
        console.log(`User ${identifier} successfully verified`);
        return { success: true, message: 'OTP verified successfully' };
    }
    async checkStatus(identifier) {
        const user = await this.userModel.findOne({ email: identifier }).exec();
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return { status: user.status };
    }
    async resendOtp(email) {
        const user = await this.userModel.findOne({ email }).exec();
        if (!user) {
            throw new common_1.NotFoundException('User with this email not found');
        }
        const lastOtpSent = user.otpExpires
            ? new Date(user.otpExpires.getTime() - 10 * 60 * 1000)
            : null;
        if (lastOtpSent && new Date() < new Date(lastOtpSent.getTime() + 60 * 1000)) {
            throw new common_1.BadRequestException('You can only resend OTP after 60 seconds');
        }
        await this.sendOtpToUser(email);
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_entity_1.User.name)),
    __param(1, (0, mongoose_1.InjectModel)(Token_entity_1.Token.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        jwt_1.JwtService])
], UserService);
//# sourceMappingURL=user.service.js.map