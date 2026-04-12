import { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import toast from "react-hot-toast";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Line } from "react-chartjs-2";
import { io } from "socket.io-client";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend, Filler);

const DEFAULT_TIME = 25 * 60;
const SOCKET_URL   = "http://localhost:5000";

const Project = () => {
  const { id }       = useParams();
  const { token }    = useAuth();
  const navigate     = useNavigate();
  const socketRef    = useRef(null);
  const t            = useTheme();

  const [tasks, setTasks]             = useState([]);
  const [title, setTitle]             = useState("");
  const [priority, setPriority]       = useState("medium");
  const [activeTab, setActiveTab]     = useState("board");
  const [activeTask, setActiveTask]   = useState(null);
  const [seconds, setSeconds]         = useState(DEFAULT_TIME);
  const [running, setRunning]         = useState(false);
  const [onlineCount, setOnlineCount] = useState(1);
  const [hoveredTask, setHoveredTask] = useState(null);
  const [inputMinutes, setInputMinutes] = useState(25);
  const [pomodoroSet, setPomodoroSet]   = useState(false);
  const intervalRef                   = useRef(null);

  // ── Socket.io ────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    const socket = io(SOCKET_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join:project", id);
    });

    socket.on("task:created", (newTask) => {
      setTasks((prev) => {
        const exists = prev.find((tk) => tk._id === newTask._id);
        if (exists) return prev;
        toast(`New task: ${newTask.title}`, { icon: "📋" });
        return [...prev, newTask];
      });
    });

    socket.on("task:updated", (updatedTask) => {
      setTasks((prev) =>
        prev.map((tk) => (tk._id === updatedTask._id ? updatedTask : tk))
      );
    });

    socket.on("task:deleted", ({ id: deletedId }) => {
      setTasks((prev) => prev.filter((tk) => tk._id !== deletedId));
    });

    socket.on("room:count", (count) => setOnlineCount(count));

    return () => {
      socket.emit("leave:project", id);
      socket.disconnect();
    };
  }, [id, token]);

  // ── Fetch tasks ──────────────────────────────────────────
  const fetchTasks = useCallback(async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/tasks/project/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTasks(res.data);
    } catch {
      toast.error("Failed to load tasks");
    }
  }, [token, id]);

  useEffect(() => {
    if (token) fetchTasks();
  }, [token, fetchTasks]);

  // ── Pomodoro ─────────────────────────────────────────────
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            setPomodoroSet(false);
            toast.success("Pomodoro done! Take a break. 🍅");
            if (activeTask) {
              axios.patch(
                `http://localhost:5000/api/tasks/${activeTask._id}`,
                { pomodoroTime: (activeTask.pomodoroTime || 0) + inputMinutes },
                { headers: { Authorization: `Bearer ${token}` } }
              );
            }
            return inputMinutes * 60;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, activeTask, token, inputMinutes]);

  // ── Create task ──────────────────────────────────────────
  const createTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) { toast.error("Task title required"); return; }
    try {
      await axios.post(
        "http://localhost:5000/api/tasks",
        { title, project: id, status: "todo", priority },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTitle("");
    } catch {
      toast.error("Failed to create task");
    }
  };

  // ── Delete task ──────────────────────────────────────────
  const deleteTask = async (e, taskId) => {
    e.stopPropagation();
    try {
      await axios.delete(
        `http://localhost:5000/api/tasks/${taskId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch {
      toast.error("Failed to delete task");
    }
  };

  // ── Drag and drop ────────────────────────────────────────
  const onDragEnd = async (result) => {
    if (!result.destination) return;
    const taskId    = result.draggableId;
    const newStatus = result.destination.droppableId;
    setTasks((prev) =>
      prev.map((tk) => (tk._id === taskId ? { ...tk, status: newStatus } : tk))
    );
    try {
      await axios.patch(
        `http://localhost:5000/api/tasks/${taskId}`,
        { status: newStatus, order: result.destination.index },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch {
      toast.error("Failed to update task");
      fetchTasks();
    }
  };

  // ── Helpers ──────────────────────────────────────────────
  const columns = {
    todo:          tasks.filter((tk) => tk.status === "todo"),
    "in-progress": tasks.filter((tk) => tk.status === "in-progress"),
    done:          tasks.filter((tk) => tk.status === "done"),
  };

  const columnConfig = {
    todo:          { title: "To Do",       color: t.accent  },
    "in-progress": { title: "In Progress", color: t.warning },
    done:          { title: "Done",        color: t.success },
  };

  const priorityConfig = {
    low:    { label: "Low",    bg: t.successLight, color: t.success },
    medium: { label: "Medium", bg: t.warningLight, color: t.warning },
    high:   { label: "High",   bg: t.dangerLight,  color: t.danger  },
  };

  const formatTime = (s) => {
    const m   = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const totalTasks = tasks.length;
  const doneTasks  = tasks.filter((tk) => tk.status === "done").length;
  const remaining  = totalTasks - doneTasks;
  const progress   = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  // ── Burndown ─────────────────────────────────────────────
  const days      = ["D1","D2","D3","D4","D5","D6","D7","D8","D9","D10"];
  const idealLine = days.map((_, i) =>
    Math.round(totalTasks - (totalTasks / (days.length - 1)) * i)
  );
  const actualLine = days.map((_, i) => {
    if (i === 0) return totalTasks;
    if (i === days.length - 1) return remaining;
    return Math.max(remaining, Math.round(totalTasks - (doneTasks / (days.length - 1)) * i));
  });

  const chartData = {
    labels: days,
    datasets: [
      {
        label: "Ideal",
        data: idealLine,
        borderColor: t.textFaint,
        borderDash: [5, 5],
        tension: 0.3,
        pointRadius: 3,
      },
      {
        label: "Actual",
        data: actualLine,
        borderColor: t.accent,
        backgroundColor: t.accentLight,
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: t.accent,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
        labels: { color: t.textMuted, font: { family: "'Outfit', sans-serif" } }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: "Tasks Remaining", color: t.textMuted },
        ticks: { color: t.textMuted },
        grid:  { color: t.border },
      },
      x: {
        title: { display: true, text: "Sprint Days", color: t.textMuted },
        ticks: { color: t.textMuted },
        grid:  { color: t.border },
      },
    },
  };

  // ── Render ───────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: t.bg, fontFamily: "'Outfit', sans-serif", display: "flex", flexDirection: "column" }}>

      {/* TOP NAVBAR */}
      <div style={{ background: t.bg2, borderBottom: `1px solid ${t.border}`, padding: "0 24px", height: "56px", display: "flex", alignItems: "center", gap: "16px", flexShrink: 0 }}>
        <button
          onClick={() => navigate("/dashboard")}
          style={{ display: "flex", alignItems: "center", gap: "6px", background: "transparent", border: "none", color: t.textMuted, cursor: "pointer", fontSize: "13px", fontFamily: "'Outfit', sans-serif", padding: "6px 10px", borderRadius: "6px" }}
        >
          ← Back
        </button>

        <div style={{ width: "1px", height: "20px", background: t.border }} />

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "28px", height: "28px", background: t.accentLight, borderRadius: "7px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>📋</div>
          <span style={{ color: t.text, fontSize: "15px", fontWeight: "600" }}>Project Board</span>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "120px", height: "4px", background: t.bg4, borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ width: `${progress}%`, height: "100%", background: t.success, borderRadius: "2px", transition: "width 0.5s" }} />
            </div>
            <span style={{ fontSize: "12px", color: t.textMuted, fontWeight: "500" }}>{progress}%</span>
          </div>

          <div style={{ width: "1px", height: "20px", background: t.border }} />

          <span style={{ fontSize: "12px", padding: "4px 10px", background: t.successLight, color: t.success, borderRadius: "20px", fontWeight: "500" }}>
            ● {onlineCount} online
          </span>

          <button
            onClick={t.toggle}
            style={{ padding: "6px 12px", background: t.bg3, border: `1px solid ${t.border}`, borderRadius: "8px", color: t.textMuted, cursor: "pointer", fontSize: "12px", fontFamily: "'Outfit', sans-serif" }}
          >
            {t.dark ? "☀" : "🌙"}
          </button>
        </div>
      </div>

      {/* TABS */}
      <div style={{ background: t.bg2, borderBottom: `1px solid ${t.border}`, padding: "0 24px", display: "flex", flexShrink: 0 }}>
        {[
          { key: "board",    label: "Board",         icon: "⊞" },
          { key: "burndown", label: "Burndown Chart", icon: "📈" },
          { key: "pomodoro", label: "Pomodoro Timer", icon: "🍅" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: "14px 20px",
              background: "transparent", border: "none",
              borderBottom: `2px solid ${activeTab === tab.key ? t.accent : "transparent"}`,
              color: activeTab === tab.key ? t.accent : t.textMuted,
              cursor: "pointer", fontSize: "13px",
              fontWeight: activeTab === tab.key ? "600" : "400",
              fontFamily: "'Outfit', sans-serif",
              display: "flex", alignItems: "center", gap: "6px",
              transition: "all 0.15s",
            }}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "20px", padding: "0 8px" }}>
          {[
            { label: "Total",     value: totalTasks },
            { label: "Done",      value: doneTasks  },
            { label: "Remaining", value: remaining  },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "16px", fontWeight: "700", color: t.text, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: "10px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, overflow: "auto", padding: "24px" }}>

        {/* ── BOARD TAB ── */}
        {activeTab === "board" && (
          <>
            <form onSubmit={createTask} style={{ display: "flex", gap: "10px", marginBottom: "24px", flexWrap: "wrap" }}>
              <input
                placeholder="Add a new task..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  flex: 1, padding: "10px 16px",
                  background: t.card, border: `1px solid ${t.border}`,
                  borderRadius: "10px", color: t.text, fontSize: "14px",
                  outline: "none", minWidth: "200px",
                  fontFamily: "'Outfit', sans-serif",
                }}
              />
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                style={{
                  padding: "10px 14px",
                  background: t.card, border: `1px solid ${t.border}`,
                  borderRadius: "10px", color: t.text, fontSize: "14px",
                  outline: "none", cursor: "pointer",
                  fontFamily: "'Outfit', sans-serif",
                }}
              >
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🔴 High</option>
              </select>
              <button
                type="submit"
                style={{
                  padding: "10px 20px",
                  background: t.accent, color: "white",
                  border: "none", borderRadius: "10px",
                  fontSize: "14px", fontWeight: "600",
                  cursor: "pointer", fontFamily: "'Outfit', sans-serif",
                }}
              >
                + Add Task
              </button>
            </form>

            <DragDropContext onDragEnd={onDragEnd}>
              <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                {Object.entries(columns).map(([status, colTasks]) => (
                  <Droppable droppableId={status} key={status}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        style={{
                          flex: 1,
                          background: snapshot.isDraggingOver ? t.bg4 : t.bg2,
                          border: `1px solid ${snapshot.isDraggingOver ? t.borderHover : t.border}`,
                          borderRadius: "14px", padding: "16px",
                          minHeight: "500px", transition: "all 0.2s",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: columnConfig[status].color }} />
                            <span style={{ color: t.text, fontSize: "13px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                              {columnConfig[status].title}
                            </span>
                          </div>
                          <span style={{ background: t.bg4, color: t.textMuted, fontSize: "11px", fontWeight: "600", padding: "2px 8px", borderRadius: "20px" }}>
                            {colTasks.length}
                          </span>
                        </div>

                        {colTasks.map((task, index) => (
                          <Draggable key={task._id} draggableId={task._id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onMouseEnter={() => setHoveredTask(task._id)}
                                onMouseLeave={() => setHoveredTask(null)}
                                style={{
                                  background: snapshot.isDragging ? t.bg4 : (hoveredTask === task._id ? t.cardHover : t.card),
                                  border: `1px solid ${hoveredTask === task._id || snapshot.isDragging ? t.borderHover : t.border}`,
                                  borderRadius: "10px", padding: "14px",
                                  marginBottom: "10px", cursor: "grab",
                                  boxShadow: snapshot.isDragging ? "0 8px 24px rgba(0,0,0,0.3)" : "none",
                                  transition: "background 0.15s, border-color 0.15s",
                                  ...provided.draggableProps.style,
                                }}
                              >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                                  <span style={{ fontSize: "14px", fontWeight: "500", color: t.text, flex: 1, lineHeight: "1.4" }}>
                                    {task.title}
                                  </span>
                                  <button
                                    onClick={(e) => deleteTask(e, task._id)}
                                    style={{
                                      background: "transparent", border: "none",
                                      cursor: "pointer", color: t.textFaint,
                                      fontSize: "18px", padding: "0 0 0 8px",
                                      lineHeight: 1,
                                      opacity: hoveredTask === task._id ? 1 : 0,
                                      transition: "opacity 0.15s",
                                    }}
                                  >
                                    ×
                                  </button>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                                  <span style={{
                                    fontSize: "11px", padding: "2px 8px",
                                    borderRadius: "6px", fontWeight: "600",
                                    background: priorityConfig[task.priority]?.bg,
                                    color: priorityConfig[task.priority]?.color,
                                  }}>
                                    {priorityConfig[task.priority]?.label}
                                  </span>

                                  {task.pomodoroTime > 0 && (
                                    <span style={{ fontSize: "11px", color: t.textMuted, background: t.bg3, padding: "2px 8px", borderRadius: "6px" }}>
                                      🍅 {task.pomodoroTime}m
                                    </span>
                                  )}

                                  <button
                                    onClick={() => { setActiveTask(task); setActiveTab("pomodoro"); }}
                                    style={{
                                      fontSize: "11px", padding: "2px 10px",
                                      border: `1px solid ${t.border}`,
                                      borderRadius: "6px", cursor: "pointer",
                                      background: "transparent", color: t.textMuted,
                                      marginLeft: "auto",
                                      fontFamily: "'Outfit', sans-serif",
                                      opacity: hoveredTask === task._id ? 1 : 0,
                                      transition: "opacity 0.15s",
                                    }}
                                  >
                                    ⏱ Timer
                                  </button>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}

                        {colTasks.length === 0 && (
                          <div style={{ textAlign: "center", padding: "40px 16px", color: t.textFaint, fontSize: "13px" }}>
                            Drop tasks here
                          </div>
                        )}

                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                ))}
              </div>
            </DragDropContext>
          </>
        )}

        {/* ── BURNDOWN TAB ── */}
        {activeTab === "burndown" && (
          <div style={{ maxWidth: "860px", margin: "0 auto" }}>
            <h2 style={{ color: t.text, fontSize: "20px", fontWeight: "700", marginBottom: "20px", letterSpacing: "-0.5px" }}>
              Sprint Burndown
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "20px" }}>
              {[
                { label: "Total Tasks", value: totalTasks,    color: t.accent  },
                { label: "Completed",   value: doneTasks,     color: t.success },
                { label: "Remaining",   value: remaining,     color: t.warning },
                { label: "Progress",    value: `${progress}%`, color: t.accent },
              ].map((s) => (
                <div key={s.label} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "18px" }}>
                  <p style={{ margin: "0 0 8px 0", fontSize: "12px", color: t.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.label}</p>
                  <p style={{ margin: 0, fontSize: "28px", fontWeight: "700", color: s.color, letterSpacing: "-1px" }}>{s.value}</p>
                </div>
              ))}
            </div>

            <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "20px", marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                <span style={{ fontSize: "13px", color: t.textMuted, fontWeight: "500" }}>Sprint Progress</span>
                <span style={{ fontSize: "13px", color: t.text, fontWeight: "600" }}>{progress}%</span>
              </div>
              <div style={{ height: "8px", background: t.bg3, borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ width: `${progress}%`, height: "100%", background: `linear-gradient(90deg, ${t.accent}, ${t.success})`, borderRadius: "4px", transition: "width 0.5s" }} />
              </div>
            </div>

            <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "24px" }}>
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>
        )}

        {/* ── POMODORO TAB ── */}
        {activeTab === "pomodoro" && (
          <div style={{ maxWidth: "560px", margin: "0 auto" }}>
            <h2 style={{ color: t.text, fontSize: "20px", fontWeight: "700", marginBottom: "20px", letterSpacing: "-0.5px" }}>
              Pomodoro Timer
            </h2>

            <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: "16px", padding: "40px 32px", textAlign: "center", marginBottom: "20px" }}>

              {/* Custom time selector */}
              {!running && !pomodoroSet && (
                <div style={{ marginBottom: "32px" }}>
                  <p style={{ color: t.textMuted, fontSize: "12px", fontWeight: "600", marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.8px" }}>
                    Set focus duration
                  </p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
                    {[5, 10, 15, 25, 30, 45, 60].map((min) => (
                      <button
                        key={min}
                        onClick={() => {
                          setInputMinutes(min);
                          setSeconds(min * 60);
                        }}
                        style={{
                          padding: "7px 14px",
                          background: inputMinutes === min ? t.accent : t.bg3,
                          color: inputMinutes === min ? "white" : t.textMuted,
                          border: `1px solid ${inputMinutes === min ? t.accent : t.border}`,
                          borderRadius: "8px", cursor: "pointer",
                          fontSize: "13px", fontWeight: "600",
                          fontFamily: "'Outfit', sans-serif",
                          transition: "all 0.15s",
                        }}
                      >
                        {min}m
                      </button>
                    ))}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                    <input
                      type="number" min="1" max="120"
                      value={inputMinutes}
                      onChange={(e) => {
                        const val = Math.min(120, Math.max(1, parseInt(e.target.value) || 1));
                        setInputMinutes(val);
                        setSeconds(val * 60);
                      }}
                      style={{
                        width: "80px", padding: "8px 12px", textAlign: "center",
                        background: t.inputBg, border: `1px solid ${t.border}`,
                        borderRadius: "8px", color: t.text, fontSize: "15px",
                        outline: "none", fontFamily: "'JetBrains Mono', monospace", fontWeight: "600",
                      }}
                    />
                    <span style={{ color: t.textMuted, fontSize: "14px" }}>minutes</span>
                    <button
                      onClick={() => { setSeconds(inputMinutes * 60); setPomodoroSet(true); }}
                      style={{
                        padding: "8px 18px", background: t.accent, color: "white",
                        border: "none", borderRadius: "8px", cursor: "pointer",
                        fontSize: "13px", fontWeight: "600",
                        fontFamily: "'Outfit', sans-serif",
                      }}
                    >
                      Set →
                    </button>
                  </div>
                </div>
              )}

              {/* Circular timer */}
              <div style={{ position: "relative", width: "200px", height: "200px", margin: "0 auto 28px" }}>
                <svg width="200" height="200" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="100" cy="100" r="88" fill="none" stroke={t.bg3} strokeWidth="10" />
                  <circle
                    cx="100" cy="100" r="88" fill="none"
                    stroke={running ? t.accent : (pomodoroSet ? t.warning : t.textFaint)}
                    strokeWidth="10"
                    strokeDasharray={`${2 * Math.PI * 88}`}
                    strokeDashoffset={`${2 * Math.PI * 88 * (1 - seconds / (inputMinutes * 60))}`}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
                  />
                </svg>
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
                  <div style={{ fontSize: "40px", fontWeight: "700", color: t.text, letterSpacing: "2px", fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>
                    {formatTime(seconds)}
                  </div>
                  <div style={{ fontSize: "12px", color: t.textMuted, marginTop: "6px", fontWeight: "500" }}>
                    {running ? "🎯 Focus time" : pomodoroSet ? "⏸ Ready" : "Set duration above"}
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginBottom: "20px" }}>
                <button
                  onClick={() => { setRunning((r) => !r); setPomodoroSet(true); }}
                  style={{
                    padding: "12px 40px", color: "white", border: "none",
                    borderRadius: "10px", cursor: "pointer", fontSize: "15px",
                    fontWeight: "600", fontFamily: "'Outfit', sans-serif",
                    background: running ? t.danger : t.accent,
                    transition: "background 0.2s",
                  }}
                >
                  {running ? "⏸ Pause" : "▶ Start"}
                </button>
                <button
                  onClick={() => { setRunning(false); setPomodoroSet(false); setSeconds(inputMinutes * 60); }}
                  style={{
                    padding: "12px 24px", color: t.textMuted,
                    border: `1px solid ${t.border}`, borderRadius: "10px",
                    cursor: "pointer", fontSize: "15px",
                    background: "transparent", fontFamily: "'Outfit', sans-serif",
                  }}
                >
                  ↺ Reset
                </button>
              </div>

              {activeTask ? (
                <div style={{ background: t.accentLight, border: `1px solid ${t.accent}40`, borderRadius: "8px", padding: "10px 16px" }}>
                  <span style={{ fontSize: "13px", color: t.textMuted }}>Working on: </span>
                  <span style={{ fontSize: "13px", color: t.accent, fontWeight: "600" }}>{activeTask.title}</span>
                </div>
              ) : (
                <div style={{ background: t.bg3, borderRadius: "8px", padding: "10px 16px" }}>
                  <span style={{ fontSize: "13px", color: t.textMuted }}>Select a task below to track time</span>
                </div>
              )}
            </div>

            {/* Task list */}
            <h3 style={{ color: t.text, fontSize: "13px", fontWeight: "600", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Select Task to Track
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {tasks.length === 0 && (
                <p style={{ color: t.textMuted, fontSize: "14px", textAlign: "center", padding: "24px" }}>
                  No tasks yet. Add some from the Board tab.
                </p>
              )}
              {tasks.map((task) => (
                <div
                  key={task._id}
                  onClick={() => setActiveTask(task)}
                  style={{
                    padding: "14px 16px",
                    background: activeTask?._id === task._id ? t.accentLight : t.card,
                    borderRadius: "10px", cursor: "pointer",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    border: `1px solid ${activeTask?._id === task._id ? t.accent + "60" : t.border}`,
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: priorityConfig[task.priority]?.color || t.textMuted, flexShrink: 0 }} />
                    <span style={{ color: t.text, fontSize: "14px" }}>{task.title}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {task.pomodoroTime > 0 && (
                      <span style={{ fontSize: "12px", color: t.textMuted }}>🍅 {task.pomodoroTime}m</span>
                    )}
                    {activeTask?._id === task._id && (
                      <span style={{ fontSize: "11px", color: t.accent, fontWeight: "600", background: t.accentLight, padding: "2px 8px", borderRadius: "4px" }}>Active</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Project;