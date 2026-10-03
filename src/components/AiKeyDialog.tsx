import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ExternalLink, KeyRound, Loader2, ShieldCheck, Sparkles, Trash2 } from "lucide-react";
import { getGroqKey, openAiSettings, setGroqKey } from "@/lib/demoMode";
import { listGroqModels } from "@/lib/groqClient";
import { toast } from "sonner";

const AiKeyDialog = () => {
  const [open, setOpen] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [testing, setTesting] = useState(false);
  const [savedKey, setSavedKey] = useState(() => getGroqKey());

  useEffect(() => {
    const openHandler = () => {
      setSavedKey(getGroqKey());
      setOpen(true);
    };
    window.addEventListener("skillquest:ai-settings", openHandler);
    return () => window.removeEventListener("skillquest:ai-settings", openHandler);
  }, []);

  const handleSave = async () => {
    const candidate = keyInput.trim();
    if (!candidate) {
      toast.error("Paste your Groq API key first", { description: "Keys start with gsk_ and are free at console.groq.com" });
      return;
    }
    setTesting(true);
    try {
      const model = await listGroqModels(candidate);
      setGroqKey(candidate);
      setSavedKey(candidate);
      setKeyInput("");
      toast.success("Groq key verified & saved", {
        description: `Live AI is now on in this browser (model: ${model}).`,
      });
    } catch (error) {
      toast.error("Key check failed", {
        description: error instanceof Error ? error.message : "Could not verify this key with Groq.",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleRemove = () => {
    setGroqKey(null);
    setSavedKey("");
    toast.info("Groq key removed", { description: "The site will use built-in offline AI again." });
  };

  const maskedKey = savedKey ? `${savedKey.slice(0, 7)}...${savedKey.slice(-4)}` : "";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Settings
          </DialogTitle>
          <DialogDescription>
            This hosted demo runs entirely in your browser. Add your own free Groq API key to enable live AI, or keep using the smart built-in offline engine.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-secondary/40 p-3 text-sm space-y-1.5">
            <p className="flex items-center gap-2 font-medium">
              {savedKey ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Live Groq AI is active
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4 text-amber-500" />
                  Offline AI is active — every feature still works
                </>
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              Your key is stored only in this browser's localStorage and sent directly to Groq. It is never uploaded, committed, or shared — this site ships without any API key.
            </p>
          </div>

          {savedKey && (
            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
              <div className="flex items-center gap-2 text-sm">
                <KeyRound className="h-4 w-4 text-primary" />
                <span className="font-mono">{maskedKey}</span>
                <Badge variant="secondary">your browser only</Badge>
              </div>
              <Button variant="ghost" size="sm" onClick={handleRemove} className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="groq-key">Groq API key</Label>
            <Input
              id="groq-key"
              type="password"
              placeholder="gsk_..."
              value={keyInput}
              onChange={(event) => setKeyInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !testing) void handleSave();
              }}
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              Get a free key in under a minute at{" "}
              <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary underline">
                console.groq.com/keys <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          </div>

          <Button onClick={handleSave} disabled={testing} className="w-full bg-gradient-hero hover:opacity-90 shadow-glow">
            {testing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying key with Groq...
              </>
            ) : (
              "Test & save key"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AiKeyDialog;
