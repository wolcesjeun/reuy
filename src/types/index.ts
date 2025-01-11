export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  updated_at: string | null;
  created_at: string;
}

export interface Query {
  id: string;
  user_id: string;
  image_url: string;
  analysis_result: any;
  created_at: string;
}
