import { redirect } from "next/navigation";

import { accountLoginAction, loginAction } from "@/app/actions";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getSessionUser();

  if (user) {
    redirect(user.shop ? "/dashboard" : "/onboarding/shop");
  }

  const availableUsers = await prisma.user.findMany({
    where: {
      shop: {
        is: {
          status: "ACTIVE",
        },
      },
    },
    include: {
      shop: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const params = (await searchParams) ?? {};
  const error = typeof params.error === "string" ? params.error : null;

  return (
    <main className="auth-layout">
      <section className="auth-card">
        <div className="stack">
          <div>
            <span className="tag">Bazaarly</span>
            <h1>Enter the global marketplace.</h1>
            <p className="muted">
              Log in with an existing shop owner or create a new local account and
              build your own store from scratch.
            </p>
          </div>

          {error ? (
            <div className="status-banner status-banner--error">
              <div>
                <h3>Something needs attention</h3>
                <p>{error}</p>
              </div>
            </div>
          ) : null}

          <div className="stack-sm">
            <h2>Available accounts</h2>
            <div className="auth-account-list">
              {availableUsers.map((account) => (
                <form key={account.id} action={accountLoginAction} className="auth-account-item">
                  <input type="hidden" name="userId" value={account.id} />
                  <div className="section-row">
                    <div>
                      <strong>{account.displayName}</strong>
                      <p className="muted">
                        @{account.username} · {account.shop?.name ?? "No shop yet"}
                      </p>
                    </div>
                    <button type="submit">Use account</button>
                  </div>
                </form>
              ))}
            </div>
          </div>
        </div>

        <div className="stack">
          <div className="card">
            <h2>Quick login</h2>
            <p className="muted">Use an existing username or email to jump into the shared world.</p>
            <form action={loginAction} className="stack-sm">
              <input type="hidden" name="mode" value="login" />
              <label>
                Username or email
                <input name="username" placeholder="avery or avery@bazaarly.local" required />
              </label>
              <button type="submit">Log in</button>
            </form>
          </div>

          <div className="card">
            <h2>Create a new player</h2>
            <p className="muted">
              New accounts start with shop setup so you can immediately enter the economy.
            </p>
            <form action={loginAction} className="stack-sm">
              <input type="hidden" name="mode" value="register" />
              <label>
                Display name
                <input name="displayName" placeholder="Taylor" required />
              </label>
              <label>
                Username
                <input name="username" placeholder="taylor" required />
              </label>
              <label>
                Email
                <input name="email" type="email" placeholder="taylor@bazaarly.local" required />
              </label>
              <button type="submit">Create account</button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
