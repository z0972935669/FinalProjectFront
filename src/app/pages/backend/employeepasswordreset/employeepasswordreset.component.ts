import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BackendComponent } from '../../../layout/backend/backend.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-employeepasswordreset',
  imports: [RouterModule, BackendComponent, CommonModule, FormsModule],
  templateUrl: './employeepasswordreset.component.html',
  styleUrl: './employeepasswordreset.component.scss'
})
export class EmployeepasswordresetComponent { }
