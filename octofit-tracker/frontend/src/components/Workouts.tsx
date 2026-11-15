import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Workout = { title: string; focus: string; minutes: number; difficulty: string; reason: string };
type WorkoutResponse = { suggestions: Workout[] };

export default function Workouts() {
  const [data, setData] = useState<WorkoutResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getJson<WorkoutResponse>('/api/workouts/suggestions/mona@example.com')
      .then((response) => {
        if (active) setData(response);
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Unknown request error');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns." loading={loading} error={error}>
      {data?.suggestions.length ? (
        <ul>
          {data.suggestions.map((workout) => (
            <li key={workout.title}>
              <strong>{workout.title}</strong> - {workout.focus}, {workout.minutes} minutes, {workout.difficulty}
              <p>{workout.reason}</p>
            </li>
          ))}
        </ul>
      ) : <p>No workout suggestions yet.</p>}
    </CapabilityCard>
  );
}
