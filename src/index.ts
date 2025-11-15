import { FragmentTon } from './app/methods/ton';
import { FragmentPremium } from './app/methods/premium';
import { FragmentStars } from './app/methods/stars';

async function topupTonExample(): Promise<void> {
 console.log("Starting TON topup example");

  const tonClient = new FragmentTon();
  // @lovly - target username, 5 - TON amount (integer 1-1000000 (one billion))
  const result = await tonClient.topupTon("@lovly", 5);

  if (result.success) {
    const data = result.data;
    console.log(`TON topup successful: ${data.amount} TON sent to ${data.username}`);
    console.log(`Transaction ID: ${data.transaction_id}`);
  } else {
    console.error(`TON topup failed: ${result.error}`);
  }
}

async function buyPremiumExample(): Promise<void> {
  console.log("Starting Premium purchase example");

  const premiumClient = new FragmentPremium();
  // @lovly - target username, 6 - months duration (3, 6, or 12 only)
  const result = await premiumClient.buyPremium("@lovly", 6);

  if (result.success) {
    const data = result.data;
    console.log(`Premium purchase successful: ${data.months} months sent to ${data.username}`);
    console.log(`Transaction ID: ${data.transaction_id}`);
  } else {
    console.error(`Premium purchase failed: ${result.error}`);
  }
}

async function buyStarsExample(): Promise<void> {
  console.log("Starting Stars purchase example");

  const starsClient = new FragmentStars();
  // @lovly - target username, 50 - stars amount (integer 50-1000000 (one million))
  const result = await starsClient.buyStars("@lovly", 50);

  if (result.success) {
    const data = result.data;
    console.log(`Stars purchase successful: ${data.amount} stars sent to ${data.username}`);
    console.log(`Transaction ID: ${data.transaction_id}`);
  } else {
    console.error(`Stars purchase failed: ${result.error}`);
  }
}

async function main(): Promise<void> {
  console.log("Starting Fragment API by @lovly - examples");

  await topupTonExample();
  await buyPremiumExample();
  await buyStarsExample();

  console.log("All examples completed");
}

console.log("Fragment API by @lovly - Usage Examples");
console.log("Supported username formats: @username, username");
console.log("Limits: TON minimum 1, Premium 3/6/12 months, Stars minimum 50");
console.log("Setup: Copy .env.example to .env and fill all fields");

main().catch(console.error);