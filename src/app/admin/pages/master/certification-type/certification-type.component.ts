import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AdminService,CertificationType, Company, Region } from '../../../servies/admin.service';  
import Swal from 'sweetalert2';
import { NgxSpinnerService } from 'ngx-spinner';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
interface UploadModel {
  name: string;
  structure: any;     // REQUIRED by app-common-upload
  columns: string[];  // REQUIRED internally
  data: any[];        // REQUIRED internally
}
// export interface CertificationType {
//   certificationTypeID: number;
//   certificationTypeName: string;
//   isActive: boolean;
//   userId:number;
//   companyID: number;
//   regionID: number;
// }

@Component({
  selector: 'app-certification-type',
  standalone: false,
  templateUrl: './certification-type.component.html',
  styleUrl: './certification-type.component.css'
})
export class CertificationTypeComponent {
searchText = '';
  certificationList: CertificationType[] = [];
  certification!: CertificationType;

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

    this.certification = {
      CertificationTypeID: 0,
      CompanyID: this.companyId,
      RegionID: this.regionId,
      CertificationTypeName: '',
      IsActive: true
    };

    this.loadCompanies();
    this.loadCertificationTypes();
  }

  // ================= LOAD DATA =================

  loadCertificationTypes() {
    this.spinner.show();

    this.adminService.getCertificationTypes(this.userId).subscribe({
      next: (res: any) => {

        const data = res.data || [];

        this.certificationList = data.map((x: any) => ({
          CertificationTypeID: x.certificationTypeID,
          CertificationTypeName: x.certificationTypeName,
          CompanyID: x.companyID,
          RegionID: x.regionID,
          IsActive: x.isActive
        }));

        this.spinner.hide();
      },
      error: () => {
        this.spinner.hide();
        Swal.fire('Error', 'Failed to load data', 'error');
      }
    });
  }

  // ================= SUBMIT =================

  onSubmit() {

    this.certification.CompanyID = this.companyId;
    this.certification.RegionID = this.regionId;
    this.certification.userId = this.userId;

    this.spinner.show();

    const obs = this.isEditMode
      ? this.adminService.updateCertificationType(this.certification)
      : this.adminService.createCertificationType(this.certification);

    obs.subscribe({
      next: () => {
        this.spinner.hide();

        Swal.fire(
          this.isEditMode ? 'Updated!' : 'Added!',
          'Certification Type saved successfully.',
          'success'
        );

        this.loadCertificationTypes();
        this.clearForm();
      },
      error: () => {
        this.spinner.hide();
        Swal.fire('Error', 'Operation failed', 'error');
      }
    });
  }

  // ================= EDIT =================

  editCertification(c: CertificationType) {
    this.certification = { ...c };

    this.companyId = c.CompanyID;
    this.regionId = c.RegionID;

    this.loadRegions();
    this.isEditMode = true;
  }

  // ================= DELETE =================

  deleteCertification(c: CertificationType) {

    Swal.fire({
      title: `Delete "${c.CertificationTypeName}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes'
    }).then(result => {

      if (result.isConfirmed) {

        this.spinner.show();

        this.adminService.deleteCertificationType(c.CertificationTypeID).subscribe({
          next: () => {
            this.spinner.hide();
            Swal.fire('Deleted!', 'Deleted successfully', 'success');
            this.loadCertificationTypes();
          },
          error: () => {
            this.spinner.hide();
            Swal.fire('Error', 'Delete failed', 'error');
          }
        });

      }
    });
  }

  // ================= FILTER =================

  filteredCertifications(): CertificationType[] {
    const search = this.searchText?.toLowerCase() || '';

    return this.certificationList.filter(c =>
      c.CertificationTypeName?.toLowerCase().includes(search)
    );
  }

  // ================= COMPANY / REGION =================

  loadCompanies() {
    this.adminService.getCompanies(null, this.userId).subscribe({
      next: (res: Company[]) => {

        this.companies = res || [];

        this.companyMap = {};
        this.companies.forEach(c =>
          this.companyMap[c.companyId] = c.companyName
        );

        if (this.companyId) {
          this.loadRegions();
        }
      }
    });
  }

  loadRegions() {
    this.adminService.getRegions(null, this.userId).subscribe({
      next: (res: Region[]) => {

        const allRegions = res || [];

        this.regionMap = {};
        allRegions.forEach(r => {
          this.regionMap[r.regionID] = r.regionName;
        });

        this.regions = allRegions.filter(r =>
          r.companyID == this.companyId
        );

        if (!this.regionId && this.regions.length > 0) {
          this.regionId = this.regions[0].regionID;
        }

        this.certification.RegionID = this.regionId;
      }
    });
  }

  onCompanyChange() {
    this.certification.CompanyID = this.companyId;
    this.regionId = 0;
    this.regions = [];
    this.loadRegions();
  }

  onRegionChange() {
    this.certification.RegionID = this.regionId;
  }

  // ================= RESET =================

  resetForm() {
    Swal.fire({
      title: 'Reset form?',
      showCancelButton: true
    }).then(res => {
      if (res.isConfirmed) {
        this.clearForm();
      }
    });
  }

  clearForm() {
    this.certification = {
      CertificationTypeID: 0,
      CompanyID: this.companyId,
      RegionID: this.regionId,
      CertificationTypeName: '',
      IsActive: true
    };

    this.isEditMode = false;
  }
}
