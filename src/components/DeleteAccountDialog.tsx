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

interface DeleteAccountDialogProps {
  onConfirm: () => void;
  isDeleting: boolean;
}

export default function DeleteAccountDialog({ onConfirm, isDeleting }: DeleteAccountDialogProps) {
  return (
    <div>
      <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
        {isDeleting ? "Deleting..." : "Delete Account"}
      </Button>
    </div>
  );
}
```