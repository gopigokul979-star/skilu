
import React, { useState } from 'react';
import { UserRole, User } from '../types';
import { MOCK_USERS_LIST } from '../data/mockData';
import { LogIn, User as UserIcon, GraduationCap, Shield, Eye, EyeOff, ArrowRight, Smartphone, Mail, ArrowLeft, MessageSquare, ChevronDown } from 'lucide-react';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.STUDENT);
  
  // Login Method State
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  
  // Email State
  const [email, setEmail] = useState('alex.j@skillu.edu');
  const [password, setPassword] = useState('password');
  const [showPassword, setShowPassword] = useState(false);
  
  // Phone/OTP State
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);

  // General State
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Helper to switch roles and pre-fill demo data
  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setError('');
    
    // Pre-fill credentials for demo convenience
    if (role === UserRole.STUDENT) {
      setEmail('alex.j@skillu.edu');
    } else if (role === UserRole.TEACHER) {
      setEmail('s.connor@skillu.edu');
    } else if (role === UserRole.ADMIN) {
      setEmail('admin@skillu.edu');
    }
  };

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate network delay
    setTimeout(() => {
      // Find user in mock data
      const user = MOCK_USERS_LIST.find(
        u => u.email.toLowerCase() === email.toLowerCase() && u.role === selectedRole
      );

      if (user) {
        onLogin(user);
      } else {
        setError('Invalid credentials or role selection.');
        setIsLoading(false);
      }
    }, 800);
  };

  const handleGoogleLogin = () => {
    setError('');
    setIsLoading(true);
    // Simulate Google Auth Popup and redirect
    setTimeout(() => {
        // Just pick a mock user for the selected role to simulate a successful login
        const user = MOCK_USERS_LIST.find(u => u.role === selectedRole);
        if (user) {
            onLogin(user);
        } else {
            setIsLoading(false);
            setError('No account found for this Google ID.');
        }
    }, 1500);
  };

  const handleSendOtp = (e: React.FormEvent) => {
      e.preventDefault();
      if (phoneNumber.length < 10) {
          setError('Please enter a valid phone number.');
          return;
      }
      setError('');
      setIsLoading(true);
      setTimeout(() => {
          setIsOtpSent(true);
          setIsLoading(false);
      }, 1000);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
      e.preventDefault();
      if (otp.length < 4) {
          setError('Please enter the 4-digit OTP.');
          return;
      }
      setError('');
      setIsLoading(true);
      setTimeout(() => {
          // Just pick a mock user for the selected role
          const user = MOCK_USERS_LIST.find(u => u.role === selectedRole);
          if (user) {
              onLogin(user);
          } else {
              setIsLoading(false);
              setError('Verification failed.');
          }
      }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl flex overflow-hidden min-h-[600px]">
        
        {/* Left Side - Branding & Info (Hidden on Mobile) */}
        <div className="hidden md:flex w-1/2 bg-slate-900 text-white p-12 flex-col justify-between relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl -ml-16 -mb-16"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="20" cy="20" r="7" className="fill-blue-500" />
                  <circle cx="20" cy="6" r="3.5" className="fill-blue-400" />
                  <circle cx="32" cy="13" r="3.5" className="fill-blue-400" />
                  <circle cx="32" cy="27" r="3.5" className="fill-blue-400" />
                  <circle cx="20" cy="34" r="3.5" className="fill-blue-400" />
                  <circle cx="8" cy="27" r="3.5" className="fill-blue-400" />
                  <circle cx="8" cy="13" r="3.5" className="fill-blue-400" />
                </svg>
                <span className="text-2xl font-bold tracking-tight">Skill U</span>
            </div>
            
            <h1 className="text-4xl font-bold leading-tight mb-6">
              Empowering Education through Technology
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed">
              Manage classes, track performance, and engage with students seamlessly. The all-in-one platform for modern educational institutes.
            </p>
          </div>

          <div className="relative z-10">
            <div className="flex gap-4">
               <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl border border-slate-700">
                  <div className="text-2xl font-bold text-blue-400 mb-1">98%</div>
                  <div className="text-xs text-slate-400">Satisfaction Rate</div>
               </div>
               <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl border border-slate-700">
                  <div className="text-2xl font-bold text-emerald-400 mb-1">24/7</div>
                  <div className="text-xs text-slate-400">AI Support</div>
               </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white">
          <div className="mb-8 text-center md:text-left">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Welcome Back</h2>
            <p className="text-slate-500">Please select your role to sign in.</p>
          </div>

          {/* Role Tabs */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl mb-8">
            {[
              { id: UserRole.STUDENT, label: 'Student', icon: <UserIcon size={16} /> },
              { id: UserRole.TEACHER, label: 'Teacher', icon: <GraduationCap size={16} /> },
              { id: UserRole.ADMIN, label: 'Admin', icon: <Shield size={16} /> },
            ].map((role) => (
              <button
                key={role.id}
                onClick={() => handleRoleSelect(role.id)}
                className={`
                  flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200
                  ${selectedRole === role.id 
                    ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                  }
                `}
              >
                {role.icon}
                <span className="hidden sm:inline">{role.label}</span>
              </button>
            ))}
          </div>

          {/* Error Message */}
          {error && (
              <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                {error}
              </div>
          )}

          {/* LOGIN FORMS */}
          {loginMethod === 'email' ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <form onSubmit={handleEmailLogin} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
                        <div className="relative">
                            <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium text-slate-800 placeholder:text-slate-400"
                            placeholder="name@example.com"
                            required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                        <div className="relative">
                            <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium text-slate-800 placeholder:text-slate-400 pr-12"
                            placeholder="••••••••"
                            required
                            />
                            <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                            <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                            Remember me
                        </label>
                        <a href="#" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">Forgot password?</a>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group"
                    >
                        {isLoading ? (
                            <>Loading...</>
                        ) : (
                            <>
                            Sign In <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <form onSubmit={isOtpSent ? handleVerifyOtp : handleSendOtp} className="space-y-5">
                    {!isOtpSent ? (
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mobile Number</label>
                            <div className="flex border border-slate-200 rounded-xl bg-slate-50 focus-within:ring-2 focus-within:ring-blue-500 transition-all overflow-hidden relative">
                                <div className="relative border-r border-slate-200 bg-slate-100 hover:bg-slate-200 transition-colors">
                                    <select
                                        value={countryCode}
                                        onChange={(e) => setCountryCode(e.target.value)}
                                        className="h-full pl-3 pr-8 bg-transparent text-slate-700 font-bold text-sm outline-none appearance-none cursor-pointer z-10 relative"
                                    >
                                        <option value="+1">+1</option>
                                        <option value="+44">+44</option>
                                        <option value="+91">+91</option>
                                        <option value="+61">+61</option>
                                        <option value="+81">+81</option>
                                        <option value="+86">+86</option>
                                    </select>
                                    <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                                </div>
                                <input
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className="w-full px-4 py-3 bg-transparent outline-none font-medium text-slate-800 placeholder:text-slate-400"
                                placeholder="Phone number"
                                required
                                />
                            </div>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Enter OTP</label>
                            <div className="relative">
                                <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium text-slate-800 placeholder:text-slate-400 tracking-widest text-center text-lg"
                                placeholder="••••"
                                maxLength={6}
                                required
                                />
                                <MessageSquare className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            </div>
                            <div className="text-right mt-2">
                                <button type="button" onClick={() => setIsOtpSent(false)} className="text-xs text-blue-600 font-semibold hover:underline">Change Number</button>
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed group"
                    >
                        {isLoading ? (
                            <>Processing...</>
                        ) : (
                            <>
                            {isOtpSent ? 'Verify & Login' : 'Get OTP'} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                    
                    <button 
                        type="button" 
                        onClick={() => { setLoginMethod('email'); setIsOtpSent(false); setOtp(''); setError(''); }}
                        className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                    >
                        <ArrowLeft size={16} /> Back to Email Login
                    </button>
                </form>
            </div>
          )}

          {/* Social / Alternative Login */}
          {loginMethod === 'email' && (
            <>
                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-3 text-slate-400 font-bold tracking-wider">Or continue with</span></div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={handleGoogleLogin}
                        className="flex items-center justify-center gap-2 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors group"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                        <span className="font-semibold text-slate-700 text-sm">Google</span>
                    </button>
                    <button 
                        onClick={() => { setLoginMethod('phone'); setError(''); }}
                        className="flex items-center justify-center gap-2 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors group"
                    >
                        <Smartphone size={20} className="text-slate-600 group-hover:text-blue-600 transition-colors" />
                        <span className="font-semibold text-slate-700 text-sm">Phone</span>
                    </button>
                </div>
            </>
          )}

          <p className="mt-8 text-center text-xs text-slate-400">
            Protected by Skill U Security. By logging in, you agree to our Terms & Conditions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
