# Billfold — Billing & Subscription Management

Billfold helps freelancers and small businesses answer three questions for each customer: **What did we agree to charge? What did we bill? How much money have we received?**

For example, a shop pays ₹1,000 per month for website maintenance. One month it requests extra work and pays only part of the bill. In Billfold, the freelancer can open the shop’s profile, find the invoice, and see exactly how much is still due.

This project was built for the Diwali Next.js assignment. It uses Indian rupees and supports monthly, yearly, and one-time pricing.

## Features

| Feature | What you can do |
|---|---|
| **Customers** | Create and edit customer profiles, search by name or contact details, and view each customer’s subscriptions, invoices, and payment history. Archive customers to preserve old billing records. |
| **Products & plans** | Create a service such as *Website Care*. Give it a monthly, yearly, or one-time price. Enable or disable plans as your offerings change. |
| **Subscriptions** | Assign a plan to a customer, track the next billing date, change plans, pause, resume, or cancel. When a renewal is due, select **Renew** to generate its invoice. |
| **Invoices** | Create a bill with multiple items, add a discount and tax, save it as a draft, issue it, and download a numbered PDF. |
| **Payments** | Record full or partial payments against an invoice. Track **Pending**, **Successful**, and **Failed** payments. Only successful payments reduce the outstanding balance. |
| **Dashboard** | View recorded revenue, monthly recurring revenue, active subscriptions, outstanding balances, and renewals due in the next 30 days. Compare monthly amounts billed and collected. |

## Technology

| Part | Technology |
|---|---|
| Frontend | React, JavaScript, and CSS |
| Application framework | Next.js App Router |
| Backend | Next.js Route Handlers |
| Database | PostgreSQL with Prisma |
| Invoice PDFs | `pdf-lib` with fonts for rupees, Gujarati, and Devanagari |
| Tests | Node.js built-in test runner |

## Run locally on Windows

### 1. Open the project

You need **Node.js 22.12 or newer**, npm, and a running PostgreSQL server. To clone the repository, open PowerShell and run:

```powershell
git clone https://github.com/vedantxy/Billing_Subscription_Management.git
cd .\Billing_Subscription_Management\billfold
Test-Path .\package.json
```

The last command should print `True`. If you already have the project, open the `billfold` folder that contains `package.json` and continue from there.

### 2. Create the database

Open **pgAdmin**, connect to your PostgreSQL server, and right-click **Databases**. Select **Create → Database**, enter `billfold` as the database name, and click **Save**.

### 3. Set your database connection

For a fresh setup, create your local settings file:

```powershell
Copy-Item .env.example .env
```

Open `.env` in VS Code. Set `DATABASE_URL` using your own PostgreSQL username and password. This example uses the local `postgres` user and the default port `5432`:

```dotenv
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/billfold"
```

Replace `YOUR_PASSWORD` on your computer. If the password contains `@`, write it as `%40` inside the connection URL. Keep `.env` private. The repository includes `.env.example` so others can configure their own database.

### 4. Install and start the app

```powershell
npm ci
npm run db:setup
npm run dev
```

| Command | What it does |
|---|---|
| `npm ci` | Installs the dependency versions saved in `package-lock.json`. |
| `npm run db:setup` | Generates Prisma Client, applies the database migrations, and adds fictional sample records to an empty database. |
| `npm run dev` | Starts the local development server. Use this command when returning to the project later. |

