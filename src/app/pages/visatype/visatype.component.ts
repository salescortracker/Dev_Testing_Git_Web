import { Component, OnInit } from '@angular/core';

import Swal from 'sweetalert2';
import { NgxSpinnerService } from 'ngx-spinner';
import { AdminService } from '../../admin/servies/admin.service';

export interface VisaType {
  visaTypeId: number;
  visaTypeName: string;
  description: string;
  isActive: boolean;
  companyId: number;
  regionId: number;
  companyName: string;
  regionName: string;
  userId: number;
}

@Component({
  selector: 'app-visatype',
  standalone: false,
  templateUrl: './visatype.component.html',
  styleUrl: './visatype.component.css'
})
export class VisatypeComponent {

  visaTypes: VisaType[] = [];
  visa: VisaType = this.getEmptyVisa();
  isEditMode = false;

  companies: any[] = [];
  regions: any[] = [];
  filteredRegions: any[] = [];

  searchText = '';
  statusFilter: boolean | '' = '';

  pageSize = 5;
  currentPage = 1;

  userId: number = Number(sessionStorage.getItem('UserId'));

  constructor(
    private adminService: AdminService,
    private spinner: NgxSpinnerService
  ) {}

  ngOnInit(): void {
    this.loadCompanies();
    this.loadRegions();
    this.loadVisaTypes();
  }

  // Empty Model
  getEmptyVisa(): VisaType {
    return {
      visaTypeId: 0,
      visaTypeName: '',
      description: '',
      isActive: true,
      companyId: 0,
      regionId: 0,
      companyName: '',
      regionName: '',
      userId: this.userId
    };
  }

  // Load Visa Types
  loadVisaTypes() {
    this.spinner.show();
    this.adminService.getVisaTypeList(this.userId).subscribe({
      next: (res: any) => {
        this.visaTypes = res.data;
        this.spinner.hide();
      },
      error: () => {
        this.spinner.hide();
        Swal.fire('Error', 'Failed to load Visa Types', 'error');
      }
    });
  }

  // Submit
  onSubmit() {
    this.spinner.show();

    const request = this.isEditMode
      ? this.adminService.updateVisaType(this.visa)
      : this.adminService.createVisaType(this.visa);

    request.subscribe({
      next: (res: any) => {
        this.spinner.hide();

        if (res.message?.toLowerCase().includes('duplicate')) {
          Swal.fire('Warning', res.message, 'warning');
          return;
        }

        Swal.fire('Success', 'Saved Successfully', 'success');
        this.loadVisaTypes();
        this.resetForm();
      },
      error: () => {
        this.spinner.hide();
        Swal.fire('Error', 'Operation failed', 'error');
      }
    });
  }

  editVisa(v: VisaType) {
    this.visa = { ...v };
    this.isEditMode = true;
    this.onCompanyChange();
  }

  deleteVisa(v: VisaType) {
    Swal.fire({
      title: `Delete ${v.visaTypeName}?`,
      showDenyButton: true,
      confirmButtonText: 'Yes'
    }).then(result => {
      if (result.isConfirmed) {
        this.adminService.deleteVisaType(v.visaTypeId).subscribe(() => {
          Swal.fire('Deleted', '', 'success');
          this.loadVisaTypes();
        });
      }
    });
  }

  resetForm() {
    this.visa = this.getEmptyVisa();
    this.isEditMode = false;
  }

  // Filters
  filteredVisaTypes() {
  if (!this.visaTypes) return [];

  return this.visaTypes.filter(v =>
    v.visaTypeName?.toLowerCase().includes(this.searchText?.toLowerCase() || '') &&
    (this.statusFilter === '' || v.isActive === this.statusFilter)
  );
}

  // Pagination
  get pagedVisaTypes() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredVisaTypes().slice(start, start + this.pageSize);
  }
  onCompanyChange() {
  if (!this.visa.companyId) {
    this.filteredRegions = [];
    return;
  }
  this.filteredRegions = this.regions.filter(
    r => r.companyId == this.visa.companyId
  );
  this.visa.regionId = 0;
}

  // Load dropdowns
  loadCompanies() {
  this.adminService.getCompanies(null, this.userId).subscribe(res => {
    console.log('COMPANIES API:', res);
    this.companies = res;
  });
}

  loadRegions() {
  this.adminService.getRegions(null, this.userId).subscribe((res: any) => {
    const data = res.data || res;
    this.regions = data.map((r: any) => ({
      regionId: r.regionID,
      companyId: r.companyID,
      regionName: r.regionName
    }));

    this.filteredRegions = [...this.regions];
  });
}

  // Export
  exportAs(type: string) {
    console.log(type);
  }

  // Upload
  showUploadPopup = false;

  openUploadPopup() {
    this.showUploadPopup = true;
  }
}
