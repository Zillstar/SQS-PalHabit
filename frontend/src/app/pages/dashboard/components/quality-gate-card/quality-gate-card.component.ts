import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TaskItem } from '../../../../shared/models/task.model';

export function calculateQualityProgressPercent(score: number, target: number): number {
  const normalizedTarget = Math.max(1, target);
  return Math.max(0, Math.min(100, Math.round((score / normalizedTarget) * 100)));
}

export function getRequiredTasks(tasks: TaskItem[]): TaskItem[] {
  return tasks.filter((task) => task.isRequired);
}

export function getMissingRequiredTasks(tasks: TaskItem[], limit = 3): TaskItem[] {
  return getRequiredTasks(tasks)
    .filter((task) => !task.isCompleted)
    .slice(0, limit);
}

@Component({
  selector: 'sqs-quality-gate-card',
  standalone: true,
  imports: [],
  templateUrl: './quality-gate-card.component.html',
  styleUrl: './quality-gate-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QualityGateCardComponent {
  readonly tasks = input.required<TaskItem[]>();
  readonly qualityScore = input(0);
  readonly qualityTarget = input(80);
  readonly waterLevel = input(0);
  readonly streak = input(0);

  readonly progressPercent = computed(() =>
    calculateQualityProgressPercent(this.qualityScore(), this.qualityTarget())
  );
  readonly requiredTasks = computed(() => getRequiredTasks(this.tasks()));
  readonly completedRequiredTasks = computed(
    () => this.requiredTasks().filter((task) => task.isCompleted).length
  );
  readonly missingRequiredTasks = computed(() => getMissingRequiredTasks(this.tasks()));
  readonly gateReached = computed(() => this.qualityScore() >= this.qualityTarget());
}
