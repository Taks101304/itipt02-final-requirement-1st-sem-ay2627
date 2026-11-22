import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, 
  IonItem, IonInput, IonTextarea, IonButton, 
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, 
  IonLabel, IonSearchbar, IonCardSubtitle, IonButtons, IonCheckbox,
  IonSelect, IonSelectOption,
  AlertController
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

interface ArchivedItem extends LostItem {
  IsClaimed: boolean | number;
}

interface Account {
  Account_Id: number;
  Email: string;
  IsAdmin: boolean | number;
}

@Component({
  selector: 'app-accounts',
  templateUrl: './accounts.page.html',
  styleUrls: ['./accounts.page.scss'],
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, 
    IonItem, IonInput, IonTextarea, IonButton, 
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, 
    IonLabel, IonSearchbar, IonCardSubtitle, IonButtons, IonCheckbox,
    IonSelect, IonSelectOption,
    CommonModule, 
    FormsModule
  ],
})
export class AccountsPage implements OnInit {
  private apiUrl = 'http://localhost:8000/api/items';
  private archiveUrl = 'http://localhost:8000/api/archive';
  private accountsUrl = 'http://localhost:8000/api/accounts';
  
  items: LostItem[] = [];
  archivedItems: ArchivedItem[] = [];
  accountsList: Account[] = [];
  
  showAccountsCard: boolean = false;
  showArchiveCard: boolean = false;
  currentAdminId: number | null = null;
  
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

  constructor(
    private http: HttpClient, 
    private router: Router, 
    private route: ActivatedRoute,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['currentAdminId']) {
        this.currentAdminId = Number(params['currentAdminId']);
      }
    });

    this.loadItems();
    this.loadAccounts();
    this.loadArchive();
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
      error: (err) => console.error('Failed to load items from database:', err)
    });
  }

  loadArchive() {
    this.http.get<ArchivedItem[]>(this.archiveUrl).subscribe({
      next: (data) => {
        this.archivedItems = data.map(item => ({
          ...item,
          Contacts: item.Contacts || '',
          Status: item.Status || 'Missing',
          IsClaimed: Boolean(item.IsClaimed)
        }));
      },
      error: (err) => console.error('Failed to load archive from database:', err)
    });
  }

  loadAccounts() {
    this.http.get<Account[]>(this.accountsUrl).subscribe({
      next: (data) => {
        this.accountsList = data.map(acc => ({
          ...acc,
          IsAdmin: Boolean(acc.IsAdmin)
        }));
      },
      error: (err) => console.error('Failed to load accounts from database:', err)
    });
  }

  toggleAccountsCard() {
    this.showAccountsCard = !this.showAccountsCard;
    if (this.showAccountsCard) {
      this.showArchiveCard = false;
      this.loadAccounts();
    }
  }

  toggleArchiveCard() {
    this.showArchiveCard = !this.showArchiveCard;
    if (this.showArchiveCard) {
      this.showAccountsCard = false;
      this.loadArchive();
    }
  }

  onAdminStatusChange(account: Account, event: any) {
    const newStatus = event.detail ? event.detail.checked : event.target.checked;

    if (account.Account_Id === this.currentAdminId && !newStatus) {
      alert('You cannot remove your own admin status.');
      account.IsAdmin = true;
      return;
    }

    const actionText = newStatus ? 'promote this user to Admin' : 'remove Admin privileges from this user';
    const confirmed = window.confirm(`Are you sure you want to ${actionText} (${account.Email})?`);

    if (confirmed) {
      this.http.put(`${this.accountsUrl}/${account.Account_Id}/admin`, { is_admin: newStatus }).subscribe({
        next: () => {
          account.IsAdmin = newStatus;
        },
        error: (err) => {
          console.error('Failed to update admin status:', err);
          account.IsAdmin = !newStatus;
        }
      });
    } else {
      account.IsAdmin = !newStatus;
    }
  }

  updateItemStatus(item: LostItem, event: any) {
    const previousStatus: ItemStatus = item.Status || 'Missing';
    const nextStatus: ItemStatus = event.detail.value;

    if (nextStatus === previousStatus) {
      return;
    }

    item.Status = nextStatus;

    const payload = {
      name: item.Name,
      image: item.Image || '',
      location: item.Location,
      contacts: item.Contacts || '',
      description: item.Description || '',
      status: nextStatus
    };

    this.http.put(`${this.apiUrl}/${item.Item_Id}`, payload).subscribe({
      next: () => {
        if (this.selectedItem && this.selectedItem.Item_Id === item.Item_Id) {
          this.selectedItem = { ...this.selectedItem, Status: nextStatus };
        }
      },
      error: (err) => {
        console.error('Failed to update item status:', err);
        item.Status = previousStatus;
      }
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
        error: (err) => console.error('Failed to update item in database:', err)
      });
    } else {
      this.http.post(this.apiUrl, this.newItem).subscribe({
        next: () => {
          this.loadItems();
          this.resetForm();
        },
        error: (err) => console.error('Failed to add item to database:', err)
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

  async deleteItem(id: number, event?: Event) {
    if (event) {
      event.stopPropagation();
    }

    const alert = await this.alertCtrl.create({
      header: 'Archive & Delete Item',
      message: 'Was this item claimed before deletion?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'No (Unclaimed)',
          handler: () => {
            this.executeDeleteAndArchive(id, false);
          }
        },
        {
          text: 'Yes (Claimed)',
          handler: () => {
            this.executeDeleteAndArchive(id, true);
          }
        }
      ]
    });

    await alert.present();
  }

  private executeDeleteAndArchive(id: number, isClaimed: boolean) {
    this.http.delete(`${this.apiUrl}/${id}?is_claimed=${isClaimed}`).subscribe({
      next: () => {
        this.loadItems();
        this.loadArchive();
        if (this.isEditing && this.editId === id) {
          this.cancelEdit();
        }
        if (this.selectedItem && this.selectedItem.Item_Id === id) {
          this.selectedItem = null;
        }
      },
      error: (err) => console.error('Failed to archive/delete item in database:', err)
    });
  }

  restoreItem(id: number) {
    this.http.post(`${this.archiveUrl}/${id}/restore`, {}).subscribe({
      next: () => {
        this.loadItems();
        this.loadArchive();
      },
      error: (err) => console.error('Failed to restore item from database:', err)
    });
  }

  async permanentDeleteItem(id: number, name: string) {
    const alert = await this.alertCtrl.create({
      header: 'Permanent Deletion',
      message: `Permanently delete "${name}" (#${id}) from the archive? This action cannot be undone.`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete Permanently',
          role: 'destructive',
          handler: () => {
            this.http.delete(`${this.archiveUrl}/${id}`).subscribe({
              next: () => {
                this.loadArchive();
              },
              error: (err) => console.error('Failed to permanently delete archived item:', err)
            });
          }
        }
      ]
    });

    await alert.present();
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