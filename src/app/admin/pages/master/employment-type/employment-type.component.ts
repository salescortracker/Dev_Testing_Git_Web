import { Component } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import Swal from 'sweetalert2';
import { AdminService, Company, Region } from '../../../servies/admin.service';
export interface EmploymentType {
  EmploymenttypeID: number;
  CompanyID: number;
  RegionID: number;
  EmploymenttypeName: string;
  Description?: string;
  IsActive: boolean;
  UserId?: number;
}
@Component({
  selector: 'app-employment-type',
  standalone: false,
  templateUrl: './employment-type.component.html',
  styleUrl: './employment-type.component.css'
})
export class EmploymentTypeComponent {
searchText = '';
  employmentList: EmploymentType[] = [];
  employment!: EmploymentType;

  companies: Company[] = [];
  regions: Region[] = [];

  companyMap: Record<number, string> = {};
  regionMap: Record<number, string> = {};

  userId!: number;
  companyId!: number;
  regionId!: number;

  isEditMode = false;

  constructor(
    private adminService: AdminService,
    private spinner: NgxSpinnerService
  ) {}

  ngOnInit(): void {

    this.userId = Number(sessionStorage.getItem("UserId"));
    this.companyId = Number(sessionStorage.getItem("CompanyId"));
    this.regionId = Number(sessionStorage.getItem("RegionId"));

    this.employment = {
      EmploymenttypeID: 0,
      CompanyID: this.companyId,
      RegionID: this.regionId,
      EmploymenttypeName: '',
      Description: '',
      IsActive: true
    };

    this.loadCompanies();
    this.loadEmploymentTypes();
  }

 loadEmploymentTypes() {
  this.spinner.show();

  this.adminService.getEmploymentTypes(this.userId).subscribe({
    next: (res: any) => {

      const data = res.data || [];

      this.employmentList = data.map((e: any) => ({
        EmploymenttypeID: e.employmenttypeID,
        CompanyID: e.companyID,
        RegionID: e.regionID,
        EmploymenttypeName: e.employmenttypeName,
        Description: e.description,
        IsActive: e.isActive
      }));

      this.spinner.hide();
    },
    error: () => {
      this.spinner.hide();
      Swal.fire('Error', 'Failed to load Employment Types', 'error');
    }
  });
}

  onSubmit() {

    this.employment.CompanyID = this.companyId;
    this.employment.RegionID = this.regionId;
    this.employment.UserId = this.userId;

    this.spinner.show();

    const obs = this.isEditMode
      ? this.adminService.updateEmploymentType(this.employment)
      : this.adminService.createEmploymentType(this.employment);

    obs.subscribe({
      next: () => {
        this.spinner.hide();
        Swal.fire(
          this.isEditMode ? 'Updated!' : 'Added!',
          'Employment Type saved successfully.',
          'success'
        );
        this.loadEmploymentTypes();
        this.clearForm();
      },
      error: () => {
        this.spinner.hide();
        Swal.fire('Error', 'Operation failed', 'error');
      }
    });
  }

  editEmployment(e: EmploymentType) {
    this.employment = { ...e };
    this.companyId = e.CompanyID;
    this.regionId = e.RegionID;
    this.loadRegions();
    this.isEditMode = true;
  }

  deleteEmployment(e: EmploymentType) {

    Swal.fire({
      title: `Delete "${e.EmploymenttypeName}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete'
    }).then(result => {

      if (result.isConfirmed) {

        this.spinner.show();

        this.adminService.deleteEmploymentType(e.EmploymenttypeID)
          .subscribe({
            next: () => {
              this.spinner.hide();
              Swal.fire('Deleted!', '', 'success');
              this.loadEmploymentTypes();
            },
            error: () => {
              this.spinner.hide();
              Swal.fire('Error', 'Delete failed', 'error');
            }
          });
      }
    });
  }

  filteredEmploymentTypes(): EmploymentType[] {
    const search = this.searchText?.toLowerCase() || '';
    return this.employmentList.filter(e =>
      e.EmploymenttypeName?.toLowerCase().includes(search)
    );
  }

loadCompanies(): void {
  this.adminService.getCompanies(null, this.userId).subscribe({
    next: (res: any) => {

      console.log('All Companies 👉', res);

      const data = res?.data ?? res ?? [];

      // 🔥 Only active companies
      this.companies = data.filter((c: any) => c.isActive === true);

      // ✅ Build company map
      this.companyMap = {};
      this.companies.forEach((c: any) => {
        this.companyMap[c.companyId] = c.companyName;
      });

      console.log('Active Companies 👉', this.companies);

      // ✅ Load regions if company selected
      if (this.companyId) {
        this.loadRegions();
      }
    }
  });
}

loadRegions(): void {
  this.adminService.getRegions(null, this.userId).subscribe({
    next: (res: any) => {

      console.log('All Regions 👉', res);

      const data = res?.data ?? res ?? [];

      // 🔥 Only active regions
      const activeRegions = data.filter((r: any) => r.isActive === true);

      // ✅ Build region map
      this.regionMap = {};
      activeRegions.forEach((r: any) => {
        this.regionMap[r.regionID] = r.regionName;
      });

      // ✅ Filter regions by selected company
      this.regions = activeRegions.filter((r: any) =>
        r.companyID == this.companyId
      );

      console.log('Filtered Regions 👉', this.regions);

      // ✅ Auto-select region
      if (!this.regionId && this.regions.length > 0) {
        this.regionId = this.regions[0].regionID;
      }

      // ✅ Bind to model
      this.employment.RegionID = this.regionId;
    }
  });
}

  onCompanyChange(): void {
    sessionStorage.setItem('CompanyId', this.companyId.toString());
    this.regionId = 0;
    this.loadRegions();
  }

  onRegionChange(): void {
    sessionStorage.setItem('RegionId', this.regionId.toString());
  }

  resetForm() {
    Swal.fire({
      title: 'Reset Form?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes'
    }).then(result => {
      if (result.isConfirmed) {
        this.clearForm();
      }
    });
  }

  clearForm() {
    this.employment = {
      EmploymenttypeID: 0,
      CompanyID: this.companyId,
      RegionID: this.regionId,
      EmploymenttypeName: '',
      Description: '',
      IsActive: true
    };
    this.isEditMode = false;
  }
}
