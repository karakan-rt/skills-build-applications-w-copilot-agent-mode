import { CapabilityCard } from './CapabilityCard.js';
import { useApiResource } from '../api/useApiResource.js';

type Team = { name: string; mascot: string; members: string[] };
type TeamResponse = { teams: Team[] };

export default function Teams() {
  const { data, error, loading } = useApiResource<TeamResponse>('/api/teams');
  return (
    <CapabilityCard title="Teams" description="Manage teams and members." loading={loading} error={error}>
      {data?.teams.length ? (
        <ul>
          {data.teams.map((team) => (
            <li key={team.name}>
              {team.name} - {team.mascot}
              {team.members.length ? <span> (Members: {team.members.join(', ')})</span> : null}
            </li>
          ))}
        </ul>
      ) : <p>No teams yet.</p>}
    </CapabilityCard>
  );
}
