import { refundFullAccessSurcharges } from "../lib/full-access-refunds";

async function main() {
  const result = await refundFullAccessSurcharges();
  console.log(
    `Full Access refund complete: ${result.refundedUsers} users, ${result.refundedCents} cents refunded.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
