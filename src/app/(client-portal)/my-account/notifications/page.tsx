import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { ACCOUNT_CARD, ACCOUNT_PAGE } from "@/components/account/accountUi";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  return (
    <div className={ACCOUNT_PAGE}>
      <AccountPageHeader
        title="Notifications"
        description="Gérer vos préférences de notification"
        backHref="/my-account"
      />
      <div className={cn(ACCOUNT_CARD, "p-5 sm:p-6")}>
        <p className="text-sm text-neutral-400">
          Fonctionnalité à venir prochainement.
        </p>
      </div>
    </div>
  );
}
