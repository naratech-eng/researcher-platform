import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, Mail, Lock, User, Eye, EyeOff, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { connectMetaMask, isMetaMaskInstalled, signMessageWithMetaMask } from "@/lib/web3";
import { MetaMaskIcon } from "@/components/MetaMaskIcon";

const loginSchema = z.object({
  email: z.string().trim().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const signupSchema = z.object({
  email: z.string().trim().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string(),
  fullName: z.string().trim().min(2, { message: "Name must be at least 2 characters" }).max(100),
  role: z.enum(["researcher", "farmer", "student"] as const),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [authView, setAuthView] = useState<"login" | "signup-choice" | "signup-email" | "signup-metamask">("login");

  const resolveAuthRedirectUrl = () => {
    const envRedirect = import.meta.env.VITE_AUTH_REDIRECT_URL?.trim();
    if (envRedirect) {
      return envRedirect.endsWith("/") ? envRedirect : `${envRedirect}/`;
    }

    const hostname = window.location.hostname;
    if (hostname === "app.naratech.xyz") return "https://app.naratech.xyz/";
    if (hostname === "dev-app.naratech.xyz") return "https://dev-app.naratech.xyz/";

    return `${window.location.origin}/`;
  };

  // Redirect if already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });
  }, [navigate]);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginErrors, setLoginErrors] = useState<{ email?: string; password?: string }>({});

  // Signup form state
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showSignupFields, setShowSignupFields] = useState(false);
  const [signupErrors, setSignupErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    fullName?: string;
    role?: string;
    acceptTerms?: string;
  }>({});

  // Handle email input to reveal other fields
  const handleEmailChange = (value: string) => {
    setSignupEmail(value);
    if (value.length > 0 && !showSignupFields) {
      setShowSignupFields(true);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErrors({});
    
    const result = loginSchema.safeParse({ email: loginEmail, password: loginPassword });
    
    if (!result.success) {
      const errors: { email?: string; password?: string } = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0] === "email") errors.email = issue.message;
        if (issue.path[0] === "password") errors.password = issue.message;
      });
      setLoginErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Invalid email or password. Please try again.");
        } else {
          toast.error(error.message);
        }
        return;
      }

      if (data.user) {
        toast.success("Welcome back!");
        navigate("/");
      }
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupErrors({});

    const result = signupSchema.safeParse({
      email: signupEmail,
      password: signupPassword,
      confirmPassword,
      fullName,
      role: selectedRole,
      acceptTerms,
    });

    if (!result.success) {
      const errors: {
        email?: string;
        password?: string;
        confirmPassword?: string;
        fullName?: string;
        role?: string;
        acceptTerms?: string;
      } = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        errors[field as keyof typeof errors] = issue.message;
      });
      setSignupErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const redirectUrl = resolveAuthRedirectUrl();
      
      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            role: selectedRole,
          },
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("This email is already registered. Please login instead.");
        } else {
          toast.error(error.message);
        }
        return;
      }

      if (data.user) {
        toast.success("Account created! Welcome to Animal Genetic Research Hub.");
        navigate("/");
      }
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleMetaMaskLogin = async () => {
    if (!isMetaMaskInstalled()) {
      toast.error("Please install MetaMask to use Web3 authentication.");
      return;
    }

    setLoading(true);
    try {
      const walletAddress = await connectMetaMask();
      
      // Create a message to sign
      const message = `Sign this message to authenticate with AGRH.\n\nWallet: ${walletAddress}\nTimestamp: ${Date.now()}`;
      const signature = await signMessageWithMetaMask(walletAddress, message);

      // For now, we'll use the wallet address as a unique identifier
      // In production, you'd verify the signature on the backend
      const { data, error } = await supabase.auth.signInWithPassword({
        email: `${walletAddress.toLowerCase()}@web3.agrh`,
        password: signature.slice(0, 72), // Use part of signature as password
      });

      if (error) {
        // If account doesn't exist, show message
        toast.error("Account not found. Please sign up first with your MetaMask wallet.");
      } else if (data.user) {
        toast.success("Successfully authenticated with MetaMask.");
        navigate("/");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to authenticate with MetaMask.");
    } finally {
      setLoading(false);
    }
  };

  const handleMetaMaskSignup = async () => {
    if (!selectedRole) {
      setSignupErrors({ role: "Please select a role" });
      return;
    }

    if (!acceptTerms) {
      setSignupErrors({ acceptTerms: "You must accept the terms and conditions" });
      return;
    }

    if (!isMetaMaskInstalled()) {
      toast.error("Please install MetaMask to use Web3 authentication.");
      return;
    }

    setLoading(true);
    try {
      const walletAddress = await connectMetaMask();
      
      // Create a message to sign
      const message = `Sign this message to create an account with AGRH.\n\nWallet: ${walletAddress}\nTimestamp: ${Date.now()}`;
      const signature = await signMessageWithMetaMask(walletAddress, message);

      const redirectUrl = resolveAuthRedirectUrl();
      
      // Create account using wallet address
      const { data, error } = await supabase.auth.signUp({
        email: `${walletAddress.toLowerCase()}@web3.agrh`,
        password: signature.slice(0, 72), // Use part of signature as password
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: `User ${walletAddress.slice(0, 6)}`,
            wallet_address: walletAddress,
            role: selectedRole,
          },
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("This wallet is already registered. Please login instead.");
        } else {
          toast.error(error.message);
        }
        return;
      }

      if (data.user) {
        toast.success("Account created! Welcome to Animal Genetic Research Hub.");
        navigate("/");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to sign up with MetaMask.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-pink-500 via-fuchsia-600 to-purple-700 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(white,transparent_70%)]" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">AGRH</h1>
          </div>
          <div className="space-y-4 max-w-md">
            <h2 className="text-4xl font-bold text-white leading-tight">
              Welcome to Animal Genetic Research Hub
            </h2>
            <p className="text-white/90 text-lg">
              Empowering researchers, farmers, and students with cutting-edge AI-driven insights
              for animal genetics and breeding excellence.
            </p>
          </div>
        </div>
        
        <div className="relative z-10 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">AI-Powered Insights</h3>
              <p className="text-white/80 text-sm">
                Get intelligent recommendations for breeding decisions
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Collaborative Research</h3>
              <p className="text-white/80 text-sm">
                Connect with researchers and share findings
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Forms */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-950 relative overflow-hidden">
        {/* Gradient glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-fuchsia-900/10 to-transparent pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="w-full max-w-md relative z-10">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-purple-700 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">AGRH</h1>
          </div>

          {/* Login View */}
          {authView === "login" && (
            <Card>
              <CardHeader>
                <CardTitle>Welcome back</CardTitle>
                <CardDescription>
                  Enter your credentials to access your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="researcher@example.com"
                        className="pl-10"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                    {loginErrors.email && (
                      <p className="text-sm text-destructive">{loginErrors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-10 pr-10"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {loginErrors.password && (
                      <p className="text-sm text-destructive">{loginErrors.password}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Logging in..." : "Login"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                        Or
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full relative overflow-hidden group"
                    onClick={handleMetaMaskLogin}
                    disabled={loading}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <MetaMaskIcon className="h-5 w-5 mr-2 relative z-10" />
                    <span className="relative z-10">
                      {loading ? "Connecting..." : "Login with MetaMask"}
                    </span>
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Don't have an account?{" "}
                    <button
                      onClick={() => setAuthView("signup-choice")}
                      className="text-primary font-medium hover:underline"
                    >
                      Sign up
                    </button>
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Signup Choice View */}
          {authView === "signup-choice" && (
            <Card>
              <CardHeader>
                <CardTitle>Create an account</CardTitle>
                <CardDescription>
                  Choose how you want to sign up
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full h-auto py-6 flex items-center justify-between group relative overflow-hidden border-2 hover:border-primary/50 transition-all"
                  onClick={() => setAuthView("signup-email")}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-left">
                      <span className="font-semibold text-base block">Continue with Email</span>
                      <span className="text-xs text-muted-foreground">
                        Sign up using your email address
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all relative z-10" />
                </Button>

                <Button
                  variant="outline"
                  className="w-full h-auto py-6 flex items-center justify-between group relative overflow-hidden border-2 hover:border-orange-500/50 transition-all"
                  onClick={() => setAuthView("signup-metamask")}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-amber-500/5 to-orange-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <MetaMaskIcon className="h-8 w-8" />
                    </div>
                    <div className="text-left">
                      <span className="font-semibold text-base block">Continue with MetaMask</span>
                      <span className="text-xs text-muted-foreground">
                        Sign up using your Web3 wallet
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all relative z-10" />
                </Button>

                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <button
                      onClick={() => setAuthView("login")}
                      className="text-primary font-medium hover:underline"
                    >
                      Login
                    </button>
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Email Signup View */}
          {authView === "signup-email" && (
            <Card>
              <CardHeader>
                <button
                  onClick={() => setAuthView("signup-choice")}
                  className="text-sm text-muted-foreground hover:text-foreground mb-2 flex items-center gap-1"
                >
                  ← Back to options
                </button>
                <CardTitle>Sign up with Email</CardTitle>
                <CardDescription>
                  Create your account to get started
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="researcher@example.com"
                        className="pl-10"
                        value={signupEmail}
                        onChange={(e) => handleEmailChange(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                    {signupErrors.email && (
                      <p className="text-sm text-destructive">{signupErrors.email}</p>
                    )}
                  </div>

                  {showSignupFields && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-name"
                            type="text"
                            placeholder="Dr. Jane Smith"
                            className="pl-10"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            disabled={loading}
                          />
                        </div>
                        {signupErrors.fullName && (
                          <p className="text-sm text-destructive">{signupErrors.fullName}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-role">Select Your Role *</Label>
                        <Select value={selectedRole} onValueChange={setSelectedRole} disabled={loading}>
                          <SelectTrigger id="signup-role">
                            <SelectValue placeholder="Choose your role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="researcher">Researcher</SelectItem>
                            <SelectItem value="farmer">Farmer</SelectItem>
                            <SelectItem value="student">Student</SelectItem>
                          </SelectContent>
                        </Select>
                        {signupErrors.role && (
                          <p className="text-sm text-destructive">{signupErrors.role}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Create a strong password"
                            className="pl-10 pr-10"
                            value={signupPassword}
                            onChange={(e) => setSignupPassword(e.target.value)}
                            disabled={loading}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        {signupErrors.password && (
                          <p className="text-sm text-destructive">{signupErrors.password}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="confirm-password"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm your password"
                            className="pl-10 pr-10"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={loading}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        {signupErrors.confirmPassword && (
                          <p className="text-sm text-destructive">{signupErrors.confirmPassword}</p>
                        )}
                      </div>

                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="terms-email"
                          checked={acceptTerms}
                          onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                          disabled={loading}
                        />
                        <label
                          htmlFor="terms-email"
                          className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          I accept the{" "}
                          <a href="/terms" className="text-primary underline">
                            terms and conditions
                          </a>
                        </label>
                      </div>
                      {signupErrors.acceptTerms && (
                        <p className="text-sm text-destructive">{signupErrors.acceptTerms}</p>
                      )}

                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Creating account..." : "Create Account"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          )}

          {/* MetaMask Signup View */}
          {authView === "signup-metamask" && (
            <Card>
              <CardHeader>
                <button
                  onClick={() => setAuthView("signup-choice")}
                  className="text-sm text-muted-foreground hover:text-foreground mb-2 flex items-center gap-1"
                >
                  ← Back to options
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center">
                    <MetaMaskIcon className="h-8 w-8" />
                  </div>
                  <div>
                    <CardTitle>Sign up with MetaMask</CardTitle>
                    <CardDescription>
                      Connect your wallet to create an account
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="web3-role">Select Your Role *</Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole} disabled={loading}>
                    <SelectTrigger id="web3-role">
                      <SelectValue placeholder="Choose your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="researcher">Researcher</SelectItem>
                      <SelectItem value="farmer">Farmer</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                    </SelectContent>
                  </Select>
                  {signupErrors.role && (
                    <p className="text-sm text-destructive">{signupErrors.role}</p>
                  )}
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms-web3"
                    checked={acceptTerms}
                    onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                    disabled={loading}
                  />
                  <label
                    htmlFor="terms-web3"
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I accept the{" "}
                    <a href="/terms" className="text-primary underline">
                      terms and conditions
                    </a>
                  </label>
                </div>
                {signupErrors.acceptTerms && (
                  <p className="text-sm text-destructive">{signupErrors.acceptTerms}</p>
                )}

                <Button
                  type="button"
                  className="w-full relative overflow-hidden group bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
                  onClick={handleMetaMaskSignup}
                  disabled={loading}
                >
                  <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <MetaMaskIcon className="h-5 w-5 mr-2 relative z-10" />
                  <span className="relative z-10">
                    {loading ? "Connecting..." : "Connect MetaMask & Sign Up"}
                  </span>
                </Button>

                <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                  <p className="font-medium mb-2">What happens next?</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>MetaMask will open</li>
                    <li>You'll be asked to connect your wallet</li>
                    <li>Sign a message to verify ownership</li>
                    <li>Your account will be created</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
