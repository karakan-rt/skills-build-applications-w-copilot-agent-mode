import { CapabilityCard } from './CapabilityCard.js';
import { useApiResource } from '../api/useApiResource.js';

type Workout = { title: string; focus: string; minutes: number; difficulty: string; reason: string };
type WorkoutResponse = { suggestions: Workout[] };

export default function Workouts() {
  const { data, error, loading } = useApiResource<WorkoutResponse>('/api/workouts/suggestions/mona%40example.com');
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
