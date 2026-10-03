import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const Auth = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { user, loading, login, register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const destination = (location.state as { from?: string } | null)?.from || "/dashboard";

  if (loading) return <div className="min-h-screen bg-gradient-subtle" />;
  if (user) return <Navigate to={destination} replace />;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      if (isRegistering) await register(displayName, email, password);
      else await login(email, password);
      navigate(destination, { replace: true });
    } catch (error) {
      toast({
        title: isRegistering ? "Account creation failed" : "Sign in failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-subtle flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
        <Card className="shadow-elevated">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-hero shadow-glow">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-2xl">{isRegistering ? "Create your account" : "Welcome back"}</CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">
                {isRegistering ? "Your career profile stays with your account." : "Sign in to continue your career journey."}
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={submit}>
              {isRegistering && (
                <div className="space-y-2">
                  <Label htmlFor="display-name">Full name</Label>
                  <Input id="display-name" autoComplete="name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} required minLength={2} maxLength={80} />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" autoComplete={isRegistering ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} maxLength={128} />
                {isRegistering && <p className="text-xs text-muted-foreground">Use at least 8 characters.</p>}
              </div>
              <Button className="w-full bg-gradient-hero" type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isRegistering ? "Create account" : "Sign in"}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              {isRegistering ? "Already have an account?" : "New to AI Career Navigator?"}{" "}
              <button type="button" className="font-medium text-primary hover:underline" onClick={() => setIsRegistering((current) => !current)}>
                {isRegistering ? "Sign in" : "Create an account"}
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default Auth;