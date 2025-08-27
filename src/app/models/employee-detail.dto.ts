// src/app/models/employee-detail.dto.ts
export interface EmployeeDetailDto {
  EmployeeId: number;
  Name: string;
  IdentityNumber: string;
  BirthDate?: string | null;
  Phone?: string | null;
  Email?: string | null;
  EducationLevel?: string | null;
  RegisteredAddress?: string | null;
  CurrentAddress?: string | null;
  Height?: number | null;
  Weight?: number | null;
  PayrollBankAccount?: string | null;
  EmploymentStatusText?: string | null;
  DepartmentName?: string | null;
  JobTitleName?: string | null;
  HireDate?: string | null;
  PoliceClearanceCertified?: boolean;
  IsSupervisor?: boolean;
  IsAdmin?: boolean;
  EmergencyContactPerson?: string | null;
  EmergencyContactPhone?: string | null;
  EmergencyContactRelationship?: string | null;
  PhotoPath?: string | null;
}

// 後端實際回應（camelCase）
export interface EmployeeDetailApi {
  employeeId: number;
  name: string;
  identityNumber: string;
  birthDate?: string | null;
  phone?: string | null;
  email?: string | null;
  educationLevel?: string | null;
  registeredAddress?: string | null;
  currentAddress?: string | null;
  height?: number | null;
  weight?: number | null;
  payrollBankAccount?: string | null;
  employmentStatusText?: string | null;
  departmentName?: string | null;
  jobTitleName?: string | null;
  hireDate?: string | null;
  policeClearanceCertified?: boolean;
  isSupervisor?: boolean;
  isAdmin?: boolean;
  emergencyContactPerson?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelationship?: string | null;
  photoPath?: string | null;
}

export function mapEmployeeDetail(x: EmployeeDetailApi): EmployeeDetailDto {
  return {
    EmployeeId: x.employeeId,
    Name: x.name,
    IdentityNumber: x.identityNumber,
    BirthDate: x.birthDate,
    Phone: x.phone,
    Email: x.email,
    EducationLevel: x.educationLevel,
    RegisteredAddress: x.registeredAddress,
    CurrentAddress: x.currentAddress,
    Height: x.height,
    Weight: x.weight,
    PayrollBankAccount: x.payrollBankAccount,
    EmploymentStatusText: x.employmentStatusText,
    DepartmentName: x.departmentName,
    JobTitleName: x.jobTitleName,
    HireDate: x.hireDate,
    PoliceClearanceCertified: x.policeClearanceCertified ?? false,
    IsSupervisor: x.isSupervisor ?? false,
    IsAdmin: x.isAdmin ?? false,
    EmergencyContactPerson: x.emergencyContactPerson,
    EmergencyContactPhone: x.emergencyContactPhone,
    EmergencyContactRelationship: x.emergencyContactRelationship,
    PhotoPath: x.photoPath,
  };
}
