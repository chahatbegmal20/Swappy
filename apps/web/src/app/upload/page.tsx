"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronRight,
  File,
  Film,
  Image as ImageIcon,
  Loader2,
  Music,
  Plus,
  Trash2,
  X,
  Check,
} from "lucide-react";

import { api } from "@/lib/api";
import { useUploadStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AuthGuard } from "@/components/auth-guard";
import { Dropzone } from "./dropzone";

const PLATFORMS = ["YouTube", "TikTok", "Instagram", "Twitter", "Multiple"];
const LANGUAGES = ["English", "Spanish", "French", "German", "Portuguese", "Japanese", "Korean", "Chinese", "Hindi", "Arabic"];
const REGIONS = ["Global", "North America", "Europe", "Asia Pacific", "Latin America", "Middle East", "Africa"];
const GENRES = ["Music", "Gaming", "Tech", "Fashion", "Beauty", "Food", "Travel", "Education", "Fitness", "Comedy", "Drama", "News"];
const MOODS = ["Energetic", "Calm", "Funny", "Serious", "Inspirational", "Dark", "Romantic", "Nostalgic"];

const STEPS = [
  { label: "Project", number: 1 },
  { label: "Upload", number: 2 },
  { label: "Metadata", number: 3 },
  { label: "Analyze", number: 4 },
];

export default function UploadPage() {
  return (
    <AuthGuard>
      <UploadContent />
    </AuthGuard>
  );
}

function UploadContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  /** Stable primitive to avoid re-firing effects on searchParams identity changes. */
  const preselectedProject = searchParams.get("project") ?? "";

  const [step, setStep] = useState(1);

  // Step 1 state
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [creatingNew, setCreatingNew] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  /**
   * If the wizard was reached via /upload?project=<id> (e.g. after creating a project
   * from the dashboard), pre-select the project and advance to step 2 — but do so
   * only once on mount, so if the user later goes back to step 1 we don't fight them.
   */
  const appliedPreselect = useRef(false);
  useEffect(() => {
    if (appliedPreselect.current) return;
    if (!preselectedProject) return;
    appliedPreselect.current = true;
    setSelectedProject(preselectedProject);
    setStep(2);
  }, [preselectedProject]);

  // Step 2 state
  const { files, addFiles, removeFile, uploading, setUploading } =
    useUploadStore();

  // Step 3 state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hashtagInput, setHashtagInput] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [moods, setMoods] = useState<string[]>([]);
  const [platform, setPlatform] = useState("");
  const [language, setLanguage] = useState("English");
  const [region, setRegion] = useState("Global");

  // Step 4 state
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState("");

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: () => api.getProjects(),
  });

  const selectedProjectData = useMemo(
    () => projects?.find((p) => p.id === selectedProject),
    [projects, selectedProject],
  );

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    setCreateLoading(true);
    try {
      const project = await api.createProject({
        name: newProjectName.trim(),
        description: newProjectDesc || undefined,
      });
      /* Refresh the dashboard count and project list everywhere. */
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["projects"] }),
        queryClient.invalidateQueries({ queryKey: ["creator-dashboard"] }),
      ]);
      setSelectedProject(project.id);
      setCreatingNew(false);
      setNewProjectName("");
      setNewProjectDesc("");
    } catch {
      /* let user retry */
    } finally {
      setCreateLoading(false);
    }
  };

  const handleFilesAdded = (newFiles: File[]) => {
    const uploadFiles = newFiles.map((f) => ({
      id: crypto.randomUUID(),
      file: f,
      name: f.name,
      size: f.size,
      type: f.type,
    }));
    addFiles(uploadFiles);
  };

  const [uploadError, setUploadError] = useState("");

  const handleUploadFiles = async () => {
    if (!selectedProject || files.length === 0) return;
    setUploading(true);
    setUploadError("");
    try {
      for (const f of files) {
        const { upload_url, upload_id } = await api.getPresignedUrl({
          project_id: selectedProject,
          filename: f.name,
          content_type: f.type,
          file_size_bytes: f.size,
        });

        try {
          await fetch(upload_url, {
            method: "PUT",
            body: f.file,
            headers: { "Content-Type": f.type },
          });
        } catch {
          // Mock storage or CORS — file metadata is still tracked
        }

        const contentType = f.type.startsWith("video") ? "video"
          : f.type.startsWith("audio") ? "audio"
          : f.type.startsWith("image") ? "thumbnail"
          : "text";
        await api.completeUpload({
          upload_id,
          content_type: contentType,
        });
      }
      setStep(3);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const addHashtags = () => {
    const tags = hashtagInput
      .split(",")
      .map((t) => t.trim().replace(/^#/, ""))
      .filter((t) => t && !hashtags.includes(t));
    if (tags.length) setHashtags([...hashtags, ...tags]);
    setHashtagInput("");
  };

  const [savingMeta, setSavingMeta] = useState(false);

  const handleSaveMetadata = async () => {
    if (!selectedProject) return;
    setSavingMeta(true);
    try {
      await api.updateProjectMetadata(selectedProject, {
        ...(title && { name: title }),
        ...(description && { description }),
        ...(platform && { target_platform: platform }),
        hashtags: hashtags.length > 0 ? hashtags : undefined,
        genres: genres.length > 0 ? genres : undefined,
        moods: moods.length > 0 ? moods : undefined,
        language: language || undefined,
        region: region || undefined,
      });
      setStep(4);
    } catch {
      setStep(4);
    } finally {
      setSavingMeta(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedProject) return;
    setAnalyzing(true);
    setAnalyzeError("");
    try {
      await api.analyzeProject(selectedProject);
      router.push(`/project/${selectedProject}`);
    } catch (err) {
      setAnalyzeError(
        err instanceof Error ? err.message : "Analysis failed",
      );
      setAnalyzing(false);
    }
  };

  const canProceedStep1 = !!selectedProject;
  const canProceedStep2 = files.length > 0;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Upload Content</h1>
          <p className="mt-1 text-gray-400">
            Upload, tag, and analyze your content
          </p>
        </div>

        {/* Stepper */}
        <div className="mb-10 flex items-center justify-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.number} className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (s.number < step) setStep(s.number);
                }}
                className={cn(
                  "flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors",
                  step === s.number
                    ? "bg-indigo-600 text-white"
                    : step > s.number
                      ? "bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30"
                      : "bg-gray-800 text-gray-500",
                )}
              >
                {step > s.number ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span>{s.number}</span>
                )}
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <ChevronRight className="h-4 w-4 text-gray-600" />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Select / Create Project */}
        {step === 1 && (
          <Card className="border-gray-800 bg-gray-900">
            <CardHeader>
              <CardTitle>Select or Create a Project</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {!creatingNew ? (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-300">
                      Choose Project
                    </label>
                    <select
                      className="block w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      value={selectedProject}
                      onChange={(e) => setSelectedProject(e.target.value)}
                    >
                      <option value="">Select a project...</option>
                      {projects?.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedProjectData && (
                    <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
                      <p className="font-medium text-white">
                        {selectedProjectData.name}
                      </p>
                      {selectedProjectData.description && (
                        <p className="mt-1 text-sm text-gray-400">
                          {selectedProjectData.description}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-gray-500">
                        Created{" "}
                        {new Date(
                          selectedProjectData.created_at,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-gray-800" />
                    <span className="text-xs text-gray-500">or</span>
                    <div className="h-px flex-1 bg-gray-800" />
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setCreatingNew(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Create New Project
                  </Button>
                </>
              ) : (
                <div className="space-y-4">
                  <Input
                    label="Project Name"
                    placeholder="My new project..."
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                  />
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-300">
                      Description (optional)
                    </label>
                    <textarea
                      className="block w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      rows={2}
                      placeholder="Describe your project..."
                      value={newProjectDesc}
                      onChange={(e) => setNewProjectDesc(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="ghost"
                      onClick={() => setCreatingNew(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateProject}
                      loading={createLoading}
                      disabled={!newProjectName.trim()}
                    >
                      Create & Select
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!canProceedStep1}
                >
                  Continue
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Upload Content */}
        {step === 2 && (
          <Card className="border-gray-800 bg-gray-900">
            <CardHeader>
              <CardTitle>Upload Content Files</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Dropzone onFilesAdded={handleFilesAdded} />

              {files.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-300">
                    {files.length} file{files.length !== 1 && "s"} selected
                  </p>
                  <div className="max-h-60 space-y-2 overflow-y-auto">
                    {files.map((f) => (
                      <div
                        key={f.id}
                        className="flex items-center gap-3 rounded-lg border border-gray-800 bg-gray-950 px-4 py-3"
                      >
                        <FileTypeIcon type={f.type} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-200">
                            {f.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(f.size)}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFile(f.id)}
                          className="rounded p-1 text-gray-500 hover:bg-gray-800 hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {uploadError && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {uploadError}
                </div>
              )}

              <div className="flex items-center justify-between pt-4">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  Back
                </Button>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep(3)}
                  >
                    Skip for Now
                  </Button>
                  <Button
                    onClick={handleUploadFiles}
                    disabled={!canProceedStep2}
                    loading={uploading}
                  >
                    Upload & Continue
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Add Metadata */}
        {step === 3 && (
          <Card className="border-gray-800 bg-gray-900">
            <CardHeader>
              <CardTitle>Add Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Input
                label="Title"
                placeholder="Give your content a title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-300">
                  Description
                </label>
                <textarea
                  className="block w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  rows={3}
                  placeholder="Describe your content..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Hashtags */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-300">
                  Hashtags
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder="tag1, tag2, tag3..."
                    value={hashtagInput}
                    onChange={(e) => setHashtagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addHashtags();
                      }
                    }}
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={addHashtags}
                    className="shrink-0"
                  >
                    Add
                  </Button>
                </div>
                {hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {hashtags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-full bg-indigo-600/20 px-3 py-1 text-xs font-medium text-indigo-400"
                      >
                        #{tag}
                        <button
                          onClick={() =>
                            setHashtags(hashtags.filter((t) => t !== tag))
                          }
                          className="ml-0.5 hover:text-white"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Genre Tags */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-300">
                  Genre
                </label>
                <div className="flex flex-wrap gap-2">
                  {GENRES.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() =>
                        setGenres(
                          genres.includes(g)
                            ? genres.filter((x) => x !== g)
                            : [...genres, g],
                        )
                      }
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                        genres.includes(g)
                          ? "border-indigo-500 bg-indigo-600/20 text-indigo-400"
                          : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600",
                      )}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mood Tags */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-300">
                  Mood
                </label>
                <div className="flex flex-wrap gap-2">
                  {MOODS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() =>
                        setMoods(
                          moods.includes(m)
                            ? moods.filter((x) => x !== m)
                            : [...moods, m],
                        )
                      }
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                        moods.includes(m)
                          ? "border-purple-500 bg-purple-600/20 text-purple-400"
                          : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600",
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selects row */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-300">
                    Platform
                  </label>
                  <select
                    className="block w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                  >
                    <option value="">Select...</option>
                    {PLATFORMS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-300">
                    Language
                  </label>
                  <select
                    className="block w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-300">
                    Region
                  </label>
                  <select
                    className="block w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                  >
                    {REGIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button onClick={handleSaveMetadata} loading={savingMeta}>
                  Save & Continue
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Analyze */}
        {step === 4 && (
          <Card className="border-gray-800 bg-gray-900">
            <CardHeader>
              <CardTitle>Analyze Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center py-12 text-center">
                {analyzing ? (
                  <>
                    <div className="relative mb-6">
                      <div className="h-20 w-20 animate-spin rounded-full border-4 border-gray-700 border-t-indigo-500" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-12 w-12 animate-pulse rounded-full bg-indigo-500/20" />
                      </div>
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-white">
                      Analyzing your content...
                    </h3>
                    <p className="max-w-sm text-sm text-gray-400">
                      Our AI is evaluating visuals, audio, engagement potential,
                      and trend alignment. This may take a moment.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="mb-6 rounded-2xl bg-gray-800 p-6">
                      <Loader2 className="h-10 w-10 text-indigo-400" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-white">
                      Ready to Analyze
                    </h3>
                    <p className="mb-2 max-w-sm text-sm text-gray-400">
                      Everything is set. Hit the button below to run AI analysis
                      on your content and get viability scores.
                    </p>

                    {/* Summary */}
                    <div className="mb-8 mt-4 flex flex-wrap justify-center gap-2">
                      {selectedProjectData && (
                        <Badge variant="info">
                          {selectedProjectData.name}
                        </Badge>
                      )}
                      <Badge>{files.length} file{files.length !== 1 && "s"}</Badge>
                      {genres.map((g) => (
                        <Badge key={g} variant="default">
                          {g}
                        </Badge>
                      ))}
                      {moods.map((m) => (
                        <Badge key={m} variant="default">
                          {m}
                        </Badge>
                      ))}
                    </div>

                    {analyzeError && (
                      <p className="mb-4 rounded-lg bg-red-900/30 px-4 py-2 text-sm text-red-400">
                        {analyzeError}
                      </p>
                    )}

                    <Button size="lg" onClick={handleAnalyze}>
                      Analyze Content
                    </Button>
                  </>
                )}
              </div>

              {!analyzing && (
                <div className="flex justify-start pt-4">
                  <Button variant="ghost" onClick={() => setStep(3)}>
                    Back
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function FileTypeIcon({ type }: { type: string }) {
  if (type.startsWith("video/"))
    return <Film className="h-5 w-5 shrink-0 text-blue-400" />;
  if (type.startsWith("audio/"))
    return <Music className="h-5 w-5 shrink-0 text-purple-400" />;
  if (type.startsWith("image/"))
    return <ImageIcon className="h-5 w-5 shrink-0 text-emerald-400" />;
  return <File className="h-5 w-5 shrink-0 text-gray-400" />;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
