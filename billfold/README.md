# Billfold

A single-business billing workspace built for the Diwali Next.js assignment. A customer can have several subscriptions and invoices. Each invoice has its own line items and payment history. The dashboard updates when you change these records.

## Run it on Windows

You need Node.js 22.12 or newer and a PostgreSQL database. If you use pgAdmin, create an empty database named `billfold` first.

1. Extract the ZIP, open the `billfold` folder in VS Code and open a PowerShell terminal there.
2. Install the dependencies and make your local settings file.

   ```powershell
   npm ci
   Copy-Item .env.example .env
   ```

3. Open `.env`. Set `DATABASE_URL` to your PostgreSQL connection string. Replace the username and password placeholders. URL-encode special characters in the password.
4. Create the tables, add the fictional demo records and start the app.

   ```powershell
   npm run db:setup
   npm run dev
   ```

5. Open [localhost:3000](http://localhost:3000). Records stay in PostgreSQL when you restart. To start with empty tables, use `npm run db:migrate` instead of `npm run db:setup`.

The sample data uses rupees and dates relative to the day you seed it. Running the seed again skips a populated database. Use `npm test` to run the billing-rule tests. Use `npm run build` and then `npm start` to run the production build locally.

## A five-minute demonstration

1. Open **Customers → New customer** and add a fictional business with an email address.
2. In **Products & plans**, add a product called *Website care*. Add a monthly *Starter* plan for ₹1,000 and a yearly *Studio* plan for ₹18,000.
3. In **Subscriptions**, choose the customer and the monthly plan. Look at the start date and next billing date. The subscription adds ₹1,000 to monthly recurring revenue.
4. Open that subscription and click **New invoice**. Its ₹1,000 line appears automatically. Add two hours of support at ₹250 each. Enter a 10% discount and 18% tax. The subtotal is ₹1,500, the discount is ₹150, the tax is ₹243 and the total is **₹1,593**.
5. Save as a draft. Open it, choose **Issue invoice**, then **Record payment**. Record a successful ₹1,000 payment. The balance is **₹593**. Add a pending ₹593 payment and change it to successful from **Payments**. The invoice becomes **Paid**. Download its PDF.
6. Return to **Overview** to see revenue and outstanding balances change. Open the subscription and change to the yearly plan. Its new monthly contribution is ₹1,500 and the original invoice still shows the old price.

To demonstrate renewal, open the seeded *Paperplane Studio* subscription and choose **Renew** when due. Billfold creates one invoice and advances the next billing date. You can also pause, resume, mark past due or cancel a subscription.

## What to explain in your viva

| Question | How Billfold works |
| --- | --- |
| How does the frontend reach the database? | The React workspace calls a Next.js Route Handler under `/api`. The server validates the request and writes through Prisma. The browser never receives the database URL. |
| How is revenue different from MRR? | Recorded revenue adds successful payments. MRR adds active monthly prices and one twelfth of active yearly prices. One-time purchases contribute to recorded revenue when paid. |
| Why store money as paise? | ₹10.25 is stored as the integer 1025. Discounts and taxes are rounded to a whole paise. Tax applies after discount. Both percentage rates are entered by the user. |
| What happens on partial payment? | The remaining balance is the invoice total minus successful payments. An issued invoice becomes paid at zero balance. An open invoice becomes overdue the day after its due date in India. |
| What happens if a request is sent twice? | Each form sends a request key. The server stores the result in the same transaction as the change. A retry returns that result. A transaction lock also prevents two requests from settling the same balance or allocating the same invoice number. |
| What happens when a price changes? | A subscription holds its agreed terms. A new plan applies at the existing next billing date, without proration. Invoices keep a snapshot of the customer's billing details and each line's price. |
| How do you remove customers? | Unused profiles can be deleted. Cancel outstanding subscriptions first. Removing a customer with billing history archives the profile so that invoices and payments remain traceable. |

## Project map

| Location | Purpose |
| --- | --- |
| `app/page.jsx`, `app/layout.jsx` | App Router entry point, page metadata and styles |
| `components/` | Dashboard, charts, searchable lists, forms and details |
| `app/api/[[...path]]/route.js` | HTTP entry point for the billing resources |
| `server/http.mjs`, `server/commands.mjs` | HTTP responses, input checks, state transitions and renewal rules |
| `lib/billing.mjs` | Shared date, money, invoice and dashboard calculations |
| `server/postgres.mjs` | Prisma reads, transactions and idempotency |
| `prisma/schema.prisma`, `prisma/migrations/` | Normalized schema, relations, uniqueness and amount/date constraints |
| `server/pdf.mjs` | Multi-page PDF invoices with rupee and Indian-script font support |
| `scripts/seed.mjs`, `tests/` | Demo records and repeatable billing-rule checks |

## API

| Resource | Operations |
| --- | --- |
| `/api/customers`, `/api/customers/:id` | List, create, read profile and linked history, edit, delete or archive, restore |
| `/api/products`, `/api/plans` | List or create. Use `PATCH /:id` to edit details, prices and availability |
| `/api/subscriptions`, `/api/subscriptions/:id` | List, create and view. Patch with `status`, `change_plan` or `renew` actions |
| `/api/invoices`, `/api/invoices/:id` | List, create, view totals and payment history, issue a draft |
| `/api/invoices/:id/pdf` | Download a real PDF |
| `/api/payments`, `/api/payments/:id` | List, record and inspect simulated payments, update payment status |
| `/api/dashboard`, `/api/workspace` | Read analytics or the consistent single-workspace snapshot used by the UI |

Mutations accept JSON and an optional `Idempotency-Key` header. A repeated key must use the same method, resource and payload. The API returns readable validation messages with 400, 404 or 409 status codes.

## Submit on GitHub and Vercel

1. Create a GitHub repository in your account and push the extracted project. Include `package-lock.json` and `prisma/migrations`. Keep `.env` private. The included `.gitignore` excludes it.
2. Create or select a hosted PostgreSQL database for the assignment. In a trusted terminal, set `DATABASE_URL` to its connection string and run `npm run db:migrate`. If your provider distinguishes direct and pooled connections, use its direct connection for migrations. Run `npm run db:seed` once if you want the sample workspace.
3. In Vercel, import the GitHub repository, choose **Next.js** and add the hosted `DATABASE_URL` to the production environment. Use the provider's pooled application connection if available. Keep the default Next.js output settings. The project's `npm run build` script generates Prisma Client before building Next.js.
4. Deploy, open the deployment, create a demo customer and refresh to verify persistence. Submit the GitHub repository URL and the Vercel deployment URL.

The assignment uses a single workspace with simulated payments and no application login. Use fictional data in the shared demonstration. Payment methods are labels only. Renewals run when you choose **Renew**. [Vercel deployment documentation](https://vercel.com/docs/deployments)
