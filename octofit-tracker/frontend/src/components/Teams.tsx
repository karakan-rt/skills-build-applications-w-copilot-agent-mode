import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Team = { name: string; mascot: string; members: string[] };
type TeamResponse = { teams: Team[] };

export default function Teams() {
  const [data, setData] = useState<TeamResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getJson<TeamResponse>('/api/teams')
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
