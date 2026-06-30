import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ContractDto {
  id: number;
  tenantId: string;
  clientId: number;
  clientName: string;
  contractNumber: string;
  contractTitle: string;
  contractType: string;
  description?: string;
  referenceNumber?: string;
  currency: string;
  contractValue: number;
  taxPercentage: number;
  discount: number;
  finalAmount: number;
  paymentTerms: string;
  depositAmount: number;
  startDate: string;
  endDate: string;
  reminderDays: number;
  status: string;
  attachmentsJson?: string;
  paidAmount: number;
  remainingAmount: number;
  daysRemaining: number;
  invoicesCount: number;
  paymentsCount: number;
  createdByUserId?: number;
  createdByUserName?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateContractDto {
  clientId: number;
  contractTitle: string;
  contractType: string;
  description?: string;
  referenceNumber?: string;
  currency: string;
  contractValue: number;
  taxPercentage: number;
  discount: number;
  finalAmount: number;
  paymentTerms: string;
  depositAmount: number;
  startDate: string;
  endDate: string;
  reminderDays: number;
  status: string;
  attachmentsJson?: string;
}

export interface UpdateContractDto extends CreateContractDto {
  id: number;
}

@Injectable({
  providedIn: 'root'
})
export class ContractService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5292/api/contracts';

  getContracts(): Observable<ContractDto[]> {
    return this.http.get<ContractDto[]>(this.apiUrl);
  }

  getContract(id: number): Observable<ContractDto> {
    return this.http.get<ContractDto>(`${this.apiUrl}/${id}`);
  }

  getStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats`);
  }

  createContract(contract: CreateContractDto): Observable<ContractDto> {
    return this.http.post<ContractDto>(this.apiUrl, contract);
  }

  updateContract(id: number, contract: UpdateContractDto): Observable<ContractDto> {
    return this.http.put<ContractDto>(`${this.apiUrl}/${id}`, contract);
  }

  deleteContract(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  archiveContract(id: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/archive`, {});
  }
}
