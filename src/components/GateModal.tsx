```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface GateModalProps {
  open: boolean;
  onClose: () => void;
}

export default function GateModal({ open, onClose }: GateModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Free Analysis Limit Reached</DialogTitle>
          <DialogDescription>
            You've used your 5 free analyses. Create a free account to continue.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button asChild>
            <a href="/auth/signup">Create Account</a>
          </Button>
          <Button asChild variant="secondary">
            <a href="/auth/login">Log In</a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```