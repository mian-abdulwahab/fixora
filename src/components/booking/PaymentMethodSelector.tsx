import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Smartphone, Building2, Banknote } from "lucide-react";

interface PaymentMethodSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const PAYMENT_METHODS = [
  {
    id: "jazzcash",
    label: "JazzCash",
    description: "Pay via JazzCash mobile wallet",
    icon: Smartphone,
    color: "text-red-600",
    details: "Account: 03XX-XXXXXXX",
  },
  {
    id: "easypaisa",
    label: "Easypaisa",
    description: "Pay via Easypaisa mobile wallet",
    icon: Smartphone,
    color: "text-green-600",
    details: "Account: 03XX-XXXXXXX",
  },
  {
    id: "bank_transfer",
    label: "Bank Transfer",
    description: "Direct bank transfer / online banking",
    icon: Building2,
    color: "text-blue-600",
    details: "Account details will be shared after confirmation",
  },
  {
    id: "cash",
    label: "Cash on Service",
    description: "Pay cash when the job is done",
    icon: Banknote,
    color: "text-emerald-600",
    details: "Pay directly to the provider",
  },
];

const PaymentMethodSelector = ({ value, onChange }: PaymentMethodSelectorProps) => {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Payment Method *</Label>
      <RadioGroup value={value} onValueChange={onChange} className="space-y-2">
        {PAYMENT_METHODS.map((method) => {
          const Icon = method.icon;
          const isSelected = value === method.id;
          return (
            <label
              key={method.id}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-primary/30 hover:bg-secondary/50"
              }`}
            >
              <RadioGroupItem value={method.id} className="shrink-0" />
              <div className={`w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 ${method.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm">{method.label}</p>
                <p className="text-xs text-muted-foreground">{method.description}</p>
              </div>
            </label>
          );
        })}
      </RadioGroup>
    </div>
  );
};

export default PaymentMethodSelector;
export { PAYMENT_METHODS };
