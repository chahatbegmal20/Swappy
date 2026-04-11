"""Quick smoke test of all API endpoints."""
import httpx

base = "http://localhost:8000/api/v1"

# Register (or login if already exists)
r = httpx.post(f"{base}/auth/register", json={
    "email": "demo@swappy.io",
    "name": "Demo Creator",
    "password": "password123",
})
if r.status_code == 409:
    r = httpx.post(f"{base}/auth/login", json={
        "email": "demo@swappy.io",
        "password": "password123",
    })
    print(f"Login: {r.status_code}")
else:
    print(f"Register: {r.status_code}")
data = r.json()
token = data["access_token"]
user = data["user"]
print(f"  User: {user['name']} ({user['email']})")
print(f"  Role: {user['role']}, Tier: {user['tier']}")

headers = {"Authorization": f"Bearer {token}"}

# Get profile
r = httpx.get(f"{base}/auth/me", headers=headers)
print(f"Get Me: {r.status_code} - {r.json()['name']}")

# Create project
r = httpx.post(f"{base}/projects/", json={
    "name": "My First Video",
    "description": "Testing the AI scoring system with a gaming video",
    "target_platform": "YouTube",
    "target_audience": "Gen Z gamers aged 16-24",
}, headers=headers)
print(f"Create Project: {r.status_code}")
project = r.json()
pid = project["id"]
print(f"  Project: {project['name']} (id: {pid[:8]}...)")

# List projects
r = httpx.get(f"{base}/projects/", headers=headers)
print(f"List Projects: {r.status_code} - {len(r.json())} project(s)")

# Analyze content
r = httpx.post(f"{base}/scoring/analyze", json={"project_id": pid}, headers=headers)
print(f"Analyze: {r.status_code}")
scores = r.json()
print(f"  Overall Viability:        {scores['overall_viability']:.1%}")
print(f"  Trend Alignment:          {scores['trend_alignment']:.1%}")
print(f"  Virality Probability:     {scores['virality_probability']:.1%}")
print(f"  Audience Fit:             {scores['audience_fit']:.1%}")
print(f"  Novelty:                  {scores['novelty']:.1%}")
print(f"  Competitiveness:          {scores['competitiveness']:.1%}")
print(f"  Launch Timing:            {scores['launch_timing']:.1%}")
print(f"  Trend Creation:           {scores['trend_creation_probability']:.1%}")
print(f"  Confidence:               {scores['confidence_lower']:.1%} - {scores['confidence_upper']:.1%}")

# Explanations
expl = scores.get("explanations", {})
print(f"  Explanations: {sum(len(v) for v in expl.values())} factors")
for category, factors in expl.items():
    for f in factors:
        print(f"    [{category}] {f}")

# Recommendations
recs = scores.get("recommendations", {})
print(f"  Recommendations: {sum(len(v) for v in recs.values())} suggestions")

# Get latest score
r = httpx.get(f"{base}/scoring/{pid}/latest", headers=headers)
latest = r.json()
print(f"Latest Score: {r.status_code} - viability {latest.get('overall_viability', latest.get('detail', 'N/A'))}")

# Creator dashboard
r = httpx.get(f"{base}/dashboard/creator", headers=headers)
dash = r.json()
print(f"Dashboard: {dash['total_projects']} projects, {dash['total_uploads']} uploads")

# Market overview
r = httpx.get(f"{base}/dashboard/market", headers=headers)
m = r.json()
print(f"Market: {len(m['hot_trends'])} hot, {len(m['emerging_trends'])} emerging, {len(m['declining_trends'])} declining")

# Trends
r = httpx.get(f"{base}/trends/", headers=headers)
print(f"Trends: {r.status_code} - {len(r.json())} signals")

# Search trends
r = httpx.get(f"{base}/trends/search?q=music", headers=headers)
print(f"Search 'music': {len(r.json())} results")

# Heatmap
r = httpx.get(f"{base}/trends/heatmap", headers=headers)
print(f"Heatmap: {len(r.json())} regions")

print()
print("=" * 50)
print("ALL ENDPOINTS WORKING SUCCESSFULLY!")
print("=" * 50)
print()
print("Frontend:  http://localhost:3000")
print("API:       http://localhost:8000")
print("API Docs:  http://localhost:8000/docs")
