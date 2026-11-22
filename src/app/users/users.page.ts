import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, 
  IonItem, IonInput, IonTextarea, IonButton, 
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, 
  IonLabel, IonSearchbar, IonCardSubtitle, IonButtons 
} from '@ionic/angular';

type ItemStatus = 'Missing' | 'Found' | 'Claimed';

interface LostItem {
  Item_Id: number;
  Name: string;
  Image: string;
  Location: string;
  Contacts: string;
  Description: string;
  Status?: ItemStatus;
}

@Component({
  selector: 'app-users',
  templateUrl: './users.page.html',
  styleUrls: ['./users.page.scss'],
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, 
    IonItem, IonInput, IonTextarea, IonButton, 
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, 
    IonLabel, IonSearchbar, IonCardSubtitle, IonButtons,
    CommonModule, 
    FormsModule
  ],
})
export class UsersPage implements OnInit {
  private apiUrl = 'http://127.0.0.1:8000/api/items';
  
  items: LostItem[] = [];
  searchTerm: string = '';
  selectedItem: LostItem | null = null;
  
  newItem: {
    name: string;
    image: string;
    location: string;
    contacts: string;
    description: string;
    status: ItemStatus;
  } = {
    name: '',
    image: '',
    location: '',
    contacts: '',
    description: '',
    status: 'Missing'
  };

  isEditing = false;
  editId: number | null = null;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.loadItems();
  }

  loadItems() {
    this.http.get<LostItem[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.items = data.map(item => ({
          ...item,
          Contacts: item.Contacts || '',
          Status: item.Status || 'Missing'
        }));
      },
      error: (err) => console.error('Failed to load items:', err)
    });
  }

  get filteredItems(): LostItem[] {
    if (!this.searchTerm.trim()) {
      return this.items;
    }
    const term = this.searchTerm.toLowerCase();
    return this.items.filter(item =>
      item.Name.toLowerCase().includes(term) ||
      item.Location.toLowerCase().includes(term) ||
      (item.Contacts && item.Contacts.toLowerCase().includes(term)) ||
      (item.Description && item.Description.toLowerCase().includes(term)) ||
      (item.Status && item.Status.toLowerCase().includes(term))
    );
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.newItem.image = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  saveItem() {
    if (!this.newItem.name || !this.newItem.location) {
      alert('Please fill in at least the item name and location.');
      return;
    }

    if (this.isEditing && this.editId !== null) {
      this.http.put(`${this.apiUrl}/${this.editId}`, this.newItem).subscribe({
        next: () => {
          this.loadItems();
          if (this.selectedItem && this.selectedItem.Item_Id === this.editId) {
            this.selectedItem = {
              Item_Id: this.editId,
              Name: this.newItem.name,
              Image: this.newItem.image,
              Location: this.newItem.location,
              Contacts: this.newItem.contacts,
              Description: this.newItem.description,
              Status: this.newItem.status
            };
          }
          this.cancelEdit();
        },
        error: (err) => console.error('Failed to update item:', err)
      });
    } else {
      this.http.post(this.apiUrl, this.newItem).subscribe({
        next: () => {
          this.loadItems();
          this.resetForm();
        },
        error: (err) => console.error('Failed to add item:', err)
      });
    }
  }

  viewItem(item: LostItem) {
    this.selectedItem = item;
  }

  closeDetails() {
    this.selectedItem = null;
  }

  editItem(item: LostItem, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.isEditing = true;
    this.editId = item.Item_Id;
    this.newItem = {
      name: item.Name,
      image: item.Image,
      location: item.Location,
      contacts: item.Contacts || '',
      description: item.Description,
      status: item.Status || 'Missing'
    };
  }

  cancelEdit() {
    this.isEditing = false;
    this.editId = null;
    this.resetForm();
  }

  resetForm() {
    this.newItem = {
      name: '',
      image: '',
      location: '',
      contacts: '',
      description: '',
      status: 'Missing'
    };
  }

  logout() {
    this.router.navigate(['/home']);
  }
}