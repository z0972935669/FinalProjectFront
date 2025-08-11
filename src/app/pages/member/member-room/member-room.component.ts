import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-member-room',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './member-room.component.html',
  styleUrl: './member-room.component.scss',
})
export class MemberRoomComponent {
  Member = {
    fName: '王大爺',
    fIdNumber: 'A12*****89',
  };
  RoomBed = {
    fBedCode: 'A',
  };
  RoomTable = {
    fRoomName: 'A101',
    fRoomAlias: '松竹紅單人房',
    fRoomType: '單人房',
    fRoomPrice: 'NT 56000 元/月',
  };
  RoomOccupancy = {
    fBillingStatus: 1
  };
}
