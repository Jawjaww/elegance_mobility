import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { ClientInstallCard } from "@/components/account/ClientInstallCard";
import { ClientPushSetup } from "@/components/account/ClientPushSetup";
import { ACCOUNT_CARD, ACCOUNT_PAGE } from "@/components/account/accountUi";
import { cn } from "@/lib/utils";

/**
 * Notification settings for the client portal.
 *
 * Settings only, on purpose. The page used to end with a "Historique" list of past
 * notifications, read from `notifications` and kept live by a Realtime subscription. It was
 * removed on request, and the machinery went with it: `fetchUserNotifications` and
 * `markNotificationRead` existed solely to feed that list, and nothing else in the app read
 * the table. Keeping a Realtime channel open on every visit to show a list nobody acts on is
 * the kind of cost that outlives its feature.
 *
 * It is a server component now that no hook remains: the two cards below are the only
 * interactive parts, and they bring their own client boundary.
 */
export default function NotificationsPage() {
  return (
    <div className={ACCOUNT_PAGE}>
      <AccountPageHeader
        title="Notifications"
        description="Alertes course et préférences push"
        backHref="/my-account"
      />

      <div className={cn(ACCOUNT_CARD, "p-5 sm:p-6 mb-4")}>
        <ClientPushSetup />
      </div>

      <div className={cn(ACCOUNT_CARD, "p-5 sm:p-6")}>
        <ClientInstallCard />
      </div>
    </div>
  );
}