Open [http://localhost:3000](http://localhost:3000), or the address printed in your terminal. Add a fictional customer and refresh the page to check that PostgreSQL saved the record.

## Five-minute class demonstration

Use one fictional customer, **Patan Prints**, to show how the features work together.

1. Open **Customers** and add Patan Prints with the email `billing@patanprints.example`.
2. Open **Products & plans**. Create a service called **Website Care** and a **Starter** plan costing **₹1,000 per month**.
3. Open **Subscriptions**, select Patan Prints and the Starter plan, and use today as the start date.
4. Open the subscription and choose **New invoice**. The monthly fee appears automatically. Add two hours of extra support at ₹250 per hour, a 10% discount, and an 18% example tax rate.
5. Select **Draft invoice** under **Save as**. Save the draft, open it, and choose **Issue invoice**.

| Invoice calculation | Amount |
|---|---:|
| Monthly website care | ₹1,000 |
| Extra support, 2 hours × ₹250 | ₹500 |
| Subtotal | ₹1,500 |
| Discount, 10% of ₹1,500 | −₹150 |
| Tax, 18% of ₹1,350 | +₹243 |
| **Final invoice** | **₹1,593** |

6. Choose **Record payment** and enter a **Successful** UPI payment of **₹1,000**. The invoice shows **₹593 outstanding**.
7. Enter the remaining ₹593 as **Pending**. The balance stays at ₹593. In **Payments**, open that entry, change it to **Successful**, and select **Update status**.
8. Open the invoice again. Its status is now **Paid**, its balance is **₹0**, and **Download PDF** gives you a copy.

After both payments, Patan Prints contributes **₹1,593 to recorded revenue** and **₹1,000 to monthly recurring revenue (MRR)**. Only the monthly maintenance fee repeats. The dashboard includes all customers, so open the individual invoice to show this shop’s exact figures.

## How the code is organized

All paths below are inside `billfold/`.

| File or folder | Purpose |
|---|---|
| `app/page.jsx` and `app/layout.jsx` | Open the workspace and provide the shared page layout. |
| `components/` | Contains the dashboard, customer lists, forms, and detail windows. |
| `app/api/[[...path]]/route.js` | Receives billing API requests and passes them to the server. |
| `server/commands.mjs` | Handles business actions such as creating subscriptions, issuing invoices, renewing plans, and recording payments. |
| `lib/billing.mjs` | Calculates invoice totals, balances, billing dates, and dashboard metrics. |
| `server/postgres.mjs` | Reads and writes billing records through Prisma. |
| `prisma/schema.prisma` and `prisma/migrations/` | Define the database tables, relationships, and migration history. |
| `server/pdf.mjs` and `public/fonts/invoice/` | Generate downloadable invoice PDFs. |
| `scripts/seed.mjs` and `tests/billing.test.mjs` | Load fictional records and test the billing rules. |

### What happens when you click Record payment?

The form sends `POST /api/payments`. The server checks that the invoice has been issued, the payment date is valid, and the amount fits the remaining balance. Prisma saves the payment in PostgreSQL. The workspace then reloads the records and displays the updated balance.

## Main API routes

| Route | Purpose |
|---|---|
| `/api/customers` | List and create customers. Open `/api/customers/{id}` for a profile and its billing history. |
| `/api/products` and `/api/plans` | Manage services, prices, billing intervals, and availability. |
| `/api/subscriptions` | Create subscriptions. Update an individual subscription to change its status, plan, or billing cycle. |
| `/api/invoices` | Create and read invoices with their items, totals, and payments. |
| `/api/invoices/{id}/pdf` | Download a specific invoice as a PDF. |
| `/api/payments` | Record payments and inspect their status. |
| `/api/dashboard` and `/api/workspace` | Read dashboard totals or the data used by the workspace. |

The UI displays rupees. The API and database store amounts in **paise**, so ₹10.25 is stored as `1025`.

## Tests and production build

Run the billing tests from the `billfold` folder:

```powershell
npm test
```

The nine tests cover billing dates, rounding, partial payments, invoice history, monthly recurring revenue, input validation, and protection against billing the same renewal twice.

To try a production build locally, stop the development server and run:

```powershell
npm run build
npm start
```

## Deploy on Vercel

1. Create a hosted PostgreSQL database.
2. From the `billfold` folder in a trusted terminal or release job, set `DATABASE_URL` to the hosted database’s migration connection. Run `npm run db:migrate` to create or update its tables.
3. Import this GitHub repository into Vercel. Choose **Next.js** and set **Root Directory** to **`billfold`**, the folder containing `package.json`.
4. Add the hosted application connection as `DATABASE_URL` in Vercel’s **Production** environment. Use a separate demo database for preview deployments.
5. Deploy. Open the live URL, create a fictional customer, issue an invoice, record a partial payment, and download its PDF. Refresh to verify that the balance was saved.

## Demo scope

Billfold currently runs as a single shared workspace without an application login. Payments are recorded manually, and an operator triggers a renewal when it is due. Use fictional customer data for the public class demo. Before using real client records, add owner or staff sign-in and protect the API routes and invoice downloads.
