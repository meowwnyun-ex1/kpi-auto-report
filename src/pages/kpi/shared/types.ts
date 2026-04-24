export interface Category {
  id: number;
  name: string;
  key: string;
}

export interface YearlyTarget {
  id: number;
  category_id: number;
  measurement: string | null;
  unit: string | null;
  main: string | null;
  main_relate_display: string | null;
  fy_target: number | null;
  total_target: number;
  used_quota: number;
  remaining_quota: number;
  description_of_target: string | null;
  saving?: boolean;
  dirty?: boolean;
}

export interface MonthlyTarget {
  id: number;
  yearly_target_id: number;
  month: number;
  target: number | null;
  result: number | null;
  note: string | null;
  image_url: string | null;
  image_caption: string | null;
}

export interface Stats {
  yearly: number;
  months: Record<number, { targets: { set: number } }>;
}

export interface YearlyTargetWithMonths {
  yearly_target_id: number;
  measurement: string | null;
  unit: string | null;
  main: string | null;
  main_relate_display: string | null;
  fy_target: number | null;
  total_quota: number | null;
  used_quota: number | null;
  remaining_quota: number | null;
  months: Record<
    number,
    {
      id: number;
      target: number | null;
      result: number | null;
      note: string | null;
      image_url: string | null;
      image_caption: string | null;
      draft: string;
      draftNote: string;
      draftAttachment: any;
      dirty: boolean;
      saving: boolean;
    }
  >;
}
