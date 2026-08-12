import type { ProfileExperience, ProfileTag } from './components/ProfileComponents';

export type OptionalReadResult<T> =
  | { kind: 'value'; value: T }
  | { kind: 'unsupported' }
  | { kind: 'error'; error: unknown };

export function selectTopProfileTags(tags: ProfileTag[]): ProfileTag[] {
  return tags
    .map((tag, index) => ({ tag, index }))
    .sort((left, right) => {
      const leftCount = left.tag.questCount ?? -1;
      const rightCount = right.tag.questCount ?? -1;
      return rightCount - leftCount || left.index - right.index;
    })
    .slice(0, 3)
    .map(({ tag }) => tag);
}

export function sortExperiences(experiences: ProfileExperience[]): ProfileExperience[] {
  return experiences
    .map((experience, index) => ({ experience, index }))
    .sort((left, right) => {
      const leftStartedAt = Date.parse(left.experience.startedAt);
      const rightStartedAt = Date.parse(right.experience.startedAt);
      const leftTime = Number.isNaN(leftStartedAt) ? Number.NEGATIVE_INFINITY : leftStartedAt;
      const rightTime = Number.isNaN(rightStartedAt) ? Number.NEGATIVE_INFINITY : rightStartedAt;
      return rightTime - leftTime || left.index - right.index;
    })
    .map(({ experience }) => experience);
}
