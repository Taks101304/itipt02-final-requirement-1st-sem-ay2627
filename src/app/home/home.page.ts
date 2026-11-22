import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { IonItem, IonInput, IonButton, IonHeader, IonToolbar, IonTitle, IonContent, IonCheckbox, IonLabel } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { playCircle } from 'ionicons/icons';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonItem, 
    IonInput, 
    IonButton, 
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent,
    IonCheckbox,
    IonLabel
  ],
})
export class HomePage {
  email: string = '';
  password: string = '';
  errorMessage: string = '';
  successMessage: string = '';
  showPassword: boolean = false;
  isSignUp: boolean = false;

  constructor(private router: Router, private http: HttpClient) {
    addIcons({ playCircle });
  }

  login() {
    this.errorMessage = '';
    this.successMessage = '';

    this.http.post<any>('http://127.0.0.1:8000/api/login',  {
      email: this.email,
      password: this.password
    }).subscribe({
      next: (response) => {
        if (response && response.account) {
          const { Account_Id, IsAdmin } = response.account;
          
          // Handles boolean true, number 1, or string "true"
          const isAdminBool = IsAdmin === true || IsAdmin === 1 || IsAdmin === 'true';

          if (isAdminBool) {
            this.router.navigate(['/accounts'], { queryParams: { currentAdminId: Account_Id } });
          } else {
            this.router.navigate(['/users']);
          }
        } else {
          this.errorMessage = 'Email or password is invalid';
        }
      },
      error: () => {
        this.errorMessage = 'Email or password is invalid';
      }
    });
  }

  signup() {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.email || !this.password) {
      this.errorMessage = 'Please enter both email and password.';
      return;
    }

    this.http.post<any>('http://127.0.0.1:8000/api/signup',  {
      email: this.email,
      password: this.password
    }).subscribe({
      next: (response) => {
        if (response && response.success) {
          this.successMessage = 'Account created successfully! You can now log in.';
          this.isSignUp = false;
          this.password = '';
        } else {
          this.errorMessage = response.message || 'Signup failed.';
        }
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Error connecting to server for signup.';
      }
    });
  }

  toggleMode() {
    this.isSignUp = !this.isSignUp;
    this.errorMessage = '';
    this.successMessage = '';
  }
}