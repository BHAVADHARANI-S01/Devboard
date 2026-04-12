import { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import toast from "react-hot-toast";

const API_BASE = "https://devboard-tfen.onrender.com/api";

const api = {
  get: (path, token) =>
    axios.get(`${API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  post: (path, data, token) =>
    axios.post(`${API_BASE}${path}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  delete: (path, token) =>
    axios.delete(`${API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
};

// ─── Sub-components ─────────────────────────────────────────────────────────

const Header = ({ user, isDark, onToggleTheme, onLogout, t }) => (
  <div style={{ ...styles.header, borderBottom: `1px solid ${t.border}` }}>
    <div>
      <h1 style={{ margin: 0, color: t.text }}>DevBoard</h1>
      {user && (
        <p style={{ margin: "4px 0 0 0", color: t.textMuted, fontSize: "14px" }}>
          Welcome, {user.name}
        </p>
      )}
    </div>
    <div style={{ display: "flex", gap: "10px" }}>
      <button
        onClick={onToggleTheme}
        style={{ ...styles.outlineBtn, border: `1px solid ${t.border}`, background: t.bg3, color: t.text }}
      >
        {isDark ? "☀ Light" : "🌙 Dark"}
      </button>
      <button
        onClick={onLogout}
        style={{ ...styles.outlineBtn, border: `1px solid ${t.border}`, background: "transparent", color: t.text }}
      >
        Logout
      </button>
    </div>
  </div>
);

const CreateProjectForm = ({ name, description, onNameChange, onDescChange, onSubmit, isDark, t }) => (
  <form onSubmit={onSubmit} style={styles.form}>
    <input
      type="text"
      placeholder="Project Name"
      value={name}
      onChange={onNameChange}
      required
      style={{ ...styles.input, border: `1px solid ${t.border}`, background: t.inputBg, color: t.text }}
    />
    <input
      type="text"
      placeholder="Description (optional)"
      value={description}
      onChange={onDescChange}
      style={{ ...styles.input, border: `1px solid ${t.border}`, background: t.inputBg, color: t.text }}
    />
    <button
      type="submit"
      style={{ ...styles.button, background: isDark ? "#378ADD" : "#000" }}
    >
      + Create Project
    </button>
  </form>
);

const ProjectCard = ({ project, onOpen, onDelete, t }) => (
  <div
    onClick={() => onOpen(project._id)}
    style={{ ...styles.card, background: t.card, border: `1px solid ${t.border}` }}
  >
    <div style={styles.cardTop}>
      <h3 style={{ margin: "0 0 8px 0", color: t.text }}>{project.name}</h3>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(project._id); }}
        style={{ ...styles.deleteBtn, color: t.textMuted }}
        aria-label={`Delete ${project.name}`}
      >
        ✕
      </button>
    </div>
    <p style={{ margin: 0, color: t.textMuted, fontSize: "14px" }}>
      {project.description || "No description"}
    </p>
    <p style={{ margin: "12px 0 0 0", fontSize: "12px", color: t.dark ? "#378ADD" : "#999" }}>
      Click to open board →
    </p>
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [name, setName]         = useState("");
  const [description, setDesc]  = useState("");

  const { token, logout, user } = useAuth();
  const navigate = useNavigate();
  const t = useTheme();

  const fetchProjects = useCallback(async () => {
    try {
      const res = await api.get("/projects", token);
      setProjects(res.data);
    } catch {
      toast.error("Failed to load projects");
    }
  }, [token]);

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    fetchProjects();
  }, [fetchProjects, token, navigate]);

  const handleCreate = useCallback(async (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Project name is required"); return; }
    try {
      const res = await api.post("/projects", { name, description }, token);
      setProjects((prev) => [...prev, res.data]);
      setName("");
      setDesc("");
      toast.success("Project created!");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to create project");
    }
  }, [name, description, token]);

  const handleDelete = useCallback(async (projectId) => {
    try {
      await api.delete(`/projects/${projectId}`, token);
      setProjects((prev) => prev.filter((p) => p._id !== projectId));
      toast.success("Project deleted");
    } catch {
      toast.error("Failed to delete project");
    }
  }, [token]);

  const handleLogout = useCallback(() => {
    logout();
    navigate("/login");
  }, [logout, navigate]);

  const projectGrid = useMemo(() => (
    projects.length === 0 ? (
      <p style={{ color: t.textMuted }}>No projects yet. Create your first one above!</p>
    ) : (
      projects.map((project) => (
        <ProjectCard
          key={project._id}
          project={project}
          onOpen={(id) => navigate(`/project/${id}`)}
          onDelete={handleDelete}
          t={t}
        />
      ))
    )
  ), [projects, handleDelete, navigate, t]);

  return (
    <div style={{ ...styles.container, background: t.bg, color: t.text }}>
      <Header
        user={user}
        isDark={t.dark}
        onToggleTheme={t.toggle}
        onLogout={handleLogout}
        t={t}
      />

      <h2 style={{ color: t.text, marginBottom: "12px", padding: "0 30px" }}>
        My Projects
      </h2>

      <CreateProjectForm
        name={name}
        description={description}
        onNameChange={(e) => setName(e.target.value)}
        onDescChange={(e) => setDesc(e.target.value)}
        onSubmit={handleCreate}
        isDark={t.dark}
        t={t}
      />

      <div style={styles.grid}>{projectGrid}</div>
    </div>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = {
  container: { minHeight: "100vh", fontFamily: "sans-serif" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 30px",
    marginBottom: "30px",
  },
  form: {
    display: "flex",
    gap: "10px",
    marginBottom: "24px",
    flexWrap: "wrap",
    padding: "0 30px",
  },
  input: {
    padding: "10px 14px",
    borderRadius: "6px",
    fontSize: "14px",
    minWidth: "200px",
    outline: "none",
  },
  button: {
    padding: "10px 20px",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
  },
  outlineBtn: {
    padding: "8px 16px",
    borderRadius: "20px",
    cursor: "pointer",
    fontSize: "13px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: "16px",
    padding: "0 30px",
  },
  card: {
    padding: "20px",
    borderRadius: "10px",
    cursor: "pointer",
    transition: "0.2s",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  deleteBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    padding: "0",
  },
};

export default Dashboard;