export type ReleaseType = 'PDF' | 'VID' | 'IMG';

export interface ReleaseRecord {
  title: string;
  type: ReleaseType;
  agency: string;
  incident_date: string;
  incident_location: string;
  description: string;
  link: string;
  thumbnail: string;
  dvids_video_id: string;
  files: string[];
}

export interface DvidsEntry {
  row_title: string;
  dvids: {
    id: string;
    page: string;
    title: string;
    video: string;
  };
}
