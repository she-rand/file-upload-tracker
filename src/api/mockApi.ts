import { v4 as uuidv4 } from 'uuid';

interface SimulatedTask {
  status: string;
  timer?: number;
}

const simulatedTasks: Record<string, SimulatedTask> = {};

export function simulateUpload(): Promise<{ task_id: string }> {
  return new Promise((resolve) => {
    const task_id = uuidv4();
    simulatedTasks[task_id] = { status: "pending" };

    const duration = 5000 + Math.random() * 5000;
    const timer = setTimeout(() => {
      const isSuccess = Math.random() > 0.2;
      simulatedTasks[task_id].status = isSuccess ? "success" : "error";
    }, duration);

    simulatedTasks[task_id].timer = timer;
    resolve({ task_id });
  });
}

export function simulateStatus(task_id: string): Promise<{ status: string }> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (simulatedTasks[task_id]) {
        resolve({ status: simulatedTasks[task_id].status });
      } else {
        reject(new Error("Task not found"));
      }
    }, 500);
  });
}

export function cancelSimulatedTask(task_id: string) {
  clearTimeout(simulatedTasks[task_id]?.timer);
  simulatedTasks[task_id].status = "cancelled";
}