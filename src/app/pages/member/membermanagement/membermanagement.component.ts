import { Component } from '@angular/core';
import { RouterModule } from '@angular/router'; // ⬅️ 加這行

@Component({
  selector: 'app-membermanagement',
  standalone: true,
  imports: [RouterModule], // ⬅️ 加這行
  templateUrl: './membermanagement.component.html',
  styleUrl: './membermanagement.component.scss'
})
export class MembermanagementComponent {}
