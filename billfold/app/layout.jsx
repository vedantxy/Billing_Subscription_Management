import "@fontsource-variable/dm-sans/index.css";
import "./globals.css";
export const metadata = {
  title: "Billfold · Billing workspace",
  description: "Manage customers, subscriptions, invoices and simulated payments in one workspace.",
  icons: { icon: "/billfold.svg" },
};
export default function Layout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
