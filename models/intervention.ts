export type InterventionType = 
  | 'Check Dam' 
  | 'Farm Pond' 
  | 'Contour Trench' 
  | 'Plantation / Afforestation' 
  | 'Water Harvesting Structure' 
  | 'Gully Plug'
  | 'Percolation Tank';

export type InterventionStatus = 'Operational' | 'Requires Desilting' | 'Damaged / Under Repair' | 'Under Construction';

export interface InterventionMonitoringRecord {
  date: string;
  inspector: string;
  status: InterventionStatus;
  observations: string;
}

export interface Intervention {
  id: string;
  watershedId: string;
  name: string;
  type: InterventionType;
  villageId: string;
  villageName: string;
  latitude: number;
  longitude: number;
  status: InterventionStatus;
  installationYear: number;
  storageCapacityM3?: number;
  catchmentAreaHa?: number;
  contractorOrPanchayat: string;
  linkedImageIds: string[];
  monitoringHistory: InterventionMonitoringRecord[];
}
