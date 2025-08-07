import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
// import { UserService } from '../services/user.service';
@Component({
  selector: 'app-navbar',
  imports: [NavbarComponent, RouterLink, RouterLinkActive],
  standalone: true,
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {}
