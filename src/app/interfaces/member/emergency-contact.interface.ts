export interface EmergencyContact {
  fRelationship: string;
  fContactName: string;
  fPhone: string;
  fEmail: string;
  fCity: string;
  fDistrict: string;
  fAddress: string;
  fNotes: string;
  canEditContact?: boolean; // 後端回傳可編輯狀態
}
