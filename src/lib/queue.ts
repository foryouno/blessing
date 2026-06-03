import PQueue from 'p-queue';

export const videoQueue = new PQueue({
  concurrency: 1,
  interval: 60000,
  intervalCap: 3,
});

export const imageQueue = new PQueue({
  concurrency: 1,
  interval: 60000,
  intervalCap: 5,
});

export const ttsQueue = new PQueue({
  concurrency: 2,
  interval: 60000,
  intervalCap: 10,
});

export async function queueTask<T>(
  queue: PQueue,
  task: () => Promise<T>
): Promise<T> {
  return queue.add(task);
}
