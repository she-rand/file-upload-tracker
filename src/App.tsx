import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import 'bootstrap/dist/css/bootstrap.min.css';

// Simulate API using setTimeout and local state
const simulatedTasks: Record<string, { status: string; timer?: number }> = {};

function simulateUpload(): Promise<{ task_id: string }> {
  return new Promise((resolve) => {
    const task_id = uuidv4();
    simulatedTasks[task_id] = { status: "pending" };

    const duration = 5000 + Math.random() * 5000; // 5–10 seconds
    const timer = setTimeout(() => {
      const isSuccess = Math.random() > 0.2;
      simulatedTasks[task_id].status = isSuccess ? "success" : "error";
    }, duration);

    simulatedTasks[task_id].timer = timer;
    resolve({ task_id });
  });
}

function simulateStatus(task_id: string): Promise<{ status: string }> {
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

interface Task {
  id: string;
  fileName: string;
  status: string;
  retries: number;
}

export default function FileUploadTracker() {
  const [file, setFile] = useState<File | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const pollingRefs = useRef<Record<string, number>>({});

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    if (!f) return;
    if (!f.type.match(/pdf|image\//)) {
      alert("Only PDFs or image files are allowed.");
      return;
    }
    if (f.size > 2 * 1024 * 1024) {
      alert("File must be under 2MB.");
      return;
    }
    setFile(f);
  };

  const handleSubmit = async () => {
    if (!file) return;
    const { task_id } = await simulateUpload();
    const newTask: Task = { id: task_id, fileName: file.name, status: "pending", retries: 0 };
    setTasks((prev) => [...prev, newTask]);
    pollTask(task_id);
    setFile(null);
  };

  const pollTask = (task_id: string) => {
    const poll = async () => {
      try {
        const { status } = await simulateStatus(task_id);
        setTasks((prev) =>
          prev.map((t) => (t.id === task_id ? { ...t, status } : t))
        );
        if (status === "pending") {
          pollingRefs.current[task_id] = setTimeout(poll, 2000);
        }
      } catch (error) {
        const task = tasks.find((t) => t.id === task_id);
        if (task && task.retries < 3) {
          setTasks((prev) =>
            prev.map((t) =>
              t.id === task_id ? { ...t, retries: t.retries + 1 } : t
            )
          );
          pollingRefs.current[task_id] = setTimeout(poll, 2000);
        } else {
          setTasks((prev) =>
            prev.map((t) => (t.id === task_id ? { ...t, status: "error" } : t))
          );
        }
      }
    };
    poll();
  };

  const cancelTask = (task_id: string) => {
    clearTimeout(simulatedTasks[task_id]?.timer);
    clearTimeout(pollingRefs.current[task_id]);
    delete pollingRefs.current[task_id];
    simulatedTasks[task_id].status = "cancelled";
    setTasks((prev) =>
      prev.map((t) => (t.id === task_id ? { ...t, status: "cancelled" } : t))
    );
  };

  useEffect(() => {
    return () => {
      Object.values(pollingRefs.current).forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="container mt-4">
      <h1 className="h4 mb-4">File Upload Tracker</h1>
      <div className="mb-3">
        <input
          type="file"
          accept="application/pdf,image/*"
          onChange={handleFileChange}
          className="form-control"
        />
      </div>
      <button
        onClick={handleSubmit}
        disabled={!file}
        className="btn btn-primary mb-3"
      >
        Submit
      </button>
      <div>
        <h2 className="h6">Submitted Tasks</h2>
        {tasks.length === 0 && <p className="text-muted">No tasks yet.</p>}
        <ul className="list-group">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="list-group-item d-flex justify-content-between align-items-center"
            >
              <div>
                <div className="fw-semibold small">{task.fileName}</div>
                <div className="text-muted small">Status: {task.status}</div>
              </div>
              {task.status === "pending" && (
                <button
                  onClick={() => cancelTask(task.id)}
                  className="btn btn-sm btn-outline-danger"
                >
                  Cancel
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

