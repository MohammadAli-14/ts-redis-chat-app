import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { generateToken } from "../lib/utils.js";
import { 
  sendVerificationEmail, 
  sendWelcomeEmail,
  sendResetPasswordEmail 
} from "../emails/emailHandlers.js";
import { ENV } from "../lib/env.js";
import cloudinary from "../lib/cloudinary.js";

export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
    console.log("Signup attempt for:", email); // Add logging

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Check for existing verified user
    const existingVerifiedUser = await User.findOne({ 
      email, 
      accountVerified: true 
    });
    if (existingVerifiedUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Check for unverified user and prevent spam
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const registrationAttempts = await User.countDocuments({
      email,
      accountVerified: false,
      createdAt: { $gt: twentyFourHoursAgo }
    });

    if (registrationAttempts >= 3) {
      return res.status(400).json({ 
        message: "Too many registration attempts. Please try again tomorrow." 
      });
    }

    // Delete any existing unverified user
    await User.deleteOne({ email, accountVerified: false });

    // Create new unverified user
    const newUser = new User({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      password,
      accountVerified: false,
    });

    // Generate and save verification code
    const verificationCode = newUser.generateVerificationCode();
    await newUser.save();

    console.log("User saved, sending verification email..."); // Add logging

    // Send verification email
    try {
      await sendVerificationEmail(newUser.email, newUser.fullName, verificationCode);
      
      console.log("Verification email sent successfully"); // Add logging
      
      res.status(201).json({
        success: true,
        message: `Verification code sent to ${email}`,
        email: newUser.email,
      });
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Delete the user if email fails
      await User.deleteOne({ _id: newUser._id });
      return res.status(500).json({ 
        message: "Failed to send verification email. Please try again." 
      });
    }

  } catch (error) {
    console.error("Error in signup controller:", error);
    
    // More specific error handling
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: "Invalid data provided. Please check your input." 
      });
    }
     
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: "Email already exists. Please use a different email." 
      });
    }
    
    res.status(500).json({ 
      message: "Internal server error during signup. Please try again." 
    });
  }
};
export const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    // Validate OTP format
    if (isNaN(Number(otp))) {
      return res.status(400).json({ message: "Invalid OTP format" });
    }

    // Find unverified user
    const user = await User.findOne({ 
      email, 
      accountVerified: false 
    });

    if (!user) {
      return res.status(404).json({ message: "No pending verification found" });
    }

    const numericOTP = Number(otp);

    // Verify OTP
    if (user.verificationCode !== numericOTP) {
      return res.status(400).json({ message: "Invalid OTP code" });
    }

    // Check expiration
    if (user.verificationCodeExpire < Date.now()) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    // Verify user account
    user.accountVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpire = undefined;
    user.resendCount = 0;
    user.cooldownExpires = undefined;
    await user.save();

    // Generate token and send success response
    generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
      message: "Account successfully verified!",
    });

  } catch (error) {
    console.error("Error in verifyOTP controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const resendOTP = async (req, res) => {
  const { email } = req.body;
  const MAX_RESEND_ATTEMPTS = 3;
  const COOLDOWN_HOURS = 24;

  try {
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Find unverified user
    const user = await User.findOne({ 
      email, 
      accountVerified: false 
    });

    if (!user) {
      return res.status(404).json({ message: "No pending verification found" });
    }

    // Check for max attempts and cooldown
    if (user.resendCount >= MAX_RESEND_ATTEMPTS && user.cooldownExpires && user.cooldownExpires > Date.now()) {
      const hoursLeft = Math.ceil((user.cooldownExpires - Date.now()) / (3600 * 1000));
      return res.status(429).json({ 
        message: `Maximum attempts reached. Try again in ${hoursLeft} hours.` 
      });
    }

    // Check if cooldown is active
    if (user.cooldownExpires && user.cooldownExpires > Date.now()) {
      const minutesLeft = Math.ceil((user.cooldownExpires - Date.now()) / (60 * 1000));
      return res.status(429).json({ 
        message: `Please try again in ${minutesLeft} minutes.` 
      });
    }

    // Reset counter if cooldown period has passed
    if (user.resendCount >= MAX_RESEND_ATTEMPTS) {
      user.resendCount = 0;
    }

    // Generate new verification code
    const verificationCode = user.generateVerificationCode();
    user.resendCount = (user.resendCount || 0) + 1;

    // Set cooldown if max attempts reached
    if (user.resendCount === MAX_RESEND_ATTEMPTS) {
      user.cooldownExpires = Date.now() + COOLDOWN_HOURS * 60 * 60 * 1000;
    } else {
      user.cooldownExpires = undefined;
    }

    await user.save();

    // Send new verification email
    try {
      await sendVerificationEmail(user.email, user.fullName, verificationCode);
      
      res.status(200).json({
        success: true,
        message: `New verification code sent to ${email}`
      });
    } catch (emailError) {
      console.error("Resend OTP email error:", emailError);
      // Rollback changes on email failure
      user.resendCount -= 1;
      if (user.resendCount < MAX_RESEND_ATTEMPTS) {
        user.cooldownExpires = undefined;
      }
      await user.save();
      
      return res.status(500).json({ message: "Failed to resend OTP email" });
    }

  } catch (error) {
    console.error("Error in resendOTP controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check if account is verified
    if (!user.accountVerified) {
      return res.status(400).json({ 
        message: "Please verify your account before logging in." 
      });
    }

    // Use the comparePassword method from the User model
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Send welcome email on first login
    if (!user.welcomeEmailSent) {
      try {
        await sendWelcomeEmail(user.email, user.fullName, ENV.CLIENT_URL);
        user.welcomeEmailSent = true;
        await user.save();
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
        // Don't block login for email failure
      }
    }

    generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.error("Error in login controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Keep existing functions (logout, updateProfile) unchanged
export const logout = (_, res) => {
  res.cookie("jwt", "", { maxAge: 0 });
  res.status(200).json({ message: "Logged out successfully" });
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    if (!profilePic) return res.status(400).json({ message: "Profile pic is required" });

    const userId = req.user._id;

    const uploadResponse = await cloudinary.uploader.upload(profilePic);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadResponse.secure_url },
      { new: true }
    );

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("Error in update profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Forgot Password - Send OTP
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const MAX_RESEND_ATTEMPTS = 3;
  const COOLDOWN_HOURS = 24;

  try {
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Find verified user
    const user = await User.findOne({ 
      email, 
      accountVerified: true 
    });

    if (!user) {
      // Don't reveal if email exists for security
      return res.status(200).json({
        success: true,
        message: "If an account exists with this email, a reset code has been sent."
      });
    }

    // Check for max attempts and cooldown
    if (user.resetPasswordResendCount >= MAX_RESEND_ATTEMPTS && 
        user.resetPasswordCooldownExpires && 
        user.resetPasswordCooldownExpires > Date.now()) {
      const hoursLeft = Math.ceil((user.resetPasswordCooldownExpires - Date.now()) / (3600 * 1000));
      return res.status(429).json({ 
        message: `Maximum attempts reached. Try again in ${hoursLeft} hours.` 
      });
    }

    // Check if cooldown is active
    if (user.resetPasswordCooldownExpires && user.resetPasswordCooldownExpires > Date.now()) {
      const minutesLeft = Math.ceil((user.resetPasswordCooldownExpires - Date.now()) / (60 * 1000));
      return res.status(429).json({ 
        message: `Please try again in ${minutesLeft} minutes.` 
      });
    }

    // Reset counter if cooldown period has passed
    if (user.resetPasswordResendCount >= MAX_RESEND_ATTEMPTS) {
      user.resetPasswordResendCount = 0;
    }

    // Generate reset OTP
    const resetOTP = user.generateResetOTP();
    user.resetPasswordResendCount = (user.resetPasswordResendCount || 0) + 1;

    // Set cooldown if max attempts reached
    if (user.resetPasswordResendCount === MAX_RESEND_ATTEMPTS) {
      user.resetPasswordCooldownExpires = Date.now() + COOLDOWN_HOURS * 60 * 60 * 1000;
    } else {
      user.resetPasswordCooldownExpires = undefined;
    }

    await user.save();

    // Send reset password email
    try {
      await sendResetPasswordEmail(user.email, user.fullName, resetOTP);
      
      res.status(200).json({
        success: true,
        message: "If an account exists with this email, a reset code has been sent."
      });
    } catch (emailError) {
      console.error("Reset password email error:", emailError);
      // Rollback changes on email failure
      user.resetPasswordResendCount -= 1;
      if (user.resetPasswordResendCount < MAX_RESEND_ATTEMPTS) {
        user.resetPasswordCooldownExpires = undefined;
      }
      await user.save();
      
      return res.status(500).json({ message: "Failed to send reset code" });
    }

  } catch (error) {
    console.error("Error in forgotPassword controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Verify Reset OTP
export const verifyResetOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    // Validate OTP format
    if (isNaN(Number(otp))) {
      return res.status(400).json({ message: "Invalid OTP format" });
    }

    // Find verified user
    const user = await User.findOne({ 
      email, 
      accountVerified: true 
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid request" });
    }

    const numericOTP = Number(otp);

    // Verify OTP
    if (user.resetPasswordOTP !== numericOTP) {
      return res.status(400).json({ message: "Invalid reset code" });
    }

    // Check expiration
    if (user.resetPasswordOTPExpire < Date.now()) {
      return res.status(400).json({ message: "Reset code has expired" });
    }

    // Set verification flags
    user.resetPasswordVerified = true;
    user.resetPasswordVerifiedExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
    
    // Clear OTP after verification
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpire = undefined;
    
    await user.save();

    res.status(200).json({
      success: true,
      message: "Reset code verified successfully.",
    });

  } catch (error) {
    console.error("Error in verifyResetOTP controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Reset Password with OTP
export const resetPassword = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Verify OTP was validated and not expired
    const user = await User.findOne({ 
      email, 
      accountVerified: true,
      resetPasswordVerified: true,
      resetPasswordVerifiedExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: "Reset session expired or invalid" });
    }

    // Update password - set plain password, the User model will hash it automatically
    user.password = password;
    
    // Clear verification flags
    user.resetPasswordVerified = undefined;
    user.resetPasswordVerifiedExpires = undefined;
    user.resetPasswordResendCount = 0;
    user.resetPasswordCooldownExpires = undefined;

    await user.save(); // This will trigger the pre-save hook to hash the password

    res.status(200).json({
      success: true,
      message: "Password has been reset successfully.",
    });

  } catch (error) {
    console.error("Error in resetPassword controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};