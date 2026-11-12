import { CapabilityCard } from './CapabilityCard.js';
import { useApiResource } from '../api/useApiResource.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };
type LeaderboardResponse = { leaderboard: LeaderboardEntry[] };

export default function Leaderboard() {
  const { data, error, loading } = useApiResource<LeaderboardResponse>('/api/leaderboard');
  return (
    <CapabilityCard title="Leaderboard" description="Compare team point totals." loading={loading} error={error}>
      {data?.leaderboard.length ? (
        <ol>
          {data.leaderboard.map((entry) => (
            <li key={entry.rank}>{entry.teamName} - {entry.totalPoints} points</li>
          ))}
        </ol>
      ) : <p>No leaderboard rankings yet.</p>}
    </CapabilityCard>
  );
}
