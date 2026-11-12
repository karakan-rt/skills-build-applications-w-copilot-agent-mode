import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function badRequest(message: string): never {
  throw Object.assign(new Error(message), { status: 400 });
}

function notFound(message: string): never {
  throw Object.assign(new Error(message), { status: 404 });
}

function validId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f\d]{24}$/i.test(value) && mongoose.isValidObjectId(value);
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) badRequest('Activity data must be an object');
  const { userId, teamId, type, minutes } = input;

  if (!validId(userId) || !validId(teamId)) badRequest('A valid userId and teamId are required');
  if (typeof type !== 'string' || !type.trim()) badRequest('Activity type is required');
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    badRequest('Minutes must be a positive number');
  }

  const [user, team] = await Promise.all([User.findById(userId), Team.findById(teamId)]);
  if (!user || !team) notFound('The specified user or team does not exist');

  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)) badRequest('Team data must be an object');
  const { name, mascot } = input;
  const members = input.members ?? [];

  if (typeof name !== 'string' || !name.trim()) badRequest('Team name is required');
  if (typeof mascot !== 'string' || !mascot.trim()) badRequest('Team mascot is required');
  if (!Array.isArray(members) || !members.every(validId)) {
    badRequest('Team members must be an array of valid user IDs');
  }

  if (members.length > 0) {
    const existingMembers = await User.countDocuments({ _id: { $in: members } });
    if (existingMembers !== new Set(members).size) notFound('One or more team members do not exist');
  }

  return Team.create({ name: name.trim(), mascot: mascot.trim(), members });
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([
    Team.find().select('name').lean(),
    Activity.aggregate<{ _id: mongoose.Types.ObjectId; totalPoints: number }>([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const pointsByTeam = new Map(totals.map(({ _id, totalPoints }) => [_id.toString(), totalPoints]));
  const ranked = teams
    .map((team) => ({
      teamName: team.name,
      totalPoints: pointsByTeam.get(team._id.toString()) ?? 0,
    }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName));

  return ranked.map((entry, index) => ({ ...entry, rank: index + 1 }));
}

function activityFocus(type: string): string | undefined {
  const normalized = type.trim().toLowerCase();
  if (['run', 'running', 'cycle', 'cycling', 'bike', 'swim', 'swimming'].includes(normalized)) return 'endurance';
  if (['strength', 'weights', 'weightlifting', 'lifting'].includes(normalized)) return 'strength';
  if (['walk', 'walking', 'yoga', 'stretch', 'stretching', 'mobility'].includes(normalized)) return 'mobility';
  return undefined;
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.trim().toLowerCase() }).lean();
  if (!user) notFound('User not found');

  const recentActivities = await Activity.find({ user: user._id })
    .sort({ occurredAt: -1 })
    .limit(10)
    .select('type')
    .lean();
  const focusCounts = new Map<string, number>();
  const focusOrder: string[] = [];
  for (const activity of recentActivities) {
    const focus = activityFocus(activity.type);
    if (!focus) continue;
    focusCounts.set(focus, (focusCounts.get(focus) ?? 0) + 1);
    if (!focusOrder.includes(focus)) focusOrder.push(focus);
  }
  const orderedRecentFocuses = focusOrder.sort(
    (left, right) => (focusCounts.get(right) ?? 0) - (focusCounts.get(left) ?? 0),
  );
  const goal = user.fitnessGoal.trim().toLowerCase();
  const workouts = await Workout.find().lean();

  return workouts
    .map((workout, index) => {
      const focus = workout.focus.trim().toLowerCase();
      const recentIndex = orderedRecentFocuses.indexOf(focus);
      const matchesRecent = recentIndex >= 0;
      const matchesGoal = focus === goal;
      const reason = matchesRecent
        ? `Based on your recent ${recentActivities.find((activity) => activityFocus(activity.type) === focus)?.type} activity.`
        : matchesGoal
          ? `Matches your fitness goal of ${user.fitnessGoal}.`
          : `Suggested to explore ${workout.focus} workouts.`;
      return {
        workout: { ...workout, reason },
        score: matchesRecent ? 100 - recentIndex : matchesGoal ? 50 : 0,
        index,
      };
    })
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map(({ workout }) => workout);
}

export { User };
