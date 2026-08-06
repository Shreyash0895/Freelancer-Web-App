import { useState, useEffect } from "react";
import API from "../api/api";
import { showToast } from "../utils/toast";

// ── Star Rating Component ──
function StarRating({ value, onChange, size = 28 }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange && onChange(star)}
          onMouseEnter={() => onChange && setHovered(star)}
          onMouseLeave={() => onChange && setHovered(0)}
          style={{
            background: "none", border: "none", cursor: onChange ? "pointer" : "default",
            fontSize: size, padding: 0, lineHeight: 1,
            color: star <= (hovered || value) ? "#fbbf24" : "rgba(255,255,255,0.15)",
            transition: "color 0.15s, transform 0.1s",
            transform: hovered === star ? "scale(1.2)" : "scale(1)",
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

// ── Display stars (read-only) ──
export function StarDisplay({ rating, size = 16 }) {
  return (
    <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
      {[1, 2, 3, 4, 5].map(star => (
        <span
          key={star}
          style={{
            fontSize: size,
            color: star <= Math.round(rating) ? "#fbbf24" : "rgba(255,255,255,0.15)",
          }}
        >
          ★
        </span>
      ))}
      <span style={{ fontSize: size - 2, color: "var(--text3)", marginLeft: 6 }}>
        {Number(rating).toFixed(1)}
      </span>
    </div>
  );
}

// ── Leave Review Modal ──
export function LeaveReviewModal({ project, onClose, onSubmit }) {
  const [rating,  setRating]  = useState(0);
  const [comment, setComment] = useState("");
  const [saving,  setSaving]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) { showToast("error", "Please select a star rating"); return; }

    setSaving(true);
    try {
      await API.post("/reviews", {
        projectId: project._id,
        rating,
        comment,
      });
      showToast("success", "Review submitted! ⭐");
      onSubmit();
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to submit review");
    } finally {
      setSaving(false);
    }
  };

  const labels = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

  return (
    <div style={s.overlay}>
      <div style={s.modal}>
        <div style={s.modalHeader}>
          <h2 style={s.modalTitle}>Leave a Review</h2>
          <button onClick={onClose} style={s.closeBtn}>✕</button>
        </div>

        {/* Project info */}
        <div style={s.projectInfo}>
          <p style={s.projectName}>{project.title}</p>
          <p style={s.projectSub}>Freelancer: {project.assignedFreelancer}</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Star rating */}
          <div style={{ marginBottom: 24 }}>
            <label style={s.label}>Your Rating</label>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 8 }}>
              <StarRating value={rating} onChange={setRating} size={36} />
              {rating > 0 && (
                <span style={{ color: "#fbbf24", fontSize: 14, fontWeight: 600 }}>
                  {labels[rating]}
                </span>
              )}
            </div>
          </div>

          {/* Comment */}
          <div style={{ marginBottom: 24 }}>
            <label style={s.label}>
              Comment <span style={{ color: "var(--text3)", fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea
              className="form-input"
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Describe your experience working with this freelancer..."
              rows={4}
              style={{ resize: "vertical", marginTop: 8 }}
              maxLength={500}
            />
            <p style={{ fontSize: 11, color: "var(--text3)", textAlign: "right", marginTop: 4 }}>
              {comment.length}/500
            </p>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button type="button" onClick={onClose} className="btn btn-ghost" style={{ flex: 1 }}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || rating === 0}
              style={{ flex: 2 }}
            >
              {saving ? <span className="spinner" /> : "Submit Review ⭐"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Review Card ──
export function ReviewCard({ review }) {
  const timeAgo = (dateStr) => {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const d = Math.floor(diff / 86400000);
    const m = Math.floor(diff / 2592000000);
    if (d < 1)  return "today";
    if (d < 7)  return `${d}d ago`;
    if (m < 1)  return `${Math.floor(d/7)}w ago`;
    return `${m}mo ago`;
  };

  return (
    <div style={s.reviewCard}>
      <div style={s.reviewTop}>
        <div style={s.reviewerAvatar}>
          {(review.clientEmail || "?")[0].toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={s.reviewerName}>
            {review.clientEmail?.split("@")[0] || "Client"}
          </div>
          <div style={s.reviewTime}>{timeAgo(review.createdAt)}</div>
        </div>
        <StarDisplay rating={review.rating} size={14} />
      </div>
      {review.comment && (
        <p style={s.reviewComment}>{review.comment}</p>
      )}
    </div>
  );
}

// ── Reviews List (for profile/freelancer page) ──
export function ReviewsList({ freelancerEmail }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!freelancerEmail) return;
    API.get(`/reviews/${freelancerEmail}`)
      .then(r => setData(r.data))
      .catch(() => setData({ reviews: [], avgRating: null, total: 0 }))
      .finally(() => setLoading(false));
  }, [freelancerEmail]);

  if (loading) return (
    <div style={{ padding: "20px 0" }}>
      {[1,2].map(i => (
        <div key={i} style={{ marginBottom: 12 }}>
          <div className="skeleton" style={{ height: 80, borderRadius: 12 }} />
        </div>
      ))}
    </div>
  );

  if (!data || data.total === 0) return (
    <div style={{ padding: "24px 0", textAlign: "center", color: "var(--text3)" }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>⭐</div>
      <p style={{ fontSize: 14 }}>No reviews yet.</p>
    </div>
  );

  return (
    <div>
      {/* Summary */}
      <div style={s.reviewSummary}>
        <div style={s.avgRatingNum}>{data.avgRating}</div>
        <div>
          <StarDisplay rating={parseFloat(data.avgRating)} size={20} />
          <p style={s.reviewCount}>{data.total} review{data.total !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {data.reviews.map(r => (
          <ReviewCard key={r._id} review={r} />
        ))}
      </div>
    </div>
  );
}

// ── Styles ──
const s = {
  overlay: {
    position: "fixed", inset: 0,
    background: "rgba(0,0,0,0.78)",
    backdropFilter: "blur(8px)",
    zIndex: 1000,
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 20,
    animation: "fadeIn 0.2s ease",
  },
  modal: {
    background: "var(--bg2)",
    border: "1px solid var(--border2)",
    borderRadius: 20, padding: "36px",
    width: "100%", maxWidth: 480,
    boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
    animation: "slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)",
  },
  modalHeader: {
    display: "flex", alignItems: "center",
    justifyContent: "space-between", marginBottom: 24,
  },
  modalTitle: { fontSize: 22, fontWeight: 800, color: "var(--text)", margin: 0 },
  closeBtn: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid var(--border)",
    borderRadius: 8, color: "var(--text3)",
    fontSize: 16, cursor: "pointer",
    width: 32, height: 32,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  projectInfo: {
    background: "var(--bg3)", border: "1px solid var(--border)",
    borderRadius: 12, padding: "14px 18px", marginBottom: 24,
  },
  projectName: { fontSize: 15, fontWeight: 600, color: "var(--text)", margin: "0 0 4px" },
  projectSub:  { fontSize: 12, color: "var(--text3)", margin: 0 },
  label: { fontSize: 13, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.4px" },

  reviewCard: {
    background: "var(--bg3)",
    border: "1px solid var(--border)",
    borderRadius: 12, padding: "16px 18px",
    transition: "border-color 0.2s",
  },
  reviewTop: { display: "flex", alignItems: "center", gap: 12, marginBottom: 10 },
  reviewerAvatar: {
    width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
    background: "linear-gradient(135deg, #6c63ff, #f472b6)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 14, fontWeight: 700, color: "#fff",
  },
  reviewerName: { fontSize: 14, fontWeight: 600, color: "var(--text)" },
  reviewTime:   { fontSize: 11, color: "var(--text3)", marginTop: 2 },
  reviewComment:{ fontSize: 14, color: "var(--text2)", lineHeight: 1.65, margin: 0 },

  reviewSummary: {
    display: "flex", alignItems: "center", gap: 16,
    background: "rgba(251,191,36,0.08)",
    border: "1px solid rgba(251,191,36,0.2)",
    borderRadius: 14, padding: "16px 20px", marginBottom: 16,
  },
  avgRatingNum: {
    fontSize: 40, fontWeight: 800, color: "#fbbf24",
    fontFamily: "'Syne', sans-serif", lineHeight: 1,
  },
  reviewCount: { fontSize: 12, color: "var(--text3)", margin: "6px 0 0" },
};

export default ReviewsList;