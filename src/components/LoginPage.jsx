import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Heart, Mail, Lock, ArrowRight, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const { login, signup, auth } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        await signup(email, password);
        navigate('/'); // Go directly to app instead of login
      } else {
        await login(email, password);
        navigate('/');
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(getReadableErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setError('Password reset email sent! Please check your inbox.');
      setIsResetPassword(false);
    } catch (err) {
      console.error('Reset error:', err);
      setError(getReadableErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const getReadableErrorMessage = (error) => {
    switch (error.code) {
      case 'auth/invalid-email':
        return 'Invalid email address format';
      case 'auth/user-disabled':
        return 'This account has been disabled';
      case 'auth/user-not-found':
        return 'No account found with this email';
      case 'auth/wrong-password':
        return 'Incorrect password';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters';
      case 'auth/network-request-failed':
        return 'Network error - please check your connection';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later';
      case 'auth/missing-email':
        return 'Please enter an email address';
      case 'auth/invalid-action-code':
        return 'Invalid reset link. Please try again';
      case 'auth/expired-action-code':
        return 'Reset link has expired. Please request a new one';
      default:
        return 'An error occurred. Please try again';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col items-center justify-center p-4">
      {/* Logo Section - Updated with transparent logo */}
      <div className="mb-8 text-center">
        <img
          src="/time talk transparent.png"
          alt="Time Talk"
          className="w-32 h-32 mx-auto mb-4"
        />
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Welcome Back
        </h1>
        <p className="text-gray-600 mt-2">
          {isSignUp ? 'Create your account' : isResetPassword ? 'Reset your password' : 'Sign in to continue'}
        </p>
      </div>

      <div className="w-full max-w-md">
        <div className="bg-white/90 backdrop-blur-xl shadow-2xl rounded-3xl p-8 border border-gray-100">
          {error && (
            <div className="mb-6 bg-red-50 text-red-500 p-4 rounded-xl flex items-center gap-2 animate-fadeIn">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          {!isResetPassword ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                {/* Email Field */}
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Field (Sign Up only) */}
                {isSignUp && (
                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-10 p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Confirm your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Add Forgot Password Link */}
              {!isSignUp && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setIsResetPassword(true)}
                    className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Forgot your password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-xl
                  flex items-center justify-center gap-2 shadow-lg hover:shadow-xl 
                  transition-all duration-200 hover:transform hover:scale-[1.02]
                  disabled:opacity-70 disabled:cursor-not-allowed
                  group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-center gap-2">
                  {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      {isSignUp ? 'Create Account' : 'Login'} 
                      <ArrowRight size={20} />
                    </>
                  )}
                </div>
              </button>
            </form>
          ) : (
            /* Password Reset Form */
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-xl
                  flex items-center justify-center gap-2 shadow-lg hover:shadow-xl 
                  transition-all duration-200 hover:transform hover:scale-[1.02]"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>
          )}

          <div className="mt-6 text-center space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setIsResetPassword(false);
                setError('');
                setEmail('');
                setPassword('');
              }}
              className="text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors"
            >
              {isSignUp ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;