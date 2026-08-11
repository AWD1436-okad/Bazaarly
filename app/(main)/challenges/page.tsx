import Link from "next/link";
import { redirect } from "next/navigation";

import { ChallengeCountdown } from "@/components/challenge-countdown";
import { SimulationHeartbeat } from "@/components/simulation-heartbeat";
import { requireUser } from "@/lib/auth";
import { getDashboardChallenges } from "@/lib/challenges";
import { getActiveCurrencyCode } from "@/lib/price-profiles";
import { prisma } from "@/lib/prisma";

export default async function ChallengesPage() {
  const user = await requireUser();
  const currencyCode = await getActiveCurrencyCode(user.id);

  if (!user.shop) {
    redirect("/onboarding/shop");
  }

  const activeListingCount = await prisma.listing.count({
    where: {
      shopId: user.shop.id,
      quantity: { gt: 0 },
      active: true,
      isPaused: false,
    },
  });

  const challengeSet = await getDashboardChallenges({
    userId: user.id,
    shopId: user.shop.id,
    currencyCode,
    activeListingCount,
    playerMode: "ADVANCED",
  });

  const completedCount = challengeSet.challenges.filter((challenge) => challenge.completed).length;
  const playSmarterText = "Sell items, list stock, keep shelves active, and grow profit after costs.";

  return (
    <div className="page-grid challenges-page">
      <SimulationHeartbeat intervalMs={70000} initialDelayMs={12000} />
      <section className="page-header">
        <h1>Challenges</h1>
      </section>

      <section className="card challenge-hero-card">
        <div className="section-row">
          <div>
            <h2>Current set</h2>
            <p>
              <strong>{completedCount} of {challengeSet.challenges.length}</strong> done
              {`. ${challengeSet.stage} challenges.`}
            </p>
          </div>
          <ChallengeCountdown
            key={challengeSet.cycleEndsAt.toISOString()}
            cycleEndsAt={challengeSet.cycleEndsAt.toISOString()}
            initialSeconds={challengeSet.secondsRemaining}
          />
        </div>
      </section>

      <section className="challenge-list challenge-list--full">
        {challengeSet.challenges.map((challenge) => (
          <article
            key={challenge.key}
            className={challenge.completed ? "challenge-row challenge-row--completed" : "challenge-row"}
          >
            <div className="challenge-row__header">
              <div className="table-row__meta">
                <strong>{challenge.label}</strong>
                <span className="muted">
                  {challenge.completed ? "Completed until reset" : challenge.progressLabel}
                </span>
              </div>
              <div className="challenge-row__badges">
                <span className={`tag challenge-difficulty challenge-difficulty--${challenge.difficulty.toLowerCase().replace(/\s+/g, "-")}`}>
                  {challenge.difficulty}
                </span>
                <span className={challenge.rewarded ? "tag challenge-row__rewarded" : "tag"}>
                  {challenge.rewarded ? "Rewarded" : `Reward ${challenge.rewardLabel} + ${challenge.rewardXp} XP`}
                </span>
              </div>
            </div>
            <div className="challenge-progress" aria-label={`${Math.round(challenge.ratio * 100)}% complete`}>
              <span style={{ width: `${Math.round(challenge.ratio * 100)}%` }} />
            </div>
          </article>
        ))}
      </section>

      <section className="card">
        <div className="section-row">
          <div>
            <h2>Play smarter</h2>
            <p>{playSmarterText}</p>
          </div>
          <Link href="/dashboard" className="ghost-button">
            Back to dashboard
          </Link>
        </div>
      </section>
    </div>
  );
}
