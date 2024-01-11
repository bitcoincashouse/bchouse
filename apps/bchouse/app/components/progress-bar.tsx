export function ProgressBar({ total = 0, goal = 0, donation = 0 }) {
  // .. update the progress bar and contribution amount
  const contributionBarWidth =
    goal > 0 ? (100 * (total / goal)).toFixed(2) : '0.00'
  const donationBarWidth =
    goal > 0 ? (100 * (donation / goal)).toFixed(2) : '0.00'

  return (
    <div className="progress relative h-1 block w-full br-2 mx-0 mt-2 mb-4 overflow-hidden">
      <div
        className="absolute inset-0 bg-green-400 z-20"
        id="campaignProgressBar"
        style={{ width: `${contributionBarWidth}%` }}
      ></div>
      <div
        className="absolute inset-0 z-10"
        id="campaignContributionBar"
        style={{ left: `${donationBarWidth}`, width: `${donationBarWidth}%` }}
      ></div>
    </div>
  )
}
