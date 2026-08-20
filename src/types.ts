export interface ImageData {
  filename: string;
  name: string;
  src: string;
  uploadedAt?: string;
}

export interface Annotation {
  approved: boolean;
  rejected: boolean;
  note: string;
}

export type Annotations = Record<string, Annotation>;
