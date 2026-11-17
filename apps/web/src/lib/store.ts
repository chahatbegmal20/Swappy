import { create } from "zustand";

export interface User {
  id: string;
  email?: string | null;
  name: string;
  role: string;
  tier: string;
  phone?: string | null;
  auth_provider?: string;
  region?: string;
  language: string;
  avatar_url?: string;
  created_at: string;
  has_password?: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  /** True once we've finished the initial token check on app load. Guarded pages should wait for this. */
  authChecked: boolean;
  setUser: (user: User | null) => void;
  setAuthChecked: (checked: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  authChecked: false,
  setUser: (user) => set({ user, isAuthenticated: !!user, authChecked: true }),
  setAuthChecked: (checked) => set({ authChecked: checked }),
  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("swappy_token");
    }
    set({ user: null, isAuthenticated: false, authChecked: true });
  },
}));

interface UploadFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
}

interface UploadState {
  files: UploadFile[];
  uploading: boolean;
  progress: number;
  addFiles: (files: UploadFile[]) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  setUploading: (uploading: boolean) => void;
  setProgress: (progress: number) => void;
}

export const useUploadStore = create<UploadState>((set) => ({
  files: [],
  uploading: false,
  progress: 0,
  addFiles: (newFiles) =>
    set((state) => ({ files: [...state.files, ...newFiles] })),
  removeFile: (id) =>
    set((state) => ({ files: state.files.filter((f) => f.id !== id) })),
  clearFiles: () => set({ files: [], progress: 0 }),
  setUploading: (uploading) => set({ uploading }),
  setProgress: (progress) => set({ progress }),
}));
