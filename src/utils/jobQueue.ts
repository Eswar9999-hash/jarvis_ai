import { config } from './config';

type Job = () => Promise<void> | void;

const queue: Job[] = [];
let running = false;

const runNext = async () => {
  if (running) return;
  running = true;
  try {
    while (queue.length) {
      const job = queue.shift()!;
      await Promise.resolve(job());
    }
  } finally {
    running = false;
  }
};

export const enqueue = (job: Job) => {
  if (!config.features.jobQueue) {
    // Execute immediately when disabled to preserve behavior
    job();
    return;
  }
  queue.push(job);
  // Prefer idle if available
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(runNext);
  } else {
    setTimeout(runNext, 0);
  }
};